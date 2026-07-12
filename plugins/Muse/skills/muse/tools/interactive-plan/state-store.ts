import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { generateAgentHandoff, formatAgentHandoffMarkdown } from "./handoff";
import { loadPlanFolder } from "./mdx-loader";
import { createDefaultReviewState, type CommentThread, type ReviewState, validateApprovalReadiness, validateReviewState } from "./schema";

async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function atomicWrite(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temp, path);
}
type ApprovalPublicationStep = "handoff-json" | "handoff-markdown" | "state";

export interface ApprovalPublicationHooks {
  beforePublish?(step: ApprovalPublicationStep): void | Promise<void>;
}

interface PublicationFile {
  step: ApprovalPublicationStep;
  path: string;
  stagedPath: string;
  content: string;
  priorContent?: Uint8Array;
}

async function readOptionalBytes(path: string): Promise<Uint8Array | undefined> {
  try {
    return await readFile(path);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function restoreFile(file: PublicationFile): Promise<void> {
  if (file.priorContent === undefined) {
    await rm(file.path, { force: true });
    return;
  }
  const restorePath = `${file.path}.${process.pid}.${Date.now()}.restore`;
  await writeFile(restorePath, file.priorContent);
  await rename(restorePath, file.path);
}

async function publishApproval(files: PublicationFile[], hooks: ApprovalPublicationHooks): Promise<void> {
  const staged: PublicationFile[] = [];
  try {
    for (const file of files) {
      file.priorContent = await readOptionalBytes(file.path);
      await writeFile(file.stagedPath, file.content);
      staged.push(file);
    }
  } catch (error) {
    await Promise.allSettled(staged.map((file) => rm(file.stagedPath, { force: true })));
    throw error;
  }

  const published: PublicationFile[] = [];
  try {
    for (const file of files) {
      await hooks.beforePublish?.(file.step);
      await rename(file.stagedPath, file.path);
      published.push(file);
    }
  } catch (error) {
    const rollbackResults = await Promise.allSettled(published.reverse().map(restoreFile));
    await Promise.allSettled(files.map((file) => rm(file.stagedPath, { force: true })));
    const rollbackFailures = rollbackResults
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason);
    if (rollbackFailures.length) {
      throw new AggregateError([error, ...rollbackFailures], "Approval publication failed and rollback was incomplete");
    }
    throw error;
  }
}

export function statePath(planDir: string): string {
  return join(planDir, "plan-state.json");
}

export function commentsPath(planDir: string): string {
  return join(planDir, "comments.json");
}

export async function readReviewState(planDir: string): Promise<ReviewState> {
  const state = await readJsonFile(statePath(planDir), createDefaultReviewState());
  const errors = validateReviewState(state);
  if (errors.length) throw new Error(errors.join("\n"));
  return state;
}

function mergeReviewState(current: ReviewState, patch: Partial<ReviewState>): ReviewState {
  return {
    ...current,
    ...patch,
    answers: { ...current.answers, ...(patch.answers ?? {}) },
    checklist: { ...current.checklist, ...(patch.checklist ?? {}) },
    unresolvedCommentIds: patch.unresolvedCommentIds ?? current.unresolvedCommentIds,
  };
}

async function writeReviewState(planDir: string, state: ReviewState): Promise<ReviewState> {
  const errors = validateReviewState(state);
  if (errors.length) throw new Error(errors.join("\n"));
  await atomicWrite(statePath(planDir), state);
  return state;
}

async function updateReviewStateFromCurrent(planDir: string, current: ReviewState, patch: Partial<ReviewState>): Promise<ReviewState> {
  return writeReviewState(planDir, mergeReviewState(current, patch));
}

export async function updateReviewState(planDir: string, patch: Partial<ReviewState>): Promise<ReviewState> {
  const current = await readReviewState(planDir);
  return updateReviewStateFromCurrent(planDir, current, patch);
}

export async function readComments(planDir: string): Promise<CommentThread[]> {
  return readJsonFile(commentsPath(planDir), [] as CommentThread[]);
}

export async function addComment(planDir: string, input: Omit<CommentThread, "id" | "status" | "createdAt"> & { id?: string }): Promise<CommentThread> {
  const comments = await readComments(planDir);
  const comment: CommentThread = {
    id: input.id ?? `c${comments.length + 1}`,
    blockId: input.blockId,
    anchor: input.anchor,
    body: input.body,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  await atomicWrite(commentsPath(planDir), comments);
  const state = await readReviewState(planDir);
  await updateReviewStateFromCurrent(planDir, state, { unresolvedCommentIds: [...new Set([...state.unresolvedCommentIds, comment.id])] });
  return comment;
}

export async function resolveComment(planDir: string, id: string): Promise<CommentThread[]> {
  const comments = await readComments(planDir);
  const next = comments.map((comment) => comment.id === id ? { ...comment, status: "resolved" as const, resolvedAt: new Date().toISOString() } : comment);
  await atomicWrite(commentsPath(planDir), next);
  const state = await readReviewState(planDir);
  await updateReviewStateFromCurrent(planDir, state, { unresolvedCommentIds: state.unresolvedCommentIds.filter((commentId) => commentId !== id) });
  return next;
}

export async function approvePlan(
  planDir: string,
  reviewer = "local-reviewer",
  hooks: ApprovalPublicationHooks = {},
) {
  const current = await readReviewState(planDir);
  const plan = await loadPlanFolder(planDir);
  const readinessErrors = [
    ...(current.unresolvedCommentIds.length ? ["AgentHandoff cannot be generated while unresolved blocking comments remain"] : []),
    ...validateApprovalReadiness(plan.plan.blocks, current),
  ];
  if (readinessErrors.length) throw new Error(readinessErrors.join("\n"));

  const approvedAt = new Date().toISOString();
  const state = mergeReviewState(current, { status: "approved", approvedAt, reviewer });
  const handoff = generateAgentHandoff(plan, state);
  const suffix = `${process.pid}.${Date.now()}.approval`;
  const files: PublicationFile[] = [
    {
      step: "handoff-json",
      path: join(planDir, "agent-handoff.json"),
      stagedPath: join(planDir, `agent-handoff.json.${suffix}`),
      content: `${JSON.stringify(handoff, null, 2)}\n`,
    },
    {
      step: "handoff-markdown",
      path: join(planDir, "agent-handoff.md"),
      stagedPath: join(planDir, `agent-handoff.md.${suffix}`),
      content: formatAgentHandoffMarkdown(handoff),
    },
    {
      step: "state",
      path: statePath(planDir),
      stagedPath: join(planDir, `plan-state.json.${suffix}`),
      content: `${JSON.stringify(state, null, 2)}\n`,
    },
  ];
  await publishApproval(files, hooks);
  return handoff;
}
