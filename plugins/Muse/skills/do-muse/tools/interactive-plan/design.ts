import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/** Muse-shipped default. Do not copy this file into the user's project or home. */
export const SHIPPED_DESIGN_MD = join(import.meta.dir, "../../../../DESIGN.md");

export type DesignResolveOptions = {
  cwd?: string;
  home?: string;
};

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

export function parseDesignPrimary(source: string): string {
  const block = source.match(/^colors:\n((?:[ \t].*\n)+)/m);
  if (!block) {
    throw new Error("DESIGN.md is missing a colors block");
  }
  const primary = block[1].match(/^[ \t]+primary:[ \t]*"?(#[0-9A-Fa-f]{3,8})"?/m);
  if (!primary) {
    throw new Error("DESIGN.md is missing colors.primary");
  }
  return primary[1];
}

export async function loadDesignPrimary(options: DesignResolveOptions = {}): Promise<string> {
  return parseDesignPrimary(await readFile(await resolveDesignMdPath(options), "utf8"));
}
