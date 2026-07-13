import { constants, type BigIntStats } from "node:fs";
import { lstat, open, readFile, realpath, type FileHandle } from "node:fs/promises";
import { resolve } from "node:path";
import { dlopen, FFIType, ptr } from "bun:ffi";

const LOCK_NAME = ".muse-review.lock";
const LOCK_EX = 2;
const LOCK_NB = 4;
const LOCK_UN = 8;
const MAX_ATTEMPTS = 500;

const GENERIC_READ_WRITE = 0xc0000000;
const FILE_SHARE_READ_WRITE = 0x00000003;
const OPEN_ALWAYS = 4;
const FILE_ATTRIBUTE_NORMAL = 0x00000080;
const FILE_FLAG_OPEN_REPARSE_POINT = 0x00200000;
const LOCKFILE_EXCLUSIVE_FAIL_IMMEDIATELY = 0x00000003;
const ERROR_SHARING_VIOLATION = 32;
const ERROR_LOCK_VIOLATION = 33;
const INVALID_HANDLE_VALUE = 0xffffffffffffffffn;

interface PlanRootBinding {
  path: string;
  handle: FileHandle;
  descriptor: BigIntStats;
}

interface BackendLock {
  release(): void;
}

interface LockBackend {
  tryLock(root: PlanRootBinding): Promise<BackendLock | undefined>;
}

let backend: Promise<LockBackend> | undefined;

const FLOCK_SYMBOLS = {
  flock: {
    args: [FFIType.i32, FFIType.i32],
    returns: FFIType.i32,
  },
} as const;

function openFlockLibrary(path: string) {
  return dlopen(path, FLOCK_SYMBOLS);
}

function windowsWideString(value: string): Uint16Array {
  const result = new Uint16Array(value.length + 1);
  for (let index = 0; index < value.length; index += 1) result[index] = value.charCodeAt(index);
  return result;
}

async function loadLockBackend(): Promise<LockBackend> {
  if (process.platform === "win32") {
    const kernel = dlopen("kernel32.dll", {
      CreateFileW: {
        args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64],
        returns: FFIType.u64,
      },
      LockFileEx: {
        args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr],
        returns: FFIType.i32,
      },
      CloseHandle: {
        args: [FFIType.u64],
        returns: FFIType.i32,
      },
      GetLastError: {
        args: [],
        returns: FFIType.u32,
      },
    });
    return {
      async tryLock(root) {
        const lockPath = resolve(root.path, LOCK_NAME);
        const path = windowsWideString(lockPath);
        const handle = kernel.symbols.CreateFileW(
          ptr(path),
          GENERIC_READ_WRITE,
          FILE_SHARE_READ_WRITE,
          null,
          OPEN_ALWAYS,
          FILE_ATTRIBUTE_NORMAL | FILE_FLAG_OPEN_REPARSE_POINT,
          0n,
        );
        if (handle === INVALID_HANDLE_VALUE) {
          const error = kernel.symbols.GetLastError();
          if (error === ERROR_SHARING_VIOLATION) return undefined;
          throw new Error(`CreateFileW failed for the review lock with Windows error ${error}`);
        }
        try {
          const pathname = await lstat(lockPath, { bigint: true });
          if (!pathname.isFile() || pathname.isSymbolicLink()) {
            throw new Error(`Review lock path must be a regular non-symlink file at ${lockPath}`);
          }
        } catch (error) {
          kernel.symbols.CloseHandle(handle);
          throw error;
        }
        const overlapped = new Uint8Array(32);
        if (
          kernel.symbols.LockFileEx(
            handle,
            LOCKFILE_EXCLUSIVE_FAIL_IMMEDIATELY,
            0,
            0xffffffff,
            0xffffffff,
            ptr(overlapped),
          ) === 0
        ) {
          const error = kernel.symbols.GetLastError();
          kernel.symbols.CloseHandle(handle);
          if (error === ERROR_LOCK_VIOLATION) return undefined;
          throw new Error(`LockFileEx failed for the review lock with Windows error ${error}`);
        }
        return {
          release() {
            kernel.symbols.CloseHandle(handle);
          },
        };
      },
    };
  }

  if (process.platform !== "darwin" && process.platform !== "linux") {
    throw new Error(`Review locking is unsupported on ${process.platform}`);
  }
  let libc;
  if (process.platform === "darwin") {
    libc = openFlockLibrary("/usr/lib/libSystem.B.dylib");
  } else {
    const muslArch = process.arch === "x64" ? "x86_64" : process.arch === "arm64" ? "aarch64" : process.arch;
    const candidates = ["libc.so.6", "libc.so", `ld-musl-${muslArch}.so.1`, `/lib/ld-musl-${muslArch}.so.1`];
    for (const candidate of candidates) {
      try {
        libc = openFlockLibrary(candidate);
        break;
      } catch {
        // Try the next conventional soname before consulting the process map.
      }
    }
    if (!libc) {
      let maps = "";
      try {
        maps = await readFile("/proc/self/maps", "utf8");
      } catch {
        throw new Error("Could not resolve Linux libc for review locking");
      }
      const loaded = maps.match(/\/\S*(?:libc\.so(?:\.\d+)*|ld-musl-[^\s/]+\.so\.1)/g) ?? [];
      const path = loaded.find((entry) => !entry.includes("libcap") && !entry.includes("libcrypto"));
      if (!path) throw new Error("Could not resolve the loaded Linux libc for review locking");
      libc = openFlockLibrary(path);
    }
  }
  return {
    async tryLock(root) {
      if (libc.symbols.flock(root.handle.fd, LOCK_EX | LOCK_NB) !== 0) return undefined;
      return {
        release() {
          libc.symbols.flock(root.handle.fd, LOCK_UN);
        },
      };
    },
  };
}

async function openPlanRoot(planDir: string): Promise<PlanRootBinding> {
  const path = await realpath(planDir);
  const handle = await open(
    path,
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  );
  try {
    const [descriptor, pathname] = await Promise.all([
      handle.stat({ bigint: true }),
      lstat(path, { bigint: true }),
    ]);
    if (
      !descriptor.isDirectory()
      || !pathname.isDirectory()
      || pathname.isSymbolicLink()
      || descriptor.dev !== pathname.dev
      || descriptor.ino !== pathname.ino
    ) {
      throw new Error(`Plan root is not bound to its opened generation at ${path}`);
    }
    return { path, handle, descriptor };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function verifyPlanRoot(root: PlanRootBinding): Promise<void> {
  const [descriptor, pathname] = await Promise.all([
    root.handle.stat({ bigint: true }),
    lstat(root.path, { bigint: true }),
  ]);
  if (
    !descriptor.isDirectory()
    || !pathname.isDirectory()
    || pathname.isSymbolicLink()
    || descriptor.dev !== root.descriptor.dev
    || descriptor.ino !== root.descriptor.ino
    || pathname.dev !== descriptor.dev
    || pathname.ino !== descriptor.ino
  ) {
    throw new Error(`Plan root generation changed at ${root.path}`);
  }
}

export interface PlanLock {
  assertOwned(): Promise<void>;
  release(): Promise<void>;
}

export async function acquirePlanLock(planDir: string): Promise<PlanLock> {
  const locking = await (backend ??= loadLockBackend());
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const root = await openPlanRoot(planDir);
    let token: BackendLock | undefined;
    try {
      token = await locking.tryLock(root);
    } catch (error) {
      await root.handle.close();
      throw error;
    }
    if (token !== undefined) {
      let released = false;
      const assertOwned = async () => {
        if (released) throw new Error(`Review lock was already released for ${root.path}`);
        await verifyPlanRoot(root);
      };
      try {
        await assertOwned();
        return {
          assertOwned,
          async release() {
            if (released) return;
            released = true;
            token.release();
            await root.handle.close().catch(() => undefined);
          },
        };
      } catch (error) {
        token.release();
        await root.handle.close();
        throw error;
      }
    }
    await root.handle.close();
    await Bun.sleep(10);
  }
  throw new Error(`Timed out waiting for review lock for ${resolve(planDir)}`);
}
