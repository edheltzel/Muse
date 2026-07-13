import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readdir, readlink, rename, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateAgentHandoff, formatAgentHandoffMarkdown } from "./handoff";
import { loadPlanFolder } from "./mdx-loader";
import { acquirePlanLock } from "./plan-lock";
import {
  type AgentHandoff,
  createDefaultReviewState,
  type CommentThread,
  type ReviewState,
  validateAgentHandoff,
  validateApprovalReadiness,
  validateReviewState,
  validateReviewStatePatch,
} from "./schema";

const STORE_DIR = ".muse-review";
const CURRENT_LINK = "current";
const INITIALIZED_MARKER = "initialized";
const BUNDLE_FILES = ["plan-state.json", "comments.json", "agent-handoff.json", "agent-handoff.md"] as const;
type BundleFile = (typeof BUNDLE_FILES)[number];

interface ReviewSnapshot {
  state: ReviewState;
  comments: CommentThread[];
  handoffJson?: string;
  handoffMarkdown?: string;
}

interface PlanIdentity {
  slug: string;
  path: string;
}

function storePath(planDir: string): string {
  return join(planDir, STORE_DIR);
}

function currentPath(planDir: string): string {
  return join(storePath(planDir), CURRENT_LINK);
}

async function resolveCurrentBundle(planDir: string): Promise<string> {
  const target = await readlink(currentPath(planDir));
  const segments = target.split("/");
  if (segments.length !== 2 || segments[0] !== "bundles" || !segments[1]) {
    throw new Error(`Invalid current review bundle target '${target}'`);
  }
  const bundle = join(storePath(planDir), target);
  if (!(await lstat(bundle)).isDirectory()) throw new Error(`Current review bundle is not a directory at ${bundle}`);
  return bundle;
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
  const ids = new Set<string>();
  for (const comment of comments) {
    if (
      typeof comment !== "object"
      || comment === null
      || !("id" in comment)
      || typeof comment.id !== "string"
      || comment.id.trim().length === 0
      || ids.has(comment.id)
      || !("blockId" in comment)
      || typeof comment.blockId !== "string"
      || !("body" in comment)
      || typeof comment.body !== "string"
      || !("createdAt" in comment)
      || typeof comment.createdAt !== "string"
      || !("status" in comment)
      || (comment.status !== "open" && comment.status !== "resolved")
      || ("resolvedAt" in comment && comment.resolvedAt !== undefined && typeof comment.resolvedAt !== "string")
    ) {
      throw new Error("Comments must have unique nonblank ids and valid thread fields");
    }
    ids.add(comment.id);
  }
  return comments as CommentThread[];
}

async function readSnapshotFrom(root: string, allowMissingCore = false): Promise<ReviewSnapshot> {
  const stateSource = await readOptional(join(root, "plan-state.json"));
  const commentsSource = await readOptional(join(root, "comments.json"));
  if (!allowMissingCore && stateSource === undefined) throw new Error(`Review bundle is missing plan-state.json at ${root}`);
  if (!allowMissingCore && commentsSource === undefined) throw new Error(`Review bundle is missing comments.json at ${root}`);
  const state = stateSource === undefined ? createDefaultReviewState() : JSON.parse(stateSource) as ReviewState;
  const stateErrors = validateReviewState(state);
  if (stateErrors.length) throw new Error(stateErrors.join("\n"));
  return {
    state,
    comments: parseComments(commentsSource),
    handoffJson: await readOptional(join(root, "agent-handoff.json")),
    handoffMarkdown: await readOptional(join(root, "agent-handoff.md")),
  };
}

function normalizeSnapshot(snapshot: ReviewSnapshot, identity: PlanIdentity): ReviewSnapshot {

  const unresolvedCommentIds = snapshot.comments
    .filter((comment) => comment.status === "open")
    .map((comment) => comment.id);
  let state: ReviewState = { ...snapshot.state, unresolvedCommentIds };
  let { handoffJson, handoffMarkdown } = snapshot;
  let handoffsAgree = handoffJson === undefined && handoffMarkdown === undefined;

  if (handoffJson !== undefined && handoffMarkdown !== undefined) {
    try {
      const parsed = JSON.parse(handoffJson) as unknown;
      if (validateAgentHandoff(parsed).length === 0) {
        const handoff = parsed as AgentHandoff;
        handoffsAgree = state.approvedAt === handoff.approvedAt
          && JSON.stringify(state.answers) === JSON.stringify(handoff.answers)
          && handoff.planSlug === identity.slug
          && handoff.planPath === identity.path
          && handoff.implementationEntry === identity.path
          && formatAgentHandoffMarkdown(handoff) === handoffMarkdown;
      } else {
        handoffsAgree = false;
      }
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
  if (state.status !== "approved") {
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

interface CompatibilitySnapshot {
  path: string;
  kind: "missing" | "file" | "symlink";
  content?: Uint8Array;
  target?: string;
}

async function captureCompatibilityPath(path: string): Promise<CompatibilitySnapshot> {
  try {
    const metadata = await lstat(path);
    if (metadata.isSymbolicLink()) return { path, kind: "symlink", target: await readlink(path) };
    if (metadata.isFile()) return { path, kind: "file", content: await readFile(path) };
    throw new Error(`Unsupported compatibility path at ${path}`);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return { path, kind: "missing" };
    }
    throw error;
  }
}

async function restoreCompatibilityPath(snapshot: CompatibilitySnapshot): Promise<void> {
  if (snapshot.kind === "missing") {
    await rm(snapshot.path, { force: true });
    return;
  }
  const temporary = `${snapshot.path}.${randomUUID()}.restore`;
  if (snapshot.kind === "symlink") await symlink(snapshot.target!, temporary);
  else await writeFile(temporary, snapshot.content!);
  await rename(temporary, snapshot.path);
}

async function installCompatibilityLinks(planDir: string): Promise<void> {
  const snapshots = await Promise.all(BUNDLE_FILES.map((file) => captureCompatibilityPath(join(planDir, file))));
  const replaced: CompatibilitySnapshot[] = [];
  try {
    for (let index = 0; index < BUNDLE_FILES.length; index += 1) {
      const file = BUNDLE_FILES[index];
      const destination = join(planDir, file);
      const temporary = join(planDir, `.${file}.${randomUUID()}.link`);
      await symlink(join(STORE_DIR, CURRENT_LINK, file), temporary);
      try {
        await rename(temporary, destination);
        replaced.push(snapshots[index]);
      } catch (error) {
        await rm(temporary, { force: true });
        throw error;
      }
    }
  } catch (error) {
    const rollbackErrors: unknown[] = [];
    for (const snapshot of replaced.reverse()) {
      try {
        await restoreCompatibilityPath(snapshot);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) throw new AggregateError([error, ...rollbackErrors], "Compatibility setup failed and rollback was incomplete");
    throw error;
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
  const store = storePath(planDir);
  const marker = join(store, INITIALIZED_MARKER);
  const initialized = await pathExists(marker);
  const plan = await loadPlanFolder(planDir);
  const identity: PlanIdentity = {
    slug: plan.manifest.slug,
    path: join(plan.rootDir, plan.manifest.entry),
  };

  if (initialized) {
    if (!(await compatibilityLinksReady(planDir))) {
      throw new Error("Initialized review store has missing or replaced compatibility paths");
    }
    const currentRoot = await resolveCurrentBundle(planDir);
    const current = await readSnapshotFrom(currentRoot);
    const normalized = normalizeSnapshot(current, identity);
    if (JSON.stringify(normalized) !== JSON.stringify(current)) await publishSnapshot(planDir, normalized);
    return;
  }

  await mkdir(join(store, "bundles"), { recursive: true });
  if (!(await pathExists(currentPath(planDir)))) {
    const legacy = await readSnapshotFrom(planDir, true);
    await publishSnapshot(planDir, normalizeSnapshot(legacy, identity));
  } else {
    const currentRoot = await resolveCurrentBundle(planDir);
    const current = await readSnapshotFrom(currentRoot);
    const normalized = normalizeSnapshot(current, identity);
    if (JSON.stringify(normalized) !== JSON.stringify(current)) await publishSnapshot(planDir, normalized);
  }
  if (!(await compatibilityLinksReady(planDir))) await installCompatibilityLinks(planDir);
  const temporaryMarker = join(store, `${INITIALIZED_MARKER}.${randomUUID()}.tmp`);
  await writeFile(temporaryMarker, "v1\n");
  await rename(temporaryMarker, marker);
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
  let currentIdentity: string | undefined;
  try {
    currentIdentity = (await resolveCurrentBundle(planDir)).split("/").at(-1);
  } catch {
    currentIdentity = undefined;
  }
  await Promise.all([
    ...bundleEntries
      .filter((entry) => entry.endsWith(".staging") || (currentIdentity !== undefined && entry !== currentIdentity))
      .map((entry) => rm(join(bundles, entry), { recursive: true, force: true })),
    ...storeEntries
      .filter((entry) => (entry.startsWith("current.") && entry.endsWith(".pointer")) || (entry.startsWith(`${INITIALIZED_MARKER}.`) && entry.endsWith(".tmp")))
      .map((entry) => rm(join(store, entry), { force: true })),
  ]);
}

async function withPlanLock<T>(planDir: string, action: () => Promise<T>): Promise<T> {
  const lock = await acquirePlanLock(planDir);
  try {
    await cleanupAbandonedPublications(planDir);
    await ensureStore(planDir);
    return await action();
  } finally {
    await lock.release();
  }
}

async function readCurrentSnapshot(planDir: string): Promise<ReviewSnapshot> {
  return withPlanLock(planDir, async () => readSnapshotFrom(await resolveCurrentBundle(planDir)));
}

export async function readReviewState(planDir: string): Promise<ReviewState> {
  return (await readCurrentSnapshot(planDir)).state;
}

export async function readComments(planDir: string): Promise<CommentThread[]> {
  return (await readCurrentSnapshot(planDir)).comments;
}

export async function readPublishedArtifact(planDir: string, file: "agent-handoff.json" | "agent-handoff.md"): Promise<string> {
  const snapshot = await readCurrentSnapshot(planDir);
  if (snapshot.state.status !== "approved" || snapshot.handoffJson === undefined || snapshot.handoffMarkdown === undefined) {
    throw new Error("No coherent approved handoff is published");
  }
  return file === "agent-handoff.json" ? snapshot.handoffJson : snapshot.handoffMarkdown;
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

export async function updateReviewState(planDir: string, value: unknown): Promise<ReviewState> {
  const patchErrors = validateReviewStatePatch(value);
  if (patchErrors.length) throw new Error(patchErrors.join("\n"));
  const patch = value as Partial<ReviewState>;
  if (patch.status === "approved" || patch.approvedAt !== undefined || patch.reviewer !== undefined) {
    throw new Error("Approval status and metadata can only be set through /api/approve");
  }
  return withPlanLock(planDir, async () => {
    const snapshot = await readSnapshotFrom(await resolveCurrentBundle(planDir));
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
    const snapshot = await readSnapshotFrom(await resolveCurrentBundle(planDir));
    const id = input.id ?? `c-${randomUUID()}`;
    if (id.trim().length === 0) throw new Error("Comment id must be nonblank");
    if (snapshot.comments.some((comment) => comment.id === id)) throw new Error(`Duplicate comment id '${id}'`);
    const comment: CommentThread = {
      id,
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
    const snapshot = await readSnapshotFrom(await resolveCurrentBundle(planDir));
    const matches = snapshot.comments.filter((comment) => comment.id === id);
    if (matches.length !== 1) throw new Error(`Unknown or ambiguous comment id '${id}'`);
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
    const snapshot = await readSnapshotFrom(await resolveCurrentBundle(planDir));
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
