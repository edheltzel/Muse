import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/** Muse-shipped default. Do not copy this file into the user's project or home. */
export const SHIPPED_DESIGN_MD = join(import.meta.dir, "../../../../DESIGN.md");

export type DesignResolveOptions = {
  cwd?: string;
  home?: string;
};

export type DesignColors = {
  primary: string;
  [token: string]: string;
};

const HEX_COLOR = /^#(?:[0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

/**
 * Resolve DESIGN.md: project cwd, then ~/.agents/DESIGN.md, then the Muse-shipped default.
 * Never creates those files.
 */
export async function resolveDesignMdPath(options: DesignResolveOptions = {}): Promise<string> {
  const cwd = options.cwd ?? process.cwd();
  const home = options.home ?? homedir();
  const candidates = [join(cwd, "DESIGN.md"), join(home, ".agents", "DESIGN.md"), SHIPPED_DESIGN_MD];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // keep looking
    }
  }
  throw new Error(
    "DESIGN.md not found: project, ~/.agents/DESIGN.md, and the Muse-shipped default are all missing",
  );
}

export function parseDesignColors(markdown: string): DesignColors {
  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) throw new Error("DESIGN.md is missing YAML frontmatter");

  const colors: Record<string, string> = {};
  let inColors = false;
  for (const line of frontmatter[1].split(/\r?\n/)) {
    if (/^colors:\s*$/.test(line)) {
      inColors = true;
      continue;
    }
    if (!inColors) continue;
    if (/^\S/.test(line)) break;
    const match = line.match(/^\s+([\w-]+):\s*["']?(#[0-9A-Fa-f]+)["']?\s*$/);
    if (match) colors[match[1]] = match[2];
  }

  const primary = colors.primary;
  if (!primary) throw new Error("DESIGN.md colors.primary is required");
  if (!HEX_COLOR.test(primary)) throw new Error("DESIGN.md colors.primary must be a hex color");
  return { ...colors, primary };
}

export async function loadDesignColors(options: DesignResolveOptions = {}): Promise<DesignColors> {
  return parseDesignColors(await readFile(await resolveDesignMdPath(options), "utf8"));
}
