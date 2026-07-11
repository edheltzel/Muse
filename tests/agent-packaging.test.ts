import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");

async function readJson(path: string): Promise<Record<string, any>> {
  return JSON.parse(await readFile(join(repoRoot, path), "utf8"));
}

describe("coding-agent packaging", () => {
  test("keeps plugin identities and versions synchronized", async () => {
    const [pkg, omp, claude, codex, marketplace] = await Promise.all([
      readJson("package.json"),
      readJson("plugins/Muse/plugin.json"),
      readJson("plugins/Muse/.claude-plugin/plugin.json"),
      readJson("plugins/Muse/.codex-plugin/plugin.json"),
      readJson(".claude-plugin/marketplace.json"),
    ]);

    expect(omp.name).toBe("muse");
    expect(claude.name).toBe("muse");
    expect(codex.name).toBe("muse");
    expect(marketplace.plugins[0].name).toBe("muse");
    expect([omp.version, claude.version, codex.version, marketplace.metadata.version, marketplace.plugins[0].version]).toEqual([
      pkg.version,
      pkg.version,
      pkg.version,
      pkg.version,
      pkg.version,
    ]);
  });

  test("exposes the canonical skill to OMP, Pi, Claude Code, and Codex", async () => {
    const [pkg, codex, marketplace, codexMarketplace, skill, codexMetadata] = await Promise.all([
      readJson("package.json"),
      readJson("plugins/Muse/.codex-plugin/plugin.json"),
      readJson(".claude-plugin/marketplace.json"),
      readJson(".agents/plugins/marketplace.json"),
      readFile(join(repoRoot, "plugins/Muse/skills/muse/SKILL.md"), "utf8"),
      readFile(join(repoRoot, "plugins/Muse/skills/muse/agents/openai.yaml"), "utf8"),
    ]);

    expect(pkg.pi.skills).toEqual(["./plugins/Muse"]);
    expect(pkg.pi.prompts).toEqual(["./plugins/Muse/commands"]);
    expect(marketplace.plugins[0].source).toBe("./plugins/Muse");
    expect(codexMarketplace.plugins[0]).toMatchObject({
      name: "muse",
      source: { source: "local", path: "./plugins/Muse" },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
    });
    expect(codex.skills).toBe("./skills/");
    expect(skill).toContain("name: Muse");
    expect(codexMetadata).toContain('display_name: "Muse"');
    expect(codexMetadata).toContain("Use $Muse");
  });

  test("documents current Codex skill locations without legacy copy paths", async () => {
    const [readme, codexGuide] = await Promise.all([
      readFile(join(repoRoot, "README.md"), "utf8"),
      readFile(join(repoRoot, "configs/codex/AGENTS.md"), "utf8"),
    ]);

    expect(readme).toContain("codex plugin marketplace add edheltzel/Muse");
    expect(readme).toContain("codex plugin add muse@muse-marketplace");
    expect(readme).toContain("~/.agents/skills");
    expect(codexGuide).toContain("~/.agents/skills/muse");
    expect(readme).not.toContain("mkdir -p ~/.codex/skills ~/.codex/prompts");
    expect(codexGuide).not.toContain("copy the skill to `~/.codex/skills/Muse`");
  });
});
