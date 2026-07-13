import { createHash, randomUUID } from "node:crypto";
import { constants, type BigIntStats } from "node:fs";
import { link, lstat, mkdir, open, readdir, readlink, realpath, rename, rm, symlink, writeFile, type FileHandle } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { generateAgentHandoff, formatAgentHandoffMarkdown, parseAgentHandoffMarkdown } from "./handoff";
import { type LoadedPlanFolder, loadPlanFolderFromSources } from "./mdx-loader";
import { acquirePlanLock } from "./plan-lock";
import {
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
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
type AssertLockOwned = () => Promise<void>;

interface ReviewSnapshot {
  state: ReviewState;
  comments: CommentThread[];
  handoffJson?: string;
  handoffMarkdown?: string;
}

interface BundleReference {
  id: string;
  path: string;
  directory: BigIntStats;
}

interface OpenBundleMember {
  file: BundleFile;
  path: string;
  handle: FileHandle;
  before: BigIntStats;
}

export type ReviewOperationFailure = "not_found" | "unprocessable" | "conflict";

export class ReviewOperationError extends Error {
  constructor(
    readonly failure: ReviewOperationFailure,
    message: string,
  ) {
    super(message);
    this.name = "ReviewOperationError";
  }
}

class SnapshotCommitVerificationError extends Error {
  constructor(
    readonly published: BundleReference,
    readonly restorable: boolean,
    cause: unknown,
  ) {
    super("Published review snapshot failed canonical postcommit verification", { cause });
    this.name = "SnapshotCommitVerificationError";
  }
}

interface AuthorityFile {
  path: string;
  exists: boolean;
  bytes?: Buffer;
  handle?: FileHandle;
  stats?: BigIntStats;
}

interface PlanAuthority {
  root: BigIntStats;
  files: AuthorityFile[];
  plan: LoadedPlanFolder;
}

function sameGeneration(left: BigIntStats, right: BigIntStats): boolean {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs;
}

interface DirectoryBinding {
  path: string;
  handle: FileHandle;
  stats: BigIntStats;
}

async function openDirectoryBinding(path: string): Promise<DirectoryBinding> {
  const handle = await open(path, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
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
      throw new Error(`Directory path is not bound to its opened generation at ${path}`);
    }
    return { path, handle, stats: descriptor };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function verifyDirectoryBinding(binding: DirectoryBinding): Promise<void> {
  const [descriptor, pathname] = await Promise.all([
    binding.handle.stat({ bigint: true }),
    lstat(binding.path, { bigint: true }),
  ]);
  if (
    descriptor.dev !== binding.stats.dev
    || descriptor.ino !== binding.stats.ino
    || pathname.dev !== binding.stats.dev
    || pathname.ino !== binding.stats.ino
  ) {
    throw new Error(`Directory path generation changed at ${binding.path}`);
  }
}

async function readHandleBytes(handle: FileHandle, size: bigint): Promise<Buffer> {
  if (size > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Plan authority file is too large to read safely");
  const bytes = Buffer.alloc(Number(size));
  let offset = 0;
  while (offset < bytes.length) {
    const result = await handle.read(bytes, offset, bytes.length - offset, offset);
    if (result.bytesRead === 0) throw new Error("Plan authority file ended while being read");
    offset += result.bytesRead;
  }
  return bytes;
}

async function openAuthorityFile(path: string, required: boolean): Promise<AuthorityFile> {
  let handle;
  try {
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (error) {
    if (!required && typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return { path, exists: false };
    }
    throw error;
  }
  try {
    const [descriptor, pathname] = await Promise.all([
      handle.stat({ bigint: true }),
      lstat(path, { bigint: true }),
    ]);
    if (
      !descriptor.isFile()
      || !pathname.isFile()
      || pathname.isSymbolicLink()
      || descriptor.dev !== pathname.dev
      || descriptor.ino !== pathname.ino
    ) {
      throw new Error(`Plan authority path is not bound to its opened file at ${path}`);
    }
    const bytes = await readHandleBytes(handle, descriptor.size);
    const [descriptorAfter, pathnameAfter] = await Promise.all([
      handle.stat({ bigint: true }),
      lstat(path, { bigint: true }),
    ]);
    if (!sameGeneration(descriptor, descriptorAfter) || !sameGeneration(descriptor, pathnameAfter)) {
      throw new Error(`Plan authority changed while being captured at ${path}`);
    }
    return { path, exists: true, bytes, handle, stats: descriptor };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function capturePlanAuthority(planDir: string): Promise<PlanAuthority> {
  const root = await lstat(planDir, { bigint: true });
  if (!root.isDirectory() || root.isSymbolicLink()) throw new Error(`Plan root must be a non-symlink directory at ${planDir}`);
  const settled = await Promise.allSettled([
    openAuthorityFile(join(planDir, "plan.mdx"), true),
    openAuthorityFile(join(planDir, "canvas.mdx"), false),
    openAuthorityFile(join(planDir, "visual-explainer.json"), false),
  ]);
  const failed = settled.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failed) {
    await Promise.allSettled(settled
      .filter((result): result is PromiseFulfilledResult<AuthorityFile> => result.status === "fulfilled")
      .map((result) => result.value.handle?.close()));
    throw failed.reason;
  }
  const files = settled.map((result) => (result as PromiseFulfilledResult<AuthorityFile>).value);
  try {
    const rootAfter = await lstat(planDir, { bigint: true });
    if (!sameGeneration(root, rootAfter)) throw new Error(`Plan root changed while authority was captured at ${planDir}`);
    const [planSource, canvasSource, manifestSource] = files;
    return {
      root,
      files,
      plan: loadPlanFolderFromSources(planDir, {
        plan: planSource.bytes!.toString("utf8"),
        canvas: canvasSource.bytes?.toString("utf8"),
        manifest: manifestSource.bytes?.toString("utf8"),
      }),
    };
  } catch (error) {
    await Promise.allSettled(files.map((file) => file.handle?.close()));
    throw error;
  }
}

async function verifyPlanAuthority(planDir: string, authority: PlanAuthority): Promise<void> {
  const root = await lstat(planDir, { bigint: true });
  if (authority.root.dev !== root.dev || authority.root.ino !== root.ino) throw new Error(`Plan root generation changed at ${planDir}`);
  for (const file of authority.files) {
    if (!file.exists) {
      if (await pathExists(file.path)) throw new Error(`Plan source appeared during approval at ${file.path}`);
      continue;
    }
    const [descriptor, pathname, bytes] = await Promise.all([
      file.handle!.stat({ bigint: true }),
      lstat(file.path, { bigint: true }),
      readHandleBytes(file.handle!, file.stats!.size),
    ]);
    if (
      !sameGeneration(file.stats!, descriptor)
      || !sameGeneration(file.stats!, pathname)
      || !bytes.equals(file.bytes!)
    ) {
      throw new Error(`Plan source changed during approval at ${file.path}`);
    }
  }
}

async function closePlanAuthority(authority: PlanAuthority | undefined): Promise<void> {
  if (authority) await Promise.allSettled(authority.files.map((file) => file.handle?.close()));
}


async function resolveStoreDirectory(planDir: string, create: boolean): Promise<string> {
  const path = join(planDir, STORE_DIR);
  if (create) {
    try {
      await mkdir(path);
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST")) throw error;
    }
  }
  const metadata = await lstat(path);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`Review store must be a plan-local non-symlink directory at ${path}`);
  }
  const [planRoot, storeRoot] = await Promise.all([realpath(planDir), realpath(path)]);
  if (storeRoot !== resolve(planRoot, STORE_DIR)) {
    throw new Error(`Review store escapes the plan directory at ${path}`);
  }
  return path;
}

async function resolveBundlesDirectory(planDir: string, create: boolean): Promise<string> {
  const store = await resolveStoreDirectory(planDir, create);
  const path = join(store, "bundles");
  if (create) {
    try {
      await mkdir(path);
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST")) throw error;
    }
  }
  const metadata = await lstat(path);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`Review bundles root must be a plan-local non-symlink directory at ${path}`);
  }
  const [storeRoot, bundlesRoot] = await Promise.all([realpath(store), realpath(path)]);
  if (bundlesRoot !== resolve(storeRoot, "bundles")) {
    throw new Error(`Review bundles root escapes the review store at ${path}`);
  }
  return path;
}

async function resolveBundleReferenceFromLink(planDir: string, linkPath: string): Promise<BundleReference> {
  const store = await resolveStoreDirectory(planDir, false);
  const bundles = await resolveBundlesDirectory(planDir, false);
  const target = await readlink(linkPath);
  const canonicalTarget = target.replaceAll("\\", "/");
  const match = canonicalTarget.match(/^bundles\/([0-9a-f-]+)$/);
  if (!match || !UUID_PATTERN.test(match[1])) {
    throw new Error(`Invalid current review bundle target '${target}'`);
  }
  const path = join(bundles, match[1]);
  const directory = await lstat(path, { bigint: true });
  if (!directory.isDirectory() || directory.isSymbolicLink() || resolve(store, canonicalTarget) !== resolve(path)) {
    throw new Error(`Current review bundle is not a regular directory at ${path}`);
  }
  return { id: match[1], path, directory };
}

async function resolveCurrentBundle(planDir: string): Promise<BundleReference> {
  const store = await resolveStoreDirectory(planDir, false);
  return resolveBundleReferenceFromLink(planDir, join(store, CURRENT_LINK));
}

async function resolveCurrentBundleIfPresent(planDir: string): Promise<BundleReference | undefined> {
  let store;
  try {
    store = await resolveStoreDirectory(planDir, false);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
  try {
    await lstat(join(store, CURRENT_LINK));
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
  return resolveCurrentBundle(planDir);
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


function canonicalTimestamp(value: unknown): value is string {
  return typeof value === "string"
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value;
}

function parseComments(source: string | undefined): CommentThread[] {
  if (source === undefined) return [];
  const comments = JSON.parse(source) as unknown;
  if (!Array.isArray(comments)) throw new Error("Comments must be an array");
  const allowed: Record<string, true> = {
    id: true,
    blockId: true,
    anchor: true,
    body: true,
    status: true,
    createdAt: true,
    resolvedAt: true,
  };
  const ids = new Set<string>();
  for (const value of comments) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Each comment must be an object");
    const comment = value as Record<string, unknown>;
    const unknown = Object.keys(comment).find((key) => !allowed[key]);
    if (unknown) throw new Error(`Comment contains unknown field '${unknown}'`);
    const resolved = comment.status === "resolved";
    if (
      typeof comment.id !== "string"
      || comment.id.trim().length === 0
      || ids.has(comment.id)
      || typeof comment.blockId !== "string"
      || comment.blockId.trim().length === 0
      || typeof comment.body !== "string"
      || comment.body.trim().length === 0
      || !canonicalTimestamp(comment.createdAt)
      || (comment.status !== "open" && !resolved)
      || (comment.anchor !== undefined && (typeof comment.anchor !== "string" || comment.anchor.trim().length === 0))
      || (resolved && (!canonicalTimestamp(comment.resolvedAt) || Date.parse(comment.resolvedAt) < Date.parse(comment.createdAt)))
      || (!resolved && comment.resolvedAt !== undefined)
    ) {
      throw new Error("Comments must have unique nonblank ids, valid timestamps, and coherent open/resolved fields");
    }
    ids.add(comment.id);
  }
  return comments as CommentThread[];
}

function hasCommentBlock(plan: LoadedPlanFolder, blockId: string): boolean {
  return [...plan.plan.blocks, ...(plan.canvas?.blocks ?? [])].some((block) => block.id === blockId);
}

function assertPersistedCommentAuthority(plan: LoadedPlanFolder, comments: CommentThread[]): void {
  const orphan = comments.find((comment) => !hasCommentBlock(plan, comment.blockId));
  if (orphan) throw new Error(`Persisted comment '${orphan.id}' references unknown blockId '${orphan.blockId}'`);
}

async function readAuthorizedSnapshot(
  root: string,
  authority: PlanAuthority,
  expectedDirectory?: BigIntStats,
): Promise<ReviewSnapshot> {
  const snapshot = await readSnapshotFrom(root, expectedDirectory);
  assertPersistedCommentAuthority(authority.plan, snapshot.comments);
  return snapshot;
}
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

function computeApprovalDigest(
  authority: PlanAuthority,
  state: ReviewState,
  comments: CommentThread[],
): string {
  const { approvalDigest: _approvalDigest, ...stateValues } = state;
  const identity = canonicalize({
    sources: Object.fromEntries(authority.files.map((file) => [
      basename(file.path),
      file.exists ? { exists: true, bytes: file.bytes!.toString("base64") } : { exists: false },
    ])),
    state: stateValues,
    comments,
  });
  return createHash("sha256").update(JSON.stringify(identity)).digest("hex");
}
function assertCanonicalApprovedSnapshot(authority: PlanAuthority, snapshot: ReviewSnapshot): void {
  if (
    snapshot.state.status !== "approved"
    || snapshot.handoffJson === undefined
    || snapshot.handoffMarkdown === undefined
    || snapshot.state.approvalDigest !== computeApprovalDigest(authority, snapshot.state, snapshot.comments)
  ) {
    throw new Error("No coherent approved handoff is published");
  }
  const parsed = JSON.parse(snapshot.handoffJson) as unknown;
  const canonical = generateAgentHandoff(authority.plan, snapshot.state);
  if (
    validateAgentHandoff(parsed).length > 0
    || !isDeepStrictEqual(parsed, canonical)
    || snapshot.handoffMarkdown !== formatAgentHandoffMarkdown(canonical)
    || !isDeepStrictEqual(parseAgentHandoffMarkdown(snapshot.handoffMarkdown), canonical)
  ) {
    throw new Error("No coherent approved handoff is published");
  }
}



async function openBundleMember(root: string, file: BundleFile): Promise<OpenBundleMember> {
  const path = join(root, file);
  let handle;
  try {
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ELOOP") {
      throw new Error(`Review bundle member '${file}' must be a regular non-symlink file`);
    }
    throw error;
  }
  const [before, pathname] = await Promise.all([
    handle.stat({ bigint: true }),
    lstat(path, { bigint: true }),
  ]);
  if (
    !before.isFile()
    || !pathname.isFile()
    || pathname.isSymbolicLink()
    || before.dev !== pathname.dev
    || before.ino !== pathname.ino
  ) {
    await handle.close();
    throw new Error(`Review bundle member '${file}' must be a stable regular non-symlink file`);
  }
  return { file, path, handle, before };
}

async function readSnapshotFrom(root: string, expectedDirectory?: BigIntStats): Promise<ReviewSnapshot> {

  const directoryBefore = await lstat(root, { bigint: true });
  if (expectedDirectory && !sameGeneration(expectedDirectory, directoryBefore)) {
    throw new Error(`Review bundle path generation changed before it was read at ${root}`);
  }
  const entriesBefore = (await readdir(root)).sort();
  for (const entry of entriesBefore) {
    if (!BUNDLE_FILES.includes(entry as BundleFile)) {
      throw new Error(`Review bundle contains unexpected member '${entry}' at ${root}`);
    }
  }
  for (const required of ["plan-state.json", "comments.json"] as const) {
    if (!entriesBefore.includes(required)) throw new Error(`Review bundle is missing ${required} at ${root}`);
  }
  const handoffCount = ["agent-handoff.json", "agent-handoff.md"].filter((file) => entriesBefore.includes(file)).length;
  if (handoffCount === 1) throw new Error(`Review bundle must contain a coherent handoff pair at ${root}`);

  const contents: Partial<Record<BundleFile, string>> = {};
  const members: OpenBundleMember[] = [];
  try {
    for (const entry of entriesBefore) members.push(await openBundleMember(root, entry as BundleFile));
    for (const member of members) contents[member.file] = await member.handle.readFile("utf8");
    for (const member of members) {
      const [after, pathname] = await Promise.all([
        member.handle.stat({ bigint: true }),
        lstat(member.path, { bigint: true }),
      ]);
      if (!sameGeneration(after, member.before) || !sameGeneration(pathname, member.before)) {
        throw new Error(`Review bundle member '${member.file}' changed or was rebound while it was being read at ${root}`);
      }
    }
  } finally {
    await Promise.allSettled(members.map((member) => member.handle.close()));
  }
  const [entriesAfter, directoryAfter] = await Promise.all([
    readdir(root).then((entries) => entries.sort()),
    lstat(root, { bigint: true }),
  ]);
  if (
    !isDeepStrictEqual(entriesAfter, entriesBefore)
    || !sameGeneration(directoryAfter, directoryBefore)
    || (expectedDirectory !== undefined && !sameGeneration(directoryAfter, expectedDirectory))
  ) {
    throw new Error(`Review bundle changed or was rebound while it was being read at ${root}`);
  }
  const state = JSON.parse(contents["plan-state.json"]!) as ReviewState;
  const stateErrors = validateReviewState(state);
  if (stateErrors.length) throw new Error(stateErrors.join("\n"));
  return {
    state,
    comments: parseComments(contents["comments.json"]),
    handoffJson: contents["agent-handoff.json"],
    handoffMarkdown: contents["agent-handoff.md"],
  };
}

async function normalizeSnapshot(
  snapshot: ReviewSnapshot,
  authority: PlanAuthority,
): Promise<ReviewSnapshot> {
  assertPersistedCommentAuthority(authority.plan, snapshot.comments);
  const plan = authority.plan;
  const unresolvedCommentIds = snapshot.comments
    .filter((comment) => comment.status === "open")
    .map((comment) => comment.id);
  let state: ReviewState = { ...snapshot.state, unresolvedCommentIds };
  let { handoffJson, handoffMarkdown } = snapshot;
  let handoffsAgree = false;
  const approvalReady = unresolvedCommentIds.length === 0
    && validateApprovalReadiness([...plan.plan.blocks, ...(plan.canvas?.blocks ?? [])], state).length === 0;
  const identityMatches = state.status !== "approved"
    || state.approvalDigest === computeApprovalDigest(authority, state, snapshot.comments);

  if (state.status === "approved" && approvalReady && identityMatches) {
    try {
      assertCanonicalApprovedSnapshot(authority, { ...snapshot, state });
      handoffsAgree = true;
    } catch {
      handoffsAgree = false;
    }
  }

  if (state.status === "approved" && (!approvalReady || !identityMatches || !handoffsAgree)) {
    const { approvedAt: _approvedAt, reviewer: _reviewer, approvalDigest: _approvalDigest, ...rest } = state;
    state = { ...rest, status: "needs_revision" };
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

async function quarantineCommittedPointer(
  storeBinding: DirectoryBinding,
  currentPath: string,
  expected: BigIntStats,
  assertOwned: AssertLockOwned,
): Promise<void> {
  await verifyDirectoryBinding(storeBinding);
  const actual = await lstat(currentPath, { bigint: true });
  if (actual.dev !== expected.dev || actual.ino !== expected.ino) return;
  await assertOwned();
  await rename(currentPath, `${currentPath}.${randomUUID()}.invalid`);
}

async function publishSnapshot(
  planDir: string,
  snapshot: ReviewSnapshot,
  assertOwned: AssertLockOwned,
  beforeCommit?: () => Promise<void>,
  retainCommittedForRollback = false,
): Promise<BundleReference> {
  const store = await resolveStoreDirectory(planDir, true);
  const bundles = await resolveBundlesDirectory(planDir, true);
  const [storeBinding, bundlesBinding] = await Promise.all([
    openDirectoryBinding(store),
    openDirectoryBinding(bundles),
  ]);
  const identity = randomUUID();
  const staging = join(bundles, `${identity}.staging`);
  const bundle = join(bundles, identity);
  const pointer = join(store, `current.${identity}.pointer`);
  let bundlePublished = false;
  let stagingBinding: DirectoryBinding | undefined;
  let directory: BigIntStats | undefined;

  const closeBindings = async () => {
    await Promise.allSettled([
      stagingBinding?.handle.close(),
      bundlesBinding.handle.close(),
      storeBinding.handle.close(),
    ]);
  };
  const cleanup = async () => {
    let cleanupSafe = true;
    try {
      await Promise.all([verifyDirectoryBinding(storeBinding), verifyDirectoryBinding(bundlesBinding)]);
      if (bundlePublished) {
        const publishedDirectory = await lstat(bundle, { bigint: true });
        cleanupSafe = publishedDirectory.dev === stagingBinding!.stats.dev
          && publishedDirectory.ino === stagingBinding!.stats.ino;
      }
    } catch {
      cleanupSafe = false;
    }
    if (cleanupSafe) {
      await assertOwned();
      await Promise.allSettled([
        rm(staging, { recursive: true, force: true }),
        rm(pointer, { force: true }),
        ...(bundlePublished ? [rm(bundle, { recursive: true, force: true })] : []),
      ]);
    }
  };

  try {
    await verifyDirectoryBinding(bundlesBinding);
    await assertOwned();
    await mkdir(staging);
    stagingBinding = await openDirectoryBinding(staging);
    for (const file of BUNDLE_FILES) {
      const content = snapshotContent(snapshot, file);
      if (content !== undefined) {
        await verifyDirectoryBinding(stagingBinding);
        await assertOwned();
        await writeFile(join(staging, file), content, { flag: "wx" });
      }
    }
    await verifyDirectoryBinding(stagingBinding);
    await verifyDirectoryBinding(bundlesBinding);
    await assertOwned();
    await rename(staging, bundle);
    bundlePublished = true;
    directory = await lstat(bundle, { bigint: true });
    await verifyDirectoryBinding(storeBinding);
    await assertOwned();
    await symlink(`bundles/${identity}`, pointer);
    await beforeCommit?.();
    await verifyDirectoryBinding(storeBinding);
  } catch (error) {
    await cleanup();
    await closeBindings();
    throw error;
  }

  if (!directory) {
    await closeBindings();
    throw new Error("Published review bundle generation was not captured");
  }
  const published = { id: identity, path: bundle, directory };
  const candidate = await resolveBundleReferenceFromLink(planDir, pointer);
  if (candidate.id !== published.id || !sameGeneration(candidate.directory, published.directory)) {
    await cleanup();
    await closeBindings();
    throw new Error("Prepared current pointer does not resolve the published review generation");
  }
  const pointerGeneration = await lstat(pointer, { bigint: true });
  await Promise.allSettled([stagingBinding?.handle.close(), bundlesBinding.handle.close()]);
  await assertOwned();
  await rename(pointer, join(store, CURRENT_LINK));
  let canonicalStore = false;
  let resolvedCurrent = false;
  try {
    await verifyDirectoryBinding(storeBinding);
    canonicalStore = true;
    const current = await resolveCurrentBundle(planDir);
    resolvedCurrent = true;
    if (current.id !== published.id || !sameGeneration(current.directory, published.directory)) {
      throw new Error("Canonical current pointer does not resolve the published review generation");
    }
  } catch (error) {
    const restorable = canonicalStore && retainCommittedForRollback && !resolvedCurrent;
    if (canonicalStore && !restorable) {
      await quarantineCommittedPointer(storeBinding, join(store, CURRENT_LINK), pointerGeneration, assertOwned);
    }
    throw new SnapshotCommitVerificationError(published, restorable, error);
  } finally {
    await storeBinding.handle.close().catch(() => undefined);
  }
  return published;
}

async function restorePriorPublication(
  planDir: string,
  prior: BundleReference,
  priorBinding: DirectoryBinding,
  published: BundleReference,
  assertOwned: AssertLockOwned,
): Promise<void> {
  const store = await resolveStoreDirectory(planDir, false);
  const storeBinding = await openDirectoryBinding(store);
  const pointer = join(store, `current.${randomUUID()}.rollback`);
  let pointerGeneration: BigIntStats | undefined;
  let committed = false;
  try {
    const current = await resolveCurrentBundle(planDir);
    if (current.id !== published.id || !sameGeneration(current.directory, published.directory)) {
      throw new Error("Published approval generation changed before rollback");
    }
    await symlink(`bundles/${prior.id}`, pointer);
    await verifyDirectoryBinding(priorBinding);
    await verifyDirectoryBinding(storeBinding);
    pointerGeneration = await lstat(pointer, { bigint: true });
    await assertOwned();
    await rename(pointer, join(store, CURRENT_LINK));
    committed = true;
    await verifyDirectoryBinding(storeBinding);
    const restored = await resolveCurrentBundle(planDir);
    if (restored.id !== prior.id || !sameGeneration(restored.directory, prior.directory)) {
      throw new Error("Canonical current pointer does not resolve the restored prior generation");
    }
  } catch (error) {
    if (committed && pointerGeneration) {
      await quarantineCommittedPointer(storeBinding, join(store, CURRENT_LINK), pointerGeneration, assertOwned);
    } else {
      try {
        await verifyDirectoryBinding(storeBinding);
        await rm(pointer, { force: true });
      } catch {
        // A rebound canonical store is never modified during rollback cleanup.
      }
    }
    await Promise.allSettled([priorBinding.handle.close(), storeBinding.handle.close()]);
    throw error;
  }
  await Promise.allSettled([priorBinding.handle.close(), storeBinding.handle.close()]);
}

async function publishInvalidation(
  planDir: string,
  current: BundleReference,
  snapshot: ReviewSnapshot,
  assertOwned: AssertLockOwned,
): Promise<BundleReference> {
  const store = await resolveStoreDirectory(planDir, false);
  const invalidatedPointer = join(store, `current.${randomUUID()}.invalid`);
  await assertOwned();
  await rename(join(store, CURRENT_LINK), invalidatedPointer);
  const quarantined = await resolveBundleReferenceFromLink(planDir, invalidatedPointer);
  if (quarantined.id !== current.id) {
    throw new Error("Current approval generation changed while being invalidated");
  }
  const published = await publishSnapshot(planDir, snapshot, assertOwned);
  try {
    await assertOwned();
    await rm(invalidatedPointer, { force: true });
  } catch (error) {
    console.warn(`Invalidation committed; deferred pointer cleanup: ${error instanceof Error ? error.message : String(error)}`);
  }
  return published;
}

async function recoverInvalidatedBundle(planDir: string): Promise<BundleReference | undefined> {
  const store = await resolveStoreDirectory(planDir, false);
  const invalidated = (await readdir(store)).filter((entry) => entry.startsWith("current.") && entry.endsWith(".invalid"));
  if (invalidated.length === 0) return undefined;
  if (invalidated.length !== 1) throw new Error("Review store has multiple invalidated approval generations");
  return resolveBundleReferenceFromLink(planDir, join(store, invalidated[0]));
}

interface CompatibilitySnapshot {
  path: string;
  kind: "missing" | "file" | "symlink";
  content?: Buffer;
  target?: string;
  stats?: BigIntStats;
}

class LegacyGenerationChangedError extends Error {}

async function captureCompatibilityPath(path: string): Promise<CompatibilitySnapshot> {
  let metadata;
  try {
    metadata = await lstat(path, { bigint: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return { path, kind: "missing" };
    }
    throw error;
  }
  if (metadata.isSymbolicLink()) {
    const target = await readlink(path);
    const after = await lstat(path, { bigint: true });
    if (!sameGeneration(metadata, after)) throw new LegacyGenerationChangedError(`Legacy path changed while captured at ${path}`);
    return { path, kind: "symlink", target, stats: metadata };
  }
  if (!metadata.isFile()) throw new Error(`Unsupported compatibility path at ${path}`);
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const descriptor = await handle.stat({ bigint: true });
    if (descriptor.dev !== metadata.dev || descriptor.ino !== metadata.ino) {
      throw new LegacyGenerationChangedError(`Legacy path was rebound while captured at ${path}`);
    }
    const content = await readHandleBytes(handle, descriptor.size);
    const [descriptorAfter, pathnameAfter] = await Promise.all([
      handle.stat({ bigint: true }),
      lstat(path, { bigint: true }),
    ]);
    if (!sameGeneration(descriptor, descriptorAfter) || !sameGeneration(descriptor, pathnameAfter)) {
      throw new LegacyGenerationChangedError(`Legacy path changed while captured at ${path}`);
    }
    return { path, kind: "file", content, stats: descriptor };
  } finally {
    await handle.close();
  }
}

async function captureCompatibilityPaths(planDir: string): Promise<CompatibilitySnapshot[]> {
  return Promise.all(BUNDLE_FILES.map((file) => captureCompatibilityPath(join(planDir, file))));
}

async function verifyCompatibilitySnapshot(expected: CompatibilitySnapshot): Promise<void> {
  const current = await captureCompatibilityPath(expected.path);
  const unchanged = current.kind === expected.kind
    && (current.kind === "missing"
      || (sameGeneration(current.stats!, expected.stats!)
        && (current.kind === "file"
          ? current.content!.equals(expected.content!)
          : current.target === expected.target)));
  if (!unchanged) throw new LegacyGenerationChangedError(`Legacy path generation changed at ${expected.path}`);
}

function legacyReviewSnapshot(snapshots: CompatibilitySnapshot[]): ReviewSnapshot {
  const source = (file: BundleFile): string | undefined => {
    const snapshot = snapshots[BUNDLE_FILES.indexOf(file)];
    if (snapshot.kind === "symlink") throw new Error(`Legacy review path must not be a symlink at ${snapshot.path}`);
    return snapshot.content?.toString("utf8");
  };
  const stateSource = source("plan-state.json");
  const state = stateSource === undefined ? createDefaultReviewState() : JSON.parse(stateSource) as ReviewState;
  const stateErrors = validateReviewState(state).filter(
    (error) => error !== "Approved ReviewState.approvalDigest must be a canonical SHA-256 digest",
  );
  if (stateErrors.length) throw new Error(stateErrors.join("\n"));
  return {
    state,
    comments: parseComments(source("comments.json")),
    handoffJson: source("agent-handoff.json"),
    handoffMarkdown: source("agent-handoff.md"),
  };
}

interface CompatibilityReplacement {
  original: CompatibilitySnapshot;
  installed: CompatibilitySnapshot;
  quarantine?: string;
}

function sameCompatibilityPayload(left: CompatibilitySnapshot, right: CompatibilitySnapshot): boolean {
  return left.kind === right.kind
    && left.kind !== "missing"
    && left.stats!.dev === right.stats!.dev
    && left.stats!.ino === right.stats!.ino
    && (left.kind === "file" ? left.content!.equals(right.content!) : left.target === right.target);
}
async function verifyCompatibilityPayload(expected: CompatibilitySnapshot): Promise<void> {
  const current = await captureCompatibilityPath(expected.path);
  const unchanged = expected.kind === "missing"
    ? current.kind === "missing"
    : sameCompatibilityPayload(expected, current);
  if (!unchanged) throw new LegacyGenerationChangedError(`Legacy path generation changed at ${expected.path}`);
}
async function restoreQuarantinedCompatibility(
  expected: CompatibilitySnapshot,
  quarantine: string,
  assertOwned: AssertLockOwned,
): Promise<void> {
  const quarantined = await captureCompatibilityPath(quarantine);
  if (!sameCompatibilityPayload(expected, quarantined)) {
    throw new LegacyGenerationChangedError(`Quarantined compatibility generation changed at ${expected.path}`);
  }
  await assertOwned();
  await link(quarantine, expected.path);
  await verifyCompatibilityPayload(expected);
  await assertOwned();
  await rm(quarantine, { force: true });
}




async function rollbackCompatibilityReplacement(
  replacement: CompatibilityReplacement,
  assertOwned: AssertLockOwned,
): Promise<void> {
  const displaced = `${replacement.original.path}.${randomUUID()}.rollback`;
  await assertOwned();
  const current = await captureCompatibilityPath(replacement.original.path);
  if (!sameCompatibilityPayload(replacement.installed, current)) {
    throw new LegacyGenerationChangedError(`Compatibility path changed before rollback at ${replacement.original.path}`);
  }
  if (replacement.quarantine) {
    const quarantined = await captureCompatibilityPath(replacement.quarantine);
    if (!sameCompatibilityPayload(replacement.original, quarantined)) {
      throw new LegacyGenerationChangedError(`Quarantined compatibility generation changed at ${replacement.original.path}`);
    }
  } else if (replacement.original.kind !== "missing") {
    throw new Error(`Compatibility rollback is missing quarantine authority at ${replacement.original.path}`);
  }

  await assertOwned();
  await rename(replacement.original.path, displaced);
  const moved = await captureCompatibilityPath(displaced);
  if (!sameCompatibilityPayload(replacement.installed, moved)) {
    throw new LegacyGenerationChangedError(`Compatibility path changed during rollback at ${replacement.original.path}`);
  }
  try {
    const destination = await captureCompatibilityPath(replacement.original.path);
    if (destination.kind !== "missing") {
      throw new LegacyGenerationChangedError(`External compatibility successor appeared during rollback at ${replacement.original.path}`);
    }
    if (replacement.quarantine) {
      await restoreQuarantinedCompatibility(replacement.original, replacement.quarantine, assertOwned);
    } else {
      await verifyCompatibilityPayload(replacement.original);
    }
  } catch (error) {
    const rollbackErrors: unknown[] = [error];
    try {
      const destination = await captureCompatibilityPath(replacement.original.path);
      if (destination.kind === "missing") {
        await restoreQuarantinedCompatibility(replacement.installed, displaced, assertOwned);
      }
    } catch (rollbackError) {
      rollbackErrors.push(rollbackError);
    }
    throw new AggregateError(rollbackErrors, `Compatibility rollback retained ambiguous generations at ${replacement.original.path}`);
  }
  await assertOwned();
  await rm(displaced, { force: true });
}

async function installCompatibilityLinks(
  planDir: string,
  snapshots: CompatibilitySnapshot[],
  assertOwned: AssertLockOwned,
): Promise<CompatibilityReplacement[]> {
  const rootBinding = await openDirectoryBinding(planDir);
  const replaced: CompatibilityReplacement[] = [];
  try {
    for (let index = 0; index < BUNDLE_FILES.length; index += 1) {
      const file = BUNDLE_FILES[index];
      const original = snapshots[index];
      const destination = join(planDir, file);
      const target = join(STORE_DIR, CURRENT_LINK, file);
      let quarantine: string | undefined;
      let installedRecorded = false;
      await verifyDirectoryBinding(rootBinding);
      await verifyCompatibilitySnapshot(original);
      if (original.kind !== "missing") {
        quarantine = join(planDir, `.${file}.${randomUUID()}.legacy`);
        await assertOwned();
        await rename(destination, quarantine);
        const moved = await captureCompatibilityPath(quarantine);
        if (!sameCompatibilityPayload(original, moved)) {
          const migrationError = new LegacyGenerationChangedError(`Legacy path changed during conditional migration at ${destination}`);
          try {
            await restoreQuarantinedCompatibility({ ...moved, path: destination }, quarantine, assertOwned);
          } catch (rollbackError) {
            throw new AggregateError([migrationError, rollbackError], `Conditional compatibility migration rollback failed at ${destination}`);
          }
          throw migrationError;
        }
      }
      try {
        await verifyDirectoryBinding(rootBinding);
        await assertOwned();
        await symlink(target, destination);
        const stats = await lstat(destination, { bigint: true });
        if (!stats.isSymbolicLink()) throw new Error(`Installed compatibility path is not a symlink at ${destination}`);
        const installed: CompatibilitySnapshot = { path: destination, kind: "symlink", target, stats };
        replaced.push({ original, installed, quarantine });
        installedRecorded = true;
        await verifyCompatibilitySnapshot(installed);
      } catch (error) {
        const rollbackErrors: unknown[] = [];
        if (!installedRecorded && quarantine) {
          let successorObserved = false;
          try {
            const destinationState = await captureCompatibilityPath(destination);
            const quarantined = await captureCompatibilityPath(quarantine);
            if (!sameCompatibilityPayload(original, quarantined)) {
              throw new LegacyGenerationChangedError(`Quarantined compatibility generation changed at ${destination}`);
            }
            if (destinationState.kind !== "missing") {
              successorObserved = true;
              await assertOwned();
              await rm(quarantine, { force: true });
              throw new LegacyGenerationChangedError(`Compatibility destination changed during migration at ${destination}`);
            }
            await restoreQuarantinedCompatibility(original, quarantine, assertOwned);
          } catch (rollbackError) {
            if (successorObserved) throw rollbackError;
            rollbackErrors.push(rollbackError);
          }
        }
        if (rollbackErrors.length) {
          throw new AggregateError([error, ...rollbackErrors], `Compatibility installation failed and rollback was incomplete at ${destination}`);
        }
        if (error instanceof LegacyGenerationChangedError) throw error;
        if (typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST") {
          throw new LegacyGenerationChangedError(`Compatibility destination changed during migration at ${destination}`);
        }
        throw error;
      }
    }
    return replaced;
  } catch (error) {
    const rollbackErrors: unknown[] = [];
    for (const replacement of replaced.reverse()) {
      try {
        await verifyDirectoryBinding(rootBinding);
        await rollbackCompatibilityReplacement(replacement, assertOwned);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) throw new AggregateError([error, ...rollbackErrors], "Compatibility setup failed and rollback was incomplete");
    throw error;
  } finally {
    await rootBinding.handle.close();
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

async function publishInitializedMarker(
  store: string,
  marker: string,
  assertOwned: AssertLockOwned,
): Promise<void> {
  const binding = await openDirectoryBinding(store);
  try {
    await verifyDirectoryBinding(binding);
    await assertOwned();
    await writeFile(marker, "v1\n", { flag: "wx" });
  } finally {
    await binding.handle.close();
  }
}

async function ensureStore(
  planDir: string,
  currentReference: BundleReference | undefined,
  authority: PlanAuthority,
  assertOwned: AssertLockOwned,
  normalize = true,
): Promise<BundleReference> {
  await assertOwned();
  const store = await resolveStoreDirectory(planDir, true);
  await resolveBundlesDirectory(planDir, true);
  const marker = join(store, INITIALIZED_MARKER);
  const initialized = await pathExists(marker);

  if (initialized) {
    if (!(await compatibilityLinksReady(planDir))) {
      throw new Error("Initialized review store has missing or replaced compatibility paths");
    }
    const recoveringInvalidation = currentReference === undefined;
    const authoritative = currentReference ?? await recoverInvalidatedBundle(planDir);
    if (!authoritative) throw new Error("Initialized review store is missing its current bundle");
    if (!normalize) return authoritative;
    const current = await readSnapshotFrom(authoritative.path, authoritative.directory);
    let normalized = await normalizeSnapshot(current, authority);
    if (recoveringInvalidation && normalized.state.status === "approved") {
      const { approvedAt: _approvedAt, reviewer: _reviewer, approvalDigest: _approvalDigest, ...rest } = normalized.state;
      normalized = { state: { ...rest, status: "needs_revision" }, comments: normalized.comments };
    }
    if (isDeepStrictEqual(normalized, current)) return authoritative;
    if (recoveringInvalidation) return publishSnapshot(planDir, normalized, assertOwned);
    return current.state.status === "approved" && normalized.state.status !== "approved"
      ? publishInvalidation(planDir, authoritative, normalized, assertOwned)
      : publishSnapshot(planDir, normalized, assertOwned);
  }

  if (currentReference && await compatibilityLinksReady(planDir)) {
    await publishInitializedMarker(store, marker, assertOwned);
    return currentReference;
  }

  let publishedReference: BundleReference | undefined;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const legacyPaths = await captureCompatibilityPaths(planDir);
    const currentPath = join(store, CURRENT_LINK);
    const priorCurrent = await captureCompatibilityPath(currentPath);
    const candidate = await publishSnapshot(
      planDir,
      await normalizeSnapshot(legacyReviewSnapshot(legacyPaths), authority),
      assertOwned,
    );
    const installedCurrent = await captureCompatibilityPath(currentPath);
    let replacements: CompatibilityReplacement[] = [];
    try {
      replacements = await installCompatibilityLinks(planDir, legacyPaths, assertOwned);
      await publishInitializedMarker(store, marker, assertOwned);
      for (const replacement of replacements) {
        if (replacement.quarantine) {
          await assertOwned();
          await rm(replacement.quarantine, { force: true });
        }
      }
      publishedReference = candidate;
      break;
    } catch (error) {
      const rollbackErrors: unknown[] = [];
      const installedMarker = await captureCompatibilityPath(marker);
      if (installedMarker.kind !== "missing") {
        try {
          await rollbackCompatibilityReplacement({
            original: { path: marker, kind: "missing" },
            installed: installedMarker,
          }, assertOwned);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      for (const replacement of replacements.reverse()) {
        try {
          await rollbackCompatibilityReplacement(replacement, assertOwned);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      try {
        await rollbackCompatibilityReplacement({
          original: priorCurrent,
          installed: installedCurrent,
        }, assertOwned);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      if (rollbackErrors.length) {
        throw new AggregateError([error, ...rollbackErrors], "Review-store initialization failed and rollback was incomplete");
      }
      if (!(error instanceof LegacyGenerationChangedError)) throw error;
    }
  }
  if (!publishedReference) throw new Error("Legacy review state kept changing during migration");
  await cleanupAbandonedPublications(planDir, publishedReference, assertOwned);
  return publishedReference;
}

async function cleanupAbandonedPublications(
  planDir: string,
  currentReference: BundleReference,
  assertOwned: AssertLockOwned,
): Promise<void> {
  await assertOwned();
  const store = await resolveStoreDirectory(planDir, false);
  const bundles = await resolveBundlesDirectory(planDir, false);
  const [storeBinding, bundlesBinding] = await Promise.all([
    openDirectoryBinding(store),
    openDirectoryBinding(bundles),
  ]);
  try {
    const bundleEntries = await readdir(bundles);
    for (const entry of bundleEntries.filter((name) => name.endsWith(".staging") || name !== currentReference.id)) {
      await verifyDirectoryBinding(bundlesBinding);
      const path = join(bundles, entry);
      let binding: DirectoryBinding;
      try {
        binding = await openDirectoryBinding(path);
      } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") continue;
        throw error;
      }
      const quarantine = join(bundles, `.cleanup-${randomUUID()}`);
      try {
        await verifyDirectoryBinding(binding);
        await verifyDirectoryBinding(bundlesBinding);
        await assertOwned();
        await rename(path, quarantine);
        const moved = await lstat(quarantine, { bigint: true });
        if (moved.dev !== binding.stats.dev || moved.ino !== binding.stats.ino) {
          console.warn(`Retained rebound review bundle cleanup candidate at ${quarantine}`);
          continue;
        }
        const descriptor = await binding.handle.stat({ bigint: true });
        if (descriptor.dev !== moved.dev || descriptor.ino !== moved.ino) {
          console.warn(`Retained changed review bundle cleanup candidate at ${quarantine}`);
          continue;
        }
        await assertOwned();
        await rm(quarantine, { recursive: true });
      } finally {
        await binding.handle.close();
      }
    }

    const storeEntries = await readdir(store);
    for (const entry of storeEntries.filter((name) =>
      (name.startsWith("current.") && (name.endsWith(".pointer") || name.endsWith(".invalid") || name.endsWith(".rollback")))
      || (name.startsWith(`${INITIALIZED_MARKER}.`) && name.endsWith(".tmp")))) {
      await verifyDirectoryBinding(storeBinding);
      const path = join(store, entry);
      const before = await lstat(path, { bigint: true });
      const quarantine = join(store, `.cleanup-${randomUUID()}`);
      await assertOwned();
      await rename(path, quarantine);
      const moved = await lstat(quarantine, { bigint: true });
      if (before.dev !== moved.dev || before.ino !== moved.ino) {
        console.warn(`Retained rebound temporary review-store path at ${quarantine}`);
        continue;
      }
      await assertOwned();
      await rm(quarantine);
    }
  } finally {
    await Promise.allSettled([storeBinding.handle.close(), bundlesBinding.handle.close()]);
  }
}

async function withPlanLock<T>(
  planDir: string,
  action: (current: BundleReference, authority: PlanAuthority, assertOwned: AssertLockOwned, canonicalPlanDir: string) => Promise<T>,
  options: {
    normalize?: boolean;
    cleanup?: boolean;
    preflight?: (snapshot: ReviewSnapshot, authority: PlanAuthority) => Promise<void> | void;
  } = {},
): Promise<T> {
  planDir = await realpath(planDir);
  const lock = await acquirePlanLock(planDir);
  let authority: PlanAuthority | undefined;
  try {
    await lock.assertOwned();
    const currentBeforeInitialization = await resolveCurrentBundleIfPresent(planDir);
    authority = await capturePlanAuthority(planDir);
    let preflightComplete = false;
    if (currentBeforeInitialization) {
      const snapshot = await readAuthorizedSnapshot(
        currentBeforeInitialization.path,
        authority,
        currentBeforeInitialization.directory,
      );
      await options.preflight?.(snapshot, authority);
      preflightComplete = true;
    } else {
      const legacyPaths = await captureCompatibilityPaths(planDir);
      if (!legacyPaths.some((entry) => entry.kind === "symlink")) {
        const snapshot = legacyReviewSnapshot(legacyPaths);
        assertPersistedCommentAuthority(authority.plan, snapshot.comments);
        await options.preflight?.(snapshot, authority);
        preflightComplete = true;
      }
    }
    await lock.assertOwned();
    const current = await ensureStore(planDir, currentBeforeInitialization, authority, lock.assertOwned, options.normalize);
    if (!preflightComplete && options.preflight) {
      const snapshot = await readAuthorizedSnapshot(current.path, authority, current.directory);
      await options.preflight(snapshot, authority);
    }
    if (options.cleanup !== false) await cleanupAbandonedPublications(planDir, current, lock.assertOwned);
    return await action(current, authority, lock.assertOwned, planDir);
  } finally {
    await closePlanAuthority(authority);
    await lock.release();
  }
}

async function readCurrentSnapshot(planDir: string): Promise<ReviewSnapshot> {
  return withPlanLock(planDir, async (current, authority, assertOwned, canonicalPlanDir) => {
    const snapshot = await readAuthorizedSnapshot(current.path, authority, current.directory);
    if (
      snapshot.state.status === "approved"
      && snapshot.state.approvalDigest !== computeApprovalDigest(authority, snapshot.state, snapshot.comments)
    ) {
      throw new Error("Approved review identity changed while it was being read");
    }
    if (snapshot.state.status === "approved") {
      await assertOwned();
      await verifyPlanAuthority(canonicalPlanDir, authority);
    }
    return snapshot;
  });
}

export async function readReviewState(planDir: string): Promise<ReviewState> {
  return (await readCurrentSnapshot(planDir)).state;
}

export async function readComments(planDir: string): Promise<CommentThread[]> {
  return (await readCurrentSnapshot(planDir)).comments;
}

export async function readPublishedArtifact(planDir: string, file: "agent-handoff.json" | "agent-handoff.md"): Promise<string> {
  planDir = await realpath(planDir);
  const lock = await acquirePlanLock(planDir);
  let authority: PlanAuthority | undefined;
  try {
    await lock.assertOwned();
    const current = await resolveCurrentBundleIfPresent(planDir);
    if (!current) throw new ReviewOperationError("not_found", "No coherent approved handoff is published");
    authority = await capturePlanAuthority(planDir);
    const snapshot = await readAuthorizedSnapshot(current.path, authority, current.directory);
    try {
      assertCanonicalApprovedSnapshot(authority, snapshot);
    } catch {
      throw new ReviewOperationError("not_found", "No coherent approved handoff is published");
    }
    await lock.assertOwned();
    await verifyPlanAuthority(planDir, authority);
    return file === "agent-handoff.json" ? snapshot.handoffJson! : snapshot.handoffMarkdown!;
  } finally {
    await closePlanAuthority(authority);
    await lock.release();
  }
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
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const candidate = value as Partial<ReviewState>;
    if (candidate.status === "approved" || "approvedAt" in candidate || "reviewer" in candidate || "approvalDigest" in candidate) {
      throw new Error("Approval status and metadata can only be set through /api/approve");
    }
  }
  const patchErrors = validateReviewStatePatch(value);
  if (patchErrors.length) throw new Error(patchErrors.join("\n"));
  const patch = value as Partial<ReviewState>;
  return withPlanLock(planDir, async (current, authority, assertOwned, canonicalPlanDir) => {
    const snapshot = await readAuthorizedSnapshot(current.path, authority, current.directory);
    let state = mergeReviewState(snapshot.state, patch, snapshot.comments);
    let handoffJson = snapshot.handoffJson;
    let handoffMarkdown = snapshot.handoffMarkdown;
    if (snapshot.state.status === "approved" && (patch.status !== undefined || patch.answers !== undefined || patch.checklist !== undefined)) {
      const { approvedAt: _approvedAt, reviewer: _reviewer, approvalDigest: _approvalDigest, ...rest } = state;
      state = { ...rest, status: "needs_revision" };
      handoffJson = undefined;
      handoffMarkdown = undefined;
    }
    const errors = validateReviewState(state);
    if (errors.length) throw new Error(errors.join("\n"));
    await publishSnapshot(canonicalPlanDir, { ...snapshot, state, handoffJson, handoffMarkdown }, assertOwned);
    return state;
  });
}

export async function addComment(
  planDir: string,
  input: Omit<CommentThread, "id" | "status" | "createdAt"> & { id?: string },
): Promise<CommentThread> {
  if (typeof input.blockId !== "string" || input.blockId.trim().length === 0) throw new Error("Comment blockId must be nonblank");
  if (typeof input.body !== "string" || input.body.trim().length === 0) throw new Error("Comment body must be nonblank");
  if (input.anchor !== undefined && (typeof input.anchor !== "string" || input.anchor.trim().length === 0)) {
    throw new Error("Comment anchor must be nonblank when present");
  }
  const requireKnownBlock = (authority: PlanAuthority) => {
    if (!hasCommentBlock(authority.plan, input.blockId)) {
      throw new ReviewOperationError("unprocessable", `Unknown comment blockId '${input.blockId}'`);
    }
  };
  return withPlanLock(planDir, async (current, authority, assertOwned, canonicalPlanDir) => {
    requireKnownBlock(authority);
    const snapshot = await readAuthorizedSnapshot(current.path, authority, current.directory);
    const id = input.id ?? `c-${randomUUID()}`;
    if (id.trim().length === 0) throw new Error("Comment id must be nonblank");
    const existing = snapshot.comments.find((comment) => comment.id === id);
    if (existing) {
      if (
        existing.blockId === input.blockId
        && existing.anchor === input.anchor
        && existing.body === input.body
      ) {
        return existing;
      }
      throw new ReviewOperationError("conflict", `Comment id '${id}' is already bound to a different payload`);
    }
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
      const { approvedAt: _approvedAt, reviewer: _reviewer, approvalDigest: _approvalDigest, ...rest } = state;
      state = { ...rest, status: "needs_revision" };
      handoffJson = undefined;
      handoffMarkdown = undefined;
    }
    await publishSnapshot(canonicalPlanDir, { ...snapshot, state, comments, handoffJson, handoffMarkdown }, assertOwned);
    return comment;
  }, { preflight: (_snapshot, authority) => requireKnownBlock(authority) });
}

export async function resolveComment(planDir: string, id: string): Promise<CommentThread[]> {
  const requireComment = (snapshot: ReviewSnapshot) => {
    const matches = snapshot.comments.filter((comment) => comment.id === id);
    if (matches.length !== 1) {
      throw new ReviewOperationError("not_found", `Unknown or ambiguous comment id '${id}'`);
    }
  };
  return withPlanLock(planDir, async (current, authority, assertOwned, canonicalPlanDir) => {
    const snapshot = await readAuthorizedSnapshot(current.path, authority, current.directory);
    requireComment(snapshot);
    if (snapshot.comments.find((comment) => comment.id === id)!.status === "resolved") return snapshot.comments;
    const comments = snapshot.comments.map((comment) => comment.id === id
      ? { ...comment, status: "resolved" as const, resolvedAt: new Date().toISOString() }
      : comment);
    const state = mergeReviewState(snapshot.state, {}, comments);
    await publishSnapshot(canonicalPlanDir, { ...snapshot, state, comments }, assertOwned);
    return comments;
  }, { preflight: requireComment });
}

function assertApprovalReady(plan: LoadedPlanFolder, snapshot: ReviewSnapshot): void {
  const readinessBlocks = [...plan.plan.blocks, ...(plan.canvas?.blocks ?? [])];
  const errors = [
    ...(snapshot.comments.some((comment) => comment.status === "open")
      ? ["AgentHandoff cannot be generated while unresolved blocking comments remain"]
      : []),
    ...validateApprovalReadiness(readinessBlocks, snapshot.state),
  ];
  if (errors.length) throw new ReviewOperationError("unprocessable", errors.join("\n"));
}

export async function approvePlan(planDir: string, reviewer = "local-reviewer") {
  if (reviewer.trim().length === 0) throw new Error("Approval reviewer must be nonblank");
  return withPlanLock(planDir, async (current, authority, assertOwned, canonicalPlanDir) => {
    const plan = authority.plan;
    const snapshot = await readAuthorizedSnapshot(current.path, authority, current.directory);
    assertApprovalReady(plan, snapshot);

    const approvedAt = new Date().toISOString();
    const stateWithoutDigest = mergeReviewState(
      snapshot.state,
      { status: "approved", approvedAt, reviewer, approvalDigest: undefined },
      snapshot.comments,
    );
    const state: ReviewState = {
      ...stateWithoutDigest,
      approvalDigest: computeApprovalDigest(authority, stateWithoutDigest, snapshot.comments),
    };
    const stateErrors = validateReviewState(state);
    if (stateErrors.length) throw new Error(stateErrors.join("\n"));

    const handoff = generateAgentHandoff(plan, state);
    const handoffErrors = validateAgentHandoff(handoff);
    if (handoffErrors.length) throw new Error(handoffErrors.join("\n"));
    const handoffJson = `${JSON.stringify(handoff, null, 2)}\n`;
    const handoffMarkdown = formatAgentHandoffMarkdown(handoff);
    assertCanonicalApprovedSnapshot(authority, {
      state,
      comments: snapshot.comments,
      handoffJson,
      handoffMarkdown,
    });

    const verifyIdentity = async () => {
      await assertOwned();
      await verifyPlanAuthority(canonicalPlanDir, authority);
      if (state.approvalDigest !== computeApprovalDigest(authority, state, snapshot.comments)) {
        throw new Error("Plan source or review state changed during approval");
      }
    };
    const priorBinding = await openDirectoryBinding(current.path);
    let published: BundleReference;
    try {
      published = await publishSnapshot(canonicalPlanDir, {
        state,
        comments: snapshot.comments,
        handoffJson,
        handoffMarkdown,
      }, assertOwned, verifyIdentity, true);
    } catch (error) {
      if (error instanceof SnapshotCommitVerificationError && error.restorable) {
        try {
          await restorePriorPublication(canonicalPlanDir, current, priorBinding, error.published, assertOwned);
        } catch (rollbackError) {
          throw new AggregateError([error, rollbackError], "Approval publication verification failed and prior authority could not be restored");
        }
      } else {
        await priorBinding.handle.close().catch(() => undefined);
      }
      throw error;
    }
    try {
      await verifyIdentity();
    } catch (error) {
      try {
        await restorePriorPublication(canonicalPlanDir, current, priorBinding, published, assertOwned);
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], "Approval identity failed and prior authority could not be restored");
      }
      throw error;
    }
    await priorBinding.handle.close().catch(() => undefined);
    try {
      await cleanupAbandonedPublications(canonicalPlanDir, published, assertOwned);
    } catch (error) {
      console.warn(`Approval committed; deferred review-store cleanup: ${error instanceof Error ? error.message : String(error)}`);
    }
    return handoff;
  }, {
    normalize: false,
    cleanup: false,
    preflight: (snapshot, authority) => assertApprovalReady(authority.plan, snapshot),
  });
}
