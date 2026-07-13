import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { dlopen, FFIType } from "bun:ffi";

const LOCK_NAME = ".muse-review.lock";
const LOCK_EX = 2;
const LOCK_NB = 4;
const LOCK_UN = 8;
const MAX_ATTEMPTS = 500;

const libc = dlopen(process.platform === "darwin" ? "/usr/lib/libSystem.B.dylib" : "libc.so.6", {
  flock: {
    args: [FFIType.i32, FFIType.i32],
    returns: FFIType.i32,
  },
});

export interface PlanLock {
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
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const opened = await openLockFile(planDir);
    if (libc.symbols.flock(opened.handle.fd, LOCK_EX | LOCK_NB) === 0) {
      try {
        const [descriptor, pathname] = await Promise.all([
          opened.handle.stat({ bigint: true }),
          lstat(opened.lockPath, { bigint: true }),
        ]);
        if (
          descriptor.dev !== opened.descriptor.dev
          || descriptor.ino !== opened.descriptor.ino
          || pathname.dev !== descriptor.dev
          || pathname.ino !== descriptor.ino
        ) {
          throw new Error(`Review lock generation changed during acquisition at ${opened.lockPath}`);
        }
        let released = false;
        return {
          async release() {
            if (released) return;
            released = true;
            libc.symbols.flock(opened.handle.fd, LOCK_UN);
            await opened.handle.close().catch(() => undefined);
          },
        };
      } catch (error) {
        libc.symbols.flock(opened.handle.fd, LOCK_UN);
        await opened.handle.close();
        throw error;
      }
    }
    await opened.handle.close();
    await Bun.sleep(10);
  }
  throw new Error(`Timed out waiting for review lock at ${resolve(planDir, LOCK_NAME)}`);
}
