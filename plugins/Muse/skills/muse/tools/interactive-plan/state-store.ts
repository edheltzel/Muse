import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readdir, readlink, rename, rm, stat, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateAgentHandoff, formatAgentHandoffMarkdown } from "./handoff";
import { loadPlanFolder } from "./mdx-loader";
import { createDefaultReviewState, type CommentThread, type ReviewState, validateApprovalReadiness, validateReviewState } from "./schema";

const STORE_DIR = ".muse-review";
const CURRENT_LINK = "current";
const BUNDLE_FILES = ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"] as const;
type BundleFile = (typeof BUNDLE_FILES)[number];

interface ReviewSnapshot {
  state: ReviewState;
  comments: CommentThread[];
  handoffJson?: string;
  handoffMarkdown?: string;
}

function storePath(planDir: string): string {
  return join(planDir, STORE_DIR);
}

function currentPath(planDir: string): string {
  return join(storePath(planDir), CURRENT_LINK);
}

export function statePath(planDir: string): string {
  return join(planDir, "plan-state.json");
}

export function commentsPath(planDir: string): string {
  return join(planDir, "comments.json");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}

async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

function parseComments(source: string | undefined): CommentThread[] {
  if (source === undefined) return [];
  const comments = JSON.parse(source) as unknown;
  if (!Array.isArray(comments)) throw new Error("Comments must be an array");
  for (const comment of comments) {
    if (
      typeof comment !== "object"
      || comment === null
      || !("id" in comment)
      || typeof comment.id !== "string"
      || !("status" in comment)
      || (comment.status !== "open" && comment.status !== "resolved")
    ) {
      throw new Error("Each comment must have a string id and open or resolved status");
    }
  }
  return comments as CommentThread[];
}

async function readSnapshotFrom(root: string): Promise<ReviewSnapshot> {
  const stateSource = await readOptional(join(root, "plan-state.json"));
  const state = stateSource === undefined ? createDefaultReviewState() : JSON.parse(stateSource) as ReviewState;
  const stateErrors = validateReviewState(state);
  if (stateErrors.length) throw new Error(stateErrors.join("\n"));
  return {
    state,
    comments: parseComments(await readOptional(join(root, "comments.json"))),
    handoffJson: await readOptional(join(root, "agent-handoff.json")),
    handoffMarkdown: await readOptional(join(root, "agent-handoff.md")),
  };
}

function normalizeSnapshot(snapshot: ReviewSnapshot): ReviewSnapshot {
  const unresolvedCommentIds = snapshot.comments
    .filter((comment) => comment.status === "open")
    .map((comment) => comment.id);
  let state: ReviewState = { ...snapshot.state, unresolvedCommentIds };
  let { handoffJson, handoffMarkdown } = snapshot;
  let handoffsAgree = handoffJson === undefined && handoffMarkdown === undefined;

  if (handoffJson !== undefined && handoffMarkdown !== undefined) {
    try {
      const handoff = JSON.parse(handoffJson) as {
        status?: unknown;
        approvedAt?: unknown;
        planSlug?: unknown;
        answers?: unknown;
      };
      handoffsAgree = handoff.status === "approved"
        && typeof handoff.approvedAt === "string"
        && typeof handoff.planSlug === "string"
        && state.approvedAt === handoff.approvedAt
        && JSON.stringify(state.answers) === JSON.stringify(handoff.answers)
        && handoffMarkdown.includes(`Status: ${handoff.status}`)
        && handoffMarkdown.includes(`Approved: ${handoff.approvedAt}`)
        && handoffMarkdown.includes(`# Agent Handoff: ${handoff.planSlug}`);
    } catch {
      handoffsAgree = false;
    }
  }

  if (!handoffsAgree) {
    handoffJson = undefined;
    handoffMarkdown = undefined;
  }
  if (state.status === "approved" && (unresolvedCommentIds.length > 0 || !handoffsAgree || handoffJson === undefined)) {
    const { approvedAt: _approvedAt, reviewer: _reviewer, ...rest } = state;
    state = { ...rest, status: "needs_revision" };
    handoffJson = undefined;
    handoffMarkdown = undefined;
  }
  return { state, comments: snapshot.comments, handoffJson, handoffMarkdown };
}

function snapshotContent(snapshot: ReviewSnapshot, file: BundleFile): string | undefined {
  if (file === "plan-state.json") return `${JSON.stringify(snapshot.state, null, 2)}\n`;
  if (file === "comments.json") return `${JSON.stringify(snapshot.comments, null, 2)}\n`;
  if (file === "agent-handoff.json") return snapshot.handoffJson;
  return snapshot.handoffMarkdown;
}

async function publishSnapshot(planDir: string, snapshot: ReviewSnapshot): Promise<void> {
  const store = storePath(planDir);
  const bundles = join(store, "bundles");
  const identity = randomUUID();
  const staging = join(bundles, `${identity}.staging`);
  const bundle = join(bundles, identity);
  const pointer = join(store, `current.${identity}.pointer`);
  let bundlePublished = false;

  await mkdir(staging, { recursive: true });
  try {
    for (const file of BUNDLE_FILES) {
      const content = snapshotContent(snapshot, file);
      if (content !== undefined) await writeFile(join(staging, file), content);
    }
    await rename(staging, bundle);
    bundlePublished = true;
    await symlink(join("bundles", identity), pointer);
    await rename(pointer, currentPath(planDir));
  } catch (error) {
    await Promise.allSettled([
      rm(staging, { recursive: true, force: true }),
      rm(pointer, { force: true }),
      ...(bundlePublished ? [rm(bundle, { recursive: true, force: true })] : []),
    ]);
    throw error;
  }
}

async function installCompatibilityLinks(planDir: string): Promise<void> {
  for (const file of BUNDLE_FILES) {
    const destination = join(planDir, file);
    const temporary = join(planDir, `.${file}.${randomUUID()}.link`);
    await symlink(join(STORE_DIR, CURRENT_LINK, file), temporary);
    try {
      await rename(temporary, destination);
    } catch (error) {
      await rm(temporary, { force: true });
      throw error;
    }
  }
}

async function compatibilityLinksReady(planDir: string): Promise<boolean> {
  for (const file of BUNDLE_FILES) {
    try {
      if (await readlink(join(planDir, file)) !== join(STORE_DIR, CURRENT_LINK, file)) return false;
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error.code === "ENOENT" || error.code === "EINVAL")) return false;
      throw error;
    }
  }
  return true;
}

async function ensureStore(planDir: string): Promise<void> {
  const hasCurrent = await pathExists(currentPath(planDir));
  await mkdir(join(storePath(planDir), "bundles"), { recursive: true });
  if (!hasCurrent) await publishSnapshot(planDir, await readSnapshotFrom(planDir));
  if (!(await compatibilityLinksReady(planDir))) await installCompatibilityLinks(planDir);
  const current = await readSnapshotFrom(currentPath(planDir));
  const normalized = normalizeSnapshot(current);
  if (JSON.stringify(normalized) !== JSON.stringify(current)) await publishSnapshot(planDir, normalized);
}

async function cleanupAbandonedPublications(planDir: string): Promise<void> {
  const store = storePath(planDir);
  const bundles = join(store, "bundles");
  const bundleEntries = await readdir(bundles).catch((error) => {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return [];
    throw error;
  });
  const storeEntries = await readdir(store).catch((error) => {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return [];
    throw error;
  });
  await Promise.all([
    ...bundleEntries.filter((entry) => entry.endsWith(".staging")).map((entry) => rm(join(bundles, entry), { recursive: true, force: true })),
    ...storeEntries.filter((entry) => entry.startsWith("current.") && entry.endsWith(".pointer")).map((entry) => rm(join(store, entry), { force: true })),
  ]);
}

async function acquirePlanLock(planDir: string): Promise<() => Promise<void>> {
  const lock = join(planDir, ".muse-review.lock");
  for (let attempt = 0; attempt < 500; attempt += 1) {
    try {
      await mkdir(lock);
      try {
        await writeFile(join(lock, "owner.json"), JSON.stringify({ pid: process.pid, createdAt: Date.now() }));
      } catch (error) {
        await rm(lock, { recursive: true, force: true });
        throw error;
      }
      return () => rm(lock, { recursive: true, force: true });
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST")) throw error;
      const ownerSource = await readOptional(join(lock, "owner.json"));
      let ownerIsAlive = false;
      if (ownerSource !== undefined) {
        try {
          const owner = JSON.parse(ownerSource) as { pid?: unknown };
          if (typeof owner.pid === "number") {
            process.kill(owner.pid, 0);
            ownerIsAlive = true;
          }
        } catch (ownerError) {
          if (!(typeof ownerError === "object" && ownerError !== null && "code" in ownerError && ownerError.code === "ESRCH")) {
            ownerIsAlive = true;
          }
        }
      }
      if (!ownerIsAlive && Date.now() - (await stat(lock)).mtimeMs > 2_000) {
        await rm(lock, { recursive: true, force: true });
        continue;
      }
      await Bun.sleep(10);
    }
  }
  throw new Error(`Timed out waiting for review lock at ${lock}`);
}

async function withPlanLock<T>(planDir: string, action: () => Promise<T>): Promise<T> {
  const release = await acquirePlanLock(planDir);
  try {
    await cleanupAbandonedPublications(planDir);
    await ensureStore(planDir);
    return await action();
  } finally {
    await release();
  }
}

async function ensureStoreForRead(planDir: string): Promise<void> {
  if (await pathExists(currentPath(planDir)) && await compatibilityLinksReady(planDir)) return;
  await withPlanLock(planDir, async () => undefined);
}

async function readCurrentSnapshot(planDir: string): Promise<ReviewSnapshot> {
  await ensureStoreForRead(planDir);
  return normalizeSnapshot(await readSnapshotFrom(currentPath(planDir)));
}

export async function readReviewState(planDir: string): Promise<ReviewState> {
  return (await readCurrentSnapshot(planDir)).state;
}

export async function readComments(planDir: string): Promise<CommentThread[]> {
  return (await readCurrentSnapshot(planDir)).comments;
}

export async function readPublishedArtifact(planDir: string, file: "agent-handoff.json" | "agent-handoff.md"): Promise<string> {
  await ensureStoreForRead(planDir);
  return readFile(join(currentPath(planDir), file), "utf8");
}

function mergeReviewState(current: ReviewState, patch: Partial<ReviewState>, comments: CommentThread[]): ReviewState {
  return {
    ...current,
    ...patch,
    answers: { ...current.answers, ...(patch.answers ?? {}) },
    checklist: { ...current.checklist, ...(patch.checklist ?? {}) },
    unresolvedCommentIds: comments.filter((comment) => comment.status === "open").map((comment) => comment.id),
  };
}

export async function updateReviewState(planDir: string, patch: Partial<ReviewState>): Promise<ReviewState> {
  if (patch.status === "approved" || patch.approvedAt !== undefined || patch.reviewer !== undefined) {
    throw new Error("Approval status and metadata can only be set through /api/approve");
  }
  return withPlanLock(planDir, async () => {
    const snapshot = normalizeSnapshot(await readSnapshotFrom(currentPath(planDir)));
    let state = mergeReviewState(snapshot.state, patch, snapshot.comments);
    let handoffJson = snapshot.handoffJson;
    let handoffMarkdown = snapshot.handoffMarkdown;
    if (snapshot.state.status === "approved" && (patch.status !== undefined || patch.answers !== undefined || patch.checklist !== undefined)) {
      const { approvedAt: _approvedAt, reviewer: _reviewer, ...rest } = state;
      state = { ...rest, status: "needs_revision" };
      handoffJson = undefined;
      handoffMarkdown = undefined;
    }
    const errors = validateReviewState(state);
    if (errors.length) throw new Error(errors.join("\n"));
    await publishSnapshot(planDir, { ...snapshot, state, handoffJson, handoffMarkdown });
    return state;
  });
}

export async function addComment(
  planDir: string,
  input: Omit<CommentThread, "id" | "status" | "createdAt"> & { id?: string },
): Promise<CommentThread> {
  return withPlanLock(planDir, async () => {
    const snapshot = normalizeSnapshot(await readSnapshotFrom(currentPath(planDir)));
    const comment: CommentThread = {
      id: input.id ?? `c${snapshot.comments.length + 1}`,
      blockId: input.blockId,
      anchor: input.anchor,
      body: input.body,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    const comments = [...snapshot.comments, comment];
    let state = mergeReviewState(snapshot.state, {}, comments);
    let handoffJson = snapshot.handoffJson;
    let handoffMarkdown = snapshot.handoffMarkdown;
    if (snapshot.state.status === "approved") {
      const { approvedAt: _approvedAt, reviewer: _reviewer, ...rest } = state;
      state = { ...rest, status: "needs_revision" };
      handoffJson = undefined;
      handoffMarkdown = undefined;
    }
    await publishSnapshot(planDir, { ...snapshot, state, comments, handoffJson, handoffMarkdown });
    return comment;
  });
}

export async function resolveComment(planDir: string, id: string): Promise<CommentThread[]> {
  return withPlanLock(planDir, async () => {
    const snapshot = normalizeSnapshot(await readSnapshotFrom(currentPath(planDir)));
    const comments = snapshot.comments.map((comment) => comment.id === id
      ? { ...comment, status: "resolved" as const, resolvedAt: new Date().toISOString() }
      : comment);
    const state = mergeReviewState(snapshot.state, {}, comments);
    await publishSnapshot(planDir, { ...snapshot, state, comments });
    return comments;
  });
}

export async function approvePlan(planDir: string, reviewer = "local-reviewer") {
  return withPlanLock(planDir, async () => {
    const snapshot = normalizeSnapshot(await readSnapshotFrom(currentPath(planDir)));
    const plan = await loadPlanFolder(planDir);
    const readinessBlocks = [...plan.plan.blocks, ...(plan.canvas?.blocks ?? [])];
    const readinessErrors = [
      ...(snapshot.comments.some((comment) => comment.status === "open")
        ? ["AgentHandoff cannot be generated while unresolved blocking comments remain"]
        : []),
      ...validateApprovalReadiness(readinessBlocks, snapshot.state),
    ];
    if (readinessErrors.length) throw new Error(readinessErrors.join("\n"));

    const approvedAt = new Date().toISOString();
    const state = mergeReviewState(snapshot.state, { status: "approved", approvedAt, reviewer }, snapshot.comments);
    const handoff = generateAgentHandoff(plan, state);
    await publishSnapshot(planDir, {
      state,
      comments: snapshot.comments,
      handoffJson: `${JSON.stringify(handoff, null, 2)}\n`,
      handoffMarkdown: formatAgentHandoffMarkdown(handoff),
    });
    return handoff;
  });
}
