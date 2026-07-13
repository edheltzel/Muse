import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readlink, realpath, rm, rmdir, stat, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const LOCK_NAME = ".muse-review.lock";
const CLAIMS_DIR = ".muse-review-locks";
const STALE_CLAIM_MS = 2_000;
const GUARD_NAME = ".muse-review.lock.guard";
const GUARD_OWNER = "owner.json";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

interface OwnerClaim {
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

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isOwnerAlive(owner: OwnerClaim | undefined): boolean {
  if (!owner || owner.releasedAt !== undefined || !UUID_PATTERN.test(owner.nonce) || !Number.isInteger(owner.pid)) return false;
  try {
    process.kill(owner.pid, 0);
    return true;
  } catch (error) {
    return !(typeof error === "object" && error !== null && "code" in error && error.code === "ESRCH");
  }
}

function parseOwner(source: string): OwnerClaim | undefined {
  try {
    const owner = JSON.parse(source) as OwnerClaim;
    return typeof owner === "object" && owner !== null ? owner : undefined;
  } catch {
    return undefined;
  }
}

function nonceFromTarget(target: string): string {
  const match = target.match(/^\.muse-review-locks\/([0-9a-f-]+)\.json$/);
  if (!match || !UUID_PATTERN.test(match[1])) throw new Error(`Invalid review lock target '${target}'`);
  return match[1];
}

async function resolveClaimsDirectory(planDir: string, create: boolean): Promise<string> {
  const claimsPath = join(planDir, CLAIMS_DIR);
  if (create) {
    try {
      await mkdir(claimsPath);
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST")) throw error;
    }
  }
  const metadata = await lstat(claimsPath);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`Review claims directory must be a plan-local non-symlink directory at ${claimsPath}`);
  }
  const [planRoot, claimsRoot] = await Promise.all([realpath(planDir), realpath(claimsPath)]);
  if (claimsRoot !== resolve(planRoot, CLAIMS_DIR)) {
    throw new Error(`Review claims directory escapes the plan directory at ${claimsPath}`);
  }
  return claimsRoot;
}

async function resolveClaimPath(planDir: string, nonce: string, createClaimsDirectory = false): Promise<string> {
  if (!UUID_PATTERN.test(nonce)) throw new Error(`Invalid review claim nonce '${nonce}'`);
  const claimsRoot = await resolveClaimsDirectory(planDir, createClaimsDirectory);
  const claimPath = resolve(claimsRoot, `${nonce}.json`);
  if (dirname(claimPath) !== claimsRoot) throw new Error(`Review claim escapes the claims directory at ${claimPath}`);
  return claimPath;
}

async function removeClaim(planDir: string, nonce: string): Promise<void> {
  await rm(await resolveClaimPath(planDir, nonce), { force: true });
}

async function readGuardOwner(guardPath: string): Promise<OwnerClaim | undefined> {
  try {
    return parseOwner(await readFile(join(guardPath, GUARD_OWNER), "utf8"));
  } catch (error) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}

async function evictStaleGuard(guardPath: string): Promise<void> {
  const metadata = await lstat(guardPath).catch((error) => {
    if (isMissing(error)) return undefined;
    throw error;
  });
  if (!metadata) return;
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`Review lock guard must be a non-symlink directory at ${guardPath}`);
  }
  const owner = await readGuardOwner(guardPath);
  if (isOwnerAlive(owner) || Date.now() - metadata.mtimeMs <= STALE_CLAIM_MS) return;
  const currentOwner = await readGuardOwner(guardPath);
  if (currentOwner?.nonce !== owner?.nonce || isOwnerAlive(currentOwner)) return;
  await rm(guardPath, { recursive: true });
}

async function acquireGuard(planDir: string): Promise<() => Promise<void>> {
  const guardPath = join(planDir, GUARD_NAME);
  const owner: OwnerClaim = { nonce: randomUUID(), pid: process.pid, createdAt: Date.now() };
  for (let attempt = 0; attempt < 500; attempt += 1) {
    try {
      await mkdir(guardPath);
      try {
        await writeFile(join(guardPath, GUARD_OWNER), `${JSON.stringify(owner)}\n`, { flag: "wx" });
      } catch (error) {
        await rm(guardPath, { recursive: true, force: true });
        throw error;
      }
      return async () => {
        const current = await readGuardOwner(guardPath).catch(() => undefined);
        if (current?.nonce !== owner.nonce) return;
        await rm(join(guardPath, GUARD_OWNER), { force: true });
        await rmdir(guardPath);
      };
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST")) throw error;
      await evictStaleGuard(guardPath);
      await Bun.sleep(10);
    }
  }
  throw new Error(`Timed out waiting for review lock guard at ${guardPath}; if no Muse review operation is active, remove that directory manually`);
}

async function readCurrentClaim(planDir: string): Promise<{ target: string; nonce: string; claim?: OwnerClaim }> {
  const target = await readlink(join(planDir, LOCK_NAME));
  const nonce = nonceFromTarget(target);
  let source: string;
  try {
    source = await readFile(await resolveClaimPath(planDir, nonce), "utf8");
  } catch (error) {
    if (isMissing(error)) return { target, nonce };
    throw error;
  }
  return { target, nonce, claim: parseOwner(source) };
}

async function evictStaleClaim(planDir: string): Promise<void> {
  const lockPath = join(planDir, LOCK_NAME);
  let current: { target: string; nonce: string; claim?: OwnerClaim };
  try {
    current = await readCurrentClaim(planDir);
  } catch (error) {
    if (isMissing(error)) return;
    throw error;
  }

  if (isOwnerAlive(current.claim)) return;
  let timestamp;
  try {
    timestamp = await stat(await resolveClaimPath(planDir, current.nonce));
  } catch (error) {
    if (!isMissing(error)) throw error;
    timestamp = await stat(lockPath);
  }
  if (current.claim?.releasedAt === undefined && Date.now() - timestamp.mtimeMs <= STALE_CLAIM_MS) return;
  if (await readlink(lockPath).catch(() => undefined) !== current.target) return;
  await rm(lockPath, { force: true });
  await removeClaim(planDir, current.nonce);
}

export async function acquirePlanLock(planDir: string): Promise<PlanLock> {
  const lockPath = join(planDir, LOCK_NAME);
  const nonce = randomUUID();
  const target = `${CLAIMS_DIR}/${nonce}.json`;
  const claim: OwnerClaim = { nonce, pid: process.pid, createdAt: Date.now() };
  const claimPath = await resolveClaimPath(planDir, nonce, true);
  await writeFile(await resolveClaimPath(planDir, nonce), `${JSON.stringify(claim)}\n`, { flag: "wx" });

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
            try {
              await writeFile(await resolveClaimPath(planDir, nonce), `${JSON.stringify({ ...claim, releasedAt: Date.now() })}\n`);
            } catch {
              return;
            }
            let releaseOwnershipGuard: (() => Promise<void>) | undefined;
            try {
              releaseOwnershipGuard = await acquireGuard(planDir);
              if (await readlink(lockPath).catch(() => undefined) === target) await rm(lockPath, { force: true });
              if (await readlink(lockPath).catch(() => undefined) !== target) await removeClaim(planDir, nonce);
            } catch {
              // A released plan-local claim is recoverable by the next lock taker.
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
    await removeClaim(planDir, nonce).catch(() => undefined);
    throw error;
  }
}
