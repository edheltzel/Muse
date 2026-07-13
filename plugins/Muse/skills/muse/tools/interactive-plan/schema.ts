import { getRendererOwnedIds, KNOWN_MDX_COMPONENTS } from "./shared";

export type VisualPlanKind = "plan" | "recap" | "styleguide";
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type CommentStatus = "open" | "resolved";

export interface VisualPlanManifest {
  kind: VisualPlanKind;
  slug: string;
  title: string;
  createdAt: string;
  source: string[];
  entry: string;
  dist: string;
  localOnly: true;
}

export interface ReviewState {
  status: ReviewStatus;
  approvedAt?: string;
  reviewer?: string;
  answers: Record<string, string | string[]>;
  checklist: Record<string, boolean>;
  unresolvedCommentIds: string[];
}

export interface CommentThread {
  id: string;
  blockId: string;
  anchor?: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface AgentHandoff {
  status: "approved";
  planSlug: string;
  planPath: string;
  approvedAt: string;
  approvedScope: string[];
  decisions: string[];
  answers: Record<string, string | string[]>;
  implementationEntry: string;
  verification: string[];
  openRisks: string[];
}

export interface MdxBlock {
  id: string;
  type: string;
  props: Record<string, string | boolean | number>;
  body: string;
}

export interface ParsedPlanSource {
  frontmatter: Record<string, string>;
  blocks: MdxBlock[];
  raw: string;
}

export const REVIEW_STATUSES = [
  "draft",
  "in_review",
  "needs_revision",
  "approved",
] as const;

export function createDefaultReviewState(): ReviewState {
  return { status: "draft", answers: {}, checklist: {}, unresolvedCommentIds: [] };
}

export function validateReviewState(value: unknown): string[] {
  const errors: string[] = [];
  const state = value as Partial<ReviewState> | null;
  if (!state || typeof state !== "object") return ["ReviewState must be an object"];
  if (!REVIEW_STATUSES.includes(state.status as ReviewStatus)) {
    errors.push(`ReviewState.status must be one of ${REVIEW_STATUSES.join(", ")}`);
  }
  if (!state.answers || typeof state.answers !== "object") errors.push("ReviewState.answers must be an object");
  if (!state.checklist || typeof state.checklist !== "object") errors.push("ReviewState.checklist must be an object");
  if (!Array.isArray(state.unresolvedCommentIds)) errors.push("ReviewState.unresolvedCommentIds must be an array");
  return errors;
}

export function validateBlocks(blocks: MdxBlock[], reservedIds: readonly string[] = []): string[] {
  const errors: string[] = [];
  const seen = new Set(reservedIds);
  const emittedIds: string[] = [];
  for (const block of blocks) {
    if (!KNOWN_MDX_COMPONENTS[block.type]) {
      errors.push(`Unknown MDX component '${block.type}'${block.id ? ` at block '${block.id}'` : ""}`);
    }
    if (!block.id || typeof block.id !== "string") {
      errors.push(`MDX component '${block.type}' is missing required id`);
    } else if (seen.has(block.id)) {
      errors.push(`Duplicate MDX component id '${block.id}'`);
    } else {
      seen.add(block.id);
      emittedIds.push(...getRendererOwnedIds(block));
    }
    if (block.type === "Wireframe" && /<\/?(?:html|head|body|script)\b/i.test(block.body)) {
      errors.push(`Wireframe '${block.id}' must be an HTML fragment without html/head/body/script tags`);
    }
  }
  const renderedIds = new Set(seen);
  for (const emittedId of emittedIds) {
    if (renderedIds.has(emittedId)) {
      errors.push(`Duplicate rendered id '${emittedId}'`);
    } else {
      renderedIds.add(emittedId);
    }
  }
  return errors;
}

export function assertApprovedHandoffReady(state: ReviewState): string[] {
  const errors = validateReviewState(state);
  if (state.status !== "approved") errors.push("AgentHandoff cannot be generated unless ReviewState.status is approved");
  if (state.unresolvedCommentIds.length > 0) errors.push("AgentHandoff cannot be generated while unresolved blocking comments remain");
  return errors;
}

export function assertNoForbiddenDependenciesText(text: string): string[] {
  const errors: string[] = [];
  if (/@agent-native\//i.test(text)) errors.push("Agent Native package reference is forbidden");
  if (/\breact(?:-dom)?\b/i.test(text)) errors.push("React dependency reference is forbidden in implementation files");
  return errors;
}
