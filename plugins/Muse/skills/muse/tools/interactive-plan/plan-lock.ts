import { randomUUID } from "node:crypto";
import { mkdir, readFile, readlink, rm, rmdir, stat, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const LOCK_NAME = ".muse-review.lock";
const CLAIMS_DIR = ".muse-review-locks";
const STALE_CLAIM_MS = 2_000;
const GUARD_NAME = ".muse-review.lock.guard";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

interface LockClaim {
  nonce: string;
  pid: number;
  createdAt: number;
  releasedAt?: number;
}

export interface PlanLock {
  nonce: string;
  claimPath: string;
  release(): Promise<void>;
}


function nonceFromTarget(target: string): string {
  const match = target.match(/^\.muse-review-locks\/([0-9a-f-]+)\.json$/);
  if (!match || !UUID_PATTERN.test(match[1])) throw new Error(`Invalid review lock target '${target}'`);
  return match[1];
}

async function acquireGuard(planDir: string): Promise<() => Promise<void>> {
  const guardPath = join(planDir, GUARD_NAME);
  for (let attempt = 0; attempt < 500; attempt += 1) {
    try {
      await mkdir(guardPath);
      return async () => rmdir(guardPath);
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST")) throw error;
      await Bun.sleep(10);
    }
  }
  throw new Error(`Timed out waiting for review lock guard at ${guardPath}; if no Muse review operation is active, remove that directory manually`);
}

async function readCurrentClaim(planDir: string): Promise<{ target: string; path: string; claim?: LockClaim }> {
  const target = await readlink(join(planDir, LOCK_NAME));
  nonceFromTarget(target);
  const path = join(planDir, target);
  let source: string;
  try {
    source = await readFile(path, "utf8");
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return { target, path };
    }
    throw error;
  }
  try {
    return { target, path, claim: JSON.parse(source) as LockClaim };
  } catch {
    return { target, path };
  }
}

async function evictStaleClaim(planDir: string): Promise<void> {
  const lockPath = join(planDir, LOCK_NAME);
  let current: { target: string; path: string; claim?: LockClaim };
  try {
    current = await readCurrentClaim(planDir);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return;
    throw error;
  }

  const expectedNonce = nonceFromTarget(current.target);
  let ownerIsAlive = false;
  if (current.claim?.releasedAt === undefined && current.claim?.nonce === expectedNonce && Number.isInteger(current.claim.pid)) {
    try {
      process.kill(current.claim.pid, 0);
      ownerIsAlive = true;
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === "ESRCH")) ownerIsAlive = true;
    }
  }
  if (ownerIsAlive) return;

  let timestamp;
  try {
    timestamp = await stat(current.path);
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT")) throw error;
    timestamp = await stat(lockPath);
  }
  const age = Date.now() - timestamp.mtimeMs;
  if (current.claim?.releasedAt === undefined && age <= STALE_CLAIM_MS) return;
  if (await readlink(lockPath).catch(() => undefined) !== current.target) return;
  await rm(lockPath, { force: true });
  await rm(current.path, { force: true });
}

export async function acquirePlanLock(planDir: string): Promise<PlanLock> {
  const claimsDir = join(planDir, CLAIMS_DIR);
  const lockPath = join(planDir, LOCK_NAME);
  const nonce = randomUUID();
  const target = `${CLAIMS_DIR}/${nonce}.json`;
  const claimPath = join(planDir, target);
  await mkdir(claimsDir, { recursive: true });
  const claim: LockClaim = { nonce, pid: process.pid, createdAt: Date.now() };
  await writeFile(claimPath, `${JSON.stringify(claim)}\n`);

  try {
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const releaseGuard = await acquireGuard(planDir);
      let acquired = false;
      try {
        await symlink(target, lockPath);
        acquired = true;
      } catch (error) {
        if (!(typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST")) throw error;
        await evictStaleClaim(planDir);
      } finally {
        await releaseGuard();
      }

      if (acquired) {
        return {
          nonce,
          claimPath,
          async release() {
            await writeFile(claimPath, `${JSON.stringify({ ...claim, releasedAt: Date.now() })}\n`).catch(() => undefined);
            let releaseOwnershipGuard: (() => Promise<void>) | undefined;
            try {
              releaseOwnershipGuard = await acquireGuard(planDir);
              if (await readlink(lockPath).catch(() => undefined) === target) {
                await rm(lockPath, { force: true });
              }
              if (await readlink(lockPath).catch(() => undefined) !== target) {
                await rm(claimPath, { force: true });
              }
            } catch {
              // A released claim is recoverable by the next lock taker.
            } finally {
              await releaseOwnershipGuard?.().catch(() => undefined);
            }
          },
        };
      }
      await Bun.sleep(10);
    }
    throw new Error(`Timed out waiting for review lock at ${lockPath}`);
  } catch (error) {
    await rm(claimPath, { force: true });
    throw error;
  }
}
