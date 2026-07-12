import { KNOWN_MDX_COMPONENTS, splitLines, splitPipeFields } from "./shared";

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
  if (!state.answers || typeof state.answers !== "object" || Array.isArray(state.answers)) {
    errors.push("ReviewState.answers must be an object");
  } else {
    for (const [id, answer] of Object.entries(state.answers)) {
      if (typeof answer !== "string" && !(Array.isArray(answer) && answer.every((item) => typeof item === "string"))) {
        errors.push(`ReviewState.answers['${id}'] must be a string or string array`);
      }
    }
  }
  if (!state.checklist || typeof state.checklist !== "object" || Array.isArray(state.checklist)) {
    errors.push("ReviewState.checklist must be an object");
  } else {
    for (const [id, checked] of Object.entries(state.checklist)) {
      if (typeof checked !== "boolean") errors.push(`ReviewState.checklist['${id}'] must be boolean`);
    }
  }
  if (!Array.isArray(state.unresolvedCommentIds) || !state.unresolvedCommentIds.every((id) => typeof id === "string")) {
    errors.push("ReviewState.unresolvedCommentIds must be a string array");
  }
  return errors;
}

export function validateApprovalReadiness(blocks: MdxBlock[], state: ReviewState): string[] {
  const errors: string[] = [];
  for (const block of blocks) {
    for (const line of splitLines(block.body)) {
      const fields = splitPipeFields(line);
      if (block.type === "QuestionForm" && fields[3] === "required") {
        const answer = state.answers[fields[0]];
        const answered = typeof answer === "string"
          ? answer.trim().length > 0
          : Array.isArray(answer) && answer.some((item) => item.trim().length > 0);
        if (!answered) errors.push(`Required question '${fields[0]}' must be answered`);
      }
      if (block.type === "Checklist" && fields[2] === "required" && state.checklist[fields[0]] !== true) {
        errors.push(`Required checklist item '${fields[0]}' must be checked`);
      }
    }
  }
  return errors;
}

export function validateBlocks(blocks: MdxBlock[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const readinessIds = new Set<string>();
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
    }
    if (block.type === "Wireframe" && /<\/?(?:html|head|body|script)\b/i.test(block.body)) {
      errors.push(`Wireframe '${block.id}' must be an HTML fragment without html/head/body/script tags`);
    }
    if (block.type === "QuestionForm" || block.type === "Checklist") {
      for (const line of splitLines(block.body)) {
        const fields = splitPipeFields(line);
        const expectedArities = block.type === "QuestionForm" ? [3, 4] : [2, 3];
        if (!expectedArities.includes(fields.length)) {
          errors.push(`${block.type} '${block.id}' has invalid field count ${fields.length}; expected ${expectedArities.join(" or ")}`);
          continue;
        }
        const requiredFields = block.type === "QuestionForm" ? fields.slice(0, 3) : fields.slice(0, 2);
        if (requiredFields.some((field) => field.length === 0)) {
          errors.push(`${block.type} '${block.id}' has a blank required field`);
          continue;
        }
        const id = fields[0];
        if (readinessIds.has(id)) errors.push(`Duplicate readiness item id '${id}'`);
        else readinessIds.add(id);

        const policyIndex = block.type === "QuestionForm" ? 3 : 2;
        const policy = fields[policyIndex];
        if (block.type === "QuestionForm" && fields.length === 3 && (fields[2] === "required" || fields[2] === "advisory")) {
          errors.push(`QuestionForm '${block.id}' has readiness policy '${fields[2]}' in the mode field`);
        } else if (policy !== undefined && policy !== "required" && policy !== "advisory") {
          errors.push(`${block.type} '${block.id}' has invalid readiness policy '${policy}'`);
        }
      }
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
