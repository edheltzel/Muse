import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { access } from "node:fs/promises";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

import { renderBlock } from "../plugins/Muse/skills/muse/tools/interactive-plan/components.ts";
import { interactivePlanInteractionScript } from "../plugins/Muse/skills/muse/tools/interactive-plan/client.ts";

const chromeCandidates = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter((candidate): candidate is string => Boolean(candidate));

async function findChrome(): Promise<string> {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next conventional installation path.
    }
  }
  throw new Error("Real Chromium tab tests require Chrome; set CHROME_BIN to its executable");
}

function tabBlock(type: "Tabs" | "DiffTabs"): string {
  return renderBlock({
    id: type.toLowerCase(),
    type,
    props: { title: `${type} pointer contract` },
    body: "First\nfirst body\n---\nSecond\nsecond body\n---\nThird\nthird body",
  }, { staticMode: false });
}

async function installPage(page: Page, type: "Tabs" | "DiffTabs"): Promise<void> {
  await page.setContent(`<!doctype html><html><body>${tabBlock(type)}<script>${interactivePlanInteractionScript}</script></body></html>`);
}

async function tabState(page: Page, type: "Tabs" | "DiffTabs") {
  return page.evaluate((blockId) => {
    const block = document.getElementById(blockId);
    const tabs = [...(block?.querySelectorAll(':scope > .ve-ip-body > .ve-ip-tabs > [role="tablist"] > [role="tab"]') ?? [])];
    const panels = [...(block?.querySelectorAll(':scope > .ve-ip-body > .ve-ip-tabs > [role="tabpanel"]') ?? [])];
    return {
      activeId: document.activeElement?.id,
      tabs: tabs.map((tab) => ({
        id: tab.id,
        selected: tab.getAttribute("aria-selected"),
        tabindex: tab.getAttribute("tabindex"),
      })),
      panels: panels.map((panel) => ({ id: panel.id, hidden: panel.hasAttribute("hidden") })),
    };
  }, type.toLowerCase());
}

describe("interactive plan tabs in real Chromium", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({ executablePath: await findChrome(), headless: true });
  });

  afterAll(async () => {
    await browser?.close();
  });

  test.each(["Tabs", "DiffTabs"] as const)("%s pointer click focuses and activates exactly one panel", async (type) => {
    const page = await browser.newPage();
    try {
      await installPage(page, type);
      const blockId = type.toLowerCase();
      await page.focus(`#${blockId}-tab-0`);
      await page.click(`#${blockId}-tab-1`);

      expect(await tabState(page, type)).toEqual({
        activeId: `${blockId}-tab-1`,
        tabs: [
          { id: `${blockId}-tab-0`, selected: "false", tabindex: "-1" },
          { id: `${blockId}-tab-1`, selected: "true", tabindex: "0" },
          { id: `${blockId}-tab-2`, selected: "false", tabindex: "-1" },
        ],
        panels: [
          { id: `${blockId}-panel-0`, hidden: true },
          { id: `${blockId}-panel-1`, hidden: false },
          { id: `${blockId}-panel-2`, hidden: true },
        ],
      });
    } finally {
      await page.close();
    }
  });

  test.each(["Tabs", "DiffTabs"] as const)("%s ignores pointer clicks with duplicate direct-child targets", async (type) => {
    const page = await browser.newPage();
    try {
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
    } finally {
      await page.close();
    }
  });
});
