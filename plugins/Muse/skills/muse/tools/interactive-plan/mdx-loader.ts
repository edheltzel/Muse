import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { type MdxBlock, type ParsedPlanSource, type VisualPlanManifest, validateBlocks } from "./schema";

export interface LoadedPlanFolder {
  rootDir: string;
  manifest: VisualPlanManifest;
  plan: ParsedPlanSource;
  canvas?: ParsedPlanSource;
}

export function parseFrontmatter(source: string): { frontmatter: Record<string, string>; body: string } {
  if (!source.startsWith("---\n")) return { frontmatter: {}, body: source };
  const end = source.indexOf("\n---", 4);
  if (end === -1) return { frontmatter: {}, body: source };
  const raw = source.slice(4, end).trim();
  const frontmatter: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) frontmatter[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return { frontmatter, body: source.slice(end + 5).replace(/^\n/, "") };
}

function parseAttrs(raw: string): Record<string, string | boolean | number> {
  const props: Record<string, string | boolean | number> = {};
  const attrPattern = /([A-Za-z_:][A-Za-z0-9_:.-]*)(?:=("[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+))?/g;
  for (const match of raw.matchAll(attrPattern)) {
    const key = match[1];
    if (!match[2]) {
      props[key] = key === "id" ? "" : true;
      continue;
    }
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else if (value.startsWith("{") && value.endsWith("}")) {
      value = value.slice(1, -1).trim().replace(/^['"]|['"]$/g, "");
    }
    if (/^-?\d+(?:\.\d+)?$/.test(value)) props[key] = Number(value);
    else if (value === "true" || value === "false") props[key] = value === "true";
    else props[key] = value;
  }
  return props;
}

function assertWellFormedComponentTags(body: string): void {
  const tagPattern = /<(\/?)([A-Z][A-Za-z0-9]*)\b([^>]*)>/g;
  const incompleteTagPattern = /<\/?[A-Z][A-Za-z0-9]*\b/;
  const stack: string[] = [];
  let cursor = 0;

  for (const match of body.matchAll(tagPattern)) {
    const skipped = body.slice(cursor, match.index);
    const incomplete = skipped.match(incompleteTagPattern);
    if (incomplete) {
      throw new Error(`Malformed MDX component source: incomplete tag '${incomplete[0]}'`);
    }
    cursor = (match.index ?? 0) + match[0].length;

    const closing = match[1] === "/";
    const type = match[2];
    const selfClosing = /\/\s*$/.test(match[3] ?? "");
    if (closing) {
      const openType = stack.pop();
      if (!openType) throw new Error(`Malformed MDX component source: unexpected closing '${type}'`);
      if (openType !== type) {
        throw new Error(`Malformed MDX component source: closing '${type}' does not match open '${openType}'`);
      }
    } else if (!selfClosing) {
      if (stack.length > 0) {
        throw new Error(`Malformed MDX component source: nested '${type}' inside '${stack.at(-1)}' is not supported`);
      }
      stack.push(type);
    }
  }

  const incomplete = body.slice(cursor).match(incompleteTagPattern);
  if (incomplete) throw new Error(`Malformed MDX component source: incomplete tag '${incomplete[0]}'`);
  if (stack.length > 0) throw new Error(`Malformed MDX component source: unclosed '${stack.at(-1)}'`);
}

export function parseMdxSource(source: string): ParsedPlanSource {
  const { frontmatter, body } = parseFrontmatter(source);
  assertWellFormedComponentTags(body);
  const blocks: MdxBlock[] = [];
  const paired = /<([A-Z][A-Za-z0-9]*)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  const selfClosing = /<([A-Z][A-Za-z0-9]*)\b([^>]*)\/>/g;

  for (const match of body.matchAll(paired)) {
    const props = parseAttrs(match[2] ?? "");
    blocks.push({ id: typeof props.id === "string" ? props.id : "", type: match[1], props, body: match[3].trim() });
  }
  for (const match of body.matchAll(selfClosing)) {
    const props = parseAttrs(match[2] ?? "");
    blocks.push({ id: typeof props.id === "string" ? props.id : "", type: match[1], props, body: "" });
  }

  if (blocks.length === 0) {
    blocks.push({
      id: String(frontmatter.slug ?? "markdown-body"),
      type: "Callout",
      props: { id: String(frontmatter.slug ?? "markdown-body"), tone: "note", title: frontmatter.title ?? "Plan" },
      body: body.trim(),
    });
  }

  return { frontmatter, blocks, raw: source };
}

async function readOptionalFile(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

export async function loadPlanFolder(rootDir: string): Promise<LoadedPlanFolder> {
  const planPath = join(rootDir, "plan.mdx");
  const plan = parseMdxSource(await readFile(planPath, "utf8"));
  const canvasPath = join(rootDir, "canvas.mdx");
  const canvasSource = await readOptionalFile(canvasPath);
  const canvas = canvasSource !== undefined ? parseMdxSource(canvasSource) : undefined;
  const manifestPath = join(rootDir, "visual-explainer.json");
  const manifestSource = await readOptionalFile(manifestPath);
  const manifestFromFile = manifestSource !== undefined ? JSON.parse(manifestSource) : {};
  const slug = String(manifestFromFile.slug ?? plan.frontmatter.slug ?? basename(rootDir));
  const manifest: VisualPlanManifest = {
    kind: manifestFromFile.kind ?? plan.frontmatter.kind ?? "plan",
    slug,
    title: manifestFromFile.title ?? plan.frontmatter.title ?? slug,
    createdAt: manifestFromFile.createdAt ?? new Date().toISOString(),
    source: Array.isArray(manifestFromFile.source) ? manifestFromFile.source : [],
    entry: manifestFromFile.entry ?? "plan.mdx",
    dist: manifestFromFile.dist ?? "dist",
    localOnly: true,
  };
  const errors = validateBlocks([...plan.blocks, ...(canvas?.blocks ?? [])], canvas ? ["canvas"] : []);
  if (errors.length) throw new Error(`Invalid plan source:\n${errors.join("\n")}`);
  return { rootDir, manifest, plan, canvas };
}
