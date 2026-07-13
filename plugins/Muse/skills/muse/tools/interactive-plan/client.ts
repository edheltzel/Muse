const baseClientScript = `
(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeToggleLabel = document.querySelector("[data-theme-toggle-label]");

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    themeToggle?.setAttribute("aria-pressed", String(theme === "dark"));
    if (themeToggleLabel) themeToggleLabel.textContent = theme === "dark" ? "Dark" : "Light";
    try {
      localStorage.setItem("ve-ip-theme", theme);
    } catch {}
  };

  const storedTheme = (() => {
    try {
      return localStorage.getItem("ve-ip-theme");
    } catch {
      return null;
    }
  })();
  setTheme(storedTheme || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  themeToggle?.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
    renderMermaid();
  });

  const mermaidTheme = (theme) => {
    const dark = theme === "dark";
    const palette = dark
      ? {
          primary: "#333a46",
          text: "#f1f3f5",
          border: "#6f7d8d",
          line: "#66b9c9",
          secondary: "#5a4125",
          tertiary: "#252b34",
        }
      : {
          primary: "#eef2f5",
          text: "#252b33",
          border: "#8d99a6",
          line: "#278195",
          secondary: "#f3dfbd",
          tertiary: "#ffffff",
        };
    return {
      theme: "base",
      securityLevel: "strict",
      startOnLoad: false,
      themeVariables: {
        fontFamily: "Fragment Mono, ui-monospace, monospace",
        primaryColor: palette.primary,
        primaryTextColor: palette.text,
        primaryBorderColor: palette.border,
        lineColor: palette.line,
        secondaryColor: palette.secondary,
        tertiaryColor: palette.tertiary,
        edgeLabelBackground: palette.tertiary,
      },
    };
  };

  let mermaidRenderVersion = 0;
  let renderedMermaidTheme = null;
  let mermaidRenderQueue = null;
  const renderMermaid = () => {
    const version = ++mermaidRenderVersion;
    const theme = root.dataset.theme === "dark" ? "dark" : "light";
    const run = async () => {
      if (version !== mermaidRenderVersion || theme === renderedMermaidTheme) return;
      const mermaid = window.mermaid;
      if (!mermaid) {
        document.querySelectorAll(".mermaid-wrap").forEach((wrap) => {
          wrap.setAttribute("data-render-state", "missing-runtime");
        });
        return;
      }

      mermaid.initialize(mermaidTheme(theme));
      const wraps = Array.from(document.querySelectorAll(".mermaid-wrap"));
      for (const wrap of wraps) {
        if (version !== mermaidRenderVersion) return;
        const source = wrap.querySelector(".mermaid-source")?.textContent?.trim();
        const canvas = wrap.querySelector(".mermaid-canvas");
        if (!source || !canvas) continue;
        try {
          const id = "ve-mermaid-" + (wrap.getAttribute("data-diagram-id") || Math.random().toString(36).slice(2));
          const rendered = await mermaid.render(id, source);
          if (version !== mermaidRenderVersion) return;
          canvas.innerHTML = rendered.svg;
          wrap.setAttribute("data-render-state", "rendered");
        } catch (error) {
          if (version !== mermaidRenderVersion) return;
          const message = document.createElement("pre");
          message.className = "mermaid-error";
          message.textContent = String(error?.message || error);
          canvas.replaceChildren(message);
          wrap.setAttribute("data-render-state", "error");
        }
      }
      renderedMermaidTheme = theme;
    };

    mermaidRenderQueue = mermaidRenderQueue ? mermaidRenderQueue.then(run, run) : run();
    return mermaidRenderQueue;
  };

  const diagramState = new WeakMap();
  const stateFor = (wrap) => {
    if (!diagramState.has(wrap)) diagramState.set(wrap, { scale: 1, x: 0, y: 0 });
    return diagramState.get(wrap);
  };
  const applyTransform = (wrap) => {
    const state = stateFor(wrap);
    const canvas = wrap.querySelector(".mermaid-canvas");
    if (canvas) canvas.style.transform = "translate(" + state.x + "px, " + state.y + "px) scale(" + state.scale + ")";
    const reset = wrap.querySelector('[data-zoom="reset"]');
    if (reset) reset.textContent = Math.round(state.scale * 100) + "%";
  };
  const zoom = (wrap, factor) => {
    const state = stateFor(wrap);
    state.scale = Math.min(2.6, Math.max(0.5, state.scale * factor));
    applyTransform(wrap);
  };

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const wrap = target.closest(".mermaid-wrap");
    if (!wrap) return;
    if (target.closest('[data-zoom="out"]')) zoom(wrap, 0.88);
    if (target.closest('[data-zoom="in"]')) zoom(wrap, 1.14);
    if (target.closest('[data-zoom="reset"]')) {
      diagramState.set(wrap, { scale: 1, x: 0, y: 0 });
      applyTransform(wrap);
    }
    if (target.closest("[data-expand]")) {
      const svg = wrap.querySelector(".mermaid-canvas svg")?.outerHTML || wrap.querySelector(".mermaid-source")?.textContent || "";
      const popup = window.open("", "_blank");
      popup?.document.write("<!doctype html><title>Muse diagram</title><body style='margin:0;background:#101418;display:grid;place-items:center;min-height:100vh;padding:32px'>" + svg + "</body>");
      popup?.document.close();
    }
  });

  document.querySelectorAll(".mermaid-wrap").forEach((wrap) => {
    const viewport = wrap.querySelector(".mermaid-viewport");
    if (!viewport) return;
    let drag = null;
    viewport.addEventListener("keydown", (event) => {
      const target = event.target;
      if (
        event.altKey
        || event.ctrlKey
        || event.metaKey
        || event.shiftKey
        || (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)))
      ) return;
      const state = stateFor(wrap);
      switch (event.key) {
        case "ArrowLeft":
          state.x += 40;
          break;
        case "ArrowRight":
          state.x -= 40;
          break;
        case "ArrowUp":
          state.y += 40;
          break;
        case "ArrowDown":
          state.y -= 40;
          break;
        default:
          return;
      }
      event.preventDefault();
      applyTransform(wrap);
    });
    viewport.addEventListener("wheel", (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      zoom(wrap, event.deltaY > 0 ? 0.9 : 1.1);
    }, { passive: false });
    viewport.addEventListener("pointerdown", (event) => {
      drag = { x: event.clientX, y: event.clientY, start: { ...stateFor(wrap) } };
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const state = stateFor(wrap);
      state.x = drag.start.x + event.clientX - drag.x;
      state.y = drag.start.y + event.clientY - drag.y;
      applyTransform(wrap);
    });
    viewport.addEventListener("pointerup", () => { drag = null; });
    applyTransform(wrap);
  });

  renderMermaid();
})();`;

export const staticPlanClientScript = baseClientScript;

export const interactivePlanClientScript = baseClientScript + `
(() => {
  const postJson = async (url, body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  };
  const writeApprovalOutput = (getText) => {
    const output = document.querySelector("[data-approval-output]");
    if (!output) return false;
    output.hidden = false;
    output.textContent = getText();
    return true;
  };

  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const tab = target.closest("[data-tab-target]");
    if (tab) {
      const id = tab.getAttribute("data-tab-target");
      const group = tab.closest(".ve-ip-tabs");
      group?.querySelectorAll("[role=tabpanel]").forEach((panel) => { panel.hidden = panel.id !== id; });
      group?.querySelectorAll("[role=tab]").forEach((button) => button.setAttribute("aria-selected", String(button === tab)));
    }

    if (target.closest("[data-needs-revision]")) {
      try {
        await postJson("/api/state", { status: "needs_revision" });
        document.body.dataset.reviewStatus = "needs_revision";
      } catch (error) {
        alert("Could not persist revision status: " + error.message);
      }
    }

    if (target.closest("[data-approve-plan]")) {
      try {
        const result = await postJson("/api/approve", { reviewer: "local-reviewer" });
        document.body.dataset.reviewStatus = "approved";
        writeApprovalOutput(() => JSON.stringify(result, null, 2));
      } catch (error) {
        if (!writeApprovalOutput(() => "Approval could not be persisted locally. Copy this page or rerun through the local bridge.\\n" + error.message)) {
          alert("Could not approve plan: " + error.message);
        }
      }
    }
  });

  document.addEventListener("change", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    try {
      if (target.dataset.checklistId) {
        await postJson("/api/state", { checklist: { [target.dataset.checklistId]: target.checked } });
      }
      if (target.name && target.closest("[data-plan-questions]")) {
        await postJson("/api/state", { answers: { [target.name]: target.value } });
      }
    } catch (error) {
      console.warn("Could not persist review state", error);
    }
  });
})();`;
