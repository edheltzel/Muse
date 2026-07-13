import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { type MdxBlock, type ParsedPlanSource, type VisualPlanManifest, validateBlocks } from "./schema";
import { findUnquotedTagEnd, KNOWN_MDX_COMPONENTS, RAW_BODY_MDX_COMPONENTS } from "./shared";

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

interface OpenComponent {
  attrs: string;
  bodyStart: number;
  type: string;
}

interface RawClosingTag {
  end: number;
  start: number;
}

function findRawClosingTags(body: string, cursor: number, type: string): RawClosingTag[] {
  const matches: RawClosingTag[] = [];
  const starts = new Set<number>();
  const addMatch = (start: number, end: number): void => {
    if (end !== -1 && !starts.has(start)) {
      starts.add(start);
      matches.push({ start, end });
    }
  };

  const standalone = new RegExp(`^[\\t ]*</${type}\\s*>[\\t ]*\\r?$`, "gm");
  standalone.lastIndex = cursor;
  for (let match = standalone.exec(body); match; match = standalone.exec(body)) {
    const start = match.index + match[0].indexOf("<");
    addMatch(start, body.indexOf(">", start));
  }

  const prefix = `</${type}`;
  for (let start = body.indexOf(prefix, cursor); start !== -1; start = body.indexOf(prefix, start + prefix.length)) {
    if (!/[\s>]/.test(body[start + prefix.length] ?? "")) continue;
    addMatch(start, findUnquotedTagEnd(body, start + prefix.length));
  }

  return matches.sort((left, right) => left.start - right.start || left.end - right.end);
}

function scanComponentBlocks(body: string): MdxBlock[] {
  function scan(cursor: number, open: OpenComponent | undefined, blocks: MdxBlock[]): MdxBlock[] {
    for (; cursor < body.length;) {
      if (open && RAW_BODY_MDX_COMPONENTS[open.type]) {
        const closingTags = findRawClosingTags(body, cursor, open.type);
        if (!closingTags.length) {
          const mismatched = body.slice(cursor).match(/^[\t ]*<\/([A-Z][A-Za-z0-9]*)\s*>[\t ]*$/m);
          if (mismatched && KNOWN_MDX_COMPONENTS[mismatched[1]]) {
            throw new Error(`Malformed MDX component source: closing '${mismatched[1]}' does not match open '${open.type}'`);
          }
          throw new Error(`Malformed MDX component source: unclosed '${open.type}'`);
        }

        let finalError: unknown;
        for (const closingTag of closingTags) {
          const suffix = body.slice(closingTag.start + open.type.length + 2, closingTag.end);
          if (suffix.trim()) {
            finalError = new Error(`Malformed MDX component source: malformed closing '${open.type}'`);
            continue;
          }
          const props = parseAttrs(open.attrs);
          const block: MdxBlock = {
            id: typeof props.id === "string" ? props.id : "",
            type: open.type,
            props,
            body: body.slice(open.bodyStart, closingTag.start).trim(),
          };
          try {
            return scan(closingTag.end + 1, undefined, [...blocks, block]);
          } catch (error) {
            finalError = error;
          }
        }
        throw finalError;
      }

      const start = body.indexOf("<", cursor);
      if (start === -1) break;
      const candidate = body.slice(start);
      const token = candidate.match(/^<(\/?)([A-Z][A-Za-z0-9]*)(?=[\s/>])/);
      if (!token) {
        const prefix = candidate.match(/^<(\/?)([A-Z][A-Za-z0-9]*)/);
        if (prefix && KNOWN_MDX_COMPONENTS[prefix[2]]) {
          const type = prefix[2];
          const continuation = candidate[prefix[0].length];
          if (continuation !== "." && continuation !== ":") {
            const detail = continuation === undefined
              ? `incomplete tag '<${prefix[1]}${type}'`
              : `illegal continuation '${continuation}' after supported component name '${type}'`;
            throw new Error(`Malformed MDX component source: ${detail}`);
          }
        }
        cursor = start + 1;
        continue;
      }

      const closing = token[1] === "/";
      const type = token[2];
      const supported = Boolean(KNOWN_MDX_COMPONENTS[type]);
      const tagEnd = findUnquotedTagEnd(body, start + token[0].length);
      if (tagEnd === -1) {
        throw new Error(`Malformed MDX component source: incomplete tag '<${closing ? "/" : ""}${type}'`);
      }
      const suffix = body.slice(start + token[0].length, tagEnd);
      const selfClosing = /\/\s*$/.test(suffix);
      cursor = tagEnd + 1;

      if (open && KNOWN_MDX_COMPONENTS[open.type] && !supported) continue;

      if (closing) {
        if (suffix.trim()) {
          throw new Error(`Malformed MDX component source: malformed closing '${type}'`);
        }
        if (!open) throw new Error(`Malformed MDX component source: unexpected closing '${type}'`);
        if (open.type !== type) {
          throw new Error(`Malformed MDX component source: closing '${type}' does not match open '${open.type}'`);
        }
        const props = parseAttrs(open.attrs);
        blocks.push({
          id: typeof props.id === "string" ? props.id : "",
          type,
          props,
          body: body.slice(open.bodyStart, start).trim(),
        });
        open = undefined;
        continue;
      }

      if (open) {
        if (supported) {
          throw new Error(`Malformed MDX component source: nested '${type}' inside '${open.type}' is not supported`);
        }
        continue;
      }

      const attrs = selfClosing ? suffix.replace(/\/\s*$/, "") : suffix;
      if (selfClosing) {
        const props = parseAttrs(attrs);
        blocks.push({ id: typeof props.id === "string" ? props.id : "", type, props, body: "" });
      } else {
        open = { attrs, bodyStart: tagEnd + 1, type };
      }
    }

    if (open) throw new Error(`Malformed MDX component source: unclosed '${open.type}'`);
    return blocks;
  }

  return scan(0, undefined, []);
}

export function parseMdxSource(source: string): ParsedPlanSource {
  const { frontmatter, body } = parseFrontmatter(source);
  const blocks = scanComponentBlocks(body);

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
