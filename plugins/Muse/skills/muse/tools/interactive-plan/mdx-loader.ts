import { readFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { type MdxBlock, type ParsedPlanSource, type VisualPlanManifest, validateBlocks } from "./schema";

export interface LoadedPlanFolder {
  rootDir: string;
  manifest: VisualPlanManifest;
  plan: ParsedPlanSource;
  canvas?: ParsedPlanSource;
}

export interface PlanFolderSources {
  plan: string;
  canvas?: string;
  manifest?: string;
}

export function parseFrontmatter(source: string): { frontmatter: Record<string, string>; body: string } {
  if (!source.startsWith("---\n")) return { frontmatter: {}, body: source };
  const end = source.indexOf("\n---", 4);
  if (end === -1) return { frontmatter: {}, body: source };
  const raw = source.slice(4, end).trim();
  const frontmatter: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) frontmatter[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return { frontmatter, body: source.slice(end + 5).replace(/^\n/, "") };
}

function parseAttrs(raw: string): Record<string, string | boolean | number> {
  const props: Record<string, string | boolean | number> = {};
  const attrPattern = /([A-Za-z_:][A-Za-z0-9_:.-]*)(?:=("[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+))?/g;
  for (const match of raw.matchAll(attrPattern)) {
    const key = match[1];
    if (!match[2]) {
      props[key] = true;
      continue;
    }
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else if (value.startsWith("{") && value.endsWith("}")) {
      value = value.slice(1, -1).trim().replace(/^["']|["']$/g, "");
    }
    if (/^-?\d+(?:\.\d+)?$/.test(value)) props[key] = Number(value);
    else if (value === "true" || value === "false") props[key] = value === "true";
    else props[key] = value;
  }
  return props;
}

export function parseMdxSource(source: string): ParsedPlanSource {
  const { frontmatter, body } = parseFrontmatter(source);
  const blocks: MdxBlock[] = [];
  const paired = /<([A-Z][A-Za-z0-9]*)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  const selfClosing = /<([A-Z][A-Za-z0-9]*)\b([^>]*)\/>/g;

  for (const match of body.matchAll(paired)) {
    const props = parseAttrs(match[2] ?? "");
    blocks.push({ id: String(props.id ?? ""), type: match[1], props, body: match[3].trim() });
  }
  for (const match of body.matchAll(selfClosing)) {
    const props = parseAttrs(match[2] ?? "");
    blocks.push({ id: String(props.id ?? ""), type: match[1], props, body: "" });
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

function singleLine(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !/[\u0000-\u001f\u007f]/.test(value);
}

function confinedRelativePath(rootDir: string, entry: string): boolean {
  if (isAbsolute(entry) || /^[A-Za-z]:[\\/]/.test(entry) || entry.startsWith("\\\\") || entry.includes("\0") || entry.replaceAll("\\", "/").split("/").includes("..")) return false;
  const root = resolve(rootDir);
  const path = resolve(root, entry);
  const fromRoot = relative(root, path);
  return fromRoot.length > 0 && !fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(fromRoot);
}

function parseManifest(rootDir: string, plan: ParsedPlanSource, source?: string): VisualPlanManifest {
  const defaults: Record<string, unknown> = {
    kind: plan.frontmatter.kind ?? "plan",
    slug: plan.frontmatter.slug ?? basename(rootDir),
    title: plan.frontmatter.title ?? plan.frontmatter.slug ?? basename(rootDir),
    createdAt: plan.frontmatter.createdAt ?? "1970-01-01T00:00:00.000Z",
    source: [],
    entry: "plan.mdx",
    dist: "dist",
    localOnly: true,
  };
  let supplied: Record<string, unknown> = {};
  if (source !== undefined) {
    const parsed = JSON.parse(source) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Visual plan manifest must be an object");
    supplied = parsed as Record<string, unknown>;
    const allowed: Record<string, true> = {
      kind: true,
      slug: true,
      title: true,
      createdAt: true,
      source: true,
      entry: true,
      dist: true,
      localOnly: true,
    };
    const unknown = Object.keys(supplied).filter((key) => !allowed[key]);
    if (unknown.length) throw new Error(`Visual plan manifest contains unknown field '${unknown[0]}'`);
  }
  const value = { ...defaults, ...supplied };

  const errors: string[] = [];
  if (value.kind !== "plan" && value.kind !== "recap" && value.kind !== "styleguide") errors.push("kind must be plan, recap, or styleguide");
  if (!singleLine(value.slug)) errors.push("slug must be a nonblank single-line string");
  if (!singleLine(value.title)) errors.push("title must be a nonblank single-line string");
  if (
    !singleLine(value.createdAt)
    || !Number.isFinite(Date.parse(value.createdAt))
    || new Date(value.createdAt).toISOString() !== value.createdAt
  ) {
    errors.push("createdAt must be a canonical ISO timestamp");
  }
  if (
    !Array.isArray(value.source)
    || value.source.some((entry) => !singleLine(entry) || !confinedRelativePath(rootDir, entry))
  ) {
    errors.push("source must be an array of nonblank single-line relative paths confined beneath the plan root");
  }
  if (value.entry !== "plan.mdx" || !confinedRelativePath(rootDir, value.entry)) {
    errors.push("entry must identify the loaded plan.mdx beneath the plan root");
  }
  if (!singleLine(value.dist) || !confinedRelativePath(rootDir, value.dist)) {
    errors.push("dist must be a nonblank relative path confined beneath the plan root");
  }
  if (value.localOnly !== true) errors.push("localOnly must be true");
  if (errors.length) throw new Error(`Invalid visual plan manifest:\n${errors.join("\n")}`);
  return value as unknown as VisualPlanManifest;
}

export function loadPlanFolderFromSources(rootDir: string, sources: PlanFolderSources): LoadedPlanFolder {
  const plan = parseMdxSource(sources.plan);
  const canvas = sources.canvas === undefined ? undefined : parseMdxSource(sources.canvas);
  const manifest = parseManifest(rootDir, plan, sources.manifest);
  const errors = validateBlocks([...plan.blocks, ...(canvas?.blocks ?? [])]);
  if (errors.length) throw new Error(`Invalid plan source:\n${errors.join("\n")}`);
  return { rootDir, manifest, plan, canvas };
}

async function readOptionalFile(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function loadPlanFolder(rootDir: string): Promise<LoadedPlanFolder> {
  const [plan, canvas, manifest] = await Promise.all([
    readFile(join(rootDir, "plan.mdx"), "utf8"),
    readOptionalFile(join(rootDir, "canvas.mdx")),
    readOptionalFile(join(rootDir, "visual-explainer.json")),
  ]);
  return loadPlanFolderFromSources(rootDir, { plan, canvas, manifest });
}
