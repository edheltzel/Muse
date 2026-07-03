import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { generateAgentHandoff, formatAgentHandoffMarkdown } from "./handoff";
import { loadPlanFolder } from "./mdx-loader";
import { createDefaultReviewState, type CommentThread, type ReviewState, validateReviewState } from "./schema";

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

export async function approvePlan(planDir: string, reviewer = "local-reviewer") {
  const approvedAt = new Date().toISOString();
  const state = await updateReviewState(planDir, { status: "approved", approvedAt, reviewer });
  const plan = await loadPlanFolder(planDir);
  const handoff = generateAgentHandoff(plan, state);
  await atomicWrite(join(planDir, "agent-handoff.json"), handoff);
  await writeFile(join(planDir, "agent-handoff.md"), formatAgentHandoffMarkdown(handoff));
  return handoff;
}
