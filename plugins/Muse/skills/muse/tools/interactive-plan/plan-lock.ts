import { randomUUID } from "node:crypto";
import { mkdir, readFile, readlink, rm, stat, symlink, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const LOCK_NAME = ".muse-review.lock";
const CLAIMS_DIR = ".muse-review-locks";
const STALE_CLAIM_MS = 2_000;

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

async function readCurrentClaim(planDir: string): Promise<{ target: string; path: string; claim?: LockClaim }> {
  const lockPath = join(planDir, LOCK_NAME);
  const target = await readlink(lockPath);
  const path = join(planDir, target);
  try {
    return { target, path, claim: JSON.parse(await readFile(path, "utf8")) as LockClaim };
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

  const expectedNonce = basename(current.target, ".json");
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

  const age = Date.now() - (await stat(current.path).catch(() => stat(lockPath))).mtimeMs;
  if (current.claim?.releasedAt === undefined && age <= STALE_CLAIM_MS) return;
  if (await readlink(lockPath).catch(() => undefined) !== current.target) return;
  await rm(lockPath, { force: true });
  await rm(current.path, { force: true });
}

export async function acquirePlanLock(planDir: string): Promise<PlanLock> {
  const claimsDir = join(planDir, CLAIMS_DIR);
  const lockPath = join(planDir, LOCK_NAME);
  const nonce = randomUUID();
  const target = join(CLAIMS_DIR, `${nonce}.json`);
  const claimPath = join(planDir, target);
  await mkdir(claimsDir, { recursive: true });
  const claim: LockClaim = { nonce, pid: process.pid, createdAt: Date.now() };
  await writeFile(claimPath, `${JSON.stringify(claim)}\n`);

  for (let attempt = 0; attempt < 500; attempt += 1) {
    try {
      await symlink(target, lockPath);
      return {
        nonce,
        claimPath,
        async release() {
          if (await readlink(lockPath).catch(() => undefined) !== target) {
            await rm(claimPath, { force: true }).catch(() => undefined);
            return;
          }
          await writeFile(claimPath, `${JSON.stringify({ ...claim, releasedAt: Date.now() })}\n`).catch(() => undefined);
          if (await readlink(lockPath).catch(() => undefined) === target) {
            await rm(lockPath, { force: true }).catch(() => undefined);
          }
          if (await readlink(lockPath).catch(() => undefined) !== target) {
            await rm(claimPath, { force: true }).catch(() => undefined);
          }
        },
      };
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST")) {
        await rm(claimPath, { force: true });
        throw error;
      }
      await evictStaleClaim(planDir);
      await Bun.sleep(10);
    }
  }

  await rm(claimPath, { force: true });
  throw new Error(`Timed out waiting for review lock at ${lockPath}`);
}
