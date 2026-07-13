import { findUnquotedTagEnd, KNOWN_MDX_COMPONENTS, splitTabPanels } from "./shared";

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

const HTML_ID_GRAMMAR = /^[A-Za-z][A-Za-z0-9_-]*$/;

function* openingTags(source: string): Generator<string> {
  for (let cursor = 0; cursor < source.length;) {
    const start = source.indexOf("<", cursor);
    if (start === -1) return;
    if (source.startsWith("<!--", start)) {
      const commentEnd = source.indexOf("-->", start + 4);
      cursor = commentEnd === -1 ? source.length : commentEnd + 3;
      continue;
    }
    if (!/[A-Za-z]/.test(source[start + 1] ?? "")) {
      cursor = start + 1;
      continue;
    }
    const end = findUnquotedTagEnd(source, start + 1);
    if (end === -1) return;
    const tag = source.slice(start, end + 1);
    yield tag;
    cursor = end + 1;

    const rawTextElement = tag.match(/^<(script|style)\b/i)?.[1];
    if (rawTextElement) {
      const closingStart = source.slice(cursor).search(new RegExp(`</${rawTextElement}\\s*>`, "i"));
      if (closingStart === -1) return;
      cursor += closingStart + source.slice(cursor + closingStart).indexOf(">") + 1;
    }
  }
}

function* idAttributes(source: string): Generator<string | undefined> {
  for (const tag of openingTags(source)) {
    let cursor = tag.search(/\s|\/?>/);
    while (cursor !== -1 && cursor < tag.length - 1) {
      while (/[\s/]/.test(tag[cursor] ?? "")) cursor += 1;
      const nameStart = cursor;
      while (cursor < tag.length && !/[\s=/>]/.test(tag[cursor])) cursor += 1;
      if (cursor === nameStart) {
        cursor += 1;
        continue;
      }
      const name = tag.slice(nameStart, cursor).toLowerCase();
      while (/\s/.test(tag[cursor] ?? "")) cursor += 1;
      if (tag[cursor] !== "=") {
        if (name === "id") yield undefined;
        continue;
      }
      cursor += 1;
      while (/\s/.test(tag[cursor] ?? "")) cursor += 1;
      const quote = tag[cursor] === '"' || tag[cursor] === "'" ? tag[cursor++] : "";
      const valueStart = cursor;
      if (quote) {
        while (cursor < tag.length && tag[cursor] !== quote) cursor += 1;
      } else {
        while (cursor < tag.length && !/[\s>]/.test(tag[cursor])) cursor += 1;
      }
      const value = tag.slice(valueStart, cursor);
      if (quote && tag[cursor] === quote) cursor += 1;
      if (name === "id") yield value;
    }
  }
}

export function validateRenderedHtmlIds(html: string): string[] {
  const errors: string[] = [];
  const emittedIds = new Set<string>();
  for (const id of idAttributes(html)) {
    if (id === undefined) {
      errors.push("Rendered HTML contains an id attribute without a value");
      continue;
    }
    if (!id) {
      errors.push("Rendered HTML contains an empty id attribute");
      continue;
    }
    if (!HTML_ID_GRAMMAR.test(id)) errors.push(`Rendered HTML contains unsafe id '${id}'`);
    if (emittedIds.has(id)) errors.push(`Rendered HTML contains duplicate id '${id}'`);
    emittedIds.add(id);
  }
  return errors;
}

export function validateBlocks(blocks: MdxBlock[], reservedIds: readonly string[] = []): string[] {
  const errors: string[] = [];
  const authoredIds = new Set<string>();
  const reservedIdSet = new Set(reservedIds);
  for (const block of blocks) {
    if (!KNOWN_MDX_COMPONENTS[block.type]) {
      errors.push(`Unknown MDX component '${block.type}'${block.id ? ` at block '${block.id}'` : ""}`);
    }
    if (!block.id || typeof block.id !== "string") {
      errors.push(`MDX component '${block.type}' is missing required id`);
    } else {
      if (!HTML_ID_GRAMMAR.test(block.id)) {
        errors.push(`MDX component '${block.type}' has unsafe id '${block.id}'; use a letter followed by letters, numbers, underscores, or hyphens`);
      }
      if (reservedIdSet.has(block.id)) {
        errors.push(`MDX component id '${block.id}' collides with renderer-owned id '${block.id}'`);
      }
      if (authoredIds.has(block.id)) errors.push(`Duplicate MDX component id '${block.id}'`);
      else authoredIds.add(block.id);
    }
    if (block.type === "Wireframe" && /<\/?(?:html|head|body|script)\b/i.test(block.body)) {
      errors.push(`Wireframe '${block.id}' must be an HTML fragment without html/head/body/script tags`);
    }
  }

  const emittedIds = new Set([...authoredIds, ...reservedIdSet]);
  for (const block of blocks) {
    if (block.type !== "Tabs" && block.type !== "DiffTabs") continue;
    const panels = splitTabPanels(block.body);
    panels.forEach((panel, index) => {
      if (!panel) errors.push(`${block.type} '${block.id}' contains an empty panel at position ${index + 1}`);
      for (const generatedId of [`${block.id}-tab-${index}`, `${block.id}-panel-${index}`]) {
        if (authoredIds.has(generatedId)) {
          errors.push(`Generated HTML id '${generatedId}' for ${block.type} '${block.id}' collides with an authored block id`);
        } else if (reservedIdSet.has(generatedId)) {
          errors.push(`Generated HTML id '${generatedId}' for ${block.type} '${block.id}' collides with a renderer-owned id`);
        } else if (emittedIds.has(generatedId)) {
          errors.push(`Generated HTML id '${generatedId}' for ${block.type} '${block.id}' collides with another emitted id`);
        }
        emittedIds.add(generatedId);
      }
    });
  }

  for (const block of blocks) {
    if (block.type !== "Wireframe" && block.type !== "StateGallery") continue;
    for (const id of idAttributes(block.body)) {
      if (id === undefined) {
        errors.push(`${block.type} '${block.id}' contains an id attribute without a value`);
        continue;
      }
      if (!id) {
        errors.push(`${block.type} '${block.id}' contains an empty id attribute`);
        continue;
      }
      if (!HTML_ID_GRAMMAR.test(id)) {
        errors.push(`${block.type} descendant has unsafe id '${id}' in '${block.id}'`);
      }
      if (emittedIds.has(id)) {
        errors.push(`${block.type} descendant id '${id}' in '${block.id}' collides with another emitted id`);
      }
      emittedIds.add(id);
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
