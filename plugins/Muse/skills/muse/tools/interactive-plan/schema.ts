import { parse, parseFragment, type DefaultTreeAdapterTypes } from "parse5";
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

const HTML_RAW_TEXT_ELEMENTS: Readonly<Record<string, true | undefined>> = Object.freeze({
  iframe: true,
  noembed: true,
  noframes: true,
  plaintext: true,
  script: true,
  style: true,
  textarea: true,
  title: true,
  xmp: true,
});

interface HtmlId {
  hasValue: boolean;
  value: string;
}

interface HtmlIdScope {
  ids: HtmlId[];
  name: string;
}

function isHtmlElement(node: DefaultTreeAdapterTypes.Node): node is DefaultTreeAdapterTypes.Element {
  return "tagName" in node;
}

function htmlIdScopes(source: string, documentMode: boolean): HtmlIdScope[] {
  const root: DefaultTreeAdapterTypes.Node = documentMode
    ? parse(source, { sourceCodeLocationInfo: true })
    : parseFragment(source, { sourceCodeLocationInfo: true });
  const scopes: HtmlIdScope[] = [{ ids: [], name: documentMode ? "document" : "fragment" }];
  let templateCount = 0;
  let shadowCount = 0;

  const walk = (node: DefaultTreeAdapterTypes.Node, scope: HtmlIdScope): void => {
    if (isHtmlElement(node)) {
      const shadowMode = node.tagName === "template"
        ? node.attrs.find(({ name }) => name === "shadowrootmode")?.value.toLowerCase()
        : undefined;
      const declarativeShadow = shadowMode === "open" || shadowMode === "closed";
      if (!declarativeShadow) {
        const id = node.attrs.find(({ name }) => name === "id");
        if (id) {
          const location = node.sourceCodeLocation?.attrs?.id;
          scope.ids.push({
            hasValue: location ? source.slice(location.startOffset, location.endOffset).includes("=") : true,
            value: id.value,
          });
        }
      }
      if (node.tagName === "template") {
        const name = declarativeShadow ? `shadow root ${++shadowCount}` : `template ${++templateCount}`;
        const nestedScope = { ids: [], name };
        scopes.push(nestedScope);
        walk((node as DefaultTreeAdapterTypes.Template).content, nestedScope);
        return;
      }
    }
    if ("childNodes" in node) {
      for (const child of node.childNodes) walk(child, scope);
    }
  };

  walk(root, scopes[0]);
  return scopes;
}

function findUnterminatedRawContext(source: string): string | undefined {
  for (let cursor = 0; cursor < source.length;) {
    const start = source.indexOf("<", cursor);
    if (start === -1) return undefined;
    if (source.startsWith("<!--", start)) {
      const end = source.indexOf("-->", start + 4);
      if (end === -1) return "comment";
      cursor = end + 3;
      continue;
    }
    const opening = source.slice(start).match(/^<([A-Za-z][A-Za-z0-9-]*)\b/);
    if (!opening) {
      cursor = start + 1;
      continue;
    }
    const tagEnd = findUnquotedTagEnd(source, start + opening[0].length);
    if (tagEnd === -1) return opening[1].toLowerCase();
    const tagName = opening[1].toLowerCase();
    cursor = tagEnd + 1;
    if (!HTML_RAW_TEXT_ELEMENTS[tagName]) continue;
    if (tagName === "plaintext") return tagName;

    const closingStart = source.slice(cursor).search(new RegExp(`</${tagName}(?=[\\t\\n\\f\\r />])`, "i"));
    if (closingStart === -1) return tagName;
    const closingEnd = findUnquotedTagEnd(source, cursor + closingStart + tagName.length + 2);
    if (closingEnd === -1) return tagName;
    cursor = closingEnd + 1;
  }
  return undefined;
}

export function validateRenderedHtmlIds(html: string, expectedIds: readonly string[] = []): string[] {
  const scopes = htmlIdScopes(html, true);
  const errors: string[] = [];
  for (const scope of scopes) {
    const seen = new Set<string>();
    const prefix = scope.name === "document" ? "Rendered HTML" : `Rendered HTML scope '${scope.name}'`;
    for (const id of scope.ids) {
      if (!id.hasValue || !id.value) {
        errors.push(`${prefix} contains empty id`);
        continue;
      }
      if (!HTML_ID_GRAMMAR.test(id.value)) errors.push(`${prefix} contains unsafe id '${id.value}'`);
      if (seen.has(id.value)) errors.push(`${prefix} contains duplicate id '${id.value}'`);
      seen.add(id.value);
    }
  }

  const documentIds = scopes[0].ids.map(({ value }) => value);
  for (const expectedId of new Set(expectedIds)) {
    const count = documentIds.filter((id) => id === expectedId).length;
    if (count !== 1) {
      errors.push(`Expected rendered HTML id '${expectedId}' to materialize exactly once; found ${count}`);
    }
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
    const unterminated = findUnterminatedRawContext(block.body);
    if (unterminated) {
      errors.push(`${block.type} '${block.id}' contains unterminated ${unterminated}`);
      continue;
    }

    const [fragmentScope, ...nestedScopes] = htmlIdScopes(block.body, false);
    for (const id of fragmentScope.ids) {
      if (!id.hasValue) {
        errors.push(`${block.type} '${block.id}' contains an id attribute without a value`);
        continue;
      }
      if (!id.value) {
        errors.push(`${block.type} '${block.id}' contains an empty id attribute`);
        continue;
      }
      if (!HTML_ID_GRAMMAR.test(id.value)) {
        errors.push(`${block.type} descendant has unsafe id '${id.value}' in '${block.id}'`);
      }
      if (emittedIds.has(id.value)) {
        errors.push(`${block.type} descendant id '${id.value}' in '${block.id}' collides with another emitted id`);
      }
      emittedIds.add(id.value);
    }

    for (const scope of nestedScopes) {
      const seen = new Set<string>();
      for (const id of scope.ids) {
        if (!id.hasValue || !id.value) {
          errors.push(`${block.type} '${block.id}' ${scope.name} contains empty id`);
          continue;
        }
        if (!HTML_ID_GRAMMAR.test(id.value)) {
          errors.push(`${block.type} '${block.id}' ${scope.name} contains unsafe id '${id.value}'`);
        }
        if (seen.has(id.value)) {
          errors.push(`${block.type} '${block.id}' ${scope.name} contains duplicate id '${id.value}'`);
        }
        seen.add(id.value);
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
