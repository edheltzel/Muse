import { describe, expect, test } from "bun:test";
import {
  access,
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const repoRoot = join(import.meta.dir, "..");

async function readJson(path: string): Promise<Record<string, any>> {
  return JSON.parse(await readFile(join(repoRoot, path), "utf8"));
}

async function run(
  command: string[],
  options: { cwd?: string; env?: Record<string, string | undefined> } = {},
) {
  const process = Bun.spawn({
    cmd: command,
    cwd: options.cwd ?? repoRoot,
    env: options.env ?? Bun.env,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  return { stdout, stderr, exitCode };
}

describe("coding-agent packaging", () => {
  test("keeps plugin identities and versions synchronized", async () => {
    const [pkg, omp, claude, codex, marketplace, codexMarketplace] = await Promise.all([
      readJson("package.json"),
      readJson("plugins/Muse/plugin.json"),
      readJson("plugins/Muse/.claude-plugin/plugin.json"),
      readJson("plugins/Muse/.codex-plugin/plugin.json"),
      readJson(".claude-plugin/marketplace.json"),
      readJson(".agents/plugins/marketplace.json"),
    ]);

    expect(pkg.name).toBe("muse");
    expect(omp.name).toBe("muse");
    expect(claude.name).toBe("muse");
    expect(codex.name).toBe("muse");
    expect(codex.interface.displayName).toBe("muse");
    expect(codexMarketplace.interface.displayName).toBe("muse");
    expect(marketplace.plugins[0].name).toBe("muse");
    expect([
      omp.version,
      claude.version,
      codex.version,
      marketplace.metadata.version,
      marketplace.plugins[0].version,
    ]).toEqual([pkg.version, pkg.version, pkg.version, pkg.version, pkg.version]);
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
    expect(skill).toMatch(/^name: muse$/m);
    expect(codexMetadata).toContain('display_name: "muse"');
    expect(codexMetadata).toContain("Use muse to");
    expect(codexMetadata).not.toContain("$Muse");
  });

  test("centralizes native invocation syntax behind one lowercase cross-host request", async () => {
    const [invocation, readme, skill, openclawGuide, codexGuide, piGuide] = await Promise.all([
      readFile(join(repoRoot, "plugins/Muse/skills/muse/references/invocation.md"), "utf8"),
      readFile(join(repoRoot, "README.md"), "utf8"),
      readFile(join(repoRoot, "plugins/Muse/skills/muse/SKILL.md"), "utf8"),
      readFile(join(repoRoot, "configs/openclaw/AGENTS.md"), "utf8"),
      readFile(join(repoRoot, "configs/codex/AGENTS.md"), "utf8"),
      readFile(join(repoRoot, "configs/pi/AGENTS.md"), "utf8"),
    ]);

    expect(invocation).toContain("Use muse to <visualize, review, explain, or plan this work>.");
    expect(invocation).toContain("/muse:muse <request>");
    expect(invocation).toContain("/skill:muse <request>");
    expect(invocation).toContain("$muse <request>");
    expect(invocation).toMatch(/forced by host grammar/i);

    for (const surface of [readme, skill, openclawGuide, codexGuide, piGuide]) {
      expect(surface).toContain("Use muse to");
      expect(surface).not.toMatch(/\/muse:muse|\/skill:muse|\$muse|\$Muse/);
    }
  });

  test("ships an up-to-date self-contained interactive runtime", async () => {
    const runtimeEntry = join(
      repoRoot,
      "plugins/Muse/skills/muse/tools/interactive-plan/runtime-entry.ts",
    );
    const runtimePath = join(
      repoRoot,
      "plugins/Muse/skills/muse/tools/interactive-plan/runtime.mjs",
    );
    const build = await Bun.build({
      entrypoints: [runtimeEntry],
      target: "bun",
      format: "esm",
      minify: true,
    });
    expect(build.success).toBe(true);
    expect(await readFile(runtimePath, "utf8")).toBe(await build.outputs[0].text());

    const fixtureRoot = await mkdtemp(join(tmpdir(), "muse-plugin-cache-"));
    try {
      const pluginCopy = join(fixtureRoot, "cache", "muse");
      const planCopy = join(fixtureRoot, "consumer", "plan");
      await mkdir(dirname(pluginCopy), { recursive: true });
      await mkdir(dirname(planCopy), { recursive: true });
      await cp(join(repoRoot, "plugins", "Muse"), pluginCopy, { recursive: true });
      await cp(join(repoRoot, "tests", "fixtures", "interactive-plans", "minimal-plan"), planCopy, {
        recursive: true,
      });

      const result = await run(
        [
          process.execPath,
          "--no-install",
          join(pluginCopy, "skills", "muse", "tools", "interactive-plan", "runtime.mjs"),
          "render",
          planCopy,
        ],
        { cwd: join(fixtureRoot, "consumer") },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe("");
      expect(await readFile(join(planCopy, "dist", "index.html"), "utf8")).toContain(
        "<!DOCTYPE html>",
      );
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  test("Pi installer delegates idempotently and quarantines shadow copies", async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), "muse-pi-installer-"));
    try {
      const home = join(fixtureRoot, "home");
      const agentDir = join(home, ".pi", "agent");
      const fakeBin = join(fixtureRoot, "bin");
      const installLog = join(fixtureRoot, "pi-install.log");
      const fakePi = join(fakeBin, "pi");
      await mkdir(join(agentDir, "skills", "Muse"), { recursive: true });
      await mkdir(join(agentDir, "prompts"), { recursive: true });
      await mkdir(fakeBin, { recursive: true });
      await writeFile(join(agentDir, "skills", "Muse", "SKILL.md"), "stale skill\n");
      await writeFile(join(agentDir, "prompts", "diff-review.md"), "stale prompt\n");
      await writeFile(fakePi, '#!/bin/sh\nprintf "%s\\n" "$*" >> "$PI_TEST_LOG"\n');
      await chmod(fakePi, 0o755);

      const env = {
        ...Bun.env,
        HOME: home,
        PI_CODING_AGENT_DIR: agentDir,
        PI_TEST_LOG: installLog,
        PATH: `${fakeBin}:${Bun.env.PATH ?? ""}`,
      };
      const first = await run(["bash", join(repoRoot, "install-pi.sh")], { env });
      expect(first.exitCode).toBe(0);
      expect(first.stdout).toMatch(/Quarantined legacy manual copies/);
      await expect(access(join(agentDir, "skills", "Muse"))).rejects.toThrow();
      await expect(access(join(agentDir, "prompts", "diff-review.md"))).rejects.toThrow();

      const backups = (await readdir(agentDir)).filter((name) =>
        name.startsWith("muse-legacy-backup-"),
      );
      expect(backups).toHaveLength(1);
      expect(await readFile(join(agentDir, backups[0], "skills", "Muse", "SKILL.md"), "utf8")).toBe(
        "stale skill\n",
      );
      expect(await readFile(join(agentDir, backups[0], "prompts", "diff-review.md"), "utf8")).toBe(
        "stale prompt\n",
      );

      const second = await run(["bash", join(repoRoot, "install-pi.sh")], { env });
      expect(second.exitCode).toBe(0);
      expect(
        (await readdir(agentDir)).filter((name) => name.startsWith("muse-legacy-backup-")),
      ).toEqual(backups);
      expect((await readFile(installLog, "utf8")).trim().split("\n")).toEqual([
        `install ${repoRoot}`,
        `install ${repoRoot}`,
      ]);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
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
