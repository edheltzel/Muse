import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { type ChildProcess } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer, { type Browser, type Page } from "puppeteer";

import { renderBlock } from "../plugins/Muse/skills/muse/tools/interactive-plan/components.ts";
import { interactivePlanInteractionScript } from "../plugins/Muse/skills/muse/tools/interactive-plan/client.ts";
import { renderPlanFolder } from "../plugins/Muse/skills/muse/tools/interactive-plan/render.ts";

type TabType = "Tabs" | "DiffTabs";

function tabBlock(type: TabType): string {
  return renderBlock({
    id: type.toLowerCase(),
    type,
    props: { title: `${type} interaction contract` },
    body: "file: alpha.ts\nalpha body\n---\nfile: beta.ts\nbeta body\n---\nfile: gamma.ts\ngamma body",
  }, { staticMode: false });
}

async function installPage(page: Page, type: TabType): Promise<void> {
  await page.setContent(`<!doctype html><html><body>${tabBlock(type)}<button id="after-tabs">After tabs</button><script>${interactivePlanInteractionScript}</script></body></html>`);
  await page.evaluate(() => {
    document.addEventListener("keydown", (event) => {
      document.body.dataset.keyDefaultPrevented = String(event.defaultPrevented);
    });
  });
}

async function tabState(page: Page, type: TabType) {
  return page.evaluate((blockId) => {
    const block = document.getElementById(blockId);
    const tabs = [...(block?.querySelectorAll(':scope > .ve-ip-body > .ve-ip-tabs > [role="tablist"] > [role="tab"]') ?? [])];
    const panels = [...(block?.querySelectorAll(':scope > .ve-ip-body > .ve-ip-tabs > [role="tabpanel"]') ?? [])];
    return {
      activeId: document.activeElement?.id,
      defaultPrevented: document.body.dataset.keyDefaultPrevented,
      tabs: tabs.map((tab) => ({
        id: tab.id,
        label: tab.textContent,
        selected: tab.getAttribute("aria-selected"),
        tabindex: tab.getAttribute("tabindex"),
      })),
      panels: panels.map((panel) => ({ id: panel.id, hidden: panel.hasAttribute("hidden") })),
    };
  }, type.toLowerCase());
}

function expectedState(type: TabType, activeIndex: number, activeId: string, defaultPrevented?: string) {
  const blockId = type.toLowerCase();
  return {
    activeId,
    defaultPrevented,
    tabs: ["alpha.ts", "beta.ts", "gamma.ts"].map((label, index) => ({
      id: `${blockId}-tab-${index}`,
      label,
      selected: String(index === activeIndex),
      tabindex: index === activeIndex ? "0" : "-1",
    })),
    panels: [0, 1, 2].map((index) => ({
      id: `${blockId}-panel-${index}`,
      hidden: index !== activeIndex,
    })),
  };
}

// OS child exits and signal escalation use the real clock; fake timers cannot drive process exit events.
async function waitForProcessExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  const { promise, resolve } = Promise.withResolvers<boolean>();
  const onExit = () => resolve(true);
  const timer = setTimeout(() => resolve(false), timeoutMs);
  child.once("exit", onExit);
  const exited = await promise;
  clearTimeout(timer);
  child.off("exit", onExit);
  return exited;
}

async function closeManagedBrowser(browser: Browser, child: ChildProcess | null): Promise<void> {
  let cleanupFailure: unknown;
  if (browser.connected) {
    const { promise: deadline, reject } = Promise.withResolvers<never>();
    const timer = setTimeout(() => reject(new Error("Timed out closing managed Chrome")), 2_000);
    try {
      await Promise.race([browser.close(), deadline]);
    } catch (error) {
      cleanupFailure = error;
    } finally {
      clearTimeout(timer);
    }
  }

  if (child && !(await waitForProcessExit(child, 250))) {
    child.kill("SIGTERM");
    if (!(await waitForProcessExit(child, 1_000))) {
      child.kill("SIGKILL");
      if (!(await waitForProcessExit(child, 1_000))) {
        cleanupFailure ??= new Error(`Managed Chrome process ${child.pid ?? "unknown"} did not terminate`);
      }
    }
  }
  if (cleanupFailure) throw cleanupFailure;
}

describe("interactive plan tabs in managed Chrome for Testing", () => {
  let browser: Browser | undefined;
  let browserProcess: ChildProcess | null = null;
  let primaryFailure: unknown;

  async function withPage(run: (page: Page) => Promise<void>): Promise<void> {
    let page: Page | undefined;
    let testFailure: unknown;
    try {
      page = await browser!.newPage();
      await run(page);
    } catch (error) {
      testFailure = error;
      primaryFailure ??= error;
      throw error;
    } finally {
      try {
        if (page && !page.isClosed()) await page.close({ runBeforeUnload: false });
      } catch (error) {
        if (!testFailure && browser?.connected) {
          primaryFailure ??= error;
          throw error;
        }
      }
    }
  }

  beforeAll(async () => {
    try {
      browser = await puppeteer.launch({
        executablePath: await puppeteer.executablePath(),
        headless: true,
      });
      browserProcess = browser.process();
    } catch (error) {
      primaryFailure ??= error;
      throw error;
    }
  });

  afterAll(async () => {
    if (!browser) return;
    try {
      await closeManagedBrowser(browser, browserProcess);
    } catch (error) {
      if (!primaryFailure) throw error;
    }
  });

  test.each(["Tabs", "DiffTabs"] as const)("%s pointer click focuses and activates exactly one panel", async (type) => {
    await withPage(async (page) => {
      await installPage(page, type);
      const blockId = type.toLowerCase();
      await page.focus(`#${blockId}-tab-0`);
      await page.click(`#${blockId}-tab-1`);

      expect(await tabState(page, type)).toEqual(expectedState(type, 1, `${blockId}-tab-1`));
    });
  });

  test.each(["Tabs", "DiffTabs"] as const)("%s implements the complete composite keyboard contract", async (type) => {
    await withPage(async (page) => {
      await installPage(page, type);
      const blockId = type.toLowerCase();
      await page.focus(`#${blockId}-tab-0`);

      for (const [key, activeIndex] of [["ArrowLeft", 2], ["ArrowRight", 0], ["End", 2], ["Home", 0]] as const) {
        await page.keyboard.press(key);
        expect(await tabState(page, type)).toEqual(expectedState(type, activeIndex, `${blockId}-tab-${activeIndex}`, "true"));
      }

      for (const modifier of ["Alt", "Control", "Meta", "Shift"] as const) {
        await page.keyboard.down(modifier);
        await page.keyboard.press("ArrowRight");
        await page.keyboard.up(modifier);
        expect(await tabState(page, type)).toEqual(expectedState(type, 0, `${blockId}-tab-0`, "false"));
      }

      await page.keyboard.press("Tab");
      expect(await tabState(page, type)).toEqual(expectedState(type, 0, `${blockId}-panel-0`, "false"));
      await page.keyboard.press("Tab");
      expect(await tabState(page, type)).toEqual(expectedState(type, 0, "after-tabs", "false"));
    });
  });

  test("tablists expose distinct stable names in Chrome accessibility tree", async () => {
    await withPage(async (page) => {
      await page.setContent(`<!doctype html><html><body>${tabBlock("Tabs")}${tabBlock("DiffTabs")}<script>${interactivePlanInteractionScript}</script></body></html>`);
      const snapshot = await page.accessibility.snapshot({ interestingOnly: false });
      const names: string[] = [];
      const visit = (node: { role?: string; name?: string; children?: unknown[] } | null): void => {
        if (!node) return;
        if (node.role === "tablist" && node.name) names.push(node.name);
        for (const child of node.children ?? []) visit(child as typeof node);
      };
      visit(snapshot);

      expect(names).toEqual([
        "Tabs interaction contract tabs (tabs)",
        "DiffTabs interaction contract tabs (difftabs)",
      ]);
    });
  });

  test.each(["Tabs", "DiffTabs"] as const)("%s keyboard behavior stays isolated with a neighboring composite", async (type) => {
    await withPage(async (page) => {
      await page.setContent(`<!doctype html><html><body>${tabBlock("Tabs")}${tabBlock("DiffTabs")}<script>${interactivePlanInteractionScript}</script></body></html>`);
      const blockId = type.toLowerCase();
      const neighbor = type === "Tabs" ? "DiffTabs" : "Tabs";
      await page.focus(`#${blockId}-tab-0`);
      await page.keyboard.press("ArrowRight");

      expect(await tabState(page, type)).toEqual(expectedState(type, 1, `${blockId}-tab-1`));
      expect(await tabState(page, neighbor)).toEqual(expectedState(neighbor, 0, `${blockId}-tab-1`));
    });
  });

  test.each(["Tabs", "DiffTabs"] as const)("%s ignores pointer clicks with duplicate direct-child targets", async (type) => {
    await withPage(async (page) => {
      await installPage(page, type);
      const blockId = type.toLowerCase();
      await page.evaluate((id) => {
        const group = document.querySelector(`#${id} > .ve-ip-body > .ve-ip-tabs`);
        const panel = document.getElementById(`${id}-panel-1`);
        if (!group || !panel) throw new Error("Tab fixture is incomplete");
        group.append(panel.cloneNode(true));
        document.getElementById(`${id}-tab-0`)?.focus();
        document.body.dataset.clickDefaultPrevented = "unset";
        document.addEventListener("click", (event) => {
          document.body.dataset.clickDefaultPrevented = String(event.defaultPrevented);
        }, { once: true });
      }, blockId);
      const before = await tabState(page, type);

      await page.click(`#${blockId}-tab-1`);

      expect(await tabState(page, type)).toEqual(before);
      expect(await page.evaluate(() => document.body.dataset.clickDefaultPrevented)).toBe("false");
    });
  });

  test.each(["Tabs", "DiffTabs"] as const)("%s static export lays out every panel in source order without controls", async (type) => {
    const planDir = await mkdtemp(join(tmpdir(), `ve-ip-static-${type.toLowerCase()}-`));
    let testFailure: unknown;
    try {
      await writeFile(join(planDir, "plan.mdx"), `<${type} id="${type.toLowerCase()}">\nfile: alpha.ts\nalpha body\n---\nfile: beta.ts\nbeta body\n---\nfile: gamma.ts\ngamma body\n</${type}>\n`);
      const { staticExportPath } = await renderPlanFolder(planDir);
      await withPage(async (page) => {
        await page.goto(pathToFileURL(staticExportPath).href, { waitUntil: "domcontentloaded" });
        const result = await page.evaluate((blockId) => {
          const block = document.getElementById(blockId);
          const panels = [...(block?.querySelectorAll(".ve-ip-static-tab-panel") ?? [])];
          return {
            controls: block?.querySelectorAll('button, [role="tablist"], [role="tab"], [role="tabpanel"], [data-tab-target]').length,
            panels: panels.map((panel) => {
              const rect = panel.getBoundingClientRect();
              return {
                heading: panel.querySelector("h3")?.textContent,
                text: panel.textContent,
                width: rect.width,
                height: rect.height,
              };
            }),
          };
        }, type.toLowerCase());

        expect(result.controls).toBe(0);
        expect(result.panels.map(({ heading }) => heading)).toEqual(["alpha.ts", "beta.ts", "gamma.ts"]);
        expect(result.panels.map(({ text }) => text?.includes("body"))).toEqual([true, true, true]);
        expect(result.panels.every(({ width, height }) => width > 0 && height > 0)).toBe(true);
      });
    } catch (error) {
      testFailure = error;
      primaryFailure ??= error;
      throw error;
    } finally {
      try {
        await rm(planDir, { recursive: true, force: true });
      } catch (error) {
        if (!testFailure) throw error;
      }
    }
  });
  test("Chrome confirms unterminated tokenizer states swallow following tab IDs", async () => {
    await withPage(async (page) => {
      for (const opening of ["<!--", "<iframe>", "<noembed>", "<noframes>", "<plaintext>", '<script type="text/plain">', "<style>", "<textarea>", "<title>", "<xmp>"]) {
        await page.setContent(`<!doctype html><html><body>${opening}${tabBlock("Tabs")}</body></html>`);
        expect(await page.evaluate(() => document.getElementById("tabs"))).toBeNull();
      }
    });
  });

  test("Chrome isolates light, template, and declarative shadow ID scopes", async () => {
    await withPage(async (page) => {
      await page.setContent('<!doctype html><html><body><div id="scoped"></div><template id="template"><div id="scoped"></div></template><section id="host"><template shadowrootmode="open"><div id="scoped"></div></template></section></body></html>');

      expect(await page.evaluate(() => {
        const template = document.getElementById("template") as HTMLTemplateElement | null;
        return {
          light: document.querySelectorAll("#scoped").length,
          shadow: document.getElementById("host")?.shadowRoot?.querySelectorAll("#scoped").length,
          template: template?.content.querySelectorAll("#scoped").length,
        };
      })).toEqual({ light: 1, shadow: 1, template: 1 });
    });
  });

  test("Chrome ignores duplicate structural start tags like the final audit", async () => {
    await withPage(async (page) => {
      await page.setContent('<!doctype html><html id="structure"><html id="ignored-html"><body id="page"><body id="ignored-body"><main id="content"></main></body></html>');

      expect(await page.evaluate(() => ({
        body: document.body.id,
        content: document.querySelectorAll("#content").length,
        html: document.documentElement.id,
        ignoredBody: document.querySelectorAll("#ignored-body").length,
        ignoredHtml: document.querySelectorAll("#ignored-html").length,
      }))).toEqual({
        body: "page",
        content: 1,
        html: "structure",
        ignoredBody: 0,
        ignoredHtml: 0,
      });
    });
  });

  test("rendered tab ID inventory equals the Chrome document inventory", async () => {
    const planDir = await mkdtemp(join(tmpdir(), "ve-ip-expected-ids-"));
    let testFailure: unknown;
    try {
      await writeFile(join(planDir, "plan.mdx"), '<Tabs id="tabs">\nfile: alpha.ts\nalpha\n---\nfile: beta.ts\nbeta\n</Tabs>\n');
      const { indexPath } = await renderPlanFolder(planDir);
      await withPage(async (page) => {
        await page.goto(pathToFileURL(indexPath).href, { waitUntil: "domcontentloaded" });
        const ids = await page.evaluate(() => [...document.querySelectorAll("[id]")].map(({ id }) => id).sort());
        expect(ids).toEqual([
          "tabs",
          "tabs-panel-0",
          "tabs-panel-1",
          "tabs-tab-0",
          "tabs-tab-1",
        ]);
      });
    } catch (error) {
      testFailure = error;
      primaryFailure ??= error;
      throw error;
    } finally {
      try {
        await rm(planDir, { recursive: true, force: true });
      } catch (error) {
        if (!testFailure) throw error;
      }
    }
  });

  test("managed Chrome cleanup terminates a retained process after disconnect", async () => {
    let disconnectedBrowser: Browser | undefined;
    let disconnectedProcess: ChildProcess | null = null;
    try {
      disconnectedBrowser = await puppeteer.launch({
        executablePath: await puppeteer.executablePath(),
        headless: true,
      });
      disconnectedProcess = disconnectedBrowser.process();
      expect(disconnectedProcess).not.toBeNull();
      disconnectedBrowser.disconnect();

      await closeManagedBrowser(disconnectedBrowser, disconnectedProcess);

      expect(await waitForProcessExit(disconnectedProcess!, 100)).toBe(true);
    } catch (error) {
      primaryFailure ??= error;
      if (disconnectedProcess && disconnectedProcess.exitCode === null && disconnectedProcess.signalCode === null) {
        disconnectedProcess.kill("SIGKILL");
        await waitForProcessExit(disconnectedProcess, 1_000);
      }
      throw error;
    }
  });

});
