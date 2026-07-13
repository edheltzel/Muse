import { constants } from "node:fs";
import { lstat, open, readFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { dlopen, FFIType, ptr } from "bun:ffi";

const LOCK_NAME = ".muse-review.lock";
const LOCK_EX = 2;
const LOCK_NB = 4;
const LOCK_UN = 8;
const MAX_ATTEMPTS = 500;

interface LockBackend {
  tryLock(fd: number): unknown | undefined;
  unlock(token: unknown): void;
}

let backend: Promise<LockBackend> | undefined;

async function loadLockBackend(): Promise<LockBackend> {
  if (process.platform === "win32") {
    const crt = dlopen("msvcrt.dll", {
      _get_osfhandle: {
        args: [FFIType.i32],
        returns: FFIType.i64,
      },
    });
    const kernel = dlopen("kernel32.dll", {
      LockFileEx: {
        args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr],
        returns: FFIType.i32,
      },
      UnlockFileEx: {
        args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr],
        returns: FFIType.i32,
      },
    });
    return {
      tryLock(fd) {
        const handle = crt.symbols._get_osfhandle(fd);
        if (handle === -1n) throw new Error("Could not resolve the Windows lock file handle");
        const overlapped = new Uint8Array(32);
        const locked = kernel.symbols.LockFileEx(handle, 3, 0, 0xffffffff, 0xffffffff, ptr(overlapped));
        return locked === 0 ? undefined : { handle, overlapped };
      },
      unlock(value) {
        const token = value as { handle: bigint; overlapped: Uint8Array };
        kernel.symbols.UnlockFileEx(token.handle, 0, 0xffffffff, 0xffffffff, ptr(token.overlapped));
      },
    };
  }

  if (process.platform !== "darwin" && process.platform !== "linux") {
    throw new Error(`Review locking is unsupported on ${process.platform}`);
  }
  let libraryPath = "/usr/lib/libSystem.B.dylib";
  if (process.platform === "linux") {
    const maps = await readFile("/proc/self/maps", "utf8");
    const candidates = maps.match(/\/\S*(?:libc\.so(?:\.\d+)*|ld-musl-[^\s/]+\.so\.1)/g) ?? [];
    libraryPath = candidates.find((path) => !path.includes("libcap") && !path.includes("libcrypto"))
      ?? (() => {
        throw new Error("Could not resolve the loaded Linux libc for review locking");
      })();
  }
  const libc = dlopen(libraryPath, {
    flock: {
      args: [FFIType.i32, FFIType.i32],
      returns: FFIType.i32,
    },
  });
  return {
    tryLock(fd) {
      return libc.symbols.flock(fd, LOCK_EX | LOCK_NB) === 0 ? fd : undefined;
    },
    unlock(value) {
      libc.symbols.flock(value as number, LOCK_UN);
    },
  };
}

export interface PlanLock {
  assertOwned(): Promise<void>;
  release(): Promise<void>;
}

async function openLockFile(planDir: string) {
  const planRoot = await realpath(planDir);
  const lockPath = resolve(planRoot, LOCK_NAME);
  const handle = await open(
    lockPath,
    constants.O_RDWR | constants.O_CREAT | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    0o600,
  );
  try {
    const [descriptor, pathname] = await Promise.all([
      handle.stat({ bigint: true }),
      lstat(lockPath, { bigint: true }),
    ]);
    if (
      !descriptor.isFile()
      || !pathname.isFile()
      || pathname.isSymbolicLink()
      || descriptor.dev !== pathname.dev
      || descriptor.ino !== pathname.ino
    ) {
      throw new Error(`Review lock path is not bound to its opened file at ${lockPath}`);
    }
    return { handle, lockPath, descriptor };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

export async function acquirePlanLock(planDir: string): Promise<PlanLock> {
  const locking = await (backend ??= loadLockBackend());
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const opened = await openLockFile(planDir);
    const token = locking.tryLock(opened.handle.fd);
    if (token !== undefined) {
      let released = false;
      const assertOwned = async () => {
        if (released) throw new Error(`Review lock was already released at ${opened.lockPath}`);
        const [descriptor, pathname] = await Promise.all([
          opened.handle.stat({ bigint: true }),
          lstat(opened.lockPath, { bigint: true }),
        ]);
        if (
          !descriptor.isFile()
          || !pathname.isFile()
          || pathname.isSymbolicLink()
          || descriptor.dev !== opened.descriptor.dev
          || descriptor.ino !== opened.descriptor.ino
          || pathname.dev !== descriptor.dev
          || pathname.ino !== descriptor.ino
        ) {
          throw new Error(`Review lock path generation changed at ${opened.lockPath}`);
        }
      };
      try {
        await assertOwned();
        return {
          assertOwned,
          async release() {
            if (released) return;
            released = true;
            locking.unlock(token);
            await opened.handle.close().catch(() => undefined);
          },
        };
      } catch (error) {
        locking.unlock(token);
        await opened.handle.close();
        throw error;
      }
    }
    await opened.handle.close();
    await Bun.sleep(10);
  }
  throw new Error(`Timed out waiting for review lock at ${resolve(planDir, LOCK_NAME)}`);
}
