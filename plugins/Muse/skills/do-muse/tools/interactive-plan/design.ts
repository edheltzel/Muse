import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/** Muse-shipped default. Do not copy this file into the user's project or home. */
export const SHIPPED_DESIGN_MD = join(import.meta.dir, "../../../../DESIGN.md");

/**
 * Resolve DESIGN.md: project cwd, then ~/.agents/DESIGN.md, then the Muse-shipped default.
 * Never creates those files.
 */
export async function resolveDesignMdPath(options: {
  cwd?: string;
  home?: string;
} = {}): Promise<string> {
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
