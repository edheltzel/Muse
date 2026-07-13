import { afterAll, beforeAll, describe, expect, test } from "bun:test";
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

describe("interactive plan tabs in managed Chrome for Testing", () => {
  let browser: Browser | undefined;
  let primaryFailure: unknown;

  async function withPage(run: (page: Page) => Promise<void>): Promise<void> {
    const page = await browser!.newPage();
    let testFailure: unknown;
    try {
      await run(page);
    } catch (error) {
      testFailure = error;
      primaryFailure ??= error;
      throw error;
    } finally {
      try {
        if (!page.isClosed()) await page.close({ runBeforeUnload: false });
      } catch (error) {
        if (!testFailure && browser?.connected) throw error;
      }
    }
  }

  beforeAll(async () => {
    browser = await puppeteer.launch({
      executablePath: await puppeteer.executablePath(),
      headless: true,
    });
  });

  afterAll(async () => {
    if (!browser?.connected) return;
    try {
      await browser.close();
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
      expect(await tabState(page, type)).toEqual(expectedState(type, 0, "after-tabs", "false"));
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
      throw error;
    } finally {
      try {
        await rm(planDir, { recursive: true, force: true });
      } catch (error) {
        if (!testFailure) throw error;
      }
    }
  });
});
