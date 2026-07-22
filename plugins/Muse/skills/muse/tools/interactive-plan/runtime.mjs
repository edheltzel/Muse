// @bun
import{mkdir as Qu,readFile as Fu,writeFile as _r}from"fs/promises";import{join as ea}from"path";import{copyFile as Le,cp as Be,mkdir as Pe,readFile as Ri}from"fs/promises";import{join as us}from"path";var si=Object.freeze([{filename:"bricolage-grotesque-latin-500-normal.woff2",family:"Bricolage Grotesque",weight:500,sha256:"b62688707e0820a9cf2a98e9b0349fbb348fd17f76b70a05b53e7a668e3f406f",sha384:"qn7O2kwYDNO8BB07VtIMUe0lUqq3WYJ/okIrACPResGQn0vViFROEt3SGde7RySe"},{filename:"bricolage-grotesque-latin-600-normal.woff2",family:"Bricolage Grotesque",weight:600,sha256:"b34fc8c1ef0ac8798455ac2979eae4b4f90f0d327e3584d1032fa77a8a9a66ca",sha384:"Ilh1L/tmtUzFnpC1cwkNgBNnW+urzfbLETMexxhppi4RurOQbreAwtqAuodE8gcS"},{filename:"bricolage-grotesque-latin-700-normal.woff2",family:"Bricolage Grotesque",weight:700,sha256:"4c373ce3c1cca41c864eb3e27c059a59fc6310547ab9c9b6cd780d387ba24206",sha384:"I1AMB8Mhv2nNTsttl0xrwLBvxe4XMocWs9FDGXH6AqBsgZTPNWagTukzMpe7LPST"},{filename:"fragment-mono-latin-400-normal.woff2",family:"Fragment Mono",weight:400,sha256:"44c4e39bff5e76652a24a872cbebabccbcfb20f62c4633b27c1f2745cba86b56",sha384:"5pPJBXVgEAccmDzYsxRokikcIMqnLiJSV7qWM3TpHdoPoqSh8vUGD1DWsnEZB0BL"}]),Ce="11.16.0",Ya=`https://cdn.jsdelivr.net/npm/mermaid@${Ce}/dist/mermaid.min.js`;var Ka="T/0lMUdJpd2S1ZHtRiofG3htU3xPCrFVeAQ1UUE2TJwlEJSV5NUwn30kP28n238E",Us=us(import.meta.dir,"assets"),Oe="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";async function Ua(s){return(await Promise.all(si.map(async(i)=>{let a=s?`data:font/woff2;base64,${(await Ri(us(Us,i.filename))).toString("base64")}`:`/assets/${i.filename}`;return`@font-face { font-family: "${i.family}"; font-style: normal; font-display: swap; font-weight: ${i.weight}; src: url("${a}") format("woff2"); unicode-range: ${Oe}; }`}))).join(`
`)}async function Ra(){let s=JSON.parse(await Ri(us(Us,"notices","manifest.json"),"utf8")),i=new Set(si.map((e)=>e.filename)),a=new Map;for(let e of s.assets){if(!i.has(e.asset))continue;let d=`${e.package}\x00${e.version}\x00${e.notice}`,c=a.get(d);if(c)c.assets.push(e.asset);else a.set(d,{package:e.package,version:e.version,assets:[e.asset],notice:e.notice});i.delete(e.asset)}if(i.size>0)throw Error(`Missing font notice metadata for: ${[...i].join(", ")}`);return Promise.all([...a.values()].map(async({notice:e,...d})=>({...d,text:await Ri(us(Us,e),"utf8")})))}async function na(s){let i=us(s,"assets");await Pe(i,{recursive:!0}),await Promise.all([...si.map((a)=>Le(us(Us,a.filename),us(i,a.filename))),Be(us(Us,"notices"),us(i,"notices"),{recursive:!0})])}function La(s){return si.some((i)=>i.filename===s)}var Ba=`
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

  const explorer = document.querySelector("[data-component-explorer]");
  if (explorer) {
    const search = explorer.querySelector("[data-component-search]");
    const filters = Array.from(explorer.querySelectorAll("[data-component-filter]"));
    const results = explorer.querySelector("[data-component-results]");
    const blocks = Array.from(document.querySelectorAll(".ve-ip-block[data-component-category]"));
    const canonicalCount = Number(explorer.getAttribute("data-component-canonical-count")) || 0;
    let activeCategory = "";

    const applyComponentFilters = () => {
      const query = search?.value.trim().toLowerCase() || "";
      let visibleCount = 0;
      const visibleTypes = new Set();
      blocks.forEach((block) => {
        const category = block.getAttribute("data-component-category") || "";
        const searchableText = (block.getAttribute("data-component-search-text") || "").toLowerCase();
        const visible = (!activeCategory || category === activeCategory) && (!query || searchableText.includes(query));
        block.hidden = !visible;
        const navLink = Array.from(document.querySelectorAll(".ve-ip-nav a")).find((link) => link.getAttribute("href") === "#" + block.id);
        if (navLink) navLink.hidden = !visible;
        if (visible) {
          visibleCount += 1;
          visibleTypes.add(block.getAttribute("data-block-type") || "");
        }
      });
      if (results) results.textContent = visibleCount + (visibleCount === 1 ? " example" : " examples") + " \xB7 " + visibleTypes.size + " unique of canonical " + canonicalCount;
    };

    search?.addEventListener("input", applyComponentFilters);
    filters.forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.getAttribute("data-component-filter") || "";
        filters.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
        applyComponentFilters();
      });
    });
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      if (event.key !== "/" || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
      event.preventDefault();
      search?.focus();
    });
    applyComponentFilters();
  }

  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const copyButton = target.closest("[data-copy-mdx]");
    if (!copyButton) return;
    const source = copyButton.closest(".ve-ip-source")?.querySelector("[data-mdx-source]")?.textContent || "";
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source);
      copyButton.textContent = "Copied";
      copyButton.setAttribute("data-copy-state", "copied");
      window.setTimeout(() => {
        copyButton.textContent = "Copy MDX";
        copyButton.removeAttribute("data-copy-state");
      }, 1600);
    } catch {
      copyButton.textContent = "Copy failed";
    }
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
          const id = wrap.getAttribute("data-mermaid-render-id");
          if (!id) continue;
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
      const renderedSvg = wrap.querySelector(".mermaid-canvas svg")?.outerHTML;
      let content = renderedSvg;
      if (!content) {
        const source = wrap.querySelector(".mermaid-source")?.textContent || "";
        content = "<pre style='white-space:pre-wrap;color:#f1f3f5'>" + source.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;") + "</pre>";
      }
      const popup = window.open("", "_blank");
      popup?.document.write("<!doctype html><title>Muse diagram</title><body style='margin:0;background:#101418;display:grid;place-items:center;min-height:100vh;padding:32px'>" + content + "</body>");
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
})();`;var Pa=`
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

  const explorer = document.querySelector("[data-component-explorer]");
  if (explorer) {
    const search = explorer.querySelector("[data-component-search]");
    const filters = Array.from(explorer.querySelectorAll("[data-component-filter]"));
    const results = explorer.querySelector("[data-component-results]");
    const blocks = Array.from(document.querySelectorAll(".ve-ip-block[data-component-category]"));
    const canonicalCount = Number(explorer.getAttribute("data-component-canonical-count")) || 0;
    let activeCategory = "";

    const applyComponentFilters = () => {
      const query = search?.value.trim().toLowerCase() || "";
      let visibleCount = 0;
      const visibleTypes = new Set();
      blocks.forEach((block) => {
        const category = block.getAttribute("data-component-category") || "";
        const searchableText = (block.getAttribute("data-component-search-text") || "").toLowerCase();
        const visible = (!activeCategory || category === activeCategory) && (!query || searchableText.includes(query));
        block.hidden = !visible;
        const navLink = Array.from(document.querySelectorAll(".ve-ip-nav a")).find((link) => link.getAttribute("href") === "#" + block.id);
        if (navLink) navLink.hidden = !visible;
        if (visible) {
          visibleCount += 1;
          visibleTypes.add(block.getAttribute("data-block-type") || "");
        }
      });
      if (results) results.textContent = visibleCount + (visibleCount === 1 ? " example" : " examples") + " \xB7 " + visibleTypes.size + " unique of canonical " + canonicalCount;
    };

    search?.addEventListener("input", applyComponentFilters);
    filters.forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.getAttribute("data-component-filter") || "";
        filters.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
        applyComponentFilters();
      });
    });
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      if (event.key !== "/" || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
      event.preventDefault();
      search?.focus();
    });
    applyComponentFilters();
  }

  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const copyButton = target.closest("[data-copy-mdx]");
    if (!copyButton) return;
    const source = copyButton.closest(".ve-ip-source")?.querySelector("[data-mdx-source]")?.textContent || "";
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source);
      copyButton.textContent = "Copied";
      copyButton.setAttribute("data-copy-state", "copied");
      window.setTimeout(() => {
        copyButton.textContent = "Copy MDX";
        copyButton.removeAttribute("data-copy-state");
      }, 1600);
    } catch {
      copyButton.textContent = "Copy failed";
    }
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
          const id = wrap.getAttribute("data-mermaid-render-id");
          if (!id) continue;
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
      const renderedSvg = wrap.querySelector(".mermaid-canvas svg")?.outerHTML;
      let content = renderedSvg;
      if (!content) {
        const source = wrap.querySelector(".mermaid-source")?.textContent || "";
        content = "<pre style='white-space:pre-wrap;color:#f1f3f5'>" + source.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;") + "</pre>";
      }
      const popup = window.open("", "_blank");
      popup?.document.write("<!doctype html><title>Muse diagram</title><body style='margin:0;background:#101418;display:grid;place-items:center;min-height:100vh;padding:32px'>" + content + "</body>");
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
})();`+`
(() => {
  const getJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(await response.text());
    return {
      value: await response.json(),
      generation: response.headers.get("x-muse-review-generation"),
    };
  };
  const postJson = async (url, body, idempotencyKey) => {
    const headers = { "Content-Type": "application/json" };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  };

  let committedState;
  let committedComments = [];
  let hydrationPromise;
  const operationStates = new Map();
  let persistenceQueue = Promise.resolve();

  const messageFor = (error) => error instanceof Error ? error.message : String(error);
  const feedbackFor = (key) => document.querySelector('[data-persistence-key="' + CSS.escape(key) + '"]');
  const renderFeedback = (key, feedback = feedbackFor(key)) => {
    if (!feedback) return;
    const operation = operationStates.get(key);
    feedback.dataset.persistenceState = operation?.status || "saved";
    const text = feedback.querySelector("[data-persistence-message]");
    if (text) text.textContent = operation?.message || "Saved";
    const button = feedback.querySelector("[data-persistence-retry]");
    if (button) button.hidden = !operation?.retry;
  };
  const setFeedback = (key, state, message, retry) => {
    if (state === "saved") operationStates.delete(key);
    else operationStates.set(key, { status: state, message, retry });
    renderFeedback(key);
  };
  const formatStatus = (status) => String(status || "draft")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
  };

  const showApprovalReceipt = (state, handoff) => {
    const receipt = document.querySelector("[data-approval-receipt]");
    if (!receipt) return;
    if (state.status !== "approved") {
      receipt.hidden = true;
      return;
    }
    receipt.hidden = false;
    const summary = receipt.querySelector("[data-approval-receipt-summary]");
    if (summary) {
      summary.textContent = "Approved by " + state.reviewer + " on " + formatDate(state.approvedAt) + ".";
    }
    const technical = receipt.querySelector("[data-approval-technical-json]");
    if (technical) {
      technical.textContent = JSON.stringify(handoff || {
        status: state.status,
        reviewer: state.reviewer,
        approvedAt: state.approvedAt,
        approvalDigest: state.approvalDigest,
      }, null, 2);
    }
  };

  const refreshApprovalReadiness = () => {
    const output = document.querySelector("[data-approval-readiness]");
    const approve = document.querySelector("[data-approve-plan]");
    if (!output || !approve || !committedState) return;
    const requiredQuestions = Array.from(document.querySelectorAll('[data-plan-questions] [data-readiness-policy="required"] input[name]'));
    const missingQuestions = requiredQuestions.filter((input) => {
      const answer = committedState.answers[input.name];
      return Array.isArray(answer)
        ? !answer.some((item) => item.trim().length > 0)
        : typeof answer !== "string" || answer.trim().length === 0;
    });
    const requiredChecks = Array.from(document.querySelectorAll('[data-plan-checklist] [data-readiness-policy="required"] [data-checklist-id]'));
    const missingChecks = requiredChecks.filter((input) => committedState.checklist[input.dataset.checklistId] !== true);
    const missing = missingQuestions.length + missingChecks.length;
    const blockers = committedState.unresolvedCommentIds.length;
    let pending = 0;
    let failed = 0;
    for (const operation of operationStates.values()) {
      if (operation.status === "pending") pending += 1;
      if (operation.status === "failed") failed += 1;
    }
    const approved = committedState.status === "approved";
    const ready = !approved && missing === 0 && blockers === 0 && pending === 0 && failed === 0;
    output.dataset.ready = String(ready);
    if (approved) {
      output.textContent = "Approved. Mark the plan for revision or change a saved value before approving again.";
    } else if (ready) {
      output.textContent = "Ready to approve: all " + (requiredQuestions.length + requiredChecks.length) + " required values are saved and no blocking comments remain.";
    } else {
      const reasons = [];
      if (missing) reasons.push(missing + " required value" + (missing === 1 ? "" : "s") + " missing");
      if (blockers) reasons.push(blockers + " unresolved blocking comment" + (blockers === 1 ? "" : "s"));
      if (pending) reasons.push(pending + " save" + (pending === 1 ? "" : "s") + " pending");
      if (failed) reasons.push(failed + " failed operation" + (failed === 1 ? "" : "s") + " awaiting retry");
      output.textContent = "Not ready: " + reasons.join("; ") + ".";
    }
    approve.disabled = document.body.dataset.reviewAuthority !== "ready" || !ready;
  };

  const syncControlAvailability = () => {
    const authoritative = document.body.dataset.reviewAuthority === "ready";
    document.querySelectorAll("[data-review-control]").forEach((control) => {
      const operation = operationStates.get(control.dataset.operationKey);
      control.disabled = !authoritative || operation?.status === "pending";
    });
    refreshApprovalReadiness();
  };

  const renderComments = (comments) => {
    const container = document.querySelector("[data-review-comments]");
    if (!container) return;
    container.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = "Review comments";
    container.append(heading);
    if (comments.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No review comments.";
      container.append(empty);
      return;
    }
    const list = document.createElement("ul");
    const template = document.querySelector("[data-persistence-template]");
    for (const comment of comments) {
      const item = document.createElement("li");
      const body = document.createElement("span");
      body.textContent = comment.body + " \u2014 " + (comment.status === "open" ? "Blocking" : "Resolved");
      item.append(body);
      if (comment.status === "open") {
        const key = "resolve:" + comment.id;
        const resolve = document.createElement("button");
        resolve.type = "button";
        resolve.dataset.resolveComment = comment.id;
        resolve.dataset.operationKey = key;
        resolve.dataset.reviewControl = "";
        resolve.textContent = "Resolve";
        item.append(" ", resolve);
        const feedback = template?.content.firstElementChild?.cloneNode(true);
        if (feedback instanceof HTMLElement) {
          feedback.dataset.persistenceKey = key;
          item.append(" ", feedback);
          renderFeedback(key, feedback);
        }
      }
      list.append(item);
    }
    container.append(list);
  };

  const formatSyncDetail = (state) => {
    const blockers = state.unresolvedCommentIds.length;
    return formatStatus(state.status) + " \xB7 " + blockers + " unresolved blocking comment" + (blockers === 1 ? "" : "s");
  };

  const applyServerTruth = (state, comments, handoff) => {
    const commentsChanged = comments !== committedComments;
    committedState = state;
    committedComments = comments;
    document.body.dataset.reviewStatus = state.status;
    document.querySelectorAll("[data-plan-questions] input[name]").forEach((input) => {
      const answer = state.answers[input.name];
      input.value = Array.isArray(answer) ? answer.join(", ") : answer || "";
    });
    document.querySelectorAll("[data-checklist-id]").forEach((input) => {
      input.checked = state.checklist[input.dataset.checklistId] === true;
    });
    const status = document.querySelector("[data-review-status-label]");
    if (status) status.textContent = formatStatus(state.status);
    const reviewer = document.querySelector("[data-review-reviewer]");
    if (reviewer) {
      reviewer.hidden = !state.reviewer;
      const value = reviewer.querySelector("strong");
      if (value) value.textContent = state.reviewer || "";
    }
    const approvedAt = document.querySelector("[data-review-approved-at]");
    if (approvedAt) {
      approvedAt.hidden = !state.approvedAt;
      const value = approvedAt.querySelector("strong");
      if (value) value.textContent = formatDate(state.approvedAt);
    }
    const syncDetail = document.querySelector("[data-review-sync-detail]");
    if (syncDetail) syncDetail.textContent = formatSyncDetail(state);
    if (commentsChanged) renderComments(comments);
    showApprovalReceipt(state, handoff);
    syncControlAvailability();
  };

  const fetchServerTruth = async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const [state, comments] = await Promise.all([
        getJson("/plan-state.json"),
        getJson("/comments.json"),
      ]);
      if (state.generation && state.generation === comments.generation) {
        return { state: state.value, comments: comments.value };
      }
    }
    throw new Error("Review state and comments changed while loading. Retry.");
  };

  const applyCoherentServerTruth = async () => {
    const truth = await fetchServerTruth();
    applyServerTruth(truth.state, truth.comments);
  };

  const updateSyncNotice = (state, title, detail, retry) => {
    document.body.dataset.reviewAuthority = state;
    const sync = document.querySelector("[data-review-sync]");
    if (sync) {
      const heading = sync.querySelector("[data-review-sync-title]");
      const description = sync.querySelector("[data-review-sync-detail]");
      const button = sync.querySelector("[data-review-retry]");
      if (heading) heading.textContent = title;
      if (description) description.textContent = detail;
      if (button) button.hidden = !retry;
    }
    syncControlAvailability();
  };

  const hydrateReviewState = async () => {
    if (hydrationPromise) return hydrationPromise;
    updateSyncNotice("loading", "Loading saved review\u2026", "Review controls unlock after server state and comments load.", false);
    hydrationPromise = (async () => {
      try {
        const truth = await fetchServerTruth();
        applyServerTruth(truth.state, truth.comments);
        operationStates.clear();
        document.querySelectorAll("[data-persistence-key]").forEach((feedback) => {
          renderFeedback(feedback.dataset.persistenceKey, feedback);
        });
        updateSyncNotice(
          "ready",
          "Review synced",
          formatSyncDetail(truth.state),
          false,
        );
      } catch (error) {
        updateSyncNotice("failed", "Review state unavailable", messageFor(error), true);
      }
    })().finally(() => {
      hydrationPromise = undefined;
    });
    return hydrationPromise;
  };

  const reconcileServerTruth = async () => {
    try {
      const truth = await fetchServerTruth();
      applyServerTruth(truth.state, truth.comments);
      return true;
    } catch {
      if (committedState) applyServerTruth(committedState, committedComments);
      return false;
    }
  };

  const runPersistenceOperation = (operation) => {
    if (operationStates.get(operation.key)?.status === "pending") return persistenceQueue;
    setFeedback(operation.key, "pending", "Saving\u2026", undefined);
    syncControlAvailability();
    const execution = persistenceQueue.then(async () => {
      try {
        const result = await operation.write();
        await operation.apply(result);
        setFeedback(operation.key, "saved", "Saved", undefined);
      } catch (error) {
        const reconciled = await reconcileServerTruth();
        if (reconciled && operation.matchesCommitted()) {
          setFeedback(operation.key, "saved", "Saved", undefined);
        } else {
          const retry = () => runPersistenceOperation(operation);
          setFeedback(operation.key, "failed", "Save failed; saved value restored. " + messageFor(error), retry);
        }
      } finally {
        syncControlAvailability();
      }
    });
    persistenceQueue = execution;
    return execution;
  };

  const ownedTabset = (tab) => {
    const tablist = tab.parentElement;
    const group = tablist?.parentElement;
    if (!tablist?.matches('[role="tablist"]') || !group?.matches(".ve-ip-tabs")) return null;
    const tabs = Array.from(tablist.children).filter((item) => item.matches('[role="tab"][data-tab-target]'));
    const panels = Array.from(group.children).filter((item) => item.matches('[role="tabpanel"]'));
    return tabs.includes(tab) ? { group, panels, tablist, tabs } : null;
  };
  const activateTab = (tab, moveFocus = false) => {
    const owner = ownedTabset(tab);
    const id = tab.getAttribute("data-tab-target");
    const matchingPanels = owner?.panels.filter((panel) => panel.id === id) || [];
    const matchingTabs = owner?.tabs.filter((button) => button.getAttribute("data-tab-target") === id) || [];
    if (!owner || !id || matchingPanels.length !== 1 || matchingTabs.length !== 1) return false;
    owner.panels.forEach((panel) => { panel.hidden = panel.id !== id; });
    owner.tabs.forEach((button) => {
      const active = button === tab;
      button.setAttribute("aria-selected", String(active));
      button.setAttribute("tabindex", active ? "0" : "-1");
    });
    if (moveFocus) tab.focus();
    return true;
  };
  const pointerFocus = new WeakMap();

  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const tab = target.closest('[role="tab"][data-tab-target]');
    if (tab && document.activeElement instanceof HTMLElement) {
      pointerFocus.set(tab, document.activeElement);
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (
      !(target instanceof HTMLElement)
      || !target.matches('[role="tab"][data-tab-target]')
      || event.altKey
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
    ) return;
    const owner = ownedTabset(target);
    if (!owner) return;
    const currentIndex = owner.tabs.indexOf(target);
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % owner.tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + owner.tabs.length) % owner.tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = owner.tabs.length - 1;
    if (nextIndex === undefined || !activateTab(owner.tabs[nextIndex], true)) return;
    event.preventDefault();
  });

  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const tab = target.closest('[role="tab"][data-tab-target]');
    if (tab) {
      const activated = activateTab(tab);
      const previousFocus = pointerFocus.get(tab);
      pointerFocus.delete(tab);
      if (!activated && previousFocus instanceof HTMLElement) previousFocus.focus();
    }

    const hydrationRetry = target.closest("[data-review-retry]");
    if (hydrationRetry) {
      await hydrateReviewState();
      return;
    }

    const persistenceRetry = target.closest("[data-persistence-retry]");
    if (persistenceRetry) {
      const feedback = persistenceRetry.closest("[data-persistence-key]");
      const retry = feedback && operationStates.get(feedback.dataset.persistenceKey)?.retry;
      if (retry) await retry();
      return;
    }

    const commentAnchor = target.closest("[data-comment-anchor]");
    if (commentAnchor) {
      const blockId = commentAnchor.getAttribute("data-comment-anchor");
      const body = prompt("Comment for this section:");
      if (blockId && body?.trim()) {
        const id = "c-" + crypto.randomUUID();
        const operation = {
          key: "comment:" + blockId,
          write: () => postJson("/api/comments", { id, blockId, anchor: blockId, body }, id),
          apply: async () => {
            const truth = await fetchServerTruth();
            applyServerTruth(truth.state, truth.comments);
          },
          matchesCommitted: () => committedComments.some((comment) => comment.id === id),
        };
        await runPersistenceOperation(operation);
      }
      return;
    }

    const resolve = target.closest("[data-resolve-comment]");
    if (resolve) {
      const id = resolve.dataset.resolveComment;
      const operation = {
        key: "resolve:" + id,
        write: () => postJson("/api/comments", { resolveId: id }),
        apply: async () => {
          const truth = await fetchServerTruth();
          applyServerTruth(truth.state, truth.comments);
        },
        matchesCommitted: () => committedComments.some((comment) => comment.id === id && comment.status === "resolved"),
      };
      await runPersistenceOperation(operation);
      return;
    }

    const revision = target.closest("[data-needs-revision]");
    if (revision) {
      const operation = {
        key: "revision",
        write: () => postJson("/api/state", { status: "needs_revision" }),
        apply: applyCoherentServerTruth,
        matchesCommitted: () => committedState?.status === "needs_revision",
      };
      await runPersistenceOperation(operation);
      return;
    }

    const approve = target.closest("[data-approve-plan]");
    if (approve) {
      const priorDigest = committedState?.approvalDigest;
      const operation = {
        key: "approval",
        write: () => postJson("/api/approve", { reviewer: "local-reviewer" }),
        apply: async (handoff) => {
          const truth = await fetchServerTruth();
          applyServerTruth(truth.state, truth.comments, handoff);
        },
        matchesCommitted: () => committedState?.status === "approved"
          && committedState.reviewer === "local-reviewer"
          && committedState.approvalDigest !== priorDigest,
      };
      await runPersistenceOperation(operation);
    }
  });

  document.addEventListener("change", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || document.body.dataset.reviewAuthority !== "ready") return;
    if (target.dataset.checklistId) {
      const id = target.dataset.checklistId;
      const checked = target.checked;
      const operation = {
        key: "checklist:" + id,
        write: () => postJson("/api/state", { checklist: { [id]: checked } }),
        apply: applyCoherentServerTruth,
        matchesCommitted: () => committedState?.checklist[id] === checked,
      };
      await runPersistenceOperation(operation);
      return;
    }
    if (target.name && target.closest("[data-plan-questions]")) {
      const id = target.name;
      const answer = target.value;
      const operation = {
        key: "answer:" + id,
        write: () => postJson("/api/state", { answers: { [id]: answer } }),
        apply: applyCoherentServerTruth,
        matchesCommitted: () => committedState?.answers[id] === answer,
      };
      await runPersistenceOperation(operation);
    }
  });

  hydrateReviewState();
})();`;var Rs=["PlanSummary","StatusDashboard","DecisionMatrix","ArchitectureDiagram","ImplementationTimeline","RiskRegister","FileMap","FileTree","AnnotatedCode","DiffTabs","ApiSurface","DataModel","Wireframe","BeforeAfter","StateGallery","ApprovalGate","QuestionForm","Checklist","CommentAnchor","Callout","Tabs","Table"],ai=Object.freeze({PlanSummary:{category:"Overview",summary:"Lead with scope, status, and the outcome narrative."},StatusDashboard:{category:"Overview",summary:"Show compact status indicators and review metrics."},DecisionMatrix:{category:"Planning",summary:"Compare decisions, rationale, and acceptance state."},ArchitectureDiagram:{category:"Diagram",summary:"Render Mermaid architecture with zoom and pan controls."},ImplementationTimeline:{category:"Planning",summary:"Present an ordered implementation or rollout sequence."},RiskRegister:{category:"Planning",summary:"Pair delivery risks with mitigations and severity."},FileMap:{category:"Evidence",summary:"List source files involved in the proposed change."},FileTree:{category:"Evidence",summary:"Show a compact project or generated-artifact hierarchy."},AnnotatedCode:{category:"Evidence",summary:"Display a focused code excerpt with file context."},DiffTabs:{category:"Evidence",summary:"Review file-specific changes in tabbed diff panels."},ApiSurface:{category:"Contracts",summary:"Document endpoints, methods, and responsibilities."},DataModel:{category:"Contracts",summary:"Describe fields, types, and persistence semantics."},Wireframe:{category:"Product UI",summary:"Embed a constrained HTML fragment for a proposed interface."},BeforeAfter:{category:"Product UI",summary:"Contrast the current state with the proposed outcome."},StateGallery:{category:"Product UI",summary:"Compare meaningful interface or workflow states."},ApprovalGate:{category:"Review",summary:"Capture approval or revision decisions at handoff."},QuestionForm:{category:"Review",summary:"Collect unresolved reviewer decisions through the local bridge."},Checklist:{category:"Review",summary:"Track explicit completion and verification criteria."},CommentAnchor:{category:"Review",summary:"Provide a stable target for contextual review comments."},Callout:{category:"Review",summary:"Highlight guidance, decisions, warnings, or risks."},Tabs:{category:"Evidence",summary:"Organize related reference content into compact panels."},Table:{category:"Contracts",summary:"Render general structured data with semantic table markup."}}),os=Object.freeze(Object.fromEntries(Rs.map((s)=>[s,!0]))),Ca=Object.freeze({ArchitectureDiagram:!0,FileMap:!0,FileTree:!0,AnnotatedCode:!0,DiffTabs:!0,ApiSurface:!0,DataModel:!0,Wireframe:!0,StateGallery:!0,Tabs:!0,Table:!0});function qs(s,i){let a="";for(let e=i;e<s.length;e+=1){let d=s[e];if(a){if(d===a&&s[e-1]!=="\\")a=""}else if(d==='"'||d==="'")a=d;else if(d===">")return e}return-1}var ii=(s)=>(i)=>ns(i.body).map((a,e)=>`${i.id}-${s}-${e}`),Oa={ArchitectureDiagram:{instructions:(s)=>[`${s.id}-instructions`],renderRoot:(s)=>[`ve-mermaid-${s.id}`]},DiffTabs:{tabs:ii("tab"),panels:ii("panel")},Tabs:{tabs:ii("tab"),panels:ii("panel")}};function _(s,i){if(i==="title")return[`${s.id}-title`];return Oa[s.type]?.[i]?.(s)??[]}function Ma(s){let i=Oa[s.type],a=i?Object.values(i).flatMap((e)=>e(s)):[];if(s.type!=="CommentAnchor")a.unshift(..._(s,"title"));return a}function k(s){return s.split(/\r?\n/).map((i)=>i.trim()).filter(Boolean)}function es(s){return s.split("|").map((i)=>i.trim())}function ns(s){return s.split(/^---\s*$/m).map((i)=>i.trim())}function q(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function zs(s){return q(s).replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/^# (.*)$/gm,"<h1>$1</h1>").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\n\n/g,"</p><p>")}function Li(s){return q(s.props.title??s.props.label??s.type)}function B(s,i,a){let e=q(_(s,"title")[0]);return`<section class="ve-ip-block ${i}" id="${q(s.id)}" data-block-id="${q(s.id)}" data-block-type="${q(s.type)}" aria-labelledby="${e}"><div class="ve-ip-label">${q(s.type)}</div><h2 id="${e}">${Li(s)}</h2><div class="ve-ip-body">${a??`<p>${zs(s.body)}</p>`}</div></section>`}function Me(s){let i=Object.entries(s.props).map(([e,d])=>{if(typeof d==="boolean")return d?e:`${e}={false}`;if(typeof d==="number")return`${e}={${d}}`;return`${e}=${JSON.stringify(d)}`}).join(" "),a=`<${s.type}${i?` ${i}`:""}`;return s.body?`${a}>
${s.body}
</${s.type}>`:`${a} />`}function Ne(s,i){let a=s.type,e=ai[a],d=Me(s),c=`${a} ${e.category} ${e.summary}`,f=`<div class="ve-ip-component-meta"><span>${q(e.category)}</span><p>${q(e.summary)}</p></div><details class="ve-ip-source"><summary>MDX source</summary><div class="ve-ip-source-toolbar"><button type="button" data-copy-mdx>Copy MDX</button></div><pre><code data-mdx-source>${q(d)}</code></pre></details>`,v=i.replace("<section ",`<section data-component-category="${q(e.category)}" data-component-search-text="${q(c)}" `),t=v.lastIndexOf("</section>");return t===-1?v:`${v.slice(0,t)}${f}${v.slice(t)}`}function Se(s){let i=q(s.props.status??"Draft");return B(s,"ve-ip-hero",`<div class="ve-ip-summary"><p>${zs(s.body)}</p><span class="ve-ip-pill">${i}</span></div>`)}function $e(s){let i=k(s.body).map((a)=>{let[e=a,d="",c=""]=es(a);return`<tr><td>${q(e)}</td><td>${q(d)}</td><td><span class="ve-ip-pill">${q(c)}</span></td></tr>`}).join("");return B(s,"ve-ip-card",`<table><thead><tr><th>Decision</th><th>Rationale</th><th>Status</th></tr></thead><tbody>${i}</tbody></table>`)}function Ee(s){let i=q(_(s,"instructions")[0]),a=q(_(s,"renderRoot")[0]);return B(s,"ve-ip-card ve-ip-diagram",`<div class="diagram-shell"><div class="diagram-shell__hint" id="${i}">Use arrow keys to pan. Hold Ctrl or Command while scrolling to zoom, drag to pan, or expand for full size.</div><div class="mermaid-wrap" data-diagram-id="${q(s.id)}" data-mermaid-render-id="${a}"><div class="zoom-controls"><button type="button" data-zoom="out" aria-label="Zoom out">\u2212</button><button type="button" data-zoom="reset" aria-label="Reset zoom and position">100%</button><button type="button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-expand aria-label="Expand diagram">\u26F6</button></div><div class="mermaid-viewport" tabindex="0" role="region" aria-label="${Li(s)} interactive diagram" aria-describedby="${i}"><pre class="mermaid-source">${q(s.body)}</pre><div class="mermaid-canvas" aria-label="${Li(s)} diagram"></div></div></div></div>`)}function Ie(s){let i=k(s.body).map((a,e)=>`<li><span>${e+1}</span><p>${zs(a)}</p></li>`).join("");return B(s,"ve-ip-card",`<ol class="ve-ip-timeline">${i}</ol>`)}function De(s){let i=k(s.body).map((a)=>{let[e=a,d="",c="medium"]=es(a);return`<tr><td>${q(e)}</td><td>${q(d)}</td><td><span class="ve-ip-pill ve-ip-pill--${q(c.toLowerCase())}">${q(c)}</span></td></tr>`}).join("");return B(s,"ve-ip-card",`<table><thead><tr><th>Risk</th><th>Mitigation</th><th>Severity</th></tr></thead><tbody>${i}</tbody></table>`)}function Na(s){let i=k(s.body).map((a)=>`<li><code>${q(a)}</code></li>`).join("");return B(s,"ve-ip-card",`<ul class="ve-ip-file-tree">${i}</ul>`)}function ke(s){return B(s,"ve-ip-code-card",`<div class="code-file"><div class="code-file__header">${q(s.props.file??s.props.title??"code")}</div><pre class="code-block code-block--scroll"><code>${q(s.body)}</code></pre></div>`)}function Sa(s,i){let a=ns(s.body),e=_(s,"panels"),d=_(s,"tabs"),c=a.map((g,y)=>{let x=g.match(/^[^\r\n]*/)?.[0]??"",o=`${s.type==="DiffTabs"?"Diff":"Panel"} ${y+1}`;return{chunk:g,label:x.replace(/^file:\s*/,"")||o,panelId:e[y],tabId:d[y]}});if(i.staticMode){let g=c.map(({chunk:y,label:x})=>`<section class="ve-ip-static-tab-panel"><h3>${q(x)}</h3><pre class="code-block code-block--scroll"><code>${q(y)}</code></pre></section>`).join("");return B(s,"ve-ip-card",`<div class="ve-ip-tabs ve-ip-tabs--static">${g}</div>`)}let f=c.map(({label:g,panelId:y,tabId:x},o)=>`<button type="button" role="tab" id="${q(x)}" aria-controls="${q(y)}" aria-selected="${o===0}" tabindex="${o===0?0:-1}" data-tab-target="${q(y)}">${q(g)}</button>`).join(""),v=c.map(({chunk:g,panelId:y,tabId:x},o)=>`<div role="tabpanel" id="${q(y)}" aria-labelledby="${q(x)}" tabindex="0"${o===0?"":" hidden"}><pre class="code-block code-block--scroll"><code>${q(g)}</code></pre></div>`).join(""),t=`${String(s.props.label??s.props.title??s.type)} tabs (${s.id})`;return B(s,"ve-ip-card",`<div class="ve-ip-tabs"><div class="ve-ip-tab-list" role="tablist" aria-label="${q(t)}">${f}</div>${v}</div>`)}function Ea(s){let i=s==="required"?"required":"advisory";return{value:i,html:`<span class="ve-ip-readiness-policy ve-ip-readiness-policy--${i}">${i==="required"?"Required":"Advisory"}</span>`}}function Ws(s){return`<span class="ve-ip-persistence" data-persistence-key="${q(s)}" data-persistence-state="loading" aria-live="polite"><span data-persistence-message>Loading\u2026</span><button type="button" data-persistence-retry hidden>Retry</button></span>`}function Ls(s,i){return s.staticMode?"disabled":`data-operation-key="${q(i)}" data-review-control disabled`}function Ge(s,i){let a=k(s.body).map((e)=>{let[d=e,c=e,f="freeform",v]=es(e),t=Ea(v),g=i.staticMode?"":Ws(`answer:${d}`);return`<div class="ve-ip-field"><label class="ve-ip-question" data-question-id="${q(d)}" data-readiness-policy="${t.value}"><span class="ve-ip-field-heading"><span>${q(c)}</span>${t.html}</span><input name="${q(d)}" data-question-mode="${q(f)}" ${Ls(i,`answer:${d}`)} /></label>${g}</div>`}).join("");return B(s,"ve-ip-card ve-ip-interactive",`<p class="ve-ip-readiness-copy">Required values gate approval; advisory values are saved but never block it.</p><form data-plan-questions>${a}</form>`)}function pe(s,i){let a=k(s.body).map((e,d)=>{let[c=`item-${d+1}`,f=e,v]=es(e),t=Ea(v),g=i.staticMode?"":Ws(`checklist:${c}`);return`<div class="ve-ip-check-row"><label class="ve-ip-check" data-readiness-policy="${t.value}"><input type="checkbox" data-checklist-id="${q(c)}" ${Ls(i,`checklist:${c}`)} /> <span>${q(f)}</span>${t.html}</label>${g}</div>`}).join("");return B(s,"ve-ip-card ve-ip-interactive",`<p class="ve-ip-readiness-copy">Required values gate approval; advisory values are saved but never block it.</p><div data-plan-checklist>${a}</div>`)}function _e(s,i){let a=i.staticMode?'<p class="ve-ip-muted">Static export: copy this page with the generated handoff packet. Agent-readable approval persistence requires the local bridge.</p>':"",e=i.staticMode?"":'<div class="ve-ip-review-metadata" data-review-metadata><span>Status <strong data-review-status-label>Loading\u2026</strong></span><span data-review-reviewer hidden>Reviewer <strong></strong></span><span data-review-approved-at hidden>Approved <strong></strong></span></div><p class="ve-ip-approval-readiness" data-approval-readiness>Loading approval readiness\u2026</p><div class="ve-ip-review-comments" data-review-comments><h3>Review comments</h3><p>Loading comments\u2026</p></div>',d=i.staticMode?"":`${Ws("approval")}${Ws("revision")}<template data-persistence-template>${Ws("")}</template>`,c=i.staticMode?"":'<section class="ve-ip-approval-receipt" data-approval-receipt hidden><h3>Approval recorded</h3><p data-approval-receipt-summary></p><p>Generated artifacts:</p><ul><li><a href="/agent-handoff.json">agent-handoff.json</a></li><li><a href="/agent-handoff.md">agent-handoff.md</a></li></ul><details data-approval-technical><summary>Technical details</summary><pre data-approval-technical-json></pre></details></section>';return B(s,"ve-ip-card ve-ip-approval",`<p>${zs(s.body||"Approve this plan once the scope and open questions are settled.")}</p>${e}<div class="ve-ip-actions"><button type="button" data-approve-plan ${Ls(i,"approval")}>Approve plan</button><button type="button" data-needs-revision ${Ls(i,"revision")}>Needs revision</button></div>${d}${a}${c}`)}function $a(s){return B(s,"ve-ip-card",`<div class="ve-ip-wireframe" data-surface="${q(s.props.surface??"browser")}">${s.body}</div>`)}function Ae(s){let[i="",a=""]=s.body.split(/^---\s*$/m);return B(s,"ve-ip-card",`<div class="ve-ip-before-after"><div><h3>Before</h3><p>${zs(i.trim())}</p></div><div><h3>After</h3><p>${zs((a??"").trim())}</p></div></div>`)}function Te(s){let i=k(s.body).map((a)=>{let[e=a,d="",c=""]=es(a);return`<div class="ve-ip-kpi"><strong>${q(d)}</strong><span>${q(e)}</span><small>${q(c)}</small></div>`}).join("");return B(s,"ve-ip-card",`<div class="ve-ip-dashboard">${i}</div>`)}function ni(s){let i=k(s.body).map(es),a=i.shift();if(!a)return B(s,"ve-ip-card","<table><tbody></tbody></table>");i.forEach((c,f)=>{if(c.length!==a.length)throw Error(`${s.type} '${s.id}' row ${f+2} has ${c.length} columns; expected ${a.length}`)});let e=`<thead><tr>${a.map((c)=>`<th scope="col">${q(c)}</th>`).join("")}</tr></thead>`,d=i.map((c)=>`<tr>${c.map((f)=>`<td>${q(f)}</td>`).join("")}</tr>`).join("");return B(s,"ve-ip-card",`<table>${e}<tbody>${d}</tbody></table>`)}var sd={PlanSummary:Se,StatusDashboard:Te,DecisionMatrix:$e,ArchitectureDiagram:Ee,ImplementationTimeline:Ie,RiskRegister:De,FileMap:Na,FileTree:Na,AnnotatedCode:ke,DiffTabs:Sa,ApiSurface:ni,DataModel:ni,Wireframe:$a,BeforeAfter:Ae,StateGallery:$a,ApprovalGate:_e,QuestionForm:Ge,Checklist:pe,CommentAnchor:(s,i)=>i.componentExplorer?B(s,"ve-ip-card",`<p class="ve-ip-muted">Invisible in generated plans; visible here so humans can inspect and copy its MDX contract.</p><span class="ve-ip-comment-anchor" data-comment-anchor="${q(s.id)}"></span>`):i.staticMode?`<button type="button" id="${q(s.id)}" class="ve-ip-comment-anchor" data-comment-anchor="${q(s.id)}" disabled>Add comment</button>`:`<span class="ve-ip-comment-control"><button type="button" id="${q(s.id)}" class="ve-ip-comment-anchor" data-comment-anchor="${q(s.id)}" ${Ls(i,`comment:${s.id}`)}>Add comment</button>${Ws(`comment:${s.id}`)}</span>`,Callout:(s)=>B(s,`ve-ip-callout ve-ip-callout--${q(s.props.tone??"note")}`),Tabs:Sa,Table:ni};function id(s,i){let a=sd[s.type];if(!a)throw Error(`No renderer registered for ${s.type}`);let e=a(s,i);return i.componentExplorer?Ne(s,e):e}function Bi(s,i){return s.map((a)=>id(a,i)).join(`
`)}import{readFile as Gr}from"fs/promises";import{basename as $r,isAbsolute as Er,join as sa,relative as ju,resolve as Ir}from"path";var ad=new Set([65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111]),Y="\uFFFD",u;(function(s){s[s.EOF=-1]="EOF",s[s.NULL=0]="NULL",s[s.TABULATION=9]="TABULATION",s[s.CARRIAGE_RETURN=13]="CARRIAGE_RETURN",s[s.LINE_FEED=10]="LINE_FEED",s[s.FORM_FEED=12]="FORM_FEED",s[s.SPACE=32]="SPACE",s[s.EXCLAMATION_MARK=33]="EXCLAMATION_MARK",s[s.QUOTATION_MARK=34]="QUOTATION_MARK",s[s.AMPERSAND=38]="AMPERSAND",s[s.APOSTROPHE=39]="APOSTROPHE",s[s.HYPHEN_MINUS=45]="HYPHEN_MINUS",s[s.SOLIDUS=47]="SOLIDUS",s[s.DIGIT_0=48]="DIGIT_0",s[s.DIGIT_9=57]="DIGIT_9",s[s.SEMICOLON=59]="SEMICOLON",s[s.LESS_THAN_SIGN=60]="LESS_THAN_SIGN",s[s.EQUALS_SIGN=61]="EQUALS_SIGN",s[s.GREATER_THAN_SIGN=62]="GREATER_THAN_SIGN",s[s.QUESTION_MARK=63]="QUESTION_MARK",s[s.LATIN_CAPITAL_A=65]="LATIN_CAPITAL_A",s[s.LATIN_CAPITAL_Z=90]="LATIN_CAPITAL_Z",s[s.RIGHT_SQUARE_BRACKET=93]="RIGHT_SQUARE_BRACKET",s[s.GRAVE_ACCENT=96]="GRAVE_ACCENT",s[s.LATIN_SMALL_A=97]="LATIN_SMALL_A",s[s.LATIN_SMALL_Z=122]="LATIN_SMALL_Z"})(u||(u={}));var $={DASH_DASH:"--",CDATA_START:"[CDATA[",DOCTYPE:"doctype",SCRIPT:"script",PUBLIC:"public",SYSTEM:"system"};function ri(s){return s>=55296&&s<=57343}function Ia(s){return s>=56320&&s<=57343}function Da(s,i){return(s-55296)*1024+9216+i}function ei(s){return s!==32&&s!==10&&s!==13&&s!==9&&s!==12&&s>=1&&s<=31||s>=127&&s<=159}function di(s){return s>=64976&&s<=65007||ad.has(s)}var w;(function(s){s.controlCharacterInInputStream="control-character-in-input-stream",s.noncharacterInInputStream="noncharacter-in-input-stream",s.surrogateInInputStream="surrogate-in-input-stream",s.nonVoidHtmlElementStartTagWithTrailingSolidus="non-void-html-element-start-tag-with-trailing-solidus",s.endTagWithAttributes="end-tag-with-attributes",s.endTagWithTrailingSolidus="end-tag-with-trailing-solidus",s.unexpectedSolidusInTag="unexpected-solidus-in-tag",s.unexpectedNullCharacter="unexpected-null-character",s.unexpectedQuestionMarkInsteadOfTagName="unexpected-question-mark-instead-of-tag-name",s.invalidFirstCharacterOfTagName="invalid-first-character-of-tag-name",s.unexpectedEqualsSignBeforeAttributeName="unexpected-equals-sign-before-attribute-name",s.missingEndTagName="missing-end-tag-name",s.unexpectedCharacterInAttributeName="unexpected-character-in-attribute-name",s.unknownNamedCharacterReference="unknown-named-character-reference",s.missingSemicolonAfterCharacterReference="missing-semicolon-after-character-reference",s.unexpectedCharacterAfterDoctypeSystemIdentifier="unexpected-character-after-doctype-system-identifier",s.unexpectedCharacterInUnquotedAttributeValue="unexpected-character-in-unquoted-attribute-value",s.eofBeforeTagName="eof-before-tag-name",s.eofInTag="eof-in-tag",s.missingAttributeValue="missing-attribute-value",s.missingWhitespaceBetweenAttributes="missing-whitespace-between-attributes",s.missingWhitespaceAfterDoctypePublicKeyword="missing-whitespace-after-doctype-public-keyword",s.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers="missing-whitespace-between-doctype-public-and-system-identifiers",s.missingWhitespaceAfterDoctypeSystemKeyword="missing-whitespace-after-doctype-system-keyword",s.missingQuoteBeforeDoctypePublicIdentifier="missing-quote-before-doctype-public-identifier",s.missingQuoteBeforeDoctypeSystemIdentifier="missing-quote-before-doctype-system-identifier",s.missingDoctypePublicIdentifier="missing-doctype-public-identifier",s.missingDoctypeSystemIdentifier="missing-doctype-system-identifier",s.abruptDoctypePublicIdentifier="abrupt-doctype-public-identifier",s.abruptDoctypeSystemIdentifier="abrupt-doctype-system-identifier",s.cdataInHtmlContent="cdata-in-html-content",s.incorrectlyOpenedComment="incorrectly-opened-comment",s.eofInScriptHtmlCommentLikeText="eof-in-script-html-comment-like-text",s.eofInDoctype="eof-in-doctype",s.nestedComment="nested-comment",s.abruptClosingOfEmptyComment="abrupt-closing-of-empty-comment",s.eofInComment="eof-in-comment",s.incorrectlyClosedComment="incorrectly-closed-comment",s.eofInCdata="eof-in-cdata",s.absenceOfDigitsInNumericCharacterReference="absence-of-digits-in-numeric-character-reference",s.nullCharacterReference="null-character-reference",s.surrogateCharacterReference="surrogate-character-reference",s.characterReferenceOutsideUnicodeRange="character-reference-outside-unicode-range",s.controlCharacterReference="control-character-reference",s.noncharacterCharacterReference="noncharacter-character-reference",s.missingWhitespaceBeforeDoctypeName="missing-whitespace-before-doctype-name",s.missingDoctypeName="missing-doctype-name",s.invalidCharacterSequenceAfterDoctypeName="invalid-character-sequence-after-doctype-name",s.duplicateAttribute="duplicate-attribute",s.nonConformingDoctype="non-conforming-doctype",s.missingDoctype="missing-doctype",s.misplacedDoctype="misplaced-doctype",s.endTagWithoutMatchingOpenElement="end-tag-without-matching-open-element",s.closingOfElementWithOpenChildElements="closing-of-element-with-open-child-elements",s.disallowedContentInNoscriptInHead="disallowed-content-in-noscript-in-head",s.openElementsLeftAfterEof="open-elements-left-after-eof",s.abandonedHeadElementChild="abandoned-head-element-child",s.misplacedStartTagForHeadElement="misplaced-start-tag-for-head-element",s.nestedNoscriptInHead="nested-noscript-in-head",s.eofInElementThatCanContainOnlyText="eof-in-element-that-can-contain-only-text"})(w||(w={}));var ed=65536;class Pi{constructor(s){this.handler=s,this.html="",this.pos=-1,this.lastGapPos=-2,this.gapStack=[],this.skipNextNewLine=!1,this.lastChunkWritten=!1,this.endOfChunkHit=!1,this.bufferWaterline=ed,this.isEol=!1,this.lineStartPos=0,this.droppedBufferSize=0,this.line=1,this.lastErrOffset=-1}get col(){return this.pos-this.lineStartPos+Number(this.lastGapPos!==this.pos)}get offset(){return this.droppedBufferSize+this.pos}getError(s,i){let{line:a,col:e,offset:d}=this,c=e+i,f=d+i;return{code:s,startLine:a,endLine:a,startCol:c,endCol:c,startOffset:f,endOffset:f}}_err(s){if(this.handler.onParseError&&this.lastErrOffset!==this.offset)this.lastErrOffset=this.offset,this.handler.onParseError(this.getError(s,0))}_addGap(){this.gapStack.push(this.lastGapPos),this.lastGapPos=this.pos}_processSurrogate(s){if(this.pos!==this.html.length-1){let i=this.html.charCodeAt(this.pos+1);if(Ia(i))return this.pos++,this._addGap(),Da(s,i)}else if(!this.lastChunkWritten)return this.endOfChunkHit=!0,u.EOF;return this._err(w.surrogateInInputStream),s}willDropParsedChunk(){return this.pos>this.bufferWaterline}dropParsedChunk(){if(this.willDropParsedChunk())this.html=this.html.substring(this.pos),this.lineStartPos-=this.pos,this.droppedBufferSize+=this.pos,this.pos=0,this.lastGapPos=-2,this.gapStack.length=0}write(s,i){if(this.html.length>0)this.html+=s;else this.html=s;this.endOfChunkHit=!1,this.lastChunkWritten=i}insertHtmlAtCurrentPos(s){this.html=this.html.substring(0,this.pos+1)+s+this.html.substring(this.pos+1),this.endOfChunkHit=!1}startsWith(s,i){if(this.pos+s.length>this.html.length)return this.endOfChunkHit=!this.lastChunkWritten,!1;if(i)return this.html.startsWith(s,this.pos);for(let a=0;a<s.length;a++)if((this.html.charCodeAt(this.pos+a)|32)!==s.charCodeAt(a))return!1;return!0}peek(s){let i=this.pos+s;if(i>=this.html.length)return this.endOfChunkHit=!this.lastChunkWritten,u.EOF;let a=this.html.charCodeAt(i);return a===u.CARRIAGE_RETURN?u.LINE_FEED:a}advance(){if(this.pos++,this.isEol)this.isEol=!1,this.line++,this.lineStartPos=this.pos;if(this.pos>=this.html.length)return this.endOfChunkHit=!this.lastChunkWritten,u.EOF;let s=this.html.charCodeAt(this.pos);if(s===u.CARRIAGE_RETURN)return this.isEol=!0,this.skipNextNewLine=!0,u.LINE_FEED;if(s===u.LINE_FEED){if(this.isEol=!0,this.skipNextNewLine)return this.line--,this.skipNextNewLine=!1,this._addGap(),this.advance()}if(this.skipNextNewLine=!1,ri(s))s=this._processSurrogate(s);if(!(this.handler.onParseError===null||s>31&&s<127||s===u.LINE_FEED||s===u.CARRIAGE_RETURN||s>159&&s<64976))this._checkForProblematicCharacters(s);return s}_checkForProblematicCharacters(s){if(ei(s))this._err(w.controlCharacterInInputStream);else if(di(s))this._err(w.noncharacterInInputStream)}retreat(s){this.pos-=s;while(this.pos<this.lastGapPos)this.lastGapPos=this.gapStack.pop(),this.pos--;this.isEol=!1}}var X;(function(s){s[s.CHARACTER=0]="CHARACTER",s[s.NULL_CHARACTER=1]="NULL_CHARACTER",s[s.WHITESPACE_CHARACTER=2]="WHITESPACE_CHARACTER",s[s.START_TAG=3]="START_TAG",s[s.END_TAG=4]="END_TAG",s[s.COMMENT=5]="COMMENT",s[s.DOCTYPE=6]="DOCTYPE",s[s.EOF=7]="EOF",s[s.HIBERNATION=8]="HIBERNATION"})(X||(X={}));function ci(s,i){for(let a=s.attrs.length-1;a>=0;a--)if(s.attrs[a].name===i)return s.attrs[a].value;return null}var cd=new Map([[0,65533],[128,8364],[130,8218],[131,402],[132,8222],[133,8230],[134,8224],[135,8225],[136,710],[137,8240],[138,352],[139,8249],[140,338],[142,381],[145,8216],[146,8217],[147,8220],[148,8221],[149,8226],[150,8211],[151,8212],[152,732],[153,8482],[154,353],[155,8250],[156,339],[158,382],[159,376]]);function ka(s){if(s>=55296&&s<=57343||s>1114111)return 65533;return cd.get(s)??s}function Ga(s){let i=atob(s),a=i.length&-2,e=new Uint16Array(a/2);for(let d=0,c=0;d<a;d+=2){let f=i.charCodeAt(d),v=i.charCodeAt(d+1);e[c++]=f|v<<8}return e}var Ci=Ga("QR08ALkAAgH6AYsDNQR2BO0EPgXZBQEGLAbdBxMISQrvCmQLfQurDKQNLw4fD4YPpA+6D/IPAAAAAAAAAAAAAAAAKhBMEY8TmxUWF2EYLBkxGuAa3RsJHDscWR8YIC8jSCSIJcMl6ie3Ku8rEC0CLjoupS7kLgAIRU1hYmNmZ2xtbm9wcnN0dVQAWgBeAGUAaQBzAHcAfgCBAIQAhwCSAJoAoACsALMAbABpAGcAO4DGAMZAUAA7gCYAJkBjAHUAdABlADuAwQDBQHIiZXZlAAJhAAFpeW0AcgByAGMAO4DCAMJAEGRyAADgNdgE3XIAYQB2AGUAO4DAAMBA8CFoYZFj4SFjcgBhZAAAoFMqAAFncIsAjgBvAG4ABGFmAADgNdg43fAlbHlGdW5jdGlvbgCgYSBpAG4AZwA7gMUAxUAAAWNzpACoAHIAAOA12Jzc6SFnbgCgVCJpAGwAZABlADuAwwDDQG0AbAA7gMQAxEAABGFjZWZvcnN1xQDYANoA7QDxAPYA+QD8AAABY3LJAM8AayNzbGFzaAAAoBYidgHTANUAAKDnKmUAZAAAoAYjeQARZIABY3J0AOAA5QDrAGEidXNlAACgNSLuI291bGxpcwCgLCFhAJJjcgAA4DXYBd1wAGYAAOA12Dnd5SF2ZdhiYwDyAOoAbSJwZXEAAKBOIgAHSE9hY2RlZmhpbG9yc3UXARoBHwE6AVIBVQFiAWQBZgGCAakB6QHtAfIBYwB5ACdkUABZADuAqQCpQIABY3B5ACUBKAE1AfUhdGUGYWmg0iJ0KGFsRGlmZmVyZW50aWFsRAAAoEUhbCJleXMAAKAtIQACYWVpb0EBRAFKAU0B8iFvbgxhZABpAGwAO4DHAMdAcgBjAAhhbiJpbnQAAKAwIm8AdAAKYQABZG5ZAV0BaSJsbGEAuGB0I2VyRG90ALdg8gA5AWkAp2NyImNsZQAAAkRNUFRwAXQBeQF9AW8AdAAAoJkiaSJudXMAAKCWIuwhdXMAoJUiaSJtZXMAAKCXIm8AAAFjc4cBlAFrKndpc2VDb250b3VySW50ZWdyYWwAAKAyImUjQ3VybHkAAAFEUZwBpAFvJXVibGVRdW90ZQAAoB0gdSJvdGUAAKAZIAACbG5wdbABtgHNAdgBbwBuAGWgNyIAoHQqgAFnaXQAvAHBAcUB8iJ1ZW50AKBhIm4AdAAAoC8i7yV1ckludGVncmFsAKAuIgABZnLRAdMBAKACIe8iZHVjdACgECJuLnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbAAAoDMi7yFzcwCgLypjAHIAAOA12J7ccABDoNMiYQBwAACgTSKABURKU1phY2VmaW9zAAsCEgIVAhgCGwIsAjQCOQI9AnMCfwNvoEUh9CJyYWhkAKARKWMAeQACZGMAeQAFZGMAeQAPZIABZ3JzACECJQIoAuchZXIAoCEgcgAAoKEhaAB2AACg5CoAAWF5MAIzAvIhb24OYRRkbAB0oAciYQCUY3IAAOA12AfdAAFhZkECawIAAWNtRQJnAvIjaXRpY2FsAAJBREdUUAJUAl8CYwJjInV0ZQC0YG8AdAFZAloC2WJiJGxlQWN1dGUA3WJyImF2ZQBgYGkibGRlANxi7yFuZACgxCJmJWVyZW50aWFsRAAAoEYhcAR9AgAAAAAAAIECjgIAABoDZgAA4DXYO91EoagAhQKJAm8AdAAAoNwgcSJ1YWwAAKBQIuIhbGUAA0NETFJVVpkCqAK1Au8C/wIRA28AbgB0AG8AdQByAEkAbgB0AGUAZwByAGEA7ADEAW8AdAKvAgAAAACwAqhgbiNBcnJvdwAAoNMhAAFlb7kC0AJmAHQAgAFBUlQAwQLGAs0CciJyb3cAAKDQIekkZ2h0QXJyb3cAoNQhZQDlACsCbgBnAAABTFLWAugC5SFmdAABQVLcAuECciJyb3cAAKD4J+kkZ2h0QXJyb3cAoPon6SRnaHRBcnJvdwCg+SdpImdodAAAAUFU9gL7AnIicm93AACg0iFlAGUAAKCoInAAQQIGAwAAAAALA3Iicm93AACg0SFvJHduQXJyb3cAAKDVIWUlcnRpY2FsQmFyAACgJSJuAAADQUJMUlRhJAM2AzoDWgNxA3oDciJyb3cAAKGTIUJVLAMwA2EAcgAAoBMpcCNBcnJvdwAAoPUhciJldmUAEWPlIWZ00gJDAwAASwMAAFIDaSVnaHRWZWN0b3IAAKBQKWUkZVZlY3RvcgAAoF4p5SJjdG9yQqC9IWEAcgAAoFYpaSJnaHQA1AFiAwAAaQNlJGVWZWN0b3IAAKBfKeUiY3RvckKgwSFhAHIAAKBXKWUAZQBBoKQiciJyb3cAAKCnIXIAcgBvAPcAtAIAAWN0gwOHA3IA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YwAAoN8i4SFycnCgtiEAoD0pgKIqImJjZG9zACsVMBU6FT4VQRVyImNhcAAAoEgqAAFhdTQVNxVwAACgRipwAACgSipvAHQAAKCNInIAAKBFKgDgKiIA/gACYWxydksVURVuFXMVcgByAG2gtyEAoDwpeQCAAWV2dwBYFWUVaRVxAHACXxUAAAAAYxVyAGUA4wAXFXUA4wAZFWUAZQAAoM4iZSJkZ2UAAKDPImUAbgA7gKQApEBlI2Fycm93AAABbHJ7FX8V5SFmdACgtiFpImdodAAAoLchZQDkAG0VAAFjaYsVkRVvAG4AaQBuAPQAkwFuAHQAAKAxImwiY3R5AACgLSOACUFIYWJjZGVmaGlqbG9yc3R1d3oAuBW7Fb8V1RXgFegV+RUKFhUWHxZUFlcWZRbFFtsW7xb7FgUXChdyAPIAtAJhAHIAAKBlKQACZ2xyc8YVyhXOFdAV5yFlcgCgICDlIXRoAKA4IfIA9QxoAHagECAAoKMiawHZFd4VYSJyb3cAAKAPKWEA4wBfAgABYXnkFecV8iFvbg9hNGQAoUYhYW/tFfQVAAFnciEC8RVyAACgyiF0InNlcQAAoHcqgAFnbG0A/xUCFgUWO4CwALBAdABhALRjcCJ0eXYAAKCxKQABaXIOFhIW8yFodACgfykA4DXYId1hAHIAAAFschsWHRYAoMMhAKDCIYACYWVnc3YAKBauAjYWOhY+Fm0AAKHEIm9zLhY0Fm4AZABzoMQi9SFpdACgZiZhIm1tYQDdY2kAbgAAoPIiAKH3AGlvQxZRFmQAZQAAgfcAO29KFksW90BuI3RpbWVzAACgxyJuAPgAUBZjAHkAUmRjAG8CXhYAAAAAYhZyAG4AAKAeI28AcAAAoA0jgAJscHR1dwBuFnEWdRaSFp4W7CFhciRgZgAA4DXYVd0AotkCZW1wc30WhBaJFo0WcQBkoFAibwB0AACgUSJpIm51cwAAoDgi7CF1cwCgFCLxInVhcmUAoKEiYgBsAGUAYgBhAHIAdwBlAGQAZwDlANcAbgCAAWFkaAClFqoWtBZyAHIAbwD3APUMbwB3AG4AYQByAHIAbwB3APMA8xVhI3Jwb29uAAABbHK8FsAWZQBmAPQAHBZpAGcAaAD0AB4WYgHJFs8WawBhAHIAbwD3AJILbwLUFgAAAADYFnIAbgAAoB8jbwBwAACgDCOAAWNvdADhFukW7BYAAXJ55RboFgDgNdi53FVkbAAAoPYp8iFvaxFhAAFkcvMW9xZvAHQAAKDxImkA5qC/JVsSAAFhaP8WAhdyAPIANQNhAPIA1wvhIm5nbGUAoKYpAAFjaQ4XEBd5AF9k5yJyYXJyAKD/JwAJRGFjZGVmZ2xtbm9wcXJzdHV4MRc4F0YXWxcyBF4XaRd5F40XrBe0F78X2RcVGCEYLRg1GEAYAAFEbzUXgRZvAPQA+BUAAWNzPBdCF3UAdABlADuA6QDpQPQhZXIAoG4qAAJhaW95TRdQF1YXWhfyIW9uG2FyAGOgViI7gOoA6kDsIW9uAKBVIk1kbwB0ABdhAAFEcmIXZhdvAHQAAKBSIgDgNdgi3XKhmipuF3QXYQB2AGUAO4DoAOhAZKCWKm8AdAAAoJgqgKGZKmlscwCAF4UXhxfuInRlcnMAoOcjAKATIWSglSpvAHQAAKCXKoABYXBzAJMXlheiF2MAcgATYXQAeQBzogUinxcAAAAAoRdlAHQAAKAFInAAMaADIDMBqRerFwCgBCAAoAUgAAFnc7AXsRdLYXAAAKACIAABZ3C4F7sXbwBuABlhZgAA4DXYVt2AAWFscwDFF8sXzxdyAHOg1SJsAACg4yl1AHMAAKBxKmkAAKG1A2x21RfYF28AbgC1Y/VjAAJjc3V24BfoF/0XEBgAAWlv5BdWF3IAYwAAoFYiaQLuFwAAAADwF+0ADQThIW50AAFnbPUX+Rd0AHIAAKCWKuUhc3MAoJUqgAFhZWkAAxgGGAoYbABzAD1gcwB0AACgXyJ2AESgYSJEAACgeCrwImFyc2wAoOUpAAFEYRkYHRhvAHQAAKBTInIAcgAAoHEpgAFjZGkAJxgqGO0XcgAAoC8hbwD0AIwCAAFhaDEYMhi3YzuA8ADwQAABbXI5GD0YbAA7gOsA60BvAACgrCCAAWNpcABGGEgYSxhsACFgcwD0ACwEAAFlb08YVxhjAHQAYQB0AGkAbwDuABoEbgBlAG4AdABpAGEAbADlADME4Ql1GAAAgRgAAIMYiBgAAAAAoRilGAAAqhgAALsYvhjRGAAA1xgnGWwAbABpAG4AZwBkAG8AdABzAGUA8QBlF3kARGRtImFsZQAAoEAmgAFpbHIAjRiRGJ0Y7CFpZwCgA/tpApcYAAAAAJoYZwAAoAD7aQBnAACgBPsA4DXYI93sIWlnAKAB++whaWcA4GYAagCAAWFsdACvGLIYthh0AACgbSZpAGcAAKAC+24AcwAAoLElbwBmAJJh8AHCGAAAxhhmAADgNdhX3QABYWvJGMwYbADsAGsEdqDUIgCg2SphI3J0aW50AACgDSoAAWFv2hgiGQABY3PeGB8ZsQPnGP0YBRkSGRUZAAAdGbID7xjyGPQY9xj5GAAA+xg7gL0AvUAAoFMhO4C8ALxAAKBVIQCgWSEAoFshswEBGQAAAxkAoFQhAKBWIbQCCxkOGQAAAAAQGTuAvgC+QACgVyEAoFwhNQAAoFghtgEZGQAAGxkAoFohAKBdITgAAKBeIWwAAKBEIHcAbgAAoCIjYwByAADgNdi73IAIRWFiY2RlZmdpamxub3JzdHYARhlKGVoZXhlmGWkZkhmWGZkZnRmgGa0ZxhnLGc8Z4BkjGmygZyIAoIwqgAFjbXAAUBlTGVgZ9SF0ZfVhbQBhAOSgswM6FgCghipyImV2ZQAfYQABaXliGWUZcgBjAB1hM2RvAHQAIWGAoWUibHFzAMYEcBl6GfGhZSLOBAAAdhlsAGEAbgD0AN8EgKF+KmNkbACBGYQZjBljAACgqSpvAHQAb6CAKmyggioAoIQqZeDbIgD+cwAAoJQqcgAA4DXYJN3noGsirATtIWVsAKA3IWMAeQBTZIChdyJFYWoApxmpGasZAKCSKgCgpSoAoKQqAAJFYWVztBm2Gb0ZwhkAoGkicABwoIoq8iFveACgiipxoIgq8aCIKrUZaQBtAACg5yJwAGYAAOA12FjdYQB2AOUAYwIAAWNp0xnWGXIAAKAKIW0AAKFzImVs3BneGQCgjioAoJAqAIM+ADtjZGxxco0E6xn0GfgZ/BkBGgABY2nvGfEZAKCnKnIAAKB6Km8AdAAAoNci0CFhcgCglSl1ImVzdAAAoHwqgAJhZGVscwAKGvQZFhrVBCAa8AEPGgAAFBpwAHIAbwD4AFkZcgAAoHgpcQAAAWxxxAQbGmwAZQBzAPMASRlpAO0A5AQAAWVuJxouGnIjdG5lcXEAAOBpIgD+xQAsGgAFQWFiY2Vma29zeUAaQxpmGmoabRqDGocalhrCGtMacgDyAMwCAAJpbG1yShpOGlAaVBpyAHMA8ABxD2YAvWBpAGwA9AASBQABZHJYGlsaYwB5AEpkAKGUIWN3YBpkGmkAcgAAoEgpAKCtIWEAcgAAoA8h6SFyYyVhgAFhbHIAcxp7Gn8a8iF0c3WgZSZpAHQAAKBlJuwhaXAAoCYg4yFvbgCguSJyAADgNdgl3XMAAAFld4wakRphInJvdwAAoCUpYSJyb3cAAKAmKYACYW1vcHIAnxqjGqcauhq+GnIAcgAAoP8h9CFodACgOyJrAAABbHKsGrMaZSRmdGFycm93AACgqSHpJGdodGFycm93AKCqIWYAAOA12Fnd4iFhcgCgFSCAAWNsdADIGswa0BpyAADgNdi93GEAcwDoAGka8iFvaydhAAFicNca2xr1IWxsAKBDIOghZW4AoBAg4Qr2GgAA/RoAAAgbExsaGwAAIRs7GwAAAAA+G2IbmRuVG6sbAACyG80b0htjAHUAdABlADuA7QDtQAChYyBpeQEbBhtyAGMAO4DuAO5AOGQAAWN4CxsNG3kANWRjAGwAO4ChAKFAAAFmcssCFhsA4DXYJt1yAGEAdgBlADuA7ADsQIChSCFpbm8AJxsyGzYbAAFpbisbLxtuAHQAAKAMKnQAAKAtIuYhaW4AoNwpdABhAACgKSHsIWlnM2GAAWFvcABDG1sbXhuAAWNndABJG0sbWRtyACthgAFlbHAAcQVRG1UbaQBuAOUAyAVhAHIA9AByBWgAMWFmAACgtyJlAGQAtWEAoggiY2ZvdGkbbRt1G3kb4SFyZQCgBSFpAG4AdKAeImkAZQAAoN0pZABvAPQAWxsAoisiY2VscIEbhRuPG5QbYQBsAACguiIAAWdyiRuNG2UAcgDzACMQ4wCCG2EicmhrAACgFyryIW9kAKA8KgACY2dwdJ8boRukG6gbeQBRZG8AbgAvYWYAAOA12FrdYQC5Y3UAZQBzAHQAO4C/AL9AAAFjabUbuRtyAADgNdi+3G4AAKIIIkVkc3bCG8QbyBvQAwCg+SJvAHQAAKD1Inag9CIAoPMiaaBiIOwhZGUpYesB1hsAANkbYwB5AFZkbAA7gO8A70AAA2NmbW9zdeYb7hvyG/Ub+hsFHAABaXnqG+0bcgBjADVhOWRyAADgNdgn3eEhdGg3YnAAZgAA4DXYW93jAf8bAAADHHIAAOA12L/c8iFjeVhk6yFjeVRkAARhY2ZnaGpvcxUcGhwiHCYcKhwtHDAcNRzwIXBhdqC6A/BjAAFleR4cIRzkIWls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ZmdobG1vcHJzdHV3CiwNLBEsHSwnLDEsQCxLLFIsYix6LIQsjyzLLOgs7Sz/LAotcgDyAAkDYQByAACgYykAAWNyFSwbLHUAdABlADuA+gD6QPIACQ1yAOMBIywAACUseQBeZHYAZQBtYQABaXkrLDAscgBjADuA+wD7QENkgAFhYmgANyw6LD0scgDyANEO7CFhY3FhYQDyAOAOAAFpckQsSCzzIWh0AKB+KQDgNdgy3XIAYQB2AGUAO4D5APlAYQFWLF8scgAAAWxyWixcLACgvyEAoL4hbABrAACggCUAAWN0Zix2LG8CbCwAAAAAcyxyAG4AZaAcI3IAAKAcI28AcAAAoA8jcgBpAACg+CUAAWFsfiyBLGMAcgBrYTuAqACoQAABZ3CILIssbwBuAHNhZgAA4DXYZt0AA2FkaGxzdZksniynLLgsuyzFLHIAcgBvAPcACQ1vAHcAbgBhAHIAcgBvAPcA2A5hI3Jwb29uAAABbHKvLLMsZQBmAPQAWyxpAGcAaAD0AF0sdQDzAKYOaQAAocUDaGzBLMIs0mNvAG4AxWPwI2Fycm93cwCgyCGAAWNpdADRLOEs5CxvAtcsAAAAAN4scgBuAGWgHSNyAACgHSNvAHAAAKAOI24AZwBvYXIAaQAAoPklYwByAADgNdjK3IABZGlyAPMs9yz6LG8AdAAAoPAi7CFkZWlhaQBmoLUlAKC0JQABYW0DLQYtcgDyAMosbAA7gPwA/EDhIm5nbGUAoKcpgAdBQkRhY2RlZmxub3Byc3oAJy0qLTAtNC2bLZ0toS2/LcMtxy3TLdgt3C3gLfwtcgDyABADYQByAHag6CoAoOkqYQBzAOgA/gIAAW5yOC08LechcnQAoJwpgANla25wcnN0AJkpSC1NLVQtXi1iLYItYQBwAHAA4QAaHG8AdABoAGkAbgDnAKEXgAFoaXIAoSmzJFotbwBwAPQAdCVooJUh7wD4JgABaXVmLWotZwBtAOEAuygAAWJwbi14LXMjZXRuZXEAceCKIgD+AODLKgD+cyNldG5lcQBx4IsiAP4A4MwqAP4AAWhyhi2KLWUAdADhABIraSNhbmdsZQAAAWxyki2WLeUhZnQAoLIiaSJnaHQAAKCzInkAMmThIXNoAKCiIoABZWxyAKcttC24LWKiKCKuLQAAAACyLWEAcgAAoLsicQAAoFoi7CFpcACg7iIAAWJ0vC1eD2EA8gBfD3IAAOA12DPddAByAOkAlS1zAHUAAAFicM0t0C0A4IIi0iAA4IMi0iBwAGYAAOA12GfdcgBvAPAAWQt0AHIA6QCaLQABY3XkLegtcgAA4DXYy9wAAWJw7C30LW4AAAFFZXUt8S0A4IoiAP5uAAABRWV/LfktAOCLIgD+6SJnemFnAKCaKYADY2Vmb3BycwANLhAuJS4pLiMuLi40LukhcmN1YQABZGkULiEuAAFiZxguHC5hAHIAAKBfKmUAcaAnIgCgWSLlIXJwAKAYIXIAAOA12DTdcABmAADgNdho3WWgQCJhAHQA6ABqD2MAcgAA4DXYzNzjCuQRUC4AAFQuAABYLmIuAAAAAGMubS5wLnQuAAAAAIguki4AAJouJxIqEnQAcgDpAB0ScgAA4DXYNd0AAUFhWy5eLnIA8gDnAnIA8gCTB75jAAFBYWYuaS5yAPIA4AJyAPIAjAdhAPAAeh5pAHMAAKD7IoABZHB0APgReS6DLgABZmx9LoAuAOA12GnddQDzAP8RaQBtAOUABBIAAUFhiy6OLnIA8gDuAnIA8gCaBwABY3GVLgoScgAA4DXYzdwAAXB0nS6hLmwAdQDzACUScgDpACASAARhY2VmaW9zdbEuvC7ELsguzC7PLtQu2S5jAAABdXm2LrsudABlADuA/QD9QE9kAAFpecAuwy5yAGMAd2FLZG4AO4ClAKVAcgAA4DXYNt1jAHkAV2RwAGYAAOA12GrdYwByAADgNdjO3AABY23dLt8ueQBOZGwAO4D/AP9AAAVhY2RlZmhpb3N38y73Lv8uAi8MLxAvEy8YLx0vIi9jInV0ZQB6YQABYXn7Lv4u8iFvbn5hN2RvAHQAfGEAAWV0Bi8KL3QAcgDmAB8QYQC2Y3IAAOA12DfdYwB5ADZk5yJyYXJyAKDdIXAAZgAA4DXYa91jAHIAAOA12M/cAAFqbiYvKC8AoA0gagAAoAwg");var M;(function(s){s[s.VALUE_LENGTH=49152]="VALUE_LENGTH",s[s.FLAG13=8192]="FLAG13",s[s.BRANCH_LENGTH=8064]="BRANCH_LENGTH",s[s.JUMP_TABLE=127]="JUMP_TABLE"})(M||(M={}));var U;(function(s){s[s.NUM=35]="NUM",s[s.SEMI=59]="SEMI",s[s.EQUALS=61]="EQUALS",s[s.ZERO=48]="ZERO",s[s.NINE=57]="NINE",s[s.LOWER_A=97]="LOWER_A",s[s.LOWER_F=102]="LOWER_F",s[s.LOWER_X=120]="LOWER_X",s[s.LOWER_Z=122]="LOWER_Z",s[s.UPPER_A=65]="UPPER_A",s[s.UPPER_F=70]="UPPER_F",s[s.UPPER_Z=90]="UPPER_Z"})(U||(U={}));var pa=32;function Oi(s){return s>=U.ZERO&&s<=U.NINE}function ud(s){return s>=U.UPPER_A&&s<=U.UPPER_F||s>=U.LOWER_A&&s<=U.LOWER_F}function vd(s){return s>=U.UPPER_A&&s<=U.UPPER_Z||s>=U.LOWER_A&&s<=U.LOWER_Z||Oi(s)}function md(s){return s===U.EQUALS||vd(s)}var P;(function(s){s[s.EntityStart=0]="EntityStart",s[s.NumericStart=1]="NumericStart",s[s.NumericDecimal=2]="NumericDecimal",s[s.NumericHex=3]="NumericHex",s[s.NamedEntity=4]="NamedEntity"})(P||(P={}));var ds;(function(s){s[s.Legacy=0]="Legacy",s[s.Strict=1]="Strict",s[s.Attribute=2]="Attribute"})(ds||(ds={}));class Mi{decodeTree;emitCodePoint;errors;constructor(s,i,a){this.decodeTree=s,this.emitCodePoint=i,this.errors=a}state=P.EntityStart;consumed=1;result=0;treeIndex=0;excess=1;decodeMode=ds.Strict;runConsumed=0;startEntity(s){this.decodeMode=s,this.state=P.EntityStart,this.result=0,this.treeIndex=0,this.excess=1,this.consumed=1,this.runConsumed=0}write(s,i){switch(this.state){case P.EntityStart:{if(s.charCodeAt(i)===U.NUM)return this.state=P.NumericStart,this.consumed+=1,this.stateNumericStart(s,i+1);return this.state=P.NamedEntity,this.stateNamedEntity(s,i)}case P.NumericStart:return this.stateNumericStart(s,i);case P.NumericDecimal:return this.stateNumericDecimal(s,i);case P.NumericHex:return this.stateNumericHex(s,i);case P.NamedEntity:return this.stateNamedEntity(s,i)}}stateNumericStart(s,i){if(i>=s.length)return-1;if((s.charCodeAt(i)|pa)===U.LOWER_X)return this.state=P.NumericHex,this.consumed+=1,this.stateNumericHex(s,i+1);return this.state=P.NumericDecimal,this.stateNumericDecimal(s,i)}stateNumericHex(s,i){while(i<s.length){let a=s.charCodeAt(i);if(Oi(a)||ud(a)){let e=a<=U.NINE?a-U.ZERO:(a|pa)-U.LOWER_A+10;this.result=this.result*16+e,this.consumed++,i++}else return this.emitNumericEntity(a,3)}return-1}stateNumericDecimal(s,i){while(i<s.length){let a=s.charCodeAt(i);if(Oi(a))this.result=this.result*10+(a-U.ZERO),this.consumed++,i++;else return this.emitNumericEntity(a,2)}return-1}emitNumericEntity(s,i){if(this.consumed<=i)return this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed),0;if(s===U.SEMI)this.consumed+=1;else if(this.decodeMode===ds.Strict)return 0;if(this.emitCodePoint(ka(this.result),this.consumed),this.errors){if(s!==U.SEMI)this.errors.missingSemicolonAfterCharacterReference();this.errors.validateNumericCharacterReference(this.result)}return this.consumed}stateNamedEntity(s,i){let{decodeTree:a}=this,e=a[this.treeIndex],d=(e&M.VALUE_LENGTH)>>14;while(i<s.length){if(d===0&&(e&M.FLAG13)!==0){let f=(e&M.BRANCH_LENGTH)>>7;if(this.runConsumed===0){let v=e&M.JUMP_TABLE;if(s.charCodeAt(i)!==v)return this.result===0?0:this.emitNotTerminatedNamedEntity();i++,this.excess++,this.runConsumed++}while(this.runConsumed<f){if(i>=s.length)return-1;let v=this.runConsumed-1,t=a[this.treeIndex+1+(v>>1)],g=v%2===0?t&255:t>>8&255;if(s.charCodeAt(i)!==g)return this.runConsumed=0,this.result===0?0:this.emitNotTerminatedNamedEntity();i++,this.excess++,this.runConsumed++}this.runConsumed=0,this.treeIndex+=1+(f>>1),e=a[this.treeIndex],d=(e&M.VALUE_LENGTH)>>14}if(i>=s.length)break;let c=s.charCodeAt(i);if(c===U.SEMI&&d!==0&&(e&M.FLAG13)!==0)return this.emitNamedEntityData(this.treeIndex,d,this.consumed+this.excess);if(this.treeIndex=fd(a,e,this.treeIndex+Math.max(1,d),c),this.treeIndex<0)return this.result===0||this.decodeMode===ds.Attribute&&(d===0||md(c))?0:this.emitNotTerminatedNamedEntity();if(e=a[this.treeIndex],d=(e&M.VALUE_LENGTH)>>14,d!==0){if(c===U.SEMI)return this.emitNamedEntityData(this.treeIndex,d,this.consumed+this.excess);if(this.decodeMode!==ds.Strict&&(e&M.FLAG13)===0)this.result=this.treeIndex,this.consumed+=this.excess,this.excess=0}i++,this.excess++}return-1}emitNotTerminatedNamedEntity(){let{result:s,decodeTree:i}=this,a=(i[s]&M.VALUE_LENGTH)>>14;return this.emitNamedEntityData(s,a,this.consumed),this.errors?.missingSemicolonAfterCharacterReference(),this.consumed}emitNamedEntityData(s,i,a){let{decodeTree:e}=this;if(this.emitCodePoint(i===1?e[s]&~(M.VALUE_LENGTH|M.FLAG13):e[s+1],a),i===3)this.emitCodePoint(e[s+2],a);return a}end(){switch(this.state){case P.NamedEntity:return this.result!==0&&(this.decodeMode!==ds.Attribute||this.result===this.treeIndex)?this.emitNotTerminatedNamedEntity():0;case P.NumericDecimal:return this.emitNumericEntity(0,2);case P.NumericHex:return this.emitNumericEntity(0,3);case P.NumericStart:return this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed),0;case P.EntityStart:return 0}}}function fd(s,i,a,e){let d=(i&M.BRANCH_LENGTH)>>7,c=i&M.JUMP_TABLE;if(d===0)return c!==0&&e===c?a:-1;if(c){let g=e-c;return g<0||g>=d?-1:s[a+g]-1}let f=d+1>>1,v=0,t=d-1;while(v<=t){let g=v+t>>>1,y=g>>1,o=s[a+y]>>(g&1)*8&255;if(o<e)v=g+1;else if(o>e)t=g-1;else return s[a+f+g]}return-1}var h;(function(s){s.HTML="http://www.w3.org/1999/xhtml",s.MATHML="http://www.w3.org/1998/Math/MathML",s.SVG="http://www.w3.org/2000/svg",s.XLINK="http://www.w3.org/1999/xlink",s.XML="http://www.w3.org/XML/1998/namespace",s.XMLNS="http://www.w3.org/2000/xmlns/"})(h||(h={}));var vs;(function(s){s.TYPE="type",s.ACTION="action",s.ENCODING="encoding",s.PROMPT="prompt",s.NAME="name",s.COLOR="color",s.FACE="face",s.SIZE="size"})(vs||(vs={}));var E;(function(s){s.NO_QUIRKS="no-quirks",s.QUIRKS="quirks",s.LIMITED_QUIRKS="limited-quirks"})(E||(E={}));var b;(function(s){s.A="a",s.ADDRESS="address",s.ANNOTATION_XML="annotation-xml",s.APPLET="applet",s.AREA="area",s.ARTICLE="article",s.ASIDE="aside",s.B="b",s.BASE="base",s.BASEFONT="basefont",s.BGSOUND="bgsound",s.BIG="big",s.BLOCKQUOTE="blockquote",s.BODY="body",s.BR="br",s.BUTTON="button",s.CAPTION="caption",s.CENTER="center",s.CODE="code",s.COL="col",s.COLGROUP="colgroup",s.DD="dd",s.DESC="desc",s.DETAILS="details",s.DIALOG="dialog",s.DIR="dir",s.DIV="div",s.DL="dl",s.DT="dt",s.EM="em",s.EMBED="embed",s.FIELDSET="fieldset",s.FIGCAPTION="figcaption",s.FIGURE="figure",s.FONT="font",s.FOOTER="footer",s.FOREIGN_OBJECT="foreignObject",s.FORM="form",s.FRAME="frame",s.FRAMESET="frameset",s.H1="h1",s.H2="h2",s.H3="h3",s.H4="h4",s.H5="h5",s.H6="h6",s.HEAD="head",s.HEADER="header",s.HGROUP="hgroup",s.HR="hr",s.HTML="html",s.I="i",s.IMG="img",s.IMAGE="image",s.INPUT="input",s.IFRAME="iframe",s.KEYGEN="keygen",s.LABEL="label",s.LI="li",s.LINK="link",s.LISTING="listing",s.MAIN="main",s.MALIGNMARK="malignmark",s.MARQUEE="marquee",s.MATH="math",s.MENU="menu",s.META="meta",s.MGLYPH="mglyph",s.MI="mi",s.MO="mo",s.MN="mn",s.MS="ms",s.MTEXT="mtext",s.NAV="nav",s.NOBR="nobr",s.NOFRAMES="noframes",s.NOEMBED="noembed",s.NOSCRIPT="noscript",s.OBJECT="object",s.OL="ol",s.OPTGROUP="optgroup",s.OPTION="option",s.P="p",s.PARAM="param",s.PLAINTEXT="plaintext",s.PRE="pre",s.RB="rb",s.RP="rp",s.RT="rt",s.RTC="rtc",s.RUBY="ruby",s.S="s",s.SCRIPT="script",s.SEARCH="search",s.SECTION="section",s.SELECT="select",s.SOURCE="source",s.SMALL="small",s.SPAN="span",s.STRIKE="strike",s.STRONG="strong",s.STYLE="style",s.SUB="sub",s.SUMMARY="summary",s.SUP="sup",s.TABLE="table",s.TBODY="tbody",s.TEMPLATE="template",s.TEXTAREA="textarea",s.TFOOT="tfoot",s.TD="td",s.TH="th",s.THEAD="thead",s.TITLE="title",s.TR="tr",s.TRACK="track",s.TT="tt",s.U="u",s.UL="ul",s.SVG="svg",s.VAR="var",s.WBR="wbr",s.XMP="xmp"})(b||(b={}));var r;(function(s){s[s.UNKNOWN=0]="UNKNOWN",s[s.A=1]="A",s[s.ADDRESS=2]="ADDRESS",s[s.ANNOTATION_XML=3]="ANNOTATION_XML",s[s.APPLET=4]="APPLET",s[s.AREA=5]="AREA",s[s.ARTICLE=6]="ARTICLE",s[s.ASIDE=7]="ASIDE",s[s.B=8]="B",s[s.BASE=9]="BASE",s[s.BASEFONT=10]="BASEFONT",s[s.BGSOUND=11]="BGSOUND",s[s.BIG=12]="BIG",s[s.BLOCKQUOTE=13]="BLOCKQUOTE",s[s.BODY=14]="BODY",s[s.BR=15]="BR",s[s.BUTTON=16]="BUTTON",s[s.CAPTION=17]="CAPTION",s[s.CENTER=18]="CENTER",s[s.CODE=19]="CODE",s[s.COL=20]="COL",s[s.COLGROUP=21]="COLGROUP",s[s.DD=22]="DD",s[s.DESC=23]="DESC",s[s.DETAILS=24]="DETAILS",s[s.DIALOG=25]="DIALOG",s[s.DIR=26]="DIR",s[s.DIV=27]="DIV",s[s.DL=28]="DL",s[s.DT=29]="DT",s[s.EM=30]="EM",s[s.EMBED=31]="EMBED",s[s.FIELDSET=32]="FIELDSET",s[s.FIGCAPTION=33]="FIGCAPTION",s[s.FIGURE=34]="FIGURE",s[s.FONT=35]="FONT",s[s.FOOTER=36]="FOOTER",s[s.FOREIGN_OBJECT=37]="FOREIGN_OBJECT",s[s.FORM=38]="FORM",s[s.FRAME=39]="FRAME",s[s.FRAMESET=40]="FRAMESET",s[s.H1=41]="H1",s[s.H2=42]="H2",s[s.H3=43]="H3",s[s.H4=44]="H4",s[s.H5=45]="H5",s[s.H6=46]="H6",s[s.HEAD=47]="HEAD",s[s.HEADER=48]="HEADER",s[s.HGROUP=49]="HGROUP",s[s.HR=50]="HR",s[s.HTML=51]="HTML",s[s.I=52]="I",s[s.IMG=53]="IMG",s[s.IMAGE=54]="IMAGE",s[s.INPUT=55]="INPUT",s[s.IFRAME=56]="IFRAME",s[s.KEYGEN=57]="KEYGEN",s[s.LABEL=58]="LABEL",s[s.LI=59]="LI",s[s.LINK=60]="LINK",s[s.LISTING=61]="LISTING",s[s.MAIN=62]="MAIN",s[s.MALIGNMARK=63]="MALIGNMARK",s[s.MARQUEE=64]="MARQUEE",s[s.MATH=65]="MATH",s[s.MENU=66]="MENU",s[s.META=67]="META",s[s.MGLYPH=68]="MGLYPH",s[s.MI=69]="MI",s[s.MO=70]="MO",s[s.MN=71]="MN",s[s.MS=72]="MS",s[s.MTEXT=73]="MTEXT",s[s.NAV=74]="NAV",s[s.NOBR=75]="NOBR",s[s.NOFRAMES=76]="NOFRAMES",s[s.NOEMBED=77]="NOEMBED",s[s.NOSCRIPT=78]="NOSCRIPT",s[s.OBJECT=79]="OBJECT",s[s.OL=80]="OL",s[s.OPTGROUP=81]="OPTGROUP",s[s.OPTION=82]="OPTION",s[s.P=83]="P",s[s.PARAM=84]="PARAM",s[s.PLAINTEXT=85]="PLAINTEXT",s[s.PRE=86]="PRE",s[s.RB=87]="RB",s[s.RP=88]="RP",s[s.RT=89]="RT",s[s.RTC=90]="RTC",s[s.RUBY=91]="RUBY",s[s.S=92]="S",s[s.SCRIPT=93]="SCRIPT",s[s.SEARCH=94]="SEARCH",s[s.SECTION=95]="SECTION",s[s.SELECT=96]="SELECT",s[s.SOURCE=97]="SOURCE",s[s.SMALL=98]="SMALL",s[s.SPAN=99]="SPAN",s[s.STRIKE=100]="STRIKE",s[s.STRONG=101]="STRONG",s[s.STYLE=102]="STYLE",s[s.SUB=103]="SUB",s[s.SUMMARY=104]="SUMMARY",s[s.SUP=105]="SUP",s[s.TABLE=106]="TABLE",s[s.TBODY=107]="TBODY",s[s.TEMPLATE=108]="TEMPLATE",s[s.TEXTAREA=109]="TEXTAREA",s[s.TFOOT=110]="TFOOT",s[s.TD=111]="TD",s[s.TH=112]="TH",s[s.THEAD=113]="THEAD",s[s.TITLE=114]="TITLE",s[s.TR=115]="TR",s[s.TRACK=116]="TRACK",s[s.TT=117]="TT",s[s.U=118]="U",s[s.UL=119]="UL",s[s.SVG=120]="SVG",s[s.VAR=121]="VAR",s[s.WBR=122]="WBR",s[s.XMP=123]="XMP"})(r||(r={}));var ld=new Map([[b.A,r.A],[b.ADDRESS,r.ADDRESS],[b.ANNOTATION_XML,r.ANNOTATION_XML],[b.APPLET,r.APPLET],[b.AREA,r.AREA],[b.ARTICLE,r.ARTICLE],[b.ASIDE,r.ASIDE],[b.B,r.B],[b.BASE,r.BASE],[b.BASEFONT,r.BASEFONT],[b.BGSOUND,r.BGSOUND],[b.BIG,r.BIG],[b.BLOCKQUOTE,r.BLOCKQUOTE],[b.BODY,r.BODY],[b.BR,r.BR],[b.BUTTON,r.BUTTON],[b.CAPTION,r.CAPTION],[b.CENTER,r.CENTER],[b.CODE,r.CODE],[b.COL,r.COL],[b.COLGROUP,r.COLGROUP],[b.DD,r.DD],[b.DESC,r.DESC],[b.DETAILS,r.DETAILS],[b.DIALOG,r.DIALOG],[b.DIR,r.DIR],[b.DIV,r.DIV],[b.DL,r.DL],[b.DT,r.DT],[b.EM,r.EM],[b.EMBED,r.EMBED],[b.FIELDSET,r.FIELDSET],[b.FIGCAPTION,r.FIGCAPTION],[b.FIGURE,r.FIGURE],[b.FONT,r.FONT],[b.FOOTER,r.FOOTER],[b.FOREIGN_OBJECT,r.FOREIGN_OBJECT],[b.FORM,r.FORM],[b.FRAME,r.FRAME],[b.FRAMESET,r.FRAMESET],[b.H1,r.H1],[b.H2,r.H2],[b.H3,r.H3],[b.H4,r.H4],[b.H5,r.H5],[b.H6,r.H6],[b.HEAD,r.HEAD],[b.HEADER,r.HEADER],[b.HGROUP,r.HGROUP],[b.HR,r.HR],[b.HTML,r.HTML],[b.I,r.I],[b.IMG,r.IMG],[b.IMAGE,r.IMAGE],[b.INPUT,r.INPUT],[b.IFRAME,r.IFRAME],[b.KEYGEN,r.KEYGEN],[b.LABEL,r.LABEL],[b.LI,r.LI],[b.LINK,r.LINK],[b.LISTING,r.LISTING],[b.MAIN,r.MAIN],[b.MALIGNMARK,r.MALIGNMARK],[b.MARQUEE,r.MARQUEE],[b.MATH,r.MATH],[b.MENU,r.MENU],[b.META,r.META],[b.MGLYPH,r.MGLYPH],[b.MI,r.MI],[b.MO,r.MO],[b.MN,r.MN],[b.MS,r.MS],[b.MTEXT,r.MTEXT],[b.NAV,r.NAV],[b.NOBR,r.NOBR],[b.NOFRAMES,r.NOFRAMES],[b.NOEMBED,r.NOEMBED],[b.NOSCRIPT,r.NOSCRIPT],[b.OBJECT,r.OBJECT],[b.OL,r.OL],[b.OPTGROUP,r.OPTGROUP],[b.OPTION,r.OPTION],[b.P,r.P],[b.PARAM,r.PARAM],[b.PLAINTEXT,r.PLAINTEXT],[b.PRE,r.PRE],[b.RB,r.RB],[b.RP,r.RP],[b.RT,r.RT],[b.RTC,r.RTC],[b.RUBY,r.RUBY],[b.S,r.S],[b.SCRIPT,r.SCRIPT],[b.SEARCH,r.SEARCH],[b.SECTION,r.SECTION],[b.SELECT,r.SELECT],[b.SOURCE,r.SOURCE],[b.SMALL,r.SMALL],[b.SPAN,r.SPAN],[b.STRIKE,r.STRIKE],[b.STRONG,r.STRONG],[b.STYLE,r.STYLE],[b.SUB,r.SUB],[b.SUMMARY,r.SUMMARY],[b.SUP,r.SUP],[b.TABLE,r.TABLE],[b.TBODY,r.TBODY],[b.TEMPLATE,r.TEMPLATE],[b.TEXTAREA,r.TEXTAREA],[b.TFOOT,r.TFOOT],[b.TD,r.TD],[b.TH,r.TH],[b.THEAD,r.THEAD],[b.TITLE,r.TITLE],[b.TR,r.TR],[b.TRACK,r.TRACK],[b.TT,r.TT],[b.U,r.U],[b.UL,r.UL],[b.SVG,r.SVG],[b.VAR,r.VAR],[b.WBR,r.WBR],[b.XMP,r.XMP]]);function hs(s){var i;return(i=ld.get(s))!==null&&i!==void 0?i:r.UNKNOWN}var H=r,_a={[h.HTML]:new Set([H.ADDRESS,H.APPLET,H.AREA,H.ARTICLE,H.ASIDE,H.BASE,H.BASEFONT,H.BGSOUND,H.BLOCKQUOTE,H.BODY,H.BR,H.BUTTON,H.CAPTION,H.CENTER,H.COL,H.COLGROUP,H.DD,H.DETAILS,H.DIR,H.DIV,H.DL,H.DT,H.EMBED,H.FIELDSET,H.FIGCAPTION,H.FIGURE,H.FOOTER,H.FORM,H.FRAME,H.FRAMESET,H.H1,H.H2,H.H3,H.H4,H.H5,H.H6,H.HEAD,H.HEADER,H.HGROUP,H.HR,H.HTML,H.IFRAME,H.IMG,H.INPUT,H.LI,H.LINK,H.LISTING,H.MAIN,H.MARQUEE,H.MENU,H.META,H.NAV,H.NOEMBED,H.NOFRAMES,H.NOSCRIPT,H.OBJECT,H.OL,H.P,H.PARAM,H.PLAINTEXT,H.PRE,H.SCRIPT,H.SECTION,H.SELECT,H.SOURCE,H.STYLE,H.SUMMARY,H.TABLE,H.TBODY,H.TD,H.TEMPLATE,H.TEXTAREA,H.TFOOT,H.TH,H.THEAD,H.TITLE,H.TR,H.TRACK,H.UL,H.WBR,H.XMP]),[h.MATHML]:new Set([H.MI,H.MO,H.MN,H.MS,H.MTEXT,H.ANNOTATION_XML]),[h.SVG]:new Set([H.TITLE,H.FOREIGN_OBJECT,H.DESC]),[h.XLINK]:new Set,[h.XML]:new Set,[h.XMLNS]:new Set},Bs=new Set([H.H1,H.H2,H.H3,H.H4,H.H5,H.H6]),Bv=new Set([b.STYLE,b.SCRIPT,b.XMP,b.IFRAME,b.NOEMBED,b.NOFRAMES,b.PLAINTEXT]);var m;(function(s){s[s.DATA=0]="DATA",s[s.RCDATA=1]="RCDATA",s[s.RAWTEXT=2]="RAWTEXT",s[s.SCRIPT_DATA=3]="SCRIPT_DATA",s[s.PLAINTEXT=4]="PLAINTEXT",s[s.TAG_OPEN=5]="TAG_OPEN",s[s.END_TAG_OPEN=6]="END_TAG_OPEN",s[s.TAG_NAME=7]="TAG_NAME",s[s.RCDATA_LESS_THAN_SIGN=8]="RCDATA_LESS_THAN_SIGN",s[s.RCDATA_END_TAG_OPEN=9]="RCDATA_END_TAG_OPEN",s[s.RCDATA_END_TAG_NAME=10]="RCDATA_END_TAG_NAME",s[s.RAWTEXT_LESS_THAN_SIGN=11]="RAWTEXT_LESS_THAN_SIGN",s[s.RAWTEXT_END_TAG_OPEN=12]="RAWTEXT_END_TAG_OPEN",s[s.RAWTEXT_END_TAG_NAME=13]="RAWTEXT_END_TAG_NAME",s[s.SCRIPT_DATA_LESS_THAN_SIGN=14]="SCRIPT_DATA_LESS_THAN_SIGN",s[s.SCRIPT_DATA_END_TAG_OPEN=15]="SCRIPT_DATA_END_TAG_OPEN",s[s.SCRIPT_DATA_END_TAG_NAME=16]="SCRIPT_DATA_END_TAG_NAME",s[s.SCRIPT_DATA_ESCAPE_START=17]="SCRIPT_DATA_ESCAPE_START",s[s.SCRIPT_DATA_ESCAPE_START_DASH=18]="SCRIPT_DATA_ESCAPE_START_DASH",s[s.SCRIPT_DATA_ESCAPED=19]="SCRIPT_DATA_ESCAPED",s[s.SCRIPT_DATA_ESCAPED_DASH=20]="SCRIPT_DATA_ESCAPED_DASH",s[s.SCRIPT_DATA_ESCAPED_DASH_DASH=21]="SCRIPT_DATA_ESCAPED_DASH_DASH",s[s.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN=22]="SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN",s[s.SCRIPT_DATA_ESCAPED_END_TAG_OPEN=23]="SCRIPT_DATA_ESCAPED_END_TAG_OPEN",s[s.SCRIPT_DATA_ESCAPED_END_TAG_NAME=24]="SCRIPT_DATA_ESCAPED_END_TAG_NAME",s[s.SCRIPT_DATA_DOUBLE_ESCAPE_START=25]="SCRIPT_DATA_DOUBLE_ESCAPE_START",s[s.SCRIPT_DATA_DOUBLE_ESCAPED=26]="SCRIPT_DATA_DOUBLE_ESCAPED",s[s.SCRIPT_DATA_DOUBLE_ESCAPED_DASH=27]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH",s[s.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH=28]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH",s[s.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN=29]="SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN",s[s.SCRIPT_DATA_DOUBLE_ESCAPE_END=30]="SCRIPT_DATA_DOUBLE_ESCAPE_END",s[s.BEFORE_ATTRIBUTE_NAME=31]="BEFORE_ATTRIBUTE_NAME",s[s.ATTRIBUTE_NAME=32]="ATTRIBUTE_NAME",s[s.AFTER_ATTRIBUTE_NAME=33]="AFTER_ATTRIBUTE_NAME",s[s.BEFORE_ATTRIBUTE_VALUE=34]="BEFORE_ATTRIBUTE_VALUE",s[s.ATTRIBUTE_VALUE_DOUBLE_QUOTED=35]="ATTRIBUTE_VALUE_DOUBLE_QUOTED",s[s.ATTRIBUTE_VALUE_SINGLE_QUOTED=36]="ATTRIBUTE_VALUE_SINGLE_QUOTED",s[s.ATTRIBUTE_VALUE_UNQUOTED=37]="ATTRIBUTE_VALUE_UNQUOTED",s[s.AFTER_ATTRIBUTE_VALUE_QUOTED=38]="AFTER_ATTRIBUTE_VALUE_QUOTED",s[s.SELF_CLOSING_START_TAG=39]="SELF_CLOSING_START_TAG",s[s.BOGUS_COMMENT=40]="BOGUS_COMMENT",s[s.MARKUP_DECLARATION_OPEN=41]="MARKUP_DECLARATION_OPEN",s[s.COMMENT_START=42]="COMMENT_START",s[s.COMMENT_START_DASH=43]="COMMENT_START_DASH",s[s.COMMENT=44]="COMMENT",s[s.COMMENT_LESS_THAN_SIGN=45]="COMMENT_LESS_THAN_SIGN",s[s.COMMENT_LESS_THAN_SIGN_BANG=46]="COMMENT_LESS_THAN_SIGN_BANG",s[s.COMMENT_LESS_THAN_SIGN_BANG_DASH=47]="COMMENT_LESS_THAN_SIGN_BANG_DASH",s[s.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH=48]="COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH",s[s.COMMENT_END_DASH=49]="COMMENT_END_DASH",s[s.COMMENT_END=50]="COMMENT_END",s[s.COMMENT_END_BANG=51]="COMMENT_END_BANG",s[s.DOCTYPE=52]="DOCTYPE",s[s.BEFORE_DOCTYPE_NAME=53]="BEFORE_DOCTYPE_NAME",s[s.DOCTYPE_NAME=54]="DOCTYPE_NAME",s[s.AFTER_DOCTYPE_NAME=55]="AFTER_DOCTYPE_NAME",s[s.AFTER_DOCTYPE_PUBLIC_KEYWORD=56]="AFTER_DOCTYPE_PUBLIC_KEYWORD",s[s.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER=57]="BEFORE_DOCTYPE_PUBLIC_IDENTIFIER",s[s.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED=58]="DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED",s[s.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED=59]="DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED",s[s.AFTER_DOCTYPE_PUBLIC_IDENTIFIER=60]="AFTER_DOCTYPE_PUBLIC_IDENTIFIER",s[s.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS=61]="BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS",s[s.AFTER_DOCTYPE_SYSTEM_KEYWORD=62]="AFTER_DOCTYPE_SYSTEM_KEYWORD",s[s.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER=63]="BEFORE_DOCTYPE_SYSTEM_IDENTIFIER",s[s.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED=64]="DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED",s[s.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED=65]="DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED",s[s.AFTER_DOCTYPE_SYSTEM_IDENTIFIER=66]="AFTER_DOCTYPE_SYSTEM_IDENTIFIER",s[s.BOGUS_DOCTYPE=67]="BOGUS_DOCTYPE",s[s.CDATA_SECTION=68]="CDATA_SECTION",s[s.CDATA_SECTION_BRACKET=69]="CDATA_SECTION_BRACKET",s[s.CDATA_SECTION_END=70]="CDATA_SECTION_END",s[s.CHARACTER_REFERENCE=71]="CHARACTER_REFERENCE",s[s.AMBIGUOUS_AMPERSAND=72]="AMBIGUOUS_AMPERSAND"})(m||(m={}));var N={DATA:m.DATA,RCDATA:m.RCDATA,RAWTEXT:m.RAWTEXT,SCRIPT_DATA:m.SCRIPT_DATA,PLAINTEXT:m.PLAINTEXT,CDATA_SECTION:m.CDATA_SECTION};function gd(s){return s>=u.DIGIT_0&&s<=u.DIGIT_9}function Ps(s){return s>=u.LATIN_CAPITAL_A&&s<=u.LATIN_CAPITAL_Z}function bd(s){return s>=u.LATIN_SMALL_A&&s<=u.LATIN_SMALL_Z}function bs(s){return bd(s)||Ps(s)}function Aa(s){return bs(s)||gd(s)}function ui(s){return s+32}function sr(s){return s===u.SPACE||s===u.LINE_FEED||s===u.TABULATION||s===u.FORM_FEED}function Ta(s){return sr(s)||s===u.SOLIDUS||s===u.GREATER_THAN_SIGN}function wd(s){if(s===u.NULL)return w.nullCharacterReference;else if(s>1114111)return w.characterReferenceOutsideUnicodeRange;else if(ri(s))return w.surrogateCharacterReference;else if(di(s))return w.noncharacterCharacterReference;else if(ei(s)||s===u.CARRIAGE_RETURN)return w.controlCharacterReference;return null}class vi{constructor(s,i){this.options=s,this.handler=i,this.paused=!1,this.inLoop=!1,this.inForeignNode=!1,this.lastStartTagName="",this.active=!1,this.state=m.DATA,this.returnState=m.DATA,this.entityStartPos=0,this.consumedAfterSnapshot=-1,this.currentCharacterToken=null,this.currentToken=null,this.currentAttr={name:"",value:""},this.preprocessor=new Pi(i),this.currentLocation=this.getCurrentLocation(-1),this.entityDecoder=new Mi(Ci,(a,e)=>{this.preprocessor.pos=this.entityStartPos+e-1,this._flushCodePointConsumedAsCharacterReference(a)},i.onParseError?{missingSemicolonAfterCharacterReference:()=>{this._err(w.missingSemicolonAfterCharacterReference,1)},absenceOfDigitsInNumericCharacterReference:(a)=>{this._err(w.absenceOfDigitsInNumericCharacterReference,this.entityStartPos-this.preprocessor.pos+a)},validateNumericCharacterReference:(a)=>{let e=wd(a);if(e)this._err(e,1)}}:void 0)}_err(s,i=0){var a,e;(e=(a=this.handler).onParseError)===null||e===void 0||e.call(a,this.preprocessor.getError(s,i))}getCurrentLocation(s){if(!this.options.sourceCodeLocationInfo)return null;return{startLine:this.preprocessor.line,startCol:this.preprocessor.col-s,startOffset:this.preprocessor.offset-s,endLine:-1,endCol:-1,endOffset:-1}}_runParsingLoop(){if(this.inLoop)return;this.inLoop=!0;while(this.active&&!this.paused){this.consumedAfterSnapshot=0;let s=this._consume();if(!this._ensureHibernation())this._callState(s)}this.inLoop=!1}pause(){this.paused=!0}resume(s){if(!this.paused)throw Error("Parser was already resumed");if(this.paused=!1,this.inLoop)return;if(this._runParsingLoop(),!this.paused)s===null||s===void 0||s()}write(s,i,a){if(this.active=!0,this.preprocessor.write(s,i),this._runParsingLoop(),!this.paused)a===null||a===void 0||a()}insertHtmlAtCurrentPos(s){this.active=!0,this.preprocessor.insertHtmlAtCurrentPos(s),this._runParsingLoop()}_ensureHibernation(){if(this.preprocessor.endOfChunkHit)return this.preprocessor.retreat(this.consumedAfterSnapshot),this.consumedAfterSnapshot=0,this.active=!1,!0;return!1}_consume(){return this.consumedAfterSnapshot++,this.preprocessor.advance()}_advanceBy(s){this.consumedAfterSnapshot+=s;for(let i=0;i<s;i++)this.preprocessor.advance()}_consumeSequenceIfMatch(s,i){if(this.preprocessor.startsWith(s,i))return this._advanceBy(s.length-1),!0;return!1}_createStartTagToken(){this.currentToken={type:X.START_TAG,tagName:"",tagID:r.UNKNOWN,selfClosing:!1,ackSelfClosing:!1,attrs:[],location:this.getCurrentLocation(1)}}_createEndTagToken(){this.currentToken={type:X.END_TAG,tagName:"",tagID:r.UNKNOWN,selfClosing:!1,ackSelfClosing:!1,attrs:[],location:this.getCurrentLocation(2)}}_createCommentToken(s){this.currentToken={type:X.COMMENT,data:"",location:this.getCurrentLocation(s)}}_createDoctypeToken(s){this.currentToken={type:X.DOCTYPE,name:s,forceQuirks:!1,publicId:null,systemId:null,location:this.currentLocation}}_createCharacterToken(s,i){this.currentCharacterToken={type:s,chars:i,location:this.currentLocation}}_createAttr(s){this.currentAttr={name:s,value:""},this.currentLocation=this.getCurrentLocation(0)}_leaveAttrName(){var s,i;let a=this.currentToken;if(ci(a,this.currentAttr.name)===null){if(a.attrs.push(this.currentAttr),a.location&&this.currentLocation){let e=(s=(i=a.location).attrs)!==null&&s!==void 0?s:i.attrs=Object.create(null);e[this.currentAttr.name]=this.currentLocation,this._leaveAttrValue()}}else this._err(w.duplicateAttribute)}_leaveAttrValue(){if(this.currentLocation)this.currentLocation.endLine=this.preprocessor.line,this.currentLocation.endCol=this.preprocessor.col,this.currentLocation.endOffset=this.preprocessor.offset}prepareToken(s){if(this._emitCurrentCharacterToken(s.location),this.currentToken=null,s.location)s.location.endLine=this.preprocessor.line,s.location.endCol=this.preprocessor.col+1,s.location.endOffset=this.preprocessor.offset+1;this.currentLocation=this.getCurrentLocation(-1)}emitCurrentTagToken(){let s=this.currentToken;if(this.prepareToken(s),s.tagID=hs(s.tagName),s.type===X.START_TAG)this.lastStartTagName=s.tagName,this.handler.onStartTag(s);else{if(s.attrs.length>0)this._err(w.endTagWithAttributes);if(s.selfClosing)this._err(w.endTagWithTrailingSolidus);this.handler.onEndTag(s)}this.preprocessor.dropParsedChunk()}emitCurrentComment(s){this.prepareToken(s),this.handler.onComment(s),this.preprocessor.dropParsedChunk()}emitCurrentDoctype(s){this.prepareToken(s),this.handler.onDoctype(s),this.preprocessor.dropParsedChunk()}_emitCurrentCharacterToken(s){if(this.currentCharacterToken){if(s&&this.currentCharacterToken.location)this.currentCharacterToken.location.endLine=s.startLine,this.currentCharacterToken.location.endCol=s.startCol,this.currentCharacterToken.location.endOffset=s.startOffset;switch(this.currentCharacterToken.type){case X.CHARACTER:{this.handler.onCharacter(this.currentCharacterToken);break}case X.NULL_CHARACTER:{this.handler.onNullCharacter(this.currentCharacterToken);break}case X.WHITESPACE_CHARACTER:{this.handler.onWhitespaceCharacter(this.currentCharacterToken);break}}this.currentCharacterToken=null}}_emitEOFToken(){let s=this.getCurrentLocation(0);if(s)s.endLine=s.startLine,s.endCol=s.startCol,s.endOffset=s.startOffset;this._emitCurrentCharacterToken(s),this.handler.onEof({type:X.EOF,location:s}),this.active=!1}_appendCharToCurrentCharacterToken(s,i){if(this.currentCharacterToken)if(this.currentCharacterToken.type===s){this.currentCharacterToken.chars+=i;return}else this.currentLocation=this.getCurrentLocation(0),this._emitCurrentCharacterToken(this.currentLocation),this.preprocessor.dropParsedChunk();this._createCharacterToken(s,i)}_emitCodePoint(s){let i=sr(s)?X.WHITESPACE_CHARACTER:s===u.NULL?X.NULL_CHARACTER:X.CHARACTER;this._appendCharToCurrentCharacterToken(i,s<65536?String.fromCharCode(s):String.fromCodePoint(s))}_emitChars(s){this._appendCharToCurrentCharacterToken(X.CHARACTER,s)}_startCharacterReference(){this.returnState=this.state,this.state=m.CHARACTER_REFERENCE,this.entityStartPos=this.preprocessor.pos,this.entityDecoder.startEntity(this._isCharacterReferenceInAttribute()?ds.Attribute:ds.Legacy)}_isCharacterReferenceInAttribute(){return this.returnState===m.ATTRIBUTE_VALUE_DOUBLE_QUOTED||this.returnState===m.ATTRIBUTE_VALUE_SINGLE_QUOTED||this.returnState===m.ATTRIBUTE_VALUE_UNQUOTED}_flushCodePointConsumedAsCharacterReference(s){if(this._isCharacterReferenceInAttribute())this.currentAttr.value+=String.fromCodePoint(s);else this._emitCodePoint(s)}_callState(s){switch(this.state){case m.DATA:{this._stateData(s);break}case m.RCDATA:{this._stateRcdata(s);break}case m.RAWTEXT:{this._stateRawtext(s);break}case m.SCRIPT_DATA:{this._stateScriptData(s);break}case m.PLAINTEXT:{this._statePlaintext(s);break}case m.TAG_OPEN:{this._stateTagOpen(s);break}case m.END_TAG_OPEN:{this._stateEndTagOpen(s);break}case m.TAG_NAME:{this._stateTagName(s);break}case m.RCDATA_LESS_THAN_SIGN:{this._stateRcdataLessThanSign(s);break}case m.RCDATA_END_TAG_OPEN:{this._stateRcdataEndTagOpen(s);break}case m.RCDATA_END_TAG_NAME:{this._stateRcdataEndTagName(s);break}case m.RAWTEXT_LESS_THAN_SIGN:{this._stateRawtextLessThanSign(s);break}case m.RAWTEXT_END_TAG_OPEN:{this._stateRawtextEndTagOpen(s);break}case m.RAWTEXT_END_TAG_NAME:{this._stateRawtextEndTagName(s);break}case m.SCRIPT_DATA_LESS_THAN_SIGN:{this._stateScriptDataLessThanSign(s);break}case m.SCRIPT_DATA_END_TAG_OPEN:{this._stateScriptDataEndTagOpen(s);break}case m.SCRIPT_DATA_END_TAG_NAME:{this._stateScriptDataEndTagName(s);break}case m.SCRIPT_DATA_ESCAPE_START:{this._stateScriptDataEscapeStart(s);break}case m.SCRIPT_DATA_ESCAPE_START_DASH:{this._stateScriptDataEscapeStartDash(s);break}case m.SCRIPT_DATA_ESCAPED:{this._stateScriptDataEscaped(s);break}case m.SCRIPT_DATA_ESCAPED_DASH:{this._stateScriptDataEscapedDash(s);break}case m.SCRIPT_DATA_ESCAPED_DASH_DASH:{this._stateScriptDataEscapedDashDash(s);break}case m.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:{this._stateScriptDataEscapedLessThanSign(s);break}case m.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:{this._stateScriptDataEscapedEndTagOpen(s);break}case m.SCRIPT_DATA_ESCAPED_END_TAG_NAME:{this._stateScriptDataEscapedEndTagName(s);break}case m.SCRIPT_DATA_DOUBLE_ESCAPE_START:{this._stateScriptDataDoubleEscapeStart(s);break}case m.SCRIPT_DATA_DOUBLE_ESCAPED:{this._stateScriptDataDoubleEscaped(s);break}case m.SCRIPT_DATA_DOUBLE_ESCAPED_DASH:{this._stateScriptDataDoubleEscapedDash(s);break}case m.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH:{this._stateScriptDataDoubleEscapedDashDash(s);break}case m.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN:{this._stateScriptDataDoubleEscapedLessThanSign(s);break}case m.SCRIPT_DATA_DOUBLE_ESCAPE_END:{this._stateScriptDataDoubleEscapeEnd(s);break}case m.BEFORE_ATTRIBUTE_NAME:{this._stateBeforeAttributeName(s);break}case m.ATTRIBUTE_NAME:{this._stateAttributeName(s);break}case m.AFTER_ATTRIBUTE_NAME:{this._stateAfterAttributeName(s);break}case m.BEFORE_ATTRIBUTE_VALUE:{this._stateBeforeAttributeValue(s);break}case m.ATTRIBUTE_VALUE_DOUBLE_QUOTED:{this._stateAttributeValueDoubleQuoted(s);break}case m.ATTRIBUTE_VALUE_SINGLE_QUOTED:{this._stateAttributeValueSingleQuoted(s);break}case m.ATTRIBUTE_VALUE_UNQUOTED:{this._stateAttributeValueUnquoted(s);break}case m.AFTER_ATTRIBUTE_VALUE_QUOTED:{this._stateAfterAttributeValueQuoted(s);break}case m.SELF_CLOSING_START_TAG:{this._stateSelfClosingStartTag(s);break}case m.BOGUS_COMMENT:{this._stateBogusComment(s);break}case m.MARKUP_DECLARATION_OPEN:{this._stateMarkupDeclarationOpen(s);break}case m.COMMENT_START:{this._stateCommentStart(s);break}case m.COMMENT_START_DASH:{this._stateCommentStartDash(s);break}case m.COMMENT:{this._stateComment(s);break}case m.COMMENT_LESS_THAN_SIGN:{this._stateCommentLessThanSign(s);break}case m.COMMENT_LESS_THAN_SIGN_BANG:{this._stateCommentLessThanSignBang(s);break}case m.COMMENT_LESS_THAN_SIGN_BANG_DASH:{this._stateCommentLessThanSignBangDash(s);break}case m.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH:{this._stateCommentLessThanSignBangDashDash(s);break}case m.COMMENT_END_DASH:{this._stateCommentEndDash(s);break}case m.COMMENT_END:{this._stateCommentEnd(s);break}case m.COMMENT_END_BANG:{this._stateCommentEndBang(s);break}case m.DOCTYPE:{this._stateDoctype(s);break}case m.BEFORE_DOCTYPE_NAME:{this._stateBeforeDoctypeName(s);break}case m.DOCTYPE_NAME:{this._stateDoctypeName(s);break}case m.AFTER_DOCTYPE_NAME:{this._stateAfterDoctypeName(s);break}case m.AFTER_DOCTYPE_PUBLIC_KEYWORD:{this._stateAfterDoctypePublicKeyword(s);break}case m.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER:{this._stateBeforeDoctypePublicIdentifier(s);break}case m.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED:{this._stateDoctypePublicIdentifierDoubleQuoted(s);break}case m.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED:{this._stateDoctypePublicIdentifierSingleQuoted(s);break}case m.AFTER_DOCTYPE_PUBLIC_IDENTIFIER:{this._stateAfterDoctypePublicIdentifier(s);break}case m.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS:{this._stateBetweenDoctypePublicAndSystemIdentifiers(s);break}case m.AFTER_DOCTYPE_SYSTEM_KEYWORD:{this._stateAfterDoctypeSystemKeyword(s);break}case m.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER:{this._stateBeforeDoctypeSystemIdentifier(s);break}case m.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED:{this._stateDoctypeSystemIdentifierDoubleQuoted(s);break}case m.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED:{this._stateDoctypeSystemIdentifierSingleQuoted(s);break}case m.AFTER_DOCTYPE_SYSTEM_IDENTIFIER:{this._stateAfterDoctypeSystemIdentifier(s);break}case m.BOGUS_DOCTYPE:{this._stateBogusDoctype(s);break}case m.CDATA_SECTION:{this._stateCdataSection(s);break}case m.CDATA_SECTION_BRACKET:{this._stateCdataSectionBracket(s);break}case m.CDATA_SECTION_END:{this._stateCdataSectionEnd(s);break}case m.CHARACTER_REFERENCE:{this._stateCharacterReference();break}case m.AMBIGUOUS_AMPERSAND:{this._stateAmbiguousAmpersand(s);break}default:throw Error("Unknown state")}}_stateData(s){switch(s){case u.LESS_THAN_SIGN:{this.state=m.TAG_OPEN;break}case u.AMPERSAND:{this._startCharacterReference();break}case u.NULL:{this._err(w.unexpectedNullCharacter),this._emitCodePoint(s);break}case u.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateRcdata(s){switch(s){case u.AMPERSAND:{this._startCharacterReference();break}case u.LESS_THAN_SIGN:{this.state=m.RCDATA_LESS_THAN_SIGN;break}case u.NULL:{this._err(w.unexpectedNullCharacter),this._emitChars(Y);break}case u.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateRawtext(s){switch(s){case u.LESS_THAN_SIGN:{this.state=m.RAWTEXT_LESS_THAN_SIGN;break}case u.NULL:{this._err(w.unexpectedNullCharacter),this._emitChars(Y);break}case u.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateScriptData(s){switch(s){case u.LESS_THAN_SIGN:{this.state=m.SCRIPT_DATA_LESS_THAN_SIGN;break}case u.NULL:{this._err(w.unexpectedNullCharacter),this._emitChars(Y);break}case u.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(s)}}_statePlaintext(s){switch(s){case u.NULL:{this._err(w.unexpectedNullCharacter),this._emitChars(Y);break}case u.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateTagOpen(s){if(bs(s))this._createStartTagToken(),this.state=m.TAG_NAME,this._stateTagName(s);else switch(s){case u.EXCLAMATION_MARK:{this.state=m.MARKUP_DECLARATION_OPEN;break}case u.SOLIDUS:{this.state=m.END_TAG_OPEN;break}case u.QUESTION_MARK:{this._err(w.unexpectedQuestionMarkInsteadOfTagName),this._createCommentToken(1),this.state=m.BOGUS_COMMENT,this._stateBogusComment(s);break}case u.EOF:{this._err(w.eofBeforeTagName),this._emitChars("<"),this._emitEOFToken();break}default:this._err(w.invalidFirstCharacterOfTagName),this._emitChars("<"),this.state=m.DATA,this._stateData(s)}}_stateEndTagOpen(s){if(bs(s))this._createEndTagToken(),this.state=m.TAG_NAME,this._stateTagName(s);else switch(s){case u.GREATER_THAN_SIGN:{this._err(w.missingEndTagName),this.state=m.DATA;break}case u.EOF:{this._err(w.eofBeforeTagName),this._emitChars("</"),this._emitEOFToken();break}default:this._err(w.invalidFirstCharacterOfTagName),this._createCommentToken(2),this.state=m.BOGUS_COMMENT,this._stateBogusComment(s)}}_stateTagName(s){let i=this.currentToken;switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:{this.state=m.BEFORE_ATTRIBUTE_NAME;break}case u.SOLIDUS:{this.state=m.SELF_CLOSING_START_TAG;break}case u.GREATER_THAN_SIGN:{this.state=m.DATA,this.emitCurrentTagToken();break}case u.NULL:{this._err(w.unexpectedNullCharacter),i.tagName+=Y;break}case u.EOF:{this._err(w.eofInTag),this._emitEOFToken();break}default:i.tagName+=String.fromCodePoint(Ps(s)?ui(s):s)}}_stateRcdataLessThanSign(s){if(s===u.SOLIDUS)this.state=m.RCDATA_END_TAG_OPEN;else this._emitChars("<"),this.state=m.RCDATA,this._stateRcdata(s)}_stateRcdataEndTagOpen(s){if(bs(s))this.state=m.RCDATA_END_TAG_NAME,this._stateRcdataEndTagName(s);else this._emitChars("</"),this.state=m.RCDATA,this._stateRcdata(s)}handleSpecialEndTag(s){if(!this.preprocessor.startsWith(this.lastStartTagName,!1))return!this._ensureHibernation();this._createEndTagToken();let i=this.currentToken;switch(i.tagName=this.lastStartTagName,this.preprocessor.peek(this.lastStartTagName.length)){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:return this._advanceBy(this.lastStartTagName.length),this.state=m.BEFORE_ATTRIBUTE_NAME,!1;case u.SOLIDUS:return this._advanceBy(this.lastStartTagName.length),this.state=m.SELF_CLOSING_START_TAG,!1;case u.GREATER_THAN_SIGN:return this._advanceBy(this.lastStartTagName.length),this.emitCurrentTagToken(),this.state=m.DATA,!1;default:return!this._ensureHibernation()}}_stateRcdataEndTagName(s){if(this.handleSpecialEndTag(s))this._emitChars("</"),this.state=m.RCDATA,this._stateRcdata(s)}_stateRawtextLessThanSign(s){if(s===u.SOLIDUS)this.state=m.RAWTEXT_END_TAG_OPEN;else this._emitChars("<"),this.state=m.RAWTEXT,this._stateRawtext(s)}_stateRawtextEndTagOpen(s){if(bs(s))this.state=m.RAWTEXT_END_TAG_NAME,this._stateRawtextEndTagName(s);else this._emitChars("</"),this.state=m.RAWTEXT,this._stateRawtext(s)}_stateRawtextEndTagName(s){if(this.handleSpecialEndTag(s))this._emitChars("</"),this.state=m.RAWTEXT,this._stateRawtext(s)}_stateScriptDataLessThanSign(s){switch(s){case u.SOLIDUS:{this.state=m.SCRIPT_DATA_END_TAG_OPEN;break}case u.EXCLAMATION_MARK:{this.state=m.SCRIPT_DATA_ESCAPE_START,this._emitChars("<!");break}default:this._emitChars("<"),this.state=m.SCRIPT_DATA,this._stateScriptData(s)}}_stateScriptDataEndTagOpen(s){if(bs(s))this.state=m.SCRIPT_DATA_END_TAG_NAME,this._stateScriptDataEndTagName(s);else this._emitChars("</"),this.state=m.SCRIPT_DATA,this._stateScriptData(s)}_stateScriptDataEndTagName(s){if(this.handleSpecialEndTag(s))this._emitChars("</"),this.state=m.SCRIPT_DATA,this._stateScriptData(s)}_stateScriptDataEscapeStart(s){if(s===u.HYPHEN_MINUS)this.state=m.SCRIPT_DATA_ESCAPE_START_DASH,this._emitChars("-");else this.state=m.SCRIPT_DATA,this._stateScriptData(s)}_stateScriptDataEscapeStartDash(s){if(s===u.HYPHEN_MINUS)this.state=m.SCRIPT_DATA_ESCAPED_DASH_DASH,this._emitChars("-");else this.state=m.SCRIPT_DATA,this._stateScriptData(s)}_stateScriptDataEscaped(s){switch(s){case u.HYPHEN_MINUS:{this.state=m.SCRIPT_DATA_ESCAPED_DASH,this._emitChars("-");break}case u.LESS_THAN_SIGN:{this.state=m.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;break}case u.NULL:{this._err(w.unexpectedNullCharacter),this._emitChars(Y);break}case u.EOF:{this._err(w.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateScriptDataEscapedDash(s){switch(s){case u.HYPHEN_MINUS:{this.state=m.SCRIPT_DATA_ESCAPED_DASH_DASH,this._emitChars("-");break}case u.LESS_THAN_SIGN:{this.state=m.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;break}case u.NULL:{this._err(w.unexpectedNullCharacter),this.state=m.SCRIPT_DATA_ESCAPED,this._emitChars(Y);break}case u.EOF:{this._err(w.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=m.SCRIPT_DATA_ESCAPED,this._emitCodePoint(s)}}_stateScriptDataEscapedDashDash(s){switch(s){case u.HYPHEN_MINUS:{this._emitChars("-");break}case u.LESS_THAN_SIGN:{this.state=m.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;break}case u.GREATER_THAN_SIGN:{this.state=m.SCRIPT_DATA,this._emitChars(">");break}case u.NULL:{this._err(w.unexpectedNullCharacter),this.state=m.SCRIPT_DATA_ESCAPED,this._emitChars(Y);break}case u.EOF:{this._err(w.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=m.SCRIPT_DATA_ESCAPED,this._emitCodePoint(s)}}_stateScriptDataEscapedLessThanSign(s){if(s===u.SOLIDUS)this.state=m.SCRIPT_DATA_ESCAPED_END_TAG_OPEN;else if(bs(s))this._emitChars("<"),this.state=m.SCRIPT_DATA_DOUBLE_ESCAPE_START,this._stateScriptDataDoubleEscapeStart(s);else this._emitChars("<"),this.state=m.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(s)}_stateScriptDataEscapedEndTagOpen(s){if(bs(s))this.state=m.SCRIPT_DATA_ESCAPED_END_TAG_NAME,this._stateScriptDataEscapedEndTagName(s);else this._emitChars("</"),this.state=m.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(s)}_stateScriptDataEscapedEndTagName(s){if(this.handleSpecialEndTag(s))this._emitChars("</"),this.state=m.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(s)}_stateScriptDataDoubleEscapeStart(s){if(this.preprocessor.startsWith($.SCRIPT,!1)&&Ta(this.preprocessor.peek($.SCRIPT.length))){this._emitCodePoint(s);for(let i=0;i<$.SCRIPT.length;i++)this._emitCodePoint(this._consume());this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED}else if(!this._ensureHibernation())this.state=m.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(s)}_stateScriptDataDoubleEscaped(s){switch(s){case u.HYPHEN_MINUS:{this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED_DASH,this._emitChars("-");break}case u.LESS_THAN_SIGN:{this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN,this._emitChars("<");break}case u.NULL:{this._err(w.unexpectedNullCharacter),this._emitChars(Y);break}case u.EOF:{this._err(w.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateScriptDataDoubleEscapedDash(s){switch(s){case u.HYPHEN_MINUS:{this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH,this._emitChars("-");break}case u.LESS_THAN_SIGN:{this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN,this._emitChars("<");break}case u.NULL:{this._err(w.unexpectedNullCharacter),this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitChars(Y);break}case u.EOF:{this._err(w.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitCodePoint(s)}}_stateScriptDataDoubleEscapedDashDash(s){switch(s){case u.HYPHEN_MINUS:{this._emitChars("-");break}case u.LESS_THAN_SIGN:{this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN,this._emitChars("<");break}case u.GREATER_THAN_SIGN:{this.state=m.SCRIPT_DATA,this._emitChars(">");break}case u.NULL:{this._err(w.unexpectedNullCharacter),this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitChars(Y);break}case u.EOF:{this._err(w.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitCodePoint(s)}}_stateScriptDataDoubleEscapedLessThanSign(s){if(s===u.SOLIDUS)this.state=m.SCRIPT_DATA_DOUBLE_ESCAPE_END,this._emitChars("/");else this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED,this._stateScriptDataDoubleEscaped(s)}_stateScriptDataDoubleEscapeEnd(s){if(this.preprocessor.startsWith($.SCRIPT,!1)&&Ta(this.preprocessor.peek($.SCRIPT.length))){this._emitCodePoint(s);for(let i=0;i<$.SCRIPT.length;i++)this._emitCodePoint(this._consume());this.state=m.SCRIPT_DATA_ESCAPED}else if(!this._ensureHibernation())this.state=m.SCRIPT_DATA_DOUBLE_ESCAPED,this._stateScriptDataDoubleEscaped(s)}_stateBeforeAttributeName(s){switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:break;case u.SOLIDUS:case u.GREATER_THAN_SIGN:case u.EOF:{this.state=m.AFTER_ATTRIBUTE_NAME,this._stateAfterAttributeName(s);break}case u.EQUALS_SIGN:{this._err(w.unexpectedEqualsSignBeforeAttributeName),this._createAttr("="),this.state=m.ATTRIBUTE_NAME;break}default:this._createAttr(""),this.state=m.ATTRIBUTE_NAME,this._stateAttributeName(s)}}_stateAttributeName(s){switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:case u.SOLIDUS:case u.GREATER_THAN_SIGN:case u.EOF:{this._leaveAttrName(),this.state=m.AFTER_ATTRIBUTE_NAME,this._stateAfterAttributeName(s);break}case u.EQUALS_SIGN:{this._leaveAttrName(),this.state=m.BEFORE_ATTRIBUTE_VALUE;break}case u.QUOTATION_MARK:case u.APOSTROPHE:case u.LESS_THAN_SIGN:{this._err(w.unexpectedCharacterInAttributeName),this.currentAttr.name+=String.fromCodePoint(s);break}case u.NULL:{this._err(w.unexpectedNullCharacter),this.currentAttr.name+=Y;break}default:this.currentAttr.name+=String.fromCodePoint(Ps(s)?ui(s):s)}}_stateAfterAttributeName(s){switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:break;case u.SOLIDUS:{this.state=m.SELF_CLOSING_START_TAG;break}case u.EQUALS_SIGN:{this.state=m.BEFORE_ATTRIBUTE_VALUE;break}case u.GREATER_THAN_SIGN:{this.state=m.DATA,this.emitCurrentTagToken();break}case u.EOF:{this._err(w.eofInTag),this._emitEOFToken();break}default:this._createAttr(""),this.state=m.ATTRIBUTE_NAME,this._stateAttributeName(s)}}_stateBeforeAttributeValue(s){switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:break;case u.QUOTATION_MARK:{this.state=m.ATTRIBUTE_VALUE_DOUBLE_QUOTED;break}case u.APOSTROPHE:{this.state=m.ATTRIBUTE_VALUE_SINGLE_QUOTED;break}case u.GREATER_THAN_SIGN:{this._err(w.missingAttributeValue),this.state=m.DATA,this.emitCurrentTagToken();break}default:this.state=m.ATTRIBUTE_VALUE_UNQUOTED,this._stateAttributeValueUnquoted(s)}}_stateAttributeValueDoubleQuoted(s){switch(s){case u.QUOTATION_MARK:{this.state=m.AFTER_ATTRIBUTE_VALUE_QUOTED;break}case u.AMPERSAND:{this._startCharacterReference();break}case u.NULL:{this._err(w.unexpectedNullCharacter),this.currentAttr.value+=Y;break}case u.EOF:{this._err(w.eofInTag),this._emitEOFToken();break}default:this.currentAttr.value+=String.fromCodePoint(s)}}_stateAttributeValueSingleQuoted(s){switch(s){case u.APOSTROPHE:{this.state=m.AFTER_ATTRIBUTE_VALUE_QUOTED;break}case u.AMPERSAND:{this._startCharacterReference();break}case u.NULL:{this._err(w.unexpectedNullCharacter),this.currentAttr.value+=Y;break}case u.EOF:{this._err(w.eofInTag),this._emitEOFToken();break}default:this.currentAttr.value+=String.fromCodePoint(s)}}_stateAttributeValueUnquoted(s){switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:{this._leaveAttrValue(),this.state=m.BEFORE_ATTRIBUTE_NAME;break}case u.AMPERSAND:{this._startCharacterReference();break}case u.GREATER_THAN_SIGN:{this._leaveAttrValue(),this.state=m.DATA,this.emitCurrentTagToken();break}case u.NULL:{this._err(w.unexpectedNullCharacter),this.currentAttr.value+=Y;break}case u.QUOTATION_MARK:case u.APOSTROPHE:case u.LESS_THAN_SIGN:case u.EQUALS_SIGN:case u.GRAVE_ACCENT:{this._err(w.unexpectedCharacterInUnquotedAttributeValue),this.currentAttr.value+=String.fromCodePoint(s);break}case u.EOF:{this._err(w.eofInTag),this._emitEOFToken();break}default:this.currentAttr.value+=String.fromCodePoint(s)}}_stateAfterAttributeValueQuoted(s){switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:{this._leaveAttrValue(),this.state=m.BEFORE_ATTRIBUTE_NAME;break}case u.SOLIDUS:{this._leaveAttrValue(),this.state=m.SELF_CLOSING_START_TAG;break}case u.GREATER_THAN_SIGN:{this._leaveAttrValue(),this.state=m.DATA,this.emitCurrentTagToken();break}case u.EOF:{this._err(w.eofInTag),this._emitEOFToken();break}default:this._err(w.missingWhitespaceBetweenAttributes),this.state=m.BEFORE_ATTRIBUTE_NAME,this._stateBeforeAttributeName(s)}}_stateSelfClosingStartTag(s){switch(s){case u.GREATER_THAN_SIGN:{let i=this.currentToken;i.selfClosing=!0,this.state=m.DATA,this.emitCurrentTagToken();break}case u.EOF:{this._err(w.eofInTag),this._emitEOFToken();break}default:this._err(w.unexpectedSolidusInTag),this.state=m.BEFORE_ATTRIBUTE_NAME,this._stateBeforeAttributeName(s)}}_stateBogusComment(s){let i=this.currentToken;switch(s){case u.GREATER_THAN_SIGN:{this.state=m.DATA,this.emitCurrentComment(i);break}case u.EOF:{this.emitCurrentComment(i),this._emitEOFToken();break}case u.NULL:{this._err(w.unexpectedNullCharacter),i.data+=Y;break}default:i.data+=String.fromCodePoint(s)}}_stateMarkupDeclarationOpen(s){if(this._consumeSequenceIfMatch($.DASH_DASH,!0))this._createCommentToken($.DASH_DASH.length+1),this.state=m.COMMENT_START;else if(this._consumeSequenceIfMatch($.DOCTYPE,!1))this.currentLocation=this.getCurrentLocation($.DOCTYPE.length+1),this.state=m.DOCTYPE;else if(this._consumeSequenceIfMatch($.CDATA_START,!0))if(this.inForeignNode)this.state=m.CDATA_SECTION;else this._err(w.cdataInHtmlContent),this._createCommentToken($.CDATA_START.length+1),this.currentToken.data="[CDATA[",this.state=m.BOGUS_COMMENT;else if(!this._ensureHibernation())this._err(w.incorrectlyOpenedComment),this._createCommentToken(2),this.state=m.BOGUS_COMMENT,this._stateBogusComment(s)}_stateCommentStart(s){switch(s){case u.HYPHEN_MINUS:{this.state=m.COMMENT_START_DASH;break}case u.GREATER_THAN_SIGN:{this._err(w.abruptClosingOfEmptyComment),this.state=m.DATA;let i=this.currentToken;this.emitCurrentComment(i);break}default:this.state=m.COMMENT,this._stateComment(s)}}_stateCommentStartDash(s){let i=this.currentToken;switch(s){case u.HYPHEN_MINUS:{this.state=m.COMMENT_END;break}case u.GREATER_THAN_SIGN:{this._err(w.abruptClosingOfEmptyComment),this.state=m.DATA,this.emitCurrentComment(i);break}case u.EOF:{this._err(w.eofInComment),this.emitCurrentComment(i),this._emitEOFToken();break}default:i.data+="-",this.state=m.COMMENT,this._stateComment(s)}}_stateComment(s){let i=this.currentToken;switch(s){case u.HYPHEN_MINUS:{this.state=m.COMMENT_END_DASH;break}case u.LESS_THAN_SIGN:{i.data+="<",this.state=m.COMMENT_LESS_THAN_SIGN;break}case u.NULL:{this._err(w.unexpectedNullCharacter),i.data+=Y;break}case u.EOF:{this._err(w.eofInComment),this.emitCurrentComment(i),this._emitEOFToken();break}default:i.data+=String.fromCodePoint(s)}}_stateCommentLessThanSign(s){let i=this.currentToken;switch(s){case u.EXCLAMATION_MARK:{i.data+="!",this.state=m.COMMENT_LESS_THAN_SIGN_BANG;break}case u.LESS_THAN_SIGN:{i.data+="<";break}default:this.state=m.COMMENT,this._stateComment(s)}}_stateCommentLessThanSignBang(s){if(s===u.HYPHEN_MINUS)this.state=m.COMMENT_LESS_THAN_SIGN_BANG_DASH;else this.state=m.COMMENT,this._stateComment(s)}_stateCommentLessThanSignBangDash(s){if(s===u.HYPHEN_MINUS)this.state=m.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH;else this.state=m.COMMENT_END_DASH,this._stateCommentEndDash(s)}_stateCommentLessThanSignBangDashDash(s){if(s!==u.GREATER_THAN_SIGN&&s!==u.EOF)this._err(w.nestedComment);this.state=m.COMMENT_END,this._stateCommentEnd(s)}_stateCommentEndDash(s){let i=this.currentToken;switch(s){case u.HYPHEN_MINUS:{this.state=m.COMMENT_END;break}case u.EOF:{this._err(w.eofInComment),this.emitCurrentComment(i),this._emitEOFToken();break}default:i.data+="-",this.state=m.COMMENT,this._stateComment(s)}}_stateCommentEnd(s){let i=this.currentToken;switch(s){case u.GREATER_THAN_SIGN:{this.state=m.DATA,this.emitCurrentComment(i);break}case u.EXCLAMATION_MARK:{this.state=m.COMMENT_END_BANG;break}case u.HYPHEN_MINUS:{i.data+="-";break}case u.EOF:{this._err(w.eofInComment),this.emitCurrentComment(i),this._emitEOFToken();break}default:i.data+="--",this.state=m.COMMENT,this._stateComment(s)}}_stateCommentEndBang(s){let i=this.currentToken;switch(s){case u.HYPHEN_MINUS:{i.data+="--!",this.state=m.COMMENT_END_DASH;break}case u.GREATER_THAN_SIGN:{this._err(w.incorrectlyClosedComment),this.state=m.DATA,this.emitCurrentComment(i);break}case u.EOF:{this._err(w.eofInComment),this.emitCurrentComment(i),this._emitEOFToken();break}default:i.data+="--!",this.state=m.COMMENT,this._stateComment(s)}}_stateDoctype(s){switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:{this.state=m.BEFORE_DOCTYPE_NAME;break}case u.GREATER_THAN_SIGN:{this.state=m.BEFORE_DOCTYPE_NAME,this._stateBeforeDoctypeName(s);break}case u.EOF:{this._err(w.eofInDoctype),this._createDoctypeToken(null);let i=this.currentToken;i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(w.missingWhitespaceBeforeDoctypeName),this.state=m.BEFORE_DOCTYPE_NAME,this._stateBeforeDoctypeName(s)}}_stateBeforeDoctypeName(s){if(Ps(s))this._createDoctypeToken(String.fromCharCode(ui(s))),this.state=m.DOCTYPE_NAME;else switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:break;case u.NULL:{this._err(w.unexpectedNullCharacter),this._createDoctypeToken(Y),this.state=m.DOCTYPE_NAME;break}case u.GREATER_THAN_SIGN:{this._err(w.missingDoctypeName),this._createDoctypeToken(null);let i=this.currentToken;i.forceQuirks=!0,this.emitCurrentDoctype(i),this.state=m.DATA;break}case u.EOF:{this._err(w.eofInDoctype),this._createDoctypeToken(null);let i=this.currentToken;i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._createDoctypeToken(String.fromCodePoint(s)),this.state=m.DOCTYPE_NAME}}_stateDoctypeName(s){let i=this.currentToken;switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:{this.state=m.AFTER_DOCTYPE_NAME;break}case u.GREATER_THAN_SIGN:{this.state=m.DATA,this.emitCurrentDoctype(i);break}case u.NULL:{this._err(w.unexpectedNullCharacter),i.name+=Y;break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:i.name+=String.fromCodePoint(Ps(s)?ui(s):s)}}_stateAfterDoctypeName(s){let i=this.currentToken;switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:break;case u.GREATER_THAN_SIGN:{this.state=m.DATA,this.emitCurrentDoctype(i);break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:if(this._consumeSequenceIfMatch($.PUBLIC,!1))this.state=m.AFTER_DOCTYPE_PUBLIC_KEYWORD;else if(this._consumeSequenceIfMatch($.SYSTEM,!1))this.state=m.AFTER_DOCTYPE_SYSTEM_KEYWORD;else if(!this._ensureHibernation())this._err(w.invalidCharacterSequenceAfterDoctypeName),i.forceQuirks=!0,this.state=m.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateAfterDoctypePublicKeyword(s){let i=this.currentToken;switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:{this.state=m.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER;break}case u.QUOTATION_MARK:{this._err(w.missingWhitespaceAfterDoctypePublicKeyword),i.publicId="",this.state=m.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;break}case u.APOSTROPHE:{this._err(w.missingWhitespaceAfterDoctypePublicKeyword),i.publicId="",this.state=m.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;break}case u.GREATER_THAN_SIGN:{this._err(w.missingDoctypePublicIdentifier),i.forceQuirks=!0,this.state=m.DATA,this.emitCurrentDoctype(i);break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(w.missingQuoteBeforeDoctypePublicIdentifier),i.forceQuirks=!0,this.state=m.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateBeforeDoctypePublicIdentifier(s){let i=this.currentToken;switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:break;case u.QUOTATION_MARK:{i.publicId="",this.state=m.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;break}case u.APOSTROPHE:{i.publicId="",this.state=m.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;break}case u.GREATER_THAN_SIGN:{this._err(w.missingDoctypePublicIdentifier),i.forceQuirks=!0,this.state=m.DATA,this.emitCurrentDoctype(i);break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(w.missingQuoteBeforeDoctypePublicIdentifier),i.forceQuirks=!0,this.state=m.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateDoctypePublicIdentifierDoubleQuoted(s){let i=this.currentToken;switch(s){case u.QUOTATION_MARK:{this.state=m.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;break}case u.NULL:{this._err(w.unexpectedNullCharacter),i.publicId+=Y;break}case u.GREATER_THAN_SIGN:{this._err(w.abruptDoctypePublicIdentifier),i.forceQuirks=!0,this.emitCurrentDoctype(i),this.state=m.DATA;break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:i.publicId+=String.fromCodePoint(s)}}_stateDoctypePublicIdentifierSingleQuoted(s){let i=this.currentToken;switch(s){case u.APOSTROPHE:{this.state=m.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;break}case u.NULL:{this._err(w.unexpectedNullCharacter),i.publicId+=Y;break}case u.GREATER_THAN_SIGN:{this._err(w.abruptDoctypePublicIdentifier),i.forceQuirks=!0,this.emitCurrentDoctype(i),this.state=m.DATA;break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:i.publicId+=String.fromCodePoint(s)}}_stateAfterDoctypePublicIdentifier(s){let i=this.currentToken;switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:{this.state=m.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS;break}case u.GREATER_THAN_SIGN:{this.state=m.DATA,this.emitCurrentDoctype(i);break}case u.QUOTATION_MARK:{this._err(w.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers),i.systemId="",this.state=m.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case u.APOSTROPHE:{this._err(w.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers),i.systemId="",this.state=m.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(w.missingQuoteBeforeDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=m.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateBetweenDoctypePublicAndSystemIdentifiers(s){let i=this.currentToken;switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:break;case u.GREATER_THAN_SIGN:{this.emitCurrentDoctype(i),this.state=m.DATA;break}case u.QUOTATION_MARK:{i.systemId="",this.state=m.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case u.APOSTROPHE:{i.systemId="",this.state=m.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(w.missingQuoteBeforeDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=m.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateAfterDoctypeSystemKeyword(s){let i=this.currentToken;switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:{this.state=m.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER;break}case u.QUOTATION_MARK:{this._err(w.missingWhitespaceAfterDoctypeSystemKeyword),i.systemId="",this.state=m.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case u.APOSTROPHE:{this._err(w.missingWhitespaceAfterDoctypeSystemKeyword),i.systemId="",this.state=m.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case u.GREATER_THAN_SIGN:{this._err(w.missingDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=m.DATA,this.emitCurrentDoctype(i);break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(w.missingQuoteBeforeDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=m.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateBeforeDoctypeSystemIdentifier(s){let i=this.currentToken;switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:break;case u.QUOTATION_MARK:{i.systemId="",this.state=m.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case u.APOSTROPHE:{i.systemId="",this.state=m.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case u.GREATER_THAN_SIGN:{this._err(w.missingDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=m.DATA,this.emitCurrentDoctype(i);break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(w.missingQuoteBeforeDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=m.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateDoctypeSystemIdentifierDoubleQuoted(s){let i=this.currentToken;switch(s){case u.QUOTATION_MARK:{this.state=m.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;break}case u.NULL:{this._err(w.unexpectedNullCharacter),i.systemId+=Y;break}case u.GREATER_THAN_SIGN:{this._err(w.abruptDoctypeSystemIdentifier),i.forceQuirks=!0,this.emitCurrentDoctype(i),this.state=m.DATA;break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:i.systemId+=String.fromCodePoint(s)}}_stateDoctypeSystemIdentifierSingleQuoted(s){let i=this.currentToken;switch(s){case u.APOSTROPHE:{this.state=m.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;break}case u.NULL:{this._err(w.unexpectedNullCharacter),i.systemId+=Y;break}case u.GREATER_THAN_SIGN:{this._err(w.abruptDoctypeSystemIdentifier),i.forceQuirks=!0,this.emitCurrentDoctype(i),this.state=m.DATA;break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:i.systemId+=String.fromCodePoint(s)}}_stateAfterDoctypeSystemIdentifier(s){let i=this.currentToken;switch(s){case u.SPACE:case u.LINE_FEED:case u.TABULATION:case u.FORM_FEED:break;case u.GREATER_THAN_SIGN:{this.emitCurrentDoctype(i),this.state=m.DATA;break}case u.EOF:{this._err(w.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(w.unexpectedCharacterAfterDoctypeSystemIdentifier),this.state=m.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateBogusDoctype(s){let i=this.currentToken;switch(s){case u.GREATER_THAN_SIGN:{this.emitCurrentDoctype(i),this.state=m.DATA;break}case u.NULL:{this._err(w.unexpectedNullCharacter);break}case u.EOF:{this.emitCurrentDoctype(i),this._emitEOFToken();break}default:}}_stateCdataSection(s){switch(s){case u.RIGHT_SQUARE_BRACKET:{this.state=m.CDATA_SECTION_BRACKET;break}case u.EOF:{this._err(w.eofInCdata),this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateCdataSectionBracket(s){if(s===u.RIGHT_SQUARE_BRACKET)this.state=m.CDATA_SECTION_END;else this._emitChars("]"),this.state=m.CDATA_SECTION,this._stateCdataSection(s)}_stateCdataSectionEnd(s){switch(s){case u.GREATER_THAN_SIGN:{this.state=m.DATA;break}case u.RIGHT_SQUARE_BRACKET:{this._emitChars("]");break}default:this._emitChars("]]"),this.state=m.CDATA_SECTION,this._stateCdataSection(s)}}_stateCharacterReference(){let s=this.entityDecoder.write(this.preprocessor.html,this.preprocessor.pos);if(s<0)if(this.preprocessor.lastChunkWritten)s=this.entityDecoder.end();else{this.active=!1,this.preprocessor.pos=this.preprocessor.html.length-1,this.consumedAfterSnapshot=0,this.preprocessor.endOfChunkHit=!0;return}if(s===0)this.preprocessor.pos=this.entityStartPos,this._flushCodePointConsumedAsCharacterReference(u.AMPERSAND),this.state=!this._isCharacterReferenceInAttribute()&&Aa(this.preprocessor.peek(1))?m.AMBIGUOUS_AMPERSAND:this.returnState;else this.state=this.returnState}_stateAmbiguousAmpersand(s){if(Aa(s))this._flushCodePointConsumedAsCharacterReference(s);else{if(s===u.SEMICOLON)this._err(w.unknownNamedCharacterReference);this.state=this.returnState,this._callState(s)}}}var er=new Set([r.DD,r.DT,r.LI,r.OPTGROUP,r.OPTION,r.P,r.RB,r.RP,r.RT,r.RTC]),ir=new Set([...er,r.CAPTION,r.COLGROUP,r.TBODY,r.TD,r.TFOOT,r.TH,r.THEAD,r.TR]),mi=new Set([r.APPLET,r.CAPTION,r.HTML,r.MARQUEE,r.OBJECT,r.TABLE,r.TD,r.TEMPLATE,r.TH]),yd=new Set([...mi,r.OL,r.UL]),xd=new Set([...mi,r.BUTTON]),ar=new Set([r.ANNOTATION_XML,r.MI,r.MN,r.MO,r.MS,r.MTEXT]),rr=new Set([r.DESC,r.FOREIGN_OBJECT,r.TITLE]),od=new Set([r.TR,r.TEMPLATE,r.HTML]),hd=new Set([r.TBODY,r.TFOOT,r.THEAD,r.TEMPLATE,r.HTML]),Hd=new Set([r.TABLE,r.TEMPLATE,r.HTML]),jd=new Set([r.TD,r.TH]);class Ni{get currentTmplContentOrNode(){return this._isInTemplate()?this.treeAdapter.getTemplateContent(this.current):this.current}constructor(s,i,a){this.treeAdapter=i,this.handler=a,this.items=[],this.tagIDs=[],this.stackTop=-1,this.tmplCount=0,this.currentTagId=r.UNKNOWN,this.current=s}_indexOf(s){return this.items.lastIndexOf(s,this.stackTop)}_isInTemplate(){return this.currentTagId===r.TEMPLATE&&this.treeAdapter.getNamespaceURI(this.current)===h.HTML}_updateCurrentElement(){this.current=this.items[this.stackTop],this.currentTagId=this.tagIDs[this.stackTop]}push(s,i){if(this.stackTop++,this.items[this.stackTop]=s,this.current=s,this.tagIDs[this.stackTop]=i,this.currentTagId=i,this._isInTemplate())this.tmplCount++;this.handler.onItemPush(s,i,!0)}pop(){let s=this.current;if(this.tmplCount>0&&this._isInTemplate())this.tmplCount--;this.stackTop--,this._updateCurrentElement(),this.handler.onItemPop(s,!0)}replace(s,i){let a=this._indexOf(s);if(this.items[a]=i,a===this.stackTop)this.current=i}insertAfter(s,i,a){let e=this._indexOf(s)+1;if(this.items.splice(e,0,i),this.tagIDs.splice(e,0,a),this.stackTop++,e===this.stackTop)this._updateCurrentElement();if(this.current&&this.currentTagId!==void 0)this.handler.onItemPush(this.current,this.currentTagId,e===this.stackTop)}popUntilTagNamePopped(s){let i=this.stackTop+1;do i=this.tagIDs.lastIndexOf(s,i-1);while(i>0&&this.treeAdapter.getNamespaceURI(this.items[i])!==h.HTML);this.shortenToLength(Math.max(i,0))}shortenToLength(s){while(this.stackTop>=s){let i=this.current;if(this.tmplCount>0&&this._isInTemplate())this.tmplCount-=1;this.stackTop--,this._updateCurrentElement(),this.handler.onItemPop(i,this.stackTop<s)}}popUntilElementPopped(s){let i=this._indexOf(s);this.shortenToLength(Math.max(i,0))}popUntilPopped(s,i){let a=this._indexOfTagNames(s,i);this.shortenToLength(Math.max(a,0))}popUntilNumberedHeaderPopped(){this.popUntilPopped(Bs,h.HTML)}popUntilTableCellPopped(){this.popUntilPopped(jd,h.HTML)}popAllUpToHtmlElement(){this.tmplCount=0,this.shortenToLength(1)}_indexOfTagNames(s,i){for(let a=this.stackTop;a>=0;a--)if(s.has(this.tagIDs[a])&&this.treeAdapter.getNamespaceURI(this.items[a])===i)return a;return-1}clearBackTo(s,i){let a=this._indexOfTagNames(s,i);this.shortenToLength(a+1)}clearBackToTableContext(){this.clearBackTo(Hd,h.HTML)}clearBackToTableBodyContext(){this.clearBackTo(hd,h.HTML)}clearBackToTableRowContext(){this.clearBackTo(od,h.HTML)}remove(s){let i=this._indexOf(s);if(i>=0)if(i===this.stackTop)this.pop();else this.items.splice(i,1),this.tagIDs.splice(i,1),this.stackTop--,this._updateCurrentElement(),this.handler.onItemPop(s,!1)}tryPeekProperlyNestedBodyElement(){return this.stackTop>=1&&this.tagIDs[1]===r.BODY?this.items[1]:null}contains(s){return this._indexOf(s)>-1}getCommonAncestor(s){let i=this._indexOf(s)-1;return i>=0?this.items[i]:null}isRootHtmlElementCurrent(){return this.stackTop===0&&this.tagIDs[0]===r.HTML}hasInDynamicScope(s,i){for(let a=this.stackTop;a>=0;a--){let e=this.tagIDs[a];switch(this.treeAdapter.getNamespaceURI(this.items[a])){case h.HTML:{if(e===s)return!0;if(i.has(e))return!1;break}case h.SVG:{if(rr.has(e))return!1;break}case h.MATHML:{if(ar.has(e))return!1;break}}}return!0}hasInScope(s){return this.hasInDynamicScope(s,mi)}hasInListItemScope(s){return this.hasInDynamicScope(s,yd)}hasInButtonScope(s){return this.hasInDynamicScope(s,xd)}hasNumberedHeaderInScope(){for(let s=this.stackTop;s>=0;s--){let i=this.tagIDs[s];switch(this.treeAdapter.getNamespaceURI(this.items[s])){case h.HTML:{if(Bs.has(i))return!0;if(mi.has(i))return!1;break}case h.SVG:{if(rr.has(i))return!1;break}case h.MATHML:{if(ar.has(i))return!1;break}}}return!0}hasInTableScope(s){for(let i=this.stackTop;i>=0;i--){if(this.treeAdapter.getNamespaceURI(this.items[i])!==h.HTML)continue;switch(this.tagIDs[i]){case s:return!0;case r.TABLE:case r.HTML:return!1}}return!0}hasTableBodyContextInTableScope(){for(let s=this.stackTop;s>=0;s--){if(this.treeAdapter.getNamespaceURI(this.items[s])!==h.HTML)continue;switch(this.tagIDs[s]){case r.TBODY:case r.THEAD:case r.TFOOT:return!0;case r.TABLE:case r.HTML:return!1}}return!0}hasInSelectScope(s){for(let i=this.stackTop;i>=0;i--){if(this.treeAdapter.getNamespaceURI(this.items[i])!==h.HTML)continue;switch(this.tagIDs[i]){case s:return!0;case r.OPTION:case r.OPTGROUP:break;default:return!1}}return!0}generateImpliedEndTags(){while(this.currentTagId!==void 0&&er.has(this.currentTagId))this.pop()}generateImpliedEndTagsThoroughly(){while(this.currentTagId!==void 0&&ir.has(this.currentTagId))this.pop()}generateImpliedEndTagsWithExclusion(s){while(this.currentTagId!==void 0&&this.currentTagId!==s&&ir.has(this.currentTagId))this.pop()}}var ss;(function(s){s[s.Marker=0]="Marker",s[s.Element=1]="Element"})(ss||(ss={}));var dr={type:ss.Marker};class Si{constructor(s){this.treeAdapter=s,this.entries=[],this.bookmark=null}_getNoahArkConditionCandidates(s,i){let a=[],e=i.length,d=this.treeAdapter.getTagName(s),c=this.treeAdapter.getNamespaceURI(s);for(let f=0;f<this.entries.length;f++){let v=this.entries[f];if(v.type===ss.Marker)break;let{element:t}=v;if(this.treeAdapter.getTagName(t)===d&&this.treeAdapter.getNamespaceURI(t)===c){let g=this.treeAdapter.getAttrList(t);if(g.length===e)a.push({idx:f,attrs:g})}}return a}_ensureNoahArkCondition(s){if(this.entries.length<3)return;let i=this.treeAdapter.getAttrList(s),a=this._getNoahArkConditionCandidates(s,i);if(a.length<3)return;let e=new Map(i.map((c)=>[c.name,c.value])),d=0;for(let c=0;c<a.length;c++){let f=a[c];if(f.attrs.every((v)=>e.get(v.name)===v.value)){if(d+=1,d>=3)this.entries.splice(f.idx,1)}}}insertMarker(){this.entries.unshift(dr)}pushElement(s,i){this._ensureNoahArkCondition(s),this.entries.unshift({type:ss.Element,element:s,token:i})}insertElementAfterBookmark(s,i){let a=this.entries.indexOf(this.bookmark);this.entries.splice(a,0,{type:ss.Element,element:s,token:i})}removeEntry(s){let i=this.entries.indexOf(s);if(i!==-1)this.entries.splice(i,1)}clearToLastMarker(){let s=this.entries.indexOf(dr);if(s===-1)this.entries.length=0;else this.entries.splice(0,s+1)}getElementEntryInScopeWithTagName(s){let i=this.entries.find((a)=>a.type===ss.Marker||this.treeAdapter.getTagName(a.element)===s);return i&&i.type===ss.Element?i:null}getElementEntry(s){return this.entries.find((i)=>i.type===ss.Element&&i.element===s)}}var is={createDocument(){return{nodeName:"#document",mode:E.NO_QUIRKS,childNodes:[]}},createDocumentFragment(){return{nodeName:"#document-fragment",childNodes:[]}},createElement(s,i,a){return{nodeName:s,tagName:s,attrs:a,namespaceURI:i,childNodes:[],parentNode:null}},createCommentNode(s){return{nodeName:"#comment",data:s,parentNode:null}},createTextNode(s){return{nodeName:"#text",value:s,parentNode:null}},appendChild(s,i){s.childNodes.push(i),i.parentNode=s},insertBefore(s,i,a){let e=s.childNodes.indexOf(a);s.childNodes.splice(e,0,i),i.parentNode=s},setTemplateContent(s,i){s.content=i},getTemplateContent(s){return s.content},setDocumentType(s,i,a,e){let d=s.childNodes.find((c)=>c.nodeName==="#documentType");if(d)d.name=i,d.publicId=a,d.systemId=e;else{let c={nodeName:"#documentType",name:i,publicId:a,systemId:e,parentNode:null};is.appendChild(s,c)}},setDocumentMode(s,i){s.mode=i},getDocumentMode(s){return s.mode},detachNode(s){if(s.parentNode){let i=s.parentNode.childNodes.indexOf(s);s.parentNode.childNodes.splice(i,1),s.parentNode=null}},insertText(s,i){if(s.childNodes.length>0){let a=s.childNodes[s.childNodes.length-1];if(is.isTextNode(a)){a.value+=i;return}}is.appendChild(s,is.createTextNode(i))},insertTextBefore(s,i,a){let e=s.childNodes[s.childNodes.indexOf(a)-1];if(e&&is.isTextNode(e))e.value+=i;else is.insertBefore(s,is.createTextNode(i),a)},adoptAttributes(s,i){let a=new Set(s.attrs.map((e)=>e.name));for(let e=0;e<i.length;e++)if(!a.has(i[e].name))s.attrs.push(i[e])},getFirstChild(s){return s.childNodes[0]},getChildNodes(s){return s.childNodes},getParentNode(s){return s.parentNode},getAttrList(s){return s.attrs},getTagName(s){return s.tagName},getNamespaceURI(s){return s.namespaceURI},getTextNodeContent(s){return s.value},getCommentNodeContent(s){return s.data},getDocumentTypeNodeName(s){return s.name},getDocumentTypeNodePublicId(s){return s.publicId},getDocumentTypeNodeSystemId(s){return s.systemId},isTextNode(s){return s.nodeName==="#text"},isCommentNode(s){return s.nodeName==="#comment"},isDocumentTypeNode(s){return s.nodeName==="#documentType"},isElementNode(s){return Object.prototype.hasOwnProperty.call(s,"tagName")},setNodeSourceCodeLocation(s,i){s.sourceCodeLocation=i},getNodeSourceCodeLocation(s){return s.sourceCodeLocation},updateNodeSourceCodeLocation(s,i){s.sourceCodeLocation={...s.sourceCodeLocation,...i}}};var ur="html",qd="about:legacy-compat",Wd="http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd",vr=["+//silmaril//dtd html pro v0r11 19970101//","-//as//dtd html 3.0 aswedit + extensions//","-//advasoft ltd//dtd html 3.0 aswedit + extensions//","-//ietf//dtd html 2.0 level 1//","-//ietf//dtd html 2.0 level 2//","-//ietf//dtd html 2.0 strict level 1//","-//ietf//dtd html 2.0 strict level 2//","-//ietf//dtd html 2.0 strict//","-//ietf//dtd html 2.0//","-//ietf//dtd html 2.1e//","-//ietf//dtd html 3.0//","-//ietf//dtd html 3.2 final//","-//ietf//dtd html 3.2//","-//ietf//dtd html 3//","-//ietf//dtd html level 0//","-//ietf//dtd html level 1//","-//ietf//dtd html level 2//","-//ietf//dtd html level 3//","-//ietf//dtd html strict level 0//","-//ietf//dtd html strict level 1//","-//ietf//dtd html strict level 2//","-//ietf//dtd html strict level 3//","-//ietf//dtd html strict//","-//ietf//dtd html//","-//metrius//dtd metrius presentational//","-//microsoft//dtd internet explorer 2.0 html strict//","-//microsoft//dtd internet explorer 2.0 html//","-//microsoft//dtd internet explorer 2.0 tables//","-//microsoft//dtd internet explorer 3.0 html strict//","-//microsoft//dtd internet explorer 3.0 html//","-//microsoft//dtd internet explorer 3.0 tables//","-//netscape comm. corp.//dtd html//","-//netscape comm. corp.//dtd strict html//","-//o'reilly and associates//dtd html 2.0//","-//o'reilly and associates//dtd html extended 1.0//","-//o'reilly and associates//dtd html extended relaxed 1.0//","-//sq//dtd html 2.0 hotmetal + extensions//","-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//","-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//","-//spyglass//dtd html 2.0 extended//","-//sun microsystems corp.//dtd hotjava html//","-//sun microsystems corp.//dtd hotjava strict html//","-//w3c//dtd html 3 1995-03-24//","-//w3c//dtd html 3.2 draft//","-//w3c//dtd html 3.2 final//","-//w3c//dtd html 3.2//","-//w3c//dtd html 3.2s draft//","-//w3c//dtd html 4.0 frameset//","-//w3c//dtd html 4.0 transitional//","-//w3c//dtd html experimental 19960712//","-//w3c//dtd html experimental 970421//","-//w3c//dtd w3 html//","-//w3o//dtd w3 html 3.0//","-//webtechs//dtd mozilla html 2.0//","-//webtechs//dtd mozilla html//"],zd=[...vr,"-//w3c//dtd html 4.01 frameset//","-//w3c//dtd html 4.01 transitional//"],Xd=new Set(["-//w3o//dtd w3 html strict 3.0//en//","-/w3c/dtd html 4.0 transitional/en","html"]),mr=["-//w3c//dtd xhtml 1.0 frameset//","-//w3c//dtd xhtml 1.0 transitional//"],Qd=[...mr,"-//w3c//dtd html 4.01 frameset//","-//w3c//dtd html 4.01 transitional//"];function cr(s,i){return i.some((a)=>s.startsWith(a))}function fr(s){return s.name===ur&&s.publicId===null&&(s.systemId===null||s.systemId===qd)}function lr(s){if(s.name!==ur)return E.QUIRKS;let{systemId:i}=s;if(i&&i.toLowerCase()===Wd)return E.QUIRKS;let{publicId:a}=s;if(a!==null){if(a=a.toLowerCase(),Xd.has(a))return E.QUIRKS;let e=i===null?zd:vr;if(cr(a,e))return E.QUIRKS;if(e=i===null?mr:Qd,cr(a,e))return E.LIMITED_QUIRKS}return E.NO_QUIRKS}var tr={TEXT_HTML:"text/html",APPLICATION_XML:"application/xhtml+xml"},Vd="definitionurl",Zd="definitionURL",Jd=new Map(["attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map((s)=>[s.toLowerCase(),s])),Yd=new Map([["xlink:actuate",{prefix:"xlink",name:"actuate",namespace:h.XLINK}],["xlink:arcrole",{prefix:"xlink",name:"arcrole",namespace:h.XLINK}],["xlink:href",{prefix:"xlink",name:"href",namespace:h.XLINK}],["xlink:role",{prefix:"xlink",name:"role",namespace:h.XLINK}],["xlink:show",{prefix:"xlink",name:"show",namespace:h.XLINK}],["xlink:title",{prefix:"xlink",name:"title",namespace:h.XLINK}],["xlink:type",{prefix:"xlink",name:"type",namespace:h.XLINK}],["xml:lang",{prefix:"xml",name:"lang",namespace:h.XML}],["xml:space",{prefix:"xml",name:"space",namespace:h.XML}],["xmlns",{prefix:"",name:"xmlns",namespace:h.XMLNS}],["xmlns:xlink",{prefix:"xmlns",name:"xlink",namespace:h.XMLNS}]]),Kd=new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map((s)=>[s.toLowerCase(),s])),Ud=new Set([r.B,r.BIG,r.BLOCKQUOTE,r.BODY,r.BR,r.CENTER,r.CODE,r.DD,r.DIV,r.DL,r.DT,r.EM,r.EMBED,r.H1,r.H2,r.H3,r.H4,r.H5,r.H6,r.HEAD,r.HR,r.I,r.IMG,r.LI,r.LISTING,r.MENU,r.META,r.NOBR,r.OL,r.P,r.PRE,r.RUBY,r.S,r.SMALL,r.SPAN,r.STRONG,r.STRIKE,r.SUB,r.SUP,r.TABLE,r.TT,r.U,r.UL,r.VAR]);function gr(s){let i=s.tagID;return i===r.FONT&&s.attrs.some(({name:e})=>e===vs.COLOR||e===vs.SIZE||e===vs.FACE)||Ud.has(i)}function $i(s){for(let i=0;i<s.attrs.length;i++)if(s.attrs[i].name===Vd){s.attrs[i].name=Zd;break}}function Ei(s){for(let i=0;i<s.attrs.length;i++){let a=Jd.get(s.attrs[i].name);if(a!=null)s.attrs[i].name=a}}function fi(s){for(let i=0;i<s.attrs.length;i++){let a=Yd.get(s.attrs[i].name);if(a)s.attrs[i].prefix=a.prefix,s.attrs[i].name=a.name,s.attrs[i].namespace=a.namespace}}function br(s){let i=Kd.get(s.tagName);if(i!=null)s.tagName=i,s.tagID=hs(s.tagName)}function Rd(s,i){return i===h.MATHML&&(s===r.MI||s===r.MO||s===r.MN||s===r.MS||s===r.MTEXT)}function nd(s,i,a){if(i===h.MATHML&&s===r.ANNOTATION_XML){for(let e=0;e<a.length;e++)if(a[e].name===vs.ENCODING){let d=a[e].value.toLowerCase();return d===tr.TEXT_HTML||d===tr.APPLICATION_XML}}return i===h.SVG&&(s===r.FOREIGN_OBJECT||s===r.DESC||s===r.TITLE)}function wr(s,i,a,e){return(!e||e===h.HTML)&&nd(s,i,a)||(!e||e===h.MATHML)&&Rd(s,i)}var Ld="hidden",Bd=8,Pd=3,l;(function(s){s[s.INITIAL=0]="INITIAL",s[s.BEFORE_HTML=1]="BEFORE_HTML",s[s.BEFORE_HEAD=2]="BEFORE_HEAD",s[s.IN_HEAD=3]="IN_HEAD",s[s.IN_HEAD_NO_SCRIPT=4]="IN_HEAD_NO_SCRIPT",s[s.AFTER_HEAD=5]="AFTER_HEAD",s[s.IN_BODY=6]="IN_BODY",s[s.TEXT=7]="TEXT",s[s.IN_TABLE=8]="IN_TABLE",s[s.IN_TABLE_TEXT=9]="IN_TABLE_TEXT",s[s.IN_CAPTION=10]="IN_CAPTION",s[s.IN_COLUMN_GROUP=11]="IN_COLUMN_GROUP",s[s.IN_TABLE_BODY=12]="IN_TABLE_BODY",s[s.IN_ROW=13]="IN_ROW",s[s.IN_CELL=14]="IN_CELL",s[s.IN_SELECT=15]="IN_SELECT",s[s.IN_SELECT_IN_TABLE=16]="IN_SELECT_IN_TABLE",s[s.IN_TEMPLATE=17]="IN_TEMPLATE",s[s.AFTER_BODY=18]="AFTER_BODY",s[s.IN_FRAMESET=19]="IN_FRAMESET",s[s.AFTER_FRAMESET=20]="AFTER_FRAMESET",s[s.AFTER_AFTER_BODY=21]="AFTER_AFTER_BODY",s[s.AFTER_AFTER_FRAMESET=22]="AFTER_AFTER_FRAMESET"})(l||(l={}));var Cd={startLine:-1,startCol:-1,startOffset:-1,endLine:-1,endCol:-1,endOffset:-1},Hr=new Set([r.TABLE,r.TBODY,r.TFOOT,r.THEAD,r.TR]),xr={scriptingEnabled:!0,sourceCodeLocationInfo:!1,treeAdapter:is,onParseError:null};class Ds{constructor(s,i,a=null,e=null){if(this.fragmentContext=a,this.scriptHandler=e,this.currentToken=null,this.stopped=!1,this.insertionMode=l.INITIAL,this.originalInsertionMode=l.INITIAL,this.headElement=null,this.formElement=null,this.currentNotInHTML=!1,this.tmplInsertionModeStack=[],this.pendingCharacterTokens=[],this.hasNonWhitespacePendingCharacterToken=!1,this.framesetOk=!0,this.skipNextNewLine=!1,this.fosterParentingEnabled=!1,this.options={...xr,...s},this.treeAdapter=this.options.treeAdapter,this.onParseError=this.options.onParseError,this.onParseError)this.options.sourceCodeLocationInfo=!0;this.document=i!==null&&i!==void 0?i:this.treeAdapter.createDocument(),this.tokenizer=new vi(this.options,this),this.activeFormattingElements=new Si(this.treeAdapter),this.fragmentContextID=a?hs(this.treeAdapter.getTagName(a)):r.UNKNOWN,this._setContextModes(a!==null&&a!==void 0?a:this.document,this.fragmentContextID),this.openElements=new Ni(this.document,this.treeAdapter,this)}static parse(s,i){let a=new this(i);return a.tokenizer.write(s,!0),a.document}static getFragmentParser(s,i){let a={...xr,...i};s!==null&&s!==void 0||(s=a.treeAdapter.createElement(b.TEMPLATE,h.HTML,[]));let e=a.treeAdapter.createElement("documentmock",h.HTML,[]),d=new this(a,e,s);if(d.fragmentContextID===r.TEMPLATE)d.tmplInsertionModeStack.unshift(l.IN_TEMPLATE);return d._initTokenizerForFragmentParsing(),d._insertFakeRootElement(),d._resetInsertionMode(),d._findFormInFragmentContext(),d}getFragment(){let s=this.treeAdapter.getFirstChild(this.document),i=this.treeAdapter.createDocumentFragment();return this._adoptNodes(s,i),i}_err(s,i,a){var e;if(!this.onParseError)return;let d=(e=s.location)!==null&&e!==void 0?e:Cd,c={code:i,startLine:d.startLine,startCol:d.startCol,startOffset:d.startOffset,endLine:a?d.startLine:d.endLine,endCol:a?d.startCol:d.endCol,endOffset:a?d.startOffset:d.endOffset};this.onParseError(c)}onItemPush(s,i,a){var e,d;if((d=(e=this.treeAdapter).onItemPush)===null||d===void 0||d.call(e,s),a&&this.openElements.stackTop>0)this._setContextModes(s,i)}onItemPop(s,i){var a,e;if(this.options.sourceCodeLocationInfo)this._setEndLocation(s,this.currentToken);if((e=(a=this.treeAdapter).onItemPop)===null||e===void 0||e.call(a,s,this.openElements.current),i){let d,c;if(this.openElements.stackTop===0&&this.fragmentContext)d=this.fragmentContext,c=this.fragmentContextID;else({current:d,currentTagId:c}=this.openElements);this._setContextModes(d,c)}}_setContextModes(s,i){let a=s===this.document||s&&this.treeAdapter.getNamespaceURI(s)===h.HTML;this.currentNotInHTML=!a,this.tokenizer.inForeignNode=!a&&s!==void 0&&i!==void 0&&!this._isIntegrationPoint(i,s)}_switchToTextParsing(s,i){this._insertElement(s,h.HTML),this.tokenizer.state=i,this.originalInsertionMode=this.insertionMode,this.insertionMode=l.TEXT}switchToPlaintextParsing(){this.insertionMode=l.TEXT,this.originalInsertionMode=l.IN_BODY,this.tokenizer.state=N.PLAINTEXT}_getAdjustedCurrentElement(){return this.openElements.stackTop===0&&this.fragmentContext?this.fragmentContext:this.openElements.current}_findFormInFragmentContext(){let s=this.fragmentContext;while(s){if(this.treeAdapter.getTagName(s)===b.FORM){this.formElement=s;break}s=this.treeAdapter.getParentNode(s)}}_initTokenizerForFragmentParsing(){if(!this.fragmentContext||this.treeAdapter.getNamespaceURI(this.fragmentContext)!==h.HTML)return;switch(this.fragmentContextID){case r.TITLE:case r.TEXTAREA:{this.tokenizer.state=N.RCDATA;break}case r.STYLE:case r.XMP:case r.IFRAME:case r.NOEMBED:case r.NOFRAMES:case r.NOSCRIPT:{this.tokenizer.state=N.RAWTEXT;break}case r.SCRIPT:{this.tokenizer.state=N.SCRIPT_DATA;break}case r.PLAINTEXT:{this.tokenizer.state=N.PLAINTEXT;break}default:}}_setDocumentType(s){let i=s.name||"",a=s.publicId||"",e=s.systemId||"";if(this.treeAdapter.setDocumentType(this.document,i,a,e),s.location){let c=this.treeAdapter.getChildNodes(this.document).find((f)=>this.treeAdapter.isDocumentTypeNode(f));if(c)this.treeAdapter.setNodeSourceCodeLocation(c,s.location)}}_attachElementToTree(s,i){if(this.options.sourceCodeLocationInfo){let a=i&&{...i,startTag:i};this.treeAdapter.setNodeSourceCodeLocation(s,a)}if(this._shouldFosterParentOnInsertion())this._fosterParentElement(s);else{let a=this.openElements.currentTmplContentOrNode;this.treeAdapter.appendChild(a!==null&&a!==void 0?a:this.document,s)}}_appendElement(s,i){let a=this.treeAdapter.createElement(s.tagName,i,s.attrs);this._attachElementToTree(a,s.location)}_insertElement(s,i){let a=this.treeAdapter.createElement(s.tagName,i,s.attrs);this._attachElementToTree(a,s.location),this.openElements.push(a,s.tagID)}_insertFakeElement(s,i){let a=this.treeAdapter.createElement(s,h.HTML,[]);this._attachElementToTree(a,null),this.openElements.push(a,i)}_insertTemplate(s){let i=this.treeAdapter.createElement(s.tagName,h.HTML,s.attrs),a=this.treeAdapter.createDocumentFragment();if(this.treeAdapter.setTemplateContent(i,a),this._attachElementToTree(i,s.location),this.openElements.push(i,s.tagID),this.options.sourceCodeLocationInfo)this.treeAdapter.setNodeSourceCodeLocation(a,null)}_insertFakeRootElement(){let s=this.treeAdapter.createElement(b.HTML,h.HTML,[]);if(this.options.sourceCodeLocationInfo)this.treeAdapter.setNodeSourceCodeLocation(s,null);this.treeAdapter.appendChild(this.openElements.current,s),this.openElements.push(s,r.HTML)}_appendCommentNode(s,i){let a=this.treeAdapter.createCommentNode(s.data);if(this.treeAdapter.appendChild(i,a),this.options.sourceCodeLocationInfo)this.treeAdapter.setNodeSourceCodeLocation(a,s.location)}_insertCharacters(s){let i,a;if(this._shouldFosterParentOnInsertion())if({parent:i,beforeElement:a}=this._findFosterParentingLocation(),a)this.treeAdapter.insertTextBefore(i,s.chars,a);else this.treeAdapter.insertText(i,s.chars);else i=this.openElements.currentTmplContentOrNode,this.treeAdapter.insertText(i,s.chars);if(!s.location)return;let e=this.treeAdapter.getChildNodes(i),d=a?e.lastIndexOf(a):e.length,c=e[d-1];if(this.treeAdapter.getNodeSourceCodeLocation(c)){let{endLine:v,endCol:t,endOffset:g}=s.location;this.treeAdapter.updateNodeSourceCodeLocation(c,{endLine:v,endCol:t,endOffset:g})}else if(this.options.sourceCodeLocationInfo)this.treeAdapter.setNodeSourceCodeLocation(c,s.location)}_adoptNodes(s,i){for(let a=this.treeAdapter.getFirstChild(s);a;a=this.treeAdapter.getFirstChild(s))this.treeAdapter.detachNode(a),this.treeAdapter.appendChild(i,a)}_setEndLocation(s,i){if(this.treeAdapter.getNodeSourceCodeLocation(s)&&i.location){let a=i.location,e=this.treeAdapter.getTagName(s),d=i.type===X.END_TAG&&e===i.tagName?{endTag:{...a},endLine:a.endLine,endCol:a.endCol,endOffset:a.endOffset}:{endLine:a.startLine,endCol:a.startCol,endOffset:a.startOffset};this.treeAdapter.updateNodeSourceCodeLocation(s,d)}}shouldProcessStartTagTokenInForeignContent(s){if(!this.currentNotInHTML)return!1;let i,a;if(this.openElements.stackTop===0&&this.fragmentContext)i=this.fragmentContext,a=this.fragmentContextID;else({current:i,currentTagId:a}=this.openElements);if(s.tagID===r.SVG&&this.treeAdapter.getTagName(i)===b.ANNOTATION_XML&&this.treeAdapter.getNamespaceURI(i)===h.MATHML)return!1;return this.tokenizer.inForeignNode||(s.tagID===r.MGLYPH||s.tagID===r.MALIGNMARK)&&a!==void 0&&!this._isIntegrationPoint(a,i,h.HTML)}_processToken(s){switch(s.type){case X.CHARACTER:{this.onCharacter(s);break}case X.NULL_CHARACTER:{this.onNullCharacter(s);break}case X.COMMENT:{this.onComment(s);break}case X.DOCTYPE:{this.onDoctype(s);break}case X.START_TAG:{this._processStartTag(s);break}case X.END_TAG:{this.onEndTag(s);break}case X.EOF:{this.onEof(s);break}case X.WHITESPACE_CHARACTER:{this.onWhitespaceCharacter(s);break}}}_isIntegrationPoint(s,i,a){let e=this.treeAdapter.getNamespaceURI(i),d=this.treeAdapter.getAttrList(i);return wr(s,e,d,a)}_reconstructActiveFormattingElements(){let s=this.activeFormattingElements.entries.length;if(s){let i=this.activeFormattingElements.entries.findIndex((e)=>e.type===ss.Marker||this.openElements.contains(e.element)),a=i===-1?s-1:i-1;for(let e=a;e>=0;e--){let d=this.activeFormattingElements.entries[e];this._insertElement(d.token,this.treeAdapter.getNamespaceURI(d.element)),d.element=this.openElements.current}}}_closeTableCell(){this.openElements.generateImpliedEndTags(),this.openElements.popUntilTableCellPopped(),this.activeFormattingElements.clearToLastMarker(),this.insertionMode=l.IN_ROW}_closePElement(){this.openElements.generateImpliedEndTagsWithExclusion(r.P),this.openElements.popUntilTagNamePopped(r.P)}_resetInsertionMode(){for(let s=this.openElements.stackTop;s>=0;s--)switch(s===0&&this.fragmentContext?this.fragmentContextID:this.openElements.tagIDs[s]){case r.TR:{this.insertionMode=l.IN_ROW;return}case r.TBODY:case r.THEAD:case r.TFOOT:{this.insertionMode=l.IN_TABLE_BODY;return}case r.CAPTION:{this.insertionMode=l.IN_CAPTION;return}case r.COLGROUP:{this.insertionMode=l.IN_COLUMN_GROUP;return}case r.TABLE:{this.insertionMode=l.IN_TABLE;return}case r.BODY:{this.insertionMode=l.IN_BODY;return}case r.FRAMESET:{this.insertionMode=l.IN_FRAMESET;return}case r.SELECT:{this._resetInsertionModeForSelect(s);return}case r.TEMPLATE:{this.insertionMode=this.tmplInsertionModeStack[0];return}case r.HTML:{this.insertionMode=this.headElement?l.AFTER_HEAD:l.BEFORE_HEAD;return}case r.TD:case r.TH:{if(s>0){this.insertionMode=l.IN_CELL;return}break}case r.HEAD:{if(s>0){this.insertionMode=l.IN_HEAD;return}break}}this.insertionMode=l.IN_BODY}_resetInsertionModeForSelect(s){if(s>0)for(let i=s-1;i>0;i--){let a=this.openElements.tagIDs[i];if(a===r.TEMPLATE)break;else if(a===r.TABLE){this.insertionMode=l.IN_SELECT_IN_TABLE;return}}this.insertionMode=l.IN_SELECT}_isElementCausesFosterParenting(s){return Hr.has(s)}_shouldFosterParentOnInsertion(){return this.fosterParentingEnabled&&this.openElements.currentTagId!==void 0&&this._isElementCausesFosterParenting(this.openElements.currentTagId)}_findFosterParentingLocation(){for(let s=this.openElements.stackTop;s>=0;s--){let i=this.openElements.items[s];switch(this.openElements.tagIDs[s]){case r.TEMPLATE:{if(this.treeAdapter.getNamespaceURI(i)===h.HTML)return{parent:this.treeAdapter.getTemplateContent(i),beforeElement:null};break}case r.TABLE:{let a=this.treeAdapter.getParentNode(i);if(a)return{parent:a,beforeElement:i};return{parent:this.openElements.items[s-1],beforeElement:null}}default:}}return{parent:this.openElements.items[0],beforeElement:null}}_fosterParentElement(s){let i=this._findFosterParentingLocation();if(i.beforeElement)this.treeAdapter.insertBefore(i.parent,s,i.beforeElement);else this.treeAdapter.appendChild(i.parent,s)}_isSpecialElement(s,i){let a=this.treeAdapter.getNamespaceURI(s);return _a[a].has(i)}onCharacter(s){if(this.skipNextNewLine=!1,this.tokenizer.inForeignNode){wu(this,s);return}switch(this.insertionMode){case l.INITIAL:{Cs(this,s);break}case l.BEFORE_HTML:{Ms(this,s);break}case l.BEFORE_HEAD:{Ns(this,s);break}case l.IN_HEAD:{Ss(this,s);break}case l.IN_HEAD_NO_SCRIPT:{$s(this,s);break}case l.AFTER_HEAD:{Es(this,s);break}case l.IN_BODY:case l.IN_CAPTION:case l.IN_CELL:case l.IN_TEMPLATE:{qr(this,s);break}case l.TEXT:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:{this._insertCharacters(s);break}case l.IN_TABLE:case l.IN_TABLE_BODY:case l.IN_ROW:{Ii(this,s);break}case l.IN_TABLE_TEXT:{Vr(this,s);break}case l.IN_COLUMN_GROUP:{ti(this,s);break}case l.AFTER_BODY:{gi(this,s);break}case l.AFTER_AFTER_BODY:{li(this,s);break}default:}}onNullCharacter(s){if(this.skipNextNewLine=!1,this.tokenizer.inForeignNode){bu(this,s);return}switch(this.insertionMode){case l.INITIAL:{Cs(this,s);break}case l.BEFORE_HTML:{Ms(this,s);break}case l.BEFORE_HEAD:{Ns(this,s);break}case l.IN_HEAD:{Ss(this,s);break}case l.IN_HEAD_NO_SCRIPT:{$s(this,s);break}case l.AFTER_HEAD:{Es(this,s);break}case l.TEXT:{this._insertCharacters(s);break}case l.IN_TABLE:case l.IN_TABLE_BODY:case l.IN_ROW:{Ii(this,s);break}case l.IN_COLUMN_GROUP:{ti(this,s);break}case l.AFTER_BODY:{gi(this,s);break}case l.AFTER_AFTER_BODY:{li(this,s);break}default:}}onComment(s){if(this.skipNextNewLine=!1,this.currentNotInHTML){Di(this,s);return}switch(this.insertionMode){case l.INITIAL:case l.BEFORE_HTML:case l.BEFORE_HEAD:case l.IN_HEAD:case l.IN_HEAD_NO_SCRIPT:case l.AFTER_HEAD:case l.IN_BODY:case l.IN_TABLE:case l.IN_CAPTION:case l.IN_COLUMN_GROUP:case l.IN_TABLE_BODY:case l.IN_ROW:case l.IN_CELL:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:case l.IN_TEMPLATE:case l.IN_FRAMESET:case l.AFTER_FRAMESET:{Di(this,s);break}case l.IN_TABLE_TEXT:{Os(this,s);break}case l.AFTER_BODY:{Id(this,s);break}case l.AFTER_AFTER_BODY:case l.AFTER_AFTER_FRAMESET:{Dd(this,s);break}default:}}onDoctype(s){switch(this.skipNextNewLine=!1,this.insertionMode){case l.INITIAL:{kd(this,s);break}case l.BEFORE_HEAD:case l.IN_HEAD:case l.IN_HEAD_NO_SCRIPT:case l.AFTER_HEAD:{this._err(s,w.misplacedDoctype);break}case l.IN_TABLE_TEXT:{Os(this,s);break}default:}}onStartTag(s){if(this.skipNextNewLine=!1,this.currentToken=s,this._processStartTag(s),s.selfClosing&&!s.ackSelfClosing)this._err(s,w.nonVoidHtmlElementStartTagWithTrailingSolidus)}_processStartTag(s){if(this.shouldProcessStartTagTokenInForeignContent(s))yu(this,s);else this._startTagOutsideForeignContent(s)}_startTagOutsideForeignContent(s){switch(this.insertionMode){case l.INITIAL:{Cs(this,s);break}case l.BEFORE_HTML:{Gd(this,s);break}case l.BEFORE_HEAD:{_d(this,s);break}case l.IN_HEAD:{as(this,s);break}case l.IN_HEAD_NO_SCRIPT:{sc(this,s);break}case l.AFTER_HEAD:{ac(this,s);break}case l.IN_BODY:{S(this,s);break}case l.IN_TABLE:{Xs(this,s);break}case l.IN_TABLE_TEXT:{Os(this,s);break}case l.IN_CAPTION:{Ac(this,s);break}case l.IN_COLUMN_GROUP:{_i(this,s);break}case l.IN_TABLE_BODY:{yi(this,s);break}case l.IN_ROW:{xi(this,s);break}case l.IN_CELL:{iu(this,s);break}case l.IN_SELECT:{Yr(this,s);break}case l.IN_SELECT_IN_TABLE:{ru(this,s);break}case l.IN_TEMPLATE:{du(this,s);break}case l.AFTER_BODY:{uu(this,s);break}case l.IN_FRAMESET:{vu(this,s);break}case l.AFTER_FRAMESET:{fu(this,s);break}case l.AFTER_AFTER_BODY:{tu(this,s);break}case l.AFTER_AFTER_FRAMESET:{gu(this,s);break}default:}}onEndTag(s){if(this.skipNextNewLine=!1,this.currentToken=s,this.currentNotInHTML)xu(this,s);else this._endTagOutsideForeignContent(s)}_endTagOutsideForeignContent(s){switch(this.insertionMode){case l.INITIAL:{Cs(this,s);break}case l.BEFORE_HTML:{pd(this,s);break}case l.BEFORE_HEAD:{Ad(this,s);break}case l.IN_HEAD:{Td(this,s);break}case l.IN_HEAD_NO_SCRIPT:{ic(this,s);break}case l.AFTER_HEAD:{rc(this,s);break}case l.IN_BODY:{wi(this,s);break}case l.TEXT:{Nc(this,s);break}case l.IN_TABLE:{Is(this,s);break}case l.IN_TABLE_TEXT:{Os(this,s);break}case l.IN_CAPTION:{Tc(this,s);break}case l.IN_COLUMN_GROUP:{su(this,s);break}case l.IN_TABLE_BODY:{ki(this,s);break}case l.IN_ROW:{Jr(this,s);break}case l.IN_CELL:{au(this,s);break}case l.IN_SELECT:{Kr(this,s);break}case l.IN_SELECT_IN_TABLE:{eu(this,s);break}case l.IN_TEMPLATE:{cu(this,s);break}case l.AFTER_BODY:{Rr(this,s);break}case l.IN_FRAMESET:{mu(this,s);break}case l.AFTER_FRAMESET:{lu(this,s);break}case l.AFTER_AFTER_BODY:{li(this,s);break}default:}}onEof(s){switch(this.insertionMode){case l.INITIAL:{Cs(this,s);break}case l.BEFORE_HTML:{Ms(this,s);break}case l.BEFORE_HEAD:{Ns(this,s);break}case l.IN_HEAD:{Ss(this,s);break}case l.IN_HEAD_NO_SCRIPT:{$s(this,s);break}case l.AFTER_HEAD:{Es(this,s);break}case l.IN_BODY:case l.IN_TABLE:case l.IN_CAPTION:case l.IN_COLUMN_GROUP:case l.IN_TABLE_BODY:case l.IN_ROW:case l.IN_CELL:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:{Qr(this,s);break}case l.TEXT:{Sc(this,s);break}case l.IN_TABLE_TEXT:{Os(this,s);break}case l.IN_TEMPLATE:{Ur(this,s);break}case l.AFTER_BODY:case l.IN_FRAMESET:case l.AFTER_FRAMESET:case l.AFTER_AFTER_BODY:case l.AFTER_AFTER_FRAMESET:{pi(this,s);break}default:}}onWhitespaceCharacter(s){if(this.skipNextNewLine){if(this.skipNextNewLine=!1,s.chars.charCodeAt(0)===u.LINE_FEED){if(s.chars.length===1)return;s.chars=s.chars.substr(1)}}if(this.tokenizer.inForeignNode){this._insertCharacters(s);return}switch(this.insertionMode){case l.IN_HEAD:case l.IN_HEAD_NO_SCRIPT:case l.AFTER_HEAD:case l.TEXT:case l.IN_COLUMN_GROUP:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:case l.IN_FRAMESET:case l.AFTER_FRAMESET:{this._insertCharacters(s);break}case l.IN_BODY:case l.IN_CAPTION:case l.IN_CELL:case l.IN_TEMPLATE:case l.AFTER_BODY:case l.AFTER_AFTER_BODY:case l.AFTER_AFTER_FRAMESET:{jr(this,s);break}case l.IN_TABLE:case l.IN_TABLE_BODY:case l.IN_ROW:{Ii(this,s);break}case l.IN_TABLE_TEXT:{Fr(this,s);break}default:}}}function Od(s,i){let a=s.activeFormattingElements.getElementEntryInScopeWithTagName(i.tagName);if(a){if(!s.openElements.contains(a.element))s.activeFormattingElements.removeEntry(a),a=null;else if(!s.openElements.hasInScope(i.tagID))a=null}else Xr(s,i);return a}function Md(s,i){let a=null,e=s.openElements.stackTop;for(;e>=0;e--){let d=s.openElements.items[e];if(d===i.element)break;if(s._isSpecialElement(d,s.openElements.tagIDs[e]))a=d}if(!a)s.openElements.shortenToLength(Math.max(e,0)),s.activeFormattingElements.removeEntry(i);return a}function Nd(s,i,a){let e=i,d=s.openElements.getCommonAncestor(i);for(let c=0,f=d;f!==a;c++,f=d){d=s.openElements.getCommonAncestor(f);let v=s.activeFormattingElements.getElementEntry(f),t=v&&c>=Pd;if(!v||t){if(t)s.activeFormattingElements.removeEntry(v);s.openElements.remove(f)}else{if(f=Sd(s,v),e===i)s.activeFormattingElements.bookmark=v;s.treeAdapter.detachNode(e),s.treeAdapter.appendChild(f,e),e=f}}return e}function Sd(s,i){let a=s.treeAdapter.getNamespaceURI(i.element),e=s.treeAdapter.createElement(i.token.tagName,a,i.token.attrs);return s.openElements.replace(i.element,e),i.element=e,e}function $d(s,i,a){let e=s.treeAdapter.getTagName(i),d=hs(e);if(s._isElementCausesFosterParenting(d))s._fosterParentElement(a);else{let c=s.treeAdapter.getNamespaceURI(i);if(d===r.TEMPLATE&&c===h.HTML)i=s.treeAdapter.getTemplateContent(i);s.treeAdapter.appendChild(i,a)}}function Ed(s,i,a){let e=s.treeAdapter.getNamespaceURI(a.element),{token:d}=a,c=s.treeAdapter.createElement(d.tagName,e,d.attrs);s._adoptNodes(i,c),s.treeAdapter.appendChild(i,c),s.activeFormattingElements.insertElementAfterBookmark(c,d),s.activeFormattingElements.removeEntry(a),s.openElements.remove(a.element),s.openElements.insertAfter(i,c,d.tagID)}function Gi(s,i){for(let a=0;a<Bd;a++){let e=Od(s,i);if(!e)break;let d=Md(s,e);if(!d)break;s.activeFormattingElements.bookmark=e;let c=Nd(s,d,e.element),f=s.openElements.getCommonAncestor(e.element);if(s.treeAdapter.detachNode(c),f)$d(s,f,c);Ed(s,d,e)}}function Di(s,i){s._appendCommentNode(i,s.openElements.currentTmplContentOrNode)}function Id(s,i){s._appendCommentNode(i,s.openElements.items[0])}function Dd(s,i){s._appendCommentNode(i,s.document)}function pi(s,i){if(s.stopped=!0,i.location){let a=s.fragmentContext?0:2;for(let e=s.openElements.stackTop;e>=a;e--)s._setEndLocation(s.openElements.items[e],i);if(!s.fragmentContext&&s.openElements.stackTop>=0){let e=s.openElements.items[0],d=s.treeAdapter.getNodeSourceCodeLocation(e);if(d&&!d.endTag){if(s._setEndLocation(e,i),s.openElements.stackTop>=1){let c=s.openElements.items[1],f=s.treeAdapter.getNodeSourceCodeLocation(c);if(f&&!f.endTag)s._setEndLocation(c,i)}}}}}function kd(s,i){s._setDocumentType(i);let a=i.forceQuirks?E.QUIRKS:lr(i);if(!fr(i))s._err(i,w.nonConformingDoctype);s.treeAdapter.setDocumentMode(s.document,a),s.insertionMode=l.BEFORE_HTML}function Cs(s,i){s._err(i,w.missingDoctype,!0),s.treeAdapter.setDocumentMode(s.document,E.QUIRKS),s.insertionMode=l.BEFORE_HTML,s._processToken(i)}function Gd(s,i){if(i.tagID===r.HTML)s._insertElement(i,h.HTML),s.insertionMode=l.BEFORE_HEAD;else Ms(s,i)}function pd(s,i){let a=i.tagID;if(a===r.HTML||a===r.HEAD||a===r.BODY||a===r.BR)Ms(s,i)}function Ms(s,i){s._insertFakeRootElement(),s.insertionMode=l.BEFORE_HEAD,s._processToken(i)}function _d(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.HEAD:{s._insertElement(i,h.HTML),s.headElement=s.openElements.current,s.insertionMode=l.IN_HEAD;break}default:Ns(s,i)}}function Ad(s,i){let a=i.tagID;if(a===r.HEAD||a===r.BODY||a===r.HTML||a===r.BR)Ns(s,i);else s._err(i,w.endTagWithoutMatchingOpenElement)}function Ns(s,i){s._insertFakeElement(b.HEAD,r.HEAD),s.headElement=s.openElements.current,s.insertionMode=l.IN_HEAD,s._processToken(i)}function as(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.BASE:case r.BASEFONT:case r.BGSOUND:case r.LINK:case r.META:{s._appendElement(i,h.HTML),i.ackSelfClosing=!0;break}case r.TITLE:{s._switchToTextParsing(i,N.RCDATA);break}case r.NOSCRIPT:{if(s.options.scriptingEnabled)s._switchToTextParsing(i,N.RAWTEXT);else s._insertElement(i,h.HTML),s.insertionMode=l.IN_HEAD_NO_SCRIPT;break}case r.NOFRAMES:case r.STYLE:{s._switchToTextParsing(i,N.RAWTEXT);break}case r.SCRIPT:{s._switchToTextParsing(i,N.SCRIPT_DATA);break}case r.TEMPLATE:{s._insertTemplate(i),s.activeFormattingElements.insertMarker(),s.framesetOk=!1,s.insertionMode=l.IN_TEMPLATE,s.tmplInsertionModeStack.unshift(l.IN_TEMPLATE);break}case r.HEAD:{s._err(i,w.misplacedStartTagForHeadElement);break}default:Ss(s,i)}}function Td(s,i){switch(i.tagID){case r.HEAD:{s.openElements.pop(),s.insertionMode=l.AFTER_HEAD;break}case r.BODY:case r.BR:case r.HTML:{Ss(s,i);break}case r.TEMPLATE:{Hs(s,i);break}default:s._err(i,w.endTagWithoutMatchingOpenElement)}}function Hs(s,i){if(s.openElements.tmplCount>0){if(s.openElements.generateImpliedEndTagsThoroughly(),s.openElements.currentTagId!==r.TEMPLATE)s._err(i,w.closingOfElementWithOpenChildElements);s.openElements.popUntilTagNamePopped(r.TEMPLATE),s.activeFormattingElements.clearToLastMarker(),s.tmplInsertionModeStack.shift(),s._resetInsertionMode()}else s._err(i,w.endTagWithoutMatchingOpenElement)}function Ss(s,i){s.openElements.pop(),s.insertionMode=l.AFTER_HEAD,s._processToken(i)}function sc(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.BASEFONT:case r.BGSOUND:case r.HEAD:case r.LINK:case r.META:case r.NOFRAMES:case r.STYLE:{as(s,i);break}case r.NOSCRIPT:{s._err(i,w.nestedNoscriptInHead);break}default:$s(s,i)}}function ic(s,i){switch(i.tagID){case r.NOSCRIPT:{s.openElements.pop(),s.insertionMode=l.IN_HEAD;break}case r.BR:{$s(s,i);break}default:s._err(i,w.endTagWithoutMatchingOpenElement)}}function $s(s,i){let a=i.type===X.EOF?w.openElementsLeftAfterEof:w.disallowedContentInNoscriptInHead;s._err(i,a),s.openElements.pop(),s.insertionMode=l.IN_HEAD,s._processToken(i)}function ac(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.BODY:{s._insertElement(i,h.HTML),s.framesetOk=!1,s.insertionMode=l.IN_BODY;break}case r.FRAMESET:{s._insertElement(i,h.HTML),s.insertionMode=l.IN_FRAMESET;break}case r.BASE:case r.BASEFONT:case r.BGSOUND:case r.LINK:case r.META:case r.NOFRAMES:case r.SCRIPT:case r.STYLE:case r.TEMPLATE:case r.TITLE:{s._err(i,w.abandonedHeadElementChild),s.openElements.push(s.headElement,r.HEAD),as(s,i),s.openElements.remove(s.headElement);break}case r.HEAD:{s._err(i,w.misplacedStartTagForHeadElement);break}default:Es(s,i)}}function rc(s,i){switch(i.tagID){case r.BODY:case r.HTML:case r.BR:{Es(s,i);break}case r.TEMPLATE:{Hs(s,i);break}default:s._err(i,w.endTagWithoutMatchingOpenElement)}}function Es(s,i){s._insertFakeElement(b.BODY,r.BODY),s.insertionMode=l.IN_BODY,bi(s,i)}function bi(s,i){switch(i.type){case X.CHARACTER:{qr(s,i);break}case X.WHITESPACE_CHARACTER:{jr(s,i);break}case X.COMMENT:{Di(s,i);break}case X.START_TAG:{S(s,i);break}case X.END_TAG:{wi(s,i);break}case X.EOF:{Qr(s,i);break}default:}}function jr(s,i){s._reconstructActiveFormattingElements(),s._insertCharacters(i)}function qr(s,i){s._reconstructActiveFormattingElements(),s._insertCharacters(i),s.framesetOk=!1}function ec(s,i){if(s.openElements.tmplCount===0)s.treeAdapter.adoptAttributes(s.openElements.items[0],i.attrs)}function dc(s,i){let a=s.openElements.tryPeekProperlyNestedBodyElement();if(a&&s.openElements.tmplCount===0)s.framesetOk=!1,s.treeAdapter.adoptAttributes(a,i.attrs)}function cc(s,i){let a=s.openElements.tryPeekProperlyNestedBodyElement();if(s.framesetOk&&a)s.treeAdapter.detachNode(a),s.openElements.popAllUpToHtmlElement(),s._insertElement(i,h.HTML),s.insertionMode=l.IN_FRAMESET}function uc(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._insertElement(i,h.HTML)}function vc(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();if(s.openElements.currentTagId!==void 0&&Bs.has(s.openElements.currentTagId))s.openElements.pop();s._insertElement(i,h.HTML)}function mc(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._insertElement(i,h.HTML),s.skipNextNewLine=!0,s.framesetOk=!1}function fc(s,i){let a=s.openElements.tmplCount>0;if(!s.formElement||a){if(s.openElements.hasInButtonScope(r.P))s._closePElement();if(s._insertElement(i,h.HTML),!a)s.formElement=s.openElements.current}}function lc(s,i){s.framesetOk=!1;let a=i.tagID;for(let e=s.openElements.stackTop;e>=0;e--){let d=s.openElements.tagIDs[e];if(a===r.LI&&d===r.LI||(a===r.DD||a===r.DT)&&(d===r.DD||d===r.DT)){s.openElements.generateImpliedEndTagsWithExclusion(d),s.openElements.popUntilTagNamePopped(d);break}if(d!==r.ADDRESS&&d!==r.DIV&&d!==r.P&&s._isSpecialElement(s.openElements.items[e],d))break}if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._insertElement(i,h.HTML)}function tc(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._insertElement(i,h.HTML),s.tokenizer.state=N.PLAINTEXT}function gc(s,i){if(s.openElements.hasInScope(r.BUTTON))s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(r.BUTTON);s._reconstructActiveFormattingElements(),s._insertElement(i,h.HTML),s.framesetOk=!1}function bc(s,i){let a=s.activeFormattingElements.getElementEntryInScopeWithTagName(b.A);if(a)Gi(s,i),s.openElements.remove(a.element),s.activeFormattingElements.removeEntry(a);s._reconstructActiveFormattingElements(),s._insertElement(i,h.HTML),s.activeFormattingElements.pushElement(s.openElements.current,i)}function wc(s,i){s._reconstructActiveFormattingElements(),s._insertElement(i,h.HTML),s.activeFormattingElements.pushElement(s.openElements.current,i)}function yc(s,i){if(s._reconstructActiveFormattingElements(),s.openElements.hasInScope(r.NOBR))Gi(s,i),s._reconstructActiveFormattingElements();s._insertElement(i,h.HTML),s.activeFormattingElements.pushElement(s.openElements.current,i)}function xc(s,i){s._reconstructActiveFormattingElements(),s._insertElement(i,h.HTML),s.activeFormattingElements.insertMarker(),s.framesetOk=!1}function oc(s,i){if(s.treeAdapter.getDocumentMode(s.document)!==E.QUIRKS&&s.openElements.hasInButtonScope(r.P))s._closePElement();s._insertElement(i,h.HTML),s.framesetOk=!1,s.insertionMode=l.IN_TABLE}function Wr(s,i){s._reconstructActiveFormattingElements(),s._appendElement(i,h.HTML),s.framesetOk=!1,i.ackSelfClosing=!0}function zr(s){let i=ci(s,vs.TYPE);return i!=null&&i.toLowerCase()===Ld}function hc(s,i){if(s._reconstructActiveFormattingElements(),s._appendElement(i,h.HTML),!zr(i))s.framesetOk=!1;i.ackSelfClosing=!0}function Hc(s,i){s._appendElement(i,h.HTML),i.ackSelfClosing=!0}function jc(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._appendElement(i,h.HTML),s.framesetOk=!1,i.ackSelfClosing=!0}function qc(s,i){i.tagName=b.IMG,i.tagID=r.IMG,Wr(s,i)}function Wc(s,i){s._insertElement(i,h.HTML),s.skipNextNewLine=!0,s.tokenizer.state=N.RCDATA,s.originalInsertionMode=s.insertionMode,s.framesetOk=!1,s.insertionMode=l.TEXT}function zc(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._reconstructActiveFormattingElements(),s.framesetOk=!1,s._switchToTextParsing(i,N.RAWTEXT)}function Xc(s,i){s.framesetOk=!1,s._switchToTextParsing(i,N.RAWTEXT)}function or(s,i){s._switchToTextParsing(i,N.RAWTEXT)}function Qc(s,i){s._reconstructActiveFormattingElements(),s._insertElement(i,h.HTML),s.framesetOk=!1,s.insertionMode=s.insertionMode===l.IN_TABLE||s.insertionMode===l.IN_CAPTION||s.insertionMode===l.IN_TABLE_BODY||s.insertionMode===l.IN_ROW||s.insertionMode===l.IN_CELL?l.IN_SELECT_IN_TABLE:l.IN_SELECT}function Fc(s,i){if(s.openElements.currentTagId===r.OPTION)s.openElements.pop();s._reconstructActiveFormattingElements(),s._insertElement(i,h.HTML)}function Vc(s,i){if(s.openElements.hasInScope(r.RUBY))s.openElements.generateImpliedEndTags();s._insertElement(i,h.HTML)}function Zc(s,i){if(s.openElements.hasInScope(r.RUBY))s.openElements.generateImpliedEndTagsWithExclusion(r.RTC);s._insertElement(i,h.HTML)}function Jc(s,i){if(s._reconstructActiveFormattingElements(),$i(i),fi(i),i.selfClosing)s._appendElement(i,h.MATHML);else s._insertElement(i,h.MATHML);i.ackSelfClosing=!0}function Yc(s,i){if(s._reconstructActiveFormattingElements(),Ei(i),fi(i),i.selfClosing)s._appendElement(i,h.SVG);else s._insertElement(i,h.SVG);i.ackSelfClosing=!0}function hr(s,i){s._reconstructActiveFormattingElements(),s._insertElement(i,h.HTML)}function S(s,i){switch(i.tagID){case r.I:case r.S:case r.B:case r.U:case r.EM:case r.TT:case r.BIG:case r.CODE:case r.FONT:case r.SMALL:case r.STRIKE:case r.STRONG:{wc(s,i);break}case r.A:{bc(s,i);break}case r.H1:case r.H2:case r.H3:case r.H4:case r.H5:case r.H6:{vc(s,i);break}case r.P:case r.DL:case r.OL:case r.UL:case r.DIV:case r.DIR:case r.NAV:case r.MAIN:case r.MENU:case r.ASIDE:case r.CENTER:case r.FIGURE:case r.FOOTER:case r.HEADER:case r.HGROUP:case r.DIALOG:case r.DETAILS:case r.ADDRESS:case r.ARTICLE:case r.SEARCH:case r.SECTION:case r.SUMMARY:case r.FIELDSET:case r.BLOCKQUOTE:case r.FIGCAPTION:{uc(s,i);break}case r.LI:case r.DD:case r.DT:{lc(s,i);break}case r.BR:case r.IMG:case r.WBR:case r.AREA:case r.EMBED:case r.KEYGEN:{Wr(s,i);break}case r.HR:{jc(s,i);break}case r.RB:case r.RTC:{Vc(s,i);break}case r.RT:case r.RP:{Zc(s,i);break}case r.PRE:case r.LISTING:{mc(s,i);break}case r.XMP:{zc(s,i);break}case r.SVG:{Yc(s,i);break}case r.HTML:{ec(s,i);break}case r.BASE:case r.LINK:case r.META:case r.STYLE:case r.TITLE:case r.SCRIPT:case r.BGSOUND:case r.BASEFONT:case r.TEMPLATE:{as(s,i);break}case r.BODY:{dc(s,i);break}case r.FORM:{fc(s,i);break}case r.NOBR:{yc(s,i);break}case r.MATH:{Jc(s,i);break}case r.TABLE:{oc(s,i);break}case r.INPUT:{hc(s,i);break}case r.PARAM:case r.TRACK:case r.SOURCE:{Hc(s,i);break}case r.IMAGE:{qc(s,i);break}case r.BUTTON:{gc(s,i);break}case r.APPLET:case r.OBJECT:case r.MARQUEE:{xc(s,i);break}case r.IFRAME:{Xc(s,i);break}case r.SELECT:{Qc(s,i);break}case r.OPTION:case r.OPTGROUP:{Fc(s,i);break}case r.NOEMBED:case r.NOFRAMES:{or(s,i);break}case r.FRAMESET:{cc(s,i);break}case r.TEXTAREA:{Wc(s,i);break}case r.NOSCRIPT:{if(s.options.scriptingEnabled)or(s,i);else hr(s,i);break}case r.PLAINTEXT:{tc(s,i);break}case r.COL:case r.TH:case r.TD:case r.TR:case r.HEAD:case r.FRAME:case r.TBODY:case r.TFOOT:case r.THEAD:case r.CAPTION:case r.COLGROUP:break;default:hr(s,i)}}function Kc(s,i){if(s.openElements.hasInScope(r.BODY)){if(s.insertionMode=l.AFTER_BODY,s.options.sourceCodeLocationInfo){let a=s.openElements.tryPeekProperlyNestedBodyElement();if(a)s._setEndLocation(a,i)}}}function Uc(s,i){if(s.openElements.hasInScope(r.BODY))s.insertionMode=l.AFTER_BODY,Rr(s,i)}function Rc(s,i){let a=i.tagID;if(s.openElements.hasInScope(a))s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(a)}function nc(s){let i=s.openElements.tmplCount>0,{formElement:a}=s;if(!i)s.formElement=null;if((a||i)&&s.openElements.hasInScope(r.FORM)){if(s.openElements.generateImpliedEndTags(),i)s.openElements.popUntilTagNamePopped(r.FORM);else if(a)s.openElements.remove(a)}}function Lc(s){if(!s.openElements.hasInButtonScope(r.P))s._insertFakeElement(b.P,r.P);s._closePElement()}function Bc(s){if(s.openElements.hasInListItemScope(r.LI))s.openElements.generateImpliedEndTagsWithExclusion(r.LI),s.openElements.popUntilTagNamePopped(r.LI)}function Pc(s,i){let a=i.tagID;if(s.openElements.hasInScope(a))s.openElements.generateImpliedEndTagsWithExclusion(a),s.openElements.popUntilTagNamePopped(a)}function Cc(s){if(s.openElements.hasNumberedHeaderInScope())s.openElements.generateImpliedEndTags(),s.openElements.popUntilNumberedHeaderPopped()}function Oc(s,i){let a=i.tagID;if(s.openElements.hasInScope(a))s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(a),s.activeFormattingElements.clearToLastMarker()}function Mc(s){s._reconstructActiveFormattingElements(),s._insertFakeElement(b.BR,r.BR),s.openElements.pop(),s.framesetOk=!1}function Xr(s,i){let{tagName:a,tagID:e}=i;for(let d=s.openElements.stackTop;d>0;d--){let c=s.openElements.items[d],f=s.openElements.tagIDs[d];if(e===f&&(e!==r.UNKNOWN||s.treeAdapter.getTagName(c)===a)){if(s.openElements.generateImpliedEndTagsWithExclusion(e),s.openElements.stackTop>=d)s.openElements.shortenToLength(d);break}if(s._isSpecialElement(c,f))break}}function wi(s,i){switch(i.tagID){case r.A:case r.B:case r.I:case r.S:case r.U:case r.EM:case r.TT:case r.BIG:case r.CODE:case r.FONT:case r.NOBR:case r.SMALL:case r.STRIKE:case r.STRONG:{Gi(s,i);break}case r.P:{Lc(s);break}case r.DL:case r.UL:case r.OL:case r.DIR:case r.DIV:case r.NAV:case r.PRE:case r.MAIN:case r.MENU:case r.ASIDE:case r.BUTTON:case r.CENTER:case r.FIGURE:case r.FOOTER:case r.HEADER:case r.HGROUP:case r.DIALOG:case r.ADDRESS:case r.ARTICLE:case r.DETAILS:case r.SEARCH:case r.SECTION:case r.SUMMARY:case r.LISTING:case r.FIELDSET:case r.BLOCKQUOTE:case r.FIGCAPTION:{Rc(s,i);break}case r.LI:{Bc(s);break}case r.DD:case r.DT:{Pc(s,i);break}case r.H1:case r.H2:case r.H3:case r.H4:case r.H5:case r.H6:{Cc(s);break}case r.BR:{Mc(s);break}case r.BODY:{Kc(s,i);break}case r.HTML:{Uc(s,i);break}case r.FORM:{nc(s);break}case r.APPLET:case r.OBJECT:case r.MARQUEE:{Oc(s,i);break}case r.TEMPLATE:{Hs(s,i);break}default:Xr(s,i)}}function Qr(s,i){if(s.tmplInsertionModeStack.length>0)Ur(s,i);else pi(s,i)}function Nc(s,i){var a;if(i.tagID===r.SCRIPT)(a=s.scriptHandler)===null||a===void 0||a.call(s,s.openElements.current);s.openElements.pop(),s.insertionMode=s.originalInsertionMode}function Sc(s,i){s._err(i,w.eofInElementThatCanContainOnlyText),s.openElements.pop(),s.insertionMode=s.originalInsertionMode,s.onEof(i)}function Ii(s,i){if(s.openElements.currentTagId!==void 0&&Hr.has(s.openElements.currentTagId))switch(s.pendingCharacterTokens.length=0,s.hasNonWhitespacePendingCharacterToken=!1,s.originalInsertionMode=s.insertionMode,s.insertionMode=l.IN_TABLE_TEXT,i.type){case X.CHARACTER:{Vr(s,i);break}case X.WHITESPACE_CHARACTER:{Fr(s,i);break}}else ks(s,i)}function $c(s,i){s.openElements.clearBackToTableContext(),s.activeFormattingElements.insertMarker(),s._insertElement(i,h.HTML),s.insertionMode=l.IN_CAPTION}function Ec(s,i){s.openElements.clearBackToTableContext(),s._insertElement(i,h.HTML),s.insertionMode=l.IN_COLUMN_GROUP}function Ic(s,i){s.openElements.clearBackToTableContext(),s._insertFakeElement(b.COLGROUP,r.COLGROUP),s.insertionMode=l.IN_COLUMN_GROUP,_i(s,i)}function Dc(s,i){s.openElements.clearBackToTableContext(),s._insertElement(i,h.HTML),s.insertionMode=l.IN_TABLE_BODY}function kc(s,i){s.openElements.clearBackToTableContext(),s._insertFakeElement(b.TBODY,r.TBODY),s.insertionMode=l.IN_TABLE_BODY,yi(s,i)}function Gc(s,i){if(s.openElements.hasInTableScope(r.TABLE))s.openElements.popUntilTagNamePopped(r.TABLE),s._resetInsertionMode(),s._processStartTag(i)}function pc(s,i){if(zr(i))s._appendElement(i,h.HTML);else ks(s,i);i.ackSelfClosing=!0}function _c(s,i){if(!s.formElement&&s.openElements.tmplCount===0)s._insertElement(i,h.HTML),s.formElement=s.openElements.current,s.openElements.pop()}function Xs(s,i){switch(i.tagID){case r.TD:case r.TH:case r.TR:{kc(s,i);break}case r.STYLE:case r.SCRIPT:case r.TEMPLATE:{as(s,i);break}case r.COL:{Ic(s,i);break}case r.FORM:{_c(s,i);break}case r.TABLE:{Gc(s,i);break}case r.TBODY:case r.TFOOT:case r.THEAD:{Dc(s,i);break}case r.INPUT:{pc(s,i);break}case r.CAPTION:{$c(s,i);break}case r.COLGROUP:{Ec(s,i);break}default:ks(s,i)}}function Is(s,i){switch(i.tagID){case r.TABLE:{if(s.openElements.hasInTableScope(r.TABLE))s.openElements.popUntilTagNamePopped(r.TABLE),s._resetInsertionMode();break}case r.TEMPLATE:{Hs(s,i);break}case r.BODY:case r.CAPTION:case r.COL:case r.COLGROUP:case r.HTML:case r.TBODY:case r.TD:case r.TFOOT:case r.TH:case r.THEAD:case r.TR:break;default:ks(s,i)}}function ks(s,i){let a=s.fosterParentingEnabled;s.fosterParentingEnabled=!0,bi(s,i),s.fosterParentingEnabled=a}function Fr(s,i){s.pendingCharacterTokens.push(i)}function Vr(s,i){s.pendingCharacterTokens.push(i),s.hasNonWhitespacePendingCharacterToken=!0}function Os(s,i){let a=0;if(s.hasNonWhitespacePendingCharacterToken)for(;a<s.pendingCharacterTokens.length;a++)ks(s,s.pendingCharacterTokens[a]);else for(;a<s.pendingCharacterTokens.length;a++)s._insertCharacters(s.pendingCharacterTokens[a]);s.insertionMode=s.originalInsertionMode,s._processToken(i)}var Zr=new Set([r.CAPTION,r.COL,r.COLGROUP,r.TBODY,r.TD,r.TFOOT,r.TH,r.THEAD,r.TR]);function Ac(s,i){let a=i.tagID;if(Zr.has(a)){if(s.openElements.hasInTableScope(r.CAPTION))s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(r.CAPTION),s.activeFormattingElements.clearToLastMarker(),s.insertionMode=l.IN_TABLE,Xs(s,i)}else S(s,i)}function Tc(s,i){let a=i.tagID;switch(a){case r.CAPTION:case r.TABLE:{if(s.openElements.hasInTableScope(r.CAPTION)){if(s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(r.CAPTION),s.activeFormattingElements.clearToLastMarker(),s.insertionMode=l.IN_TABLE,a===r.TABLE)Is(s,i)}break}case r.BODY:case r.COL:case r.COLGROUP:case r.HTML:case r.TBODY:case r.TD:case r.TFOOT:case r.TH:case r.THEAD:case r.TR:break;default:wi(s,i)}}function _i(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.COL:{s._appendElement(i,h.HTML),i.ackSelfClosing=!0;break}case r.TEMPLATE:{as(s,i);break}default:ti(s,i)}}function su(s,i){switch(i.tagID){case r.COLGROUP:{if(s.openElements.currentTagId===r.COLGROUP)s.openElements.pop(),s.insertionMode=l.IN_TABLE;break}case r.TEMPLATE:{Hs(s,i);break}case r.COL:break;default:ti(s,i)}}function ti(s,i){if(s.openElements.currentTagId===r.COLGROUP)s.openElements.pop(),s.insertionMode=l.IN_TABLE,s._processToken(i)}function yi(s,i){switch(i.tagID){case r.TR:{s.openElements.clearBackToTableBodyContext(),s._insertElement(i,h.HTML),s.insertionMode=l.IN_ROW;break}case r.TH:case r.TD:{s.openElements.clearBackToTableBodyContext(),s._insertFakeElement(b.TR,r.TR),s.insertionMode=l.IN_ROW,xi(s,i);break}case r.CAPTION:case r.COL:case r.COLGROUP:case r.TBODY:case r.TFOOT:case r.THEAD:{if(s.openElements.hasTableBodyContextInTableScope())s.openElements.clearBackToTableBodyContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE,Xs(s,i);break}default:Xs(s,i)}}function ki(s,i){let a=i.tagID;switch(i.tagID){case r.TBODY:case r.TFOOT:case r.THEAD:{if(s.openElements.hasInTableScope(a))s.openElements.clearBackToTableBodyContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE;break}case r.TABLE:{if(s.openElements.hasTableBodyContextInTableScope())s.openElements.clearBackToTableBodyContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE,Is(s,i);break}case r.BODY:case r.CAPTION:case r.COL:case r.COLGROUP:case r.HTML:case r.TD:case r.TH:case r.TR:break;default:Is(s,i)}}function xi(s,i){switch(i.tagID){case r.TH:case r.TD:{s.openElements.clearBackToTableRowContext(),s._insertElement(i,h.HTML),s.insertionMode=l.IN_CELL,s.activeFormattingElements.insertMarker();break}case r.CAPTION:case r.COL:case r.COLGROUP:case r.TBODY:case r.TFOOT:case r.THEAD:case r.TR:{if(s.openElements.hasInTableScope(r.TR))s.openElements.clearBackToTableRowContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE_BODY,yi(s,i);break}default:Xs(s,i)}}function Jr(s,i){switch(i.tagID){case r.TR:{if(s.openElements.hasInTableScope(r.TR))s.openElements.clearBackToTableRowContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE_BODY;break}case r.TABLE:{if(s.openElements.hasInTableScope(r.TR))s.openElements.clearBackToTableRowContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE_BODY,ki(s,i);break}case r.TBODY:case r.TFOOT:case r.THEAD:{if(s.openElements.hasInTableScope(i.tagID)||s.openElements.hasInTableScope(r.TR))s.openElements.clearBackToTableRowContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE_BODY,ki(s,i);break}case r.BODY:case r.CAPTION:case r.COL:case r.COLGROUP:case r.HTML:case r.TD:case r.TH:break;default:Is(s,i)}}function iu(s,i){let a=i.tagID;if(Zr.has(a)){if(s.openElements.hasInTableScope(r.TD)||s.openElements.hasInTableScope(r.TH))s._closeTableCell(),xi(s,i)}else S(s,i)}function au(s,i){let a=i.tagID;switch(a){case r.TD:case r.TH:{if(s.openElements.hasInTableScope(a))s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(a),s.activeFormattingElements.clearToLastMarker(),s.insertionMode=l.IN_ROW;break}case r.TABLE:case r.TBODY:case r.TFOOT:case r.THEAD:case r.TR:{if(s.openElements.hasInTableScope(a))s._closeTableCell(),Jr(s,i);break}case r.BODY:case r.CAPTION:case r.COL:case r.COLGROUP:case r.HTML:break;default:wi(s,i)}}function Yr(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.OPTION:{if(s.openElements.currentTagId===r.OPTION)s.openElements.pop();s._insertElement(i,h.HTML);break}case r.OPTGROUP:{if(s.openElements.currentTagId===r.OPTION)s.openElements.pop();if(s.openElements.currentTagId===r.OPTGROUP)s.openElements.pop();s._insertElement(i,h.HTML);break}case r.HR:{if(s.openElements.currentTagId===r.OPTION)s.openElements.pop();if(s.openElements.currentTagId===r.OPTGROUP)s.openElements.pop();s._appendElement(i,h.HTML),i.ackSelfClosing=!0;break}case r.INPUT:case r.KEYGEN:case r.TEXTAREA:case r.SELECT:{if(s.openElements.hasInSelectScope(r.SELECT)){if(s.openElements.popUntilTagNamePopped(r.SELECT),s._resetInsertionMode(),i.tagID!==r.SELECT)s._processStartTag(i)}break}case r.SCRIPT:case r.TEMPLATE:{as(s,i);break}default:}}function Kr(s,i){switch(i.tagID){case r.OPTGROUP:{if(s.openElements.stackTop>0&&s.openElements.currentTagId===r.OPTION&&s.openElements.tagIDs[s.openElements.stackTop-1]===r.OPTGROUP)s.openElements.pop();if(s.openElements.currentTagId===r.OPTGROUP)s.openElements.pop();break}case r.OPTION:{if(s.openElements.currentTagId===r.OPTION)s.openElements.pop();break}case r.SELECT:{if(s.openElements.hasInSelectScope(r.SELECT))s.openElements.popUntilTagNamePopped(r.SELECT),s._resetInsertionMode();break}case r.TEMPLATE:{Hs(s,i);break}default:}}function ru(s,i){let a=i.tagID;if(a===r.CAPTION||a===r.TABLE||a===r.TBODY||a===r.TFOOT||a===r.THEAD||a===r.TR||a===r.TD||a===r.TH)s.openElements.popUntilTagNamePopped(r.SELECT),s._resetInsertionMode(),s._processStartTag(i);else Yr(s,i)}function eu(s,i){let a=i.tagID;if(a===r.CAPTION||a===r.TABLE||a===r.TBODY||a===r.TFOOT||a===r.THEAD||a===r.TR||a===r.TD||a===r.TH){if(s.openElements.hasInTableScope(a))s.openElements.popUntilTagNamePopped(r.SELECT),s._resetInsertionMode(),s.onEndTag(i)}else Kr(s,i)}function du(s,i){switch(i.tagID){case r.BASE:case r.BASEFONT:case r.BGSOUND:case r.LINK:case r.META:case r.NOFRAMES:case r.SCRIPT:case r.STYLE:case r.TEMPLATE:case r.TITLE:{as(s,i);break}case r.CAPTION:case r.COLGROUP:case r.TBODY:case r.TFOOT:case r.THEAD:{s.tmplInsertionModeStack[0]=l.IN_TABLE,s.insertionMode=l.IN_TABLE,Xs(s,i);break}case r.COL:{s.tmplInsertionModeStack[0]=l.IN_COLUMN_GROUP,s.insertionMode=l.IN_COLUMN_GROUP,_i(s,i);break}case r.TR:{s.tmplInsertionModeStack[0]=l.IN_TABLE_BODY,s.insertionMode=l.IN_TABLE_BODY,yi(s,i);break}case r.TD:case r.TH:{s.tmplInsertionModeStack[0]=l.IN_ROW,s.insertionMode=l.IN_ROW,xi(s,i);break}default:s.tmplInsertionModeStack[0]=l.IN_BODY,s.insertionMode=l.IN_BODY,S(s,i)}}function cu(s,i){if(i.tagID===r.TEMPLATE)Hs(s,i)}function Ur(s,i){if(s.openElements.tmplCount>0)s.openElements.popUntilTagNamePopped(r.TEMPLATE),s.activeFormattingElements.clearToLastMarker(),s.tmplInsertionModeStack.shift(),s._resetInsertionMode(),s.onEof(i);else pi(s,i)}function uu(s,i){if(i.tagID===r.HTML)S(s,i);else gi(s,i)}function Rr(s,i){var a;if(i.tagID===r.HTML){if(!s.fragmentContext)s.insertionMode=l.AFTER_AFTER_BODY;if(s.options.sourceCodeLocationInfo&&s.openElements.tagIDs[0]===r.HTML){s._setEndLocation(s.openElements.items[0],i);let e=s.openElements.items[1];if(e&&!((a=s.treeAdapter.getNodeSourceCodeLocation(e))===null||a===void 0?void 0:a.endTag))s._setEndLocation(e,i)}}else gi(s,i)}function gi(s,i){s.insertionMode=l.IN_BODY,bi(s,i)}function vu(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.FRAMESET:{s._insertElement(i,h.HTML);break}case r.FRAME:{s._appendElement(i,h.HTML),i.ackSelfClosing=!0;break}case r.NOFRAMES:{as(s,i);break}default:}}function mu(s,i){if(i.tagID===r.FRAMESET&&!s.openElements.isRootHtmlElementCurrent()){if(s.openElements.pop(),!s.fragmentContext&&s.openElements.currentTagId!==r.FRAMESET)s.insertionMode=l.AFTER_FRAMESET}}function fu(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.NOFRAMES:{as(s,i);break}default:}}function lu(s,i){if(i.tagID===r.HTML)s.insertionMode=l.AFTER_AFTER_FRAMESET}function tu(s,i){if(i.tagID===r.HTML)S(s,i);else li(s,i)}function li(s,i){s.insertionMode=l.IN_BODY,bi(s,i)}function gu(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.NOFRAMES:{as(s,i);break}default:}}function bu(s,i){i.chars=Y,s._insertCharacters(i)}function wu(s,i){s._insertCharacters(i),s.framesetOk=!1}function nr(s){while(s.treeAdapter.getNamespaceURI(s.openElements.current)!==h.HTML&&s.openElements.currentTagId!==void 0&&!s._isIntegrationPoint(s.openElements.currentTagId,s.openElements.current))s.openElements.pop()}function yu(s,i){if(gr(i))nr(s),s._startTagOutsideForeignContent(i);else{let a=s._getAdjustedCurrentElement(),e=s.treeAdapter.getNamespaceURI(a);if(e===h.MATHML)$i(i);else if(e===h.SVG)br(i),Ei(i);if(fi(i),i.selfClosing)s._appendElement(i,e);else s._insertElement(i,e);i.ackSelfClosing=!0}}function xu(s,i){if(i.tagID===r.P||i.tagID===r.BR){nr(s),s._endTagOutsideForeignContent(i);return}for(let a=s.openElements.stackTop;a>0;a--){let e=s.openElements.items[a];if(s.treeAdapter.getNamespaceURI(e)===h.HTML){s._endTagOutsideForeignContent(i);break}let d=s.treeAdapter.getTagName(e);if(d.toLowerCase()===i.tagName){i.tagName=d,s.openElements.shortenToLength(a);break}}}var mm=new Set([b.AREA,b.BASE,b.BASEFONT,b.BGSOUND,b.BR,b.COL,b.EMBED,b.FRAME,b.HR,b.IMG,b.INPUT,b.KEYGEN,b.LINK,b.META,b.PARAM,b.SOURCE,b.TRACK,b.WBR]);function Lr(s,i){return Ds.parse(s,i)}function Br(s,i,a){if(typeof s==="string")a=i,i=s,s=null;let e=Ds.getFragmentParser(s,a);return e.tokenizer.write(i,!0),e.getFragment()}var hi=["draft","in_review","needs_revision","approved"],Pr=["status","approvedAt","reviewer","approvalDigest","answers","checklist","unresolvedCommentIds"];function Ai(s){if(typeof s!=="string"||s.trim()!==s)return!1;let i=s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/);if(!i||!Number.isFinite(Date.parse(s)))return!1;let[,a,e,d,c,f,v,,t="00",g="00"]=i,y=Number(e);return y>=1&&y<=12&&Number(d)>=1&&Number(d)<=new Date(Date.UTC(Number(a),y,0)).getUTCDate()&&Number(c)<=23&&Number(f)<=59&&Number(v)<=59&&Number(t)<=23&&Number(g)<=59}function Cr(){return{status:"draft",answers:{},checklist:{},unresolvedCommentIds:[]}}function Hi(s){if(!s||typeof s!=="object"||Array.isArray(s))return["ReviewState patch must be an object"];let i=s,a=[],e=Pr;for(let d of Object.keys(i))if(!e.includes(d))a.push(`ReviewState patch contains unknown field '${d}'`);if("status"in i&&!hi.includes(i.status))a.push(`ReviewState patch status must be one of ${hi.join(", ")}`);if("approvedAt"in i&&!Ai(i.approvedAt))a.push("ReviewState patch approvedAt must be a valid nonblank ISO timestamp");if("reviewer"in i&&(typeof i.reviewer!=="string"||i.reviewer.trim().length===0))a.push("ReviewState patch reviewer must be a nonblank string");if("answers"in i){if(!i.answers||typeof i.answers!=="object"||Array.isArray(i.answers))a.push("ReviewState patch answers must be an object");else for(let[d,c]of Object.entries(i.answers))if(typeof c!=="string"&&!(Array.isArray(c)&&c.every((f)=>typeof f==="string")))a.push(`ReviewState patch answers['${d}'] must be a string or string array`)}if("checklist"in i){if(!i.checklist||typeof i.checklist!=="object"||Array.isArray(i.checklist))a.push("ReviewState patch checklist must be an object");else for(let[d,c]of Object.entries(i.checklist))if(typeof c!=="boolean")a.push(`ReviewState patch checklist['${d}'] must be boolean`)}if("unresolvedCommentIds"in i&&(!Array.isArray(i.unresolvedCommentIds)||!i.unresolvedCommentIds.every((d)=>typeof d==="string")))a.push("ReviewState patch unresolvedCommentIds must be a string array");return a}function Gs(s){if(!s||typeof s!=="object"||Array.isArray(s))return["AgentHandoff must be an object"];let i=s,a=[],e=["status","planSlug","planPath","approvedAt","approvedScope","decisions","answers","implementationEntry","verification","openRisks","approvalDigest"];for(let c of Object.keys(i))if(!e.includes(c))a.push(`AgentHandoff contains unknown field '${c}'`);if(i.status!=="approved")a.push("AgentHandoff.status must be approved");for(let c of["planSlug","planPath","implementationEntry"])if(typeof i[c]!=="string"||i[c].trim().length===0)a.push(`AgentHandoff.${c} must be a nonblank string`);if(!Ai(i.approvedAt))a.push("AgentHandoff.approvedAt must be a valid nonblank ISO timestamp");if(typeof i.approvalDigest!=="string"||!/^[0-9a-f]{64}$/.test(i.approvalDigest))a.push("AgentHandoff.approvalDigest must be a canonical SHA-256 digest");for(let c of["approvedScope","decisions","verification","openRisks"]){let f=i[c];if(!Array.isArray(f)||!f.every((v)=>typeof v==="string"))a.push(`AgentHandoff.${c} must be a string array`)}let d=i.answers;if(!d||typeof d!=="object"||Array.isArray(d))a.push("AgentHandoff.answers must be an object");else for(let[c,f]of Object.entries(d))if(typeof f!=="string"&&!(Array.isArray(f)&&f.every((v)=>typeof v==="string")))a.push(`AgentHandoff.answers['${c}'] must be a string or string array`);return a}function Qs(s){if(!s||typeof s!=="object"||Array.isArray(s))return["ReviewState must be an object"];let i=s,a=[];for(let d of Object.keys(i))if(!Pr.includes(d))a.push(`ReviewState contains unknown field '${d}'`);if(!hi.includes(i.status))a.push(`ReviewState.status must be one of ${hi.join(", ")}`);if(!i.answers||typeof i.answers!=="object"||Array.isArray(i.answers))a.push("ReviewState.answers must be an object");else for(let[d,c]of Object.entries(i.answers))if(typeof c!=="string"&&!(Array.isArray(c)&&c.every((f)=>typeof f==="string")))a.push(`ReviewState.answers['${d}'] must be a string or string array`);if(!i.checklist||typeof i.checklist!=="object"||Array.isArray(i.checklist))a.push("ReviewState.checklist must be an object");else for(let[d,c]of Object.entries(i.checklist))if(typeof c!=="boolean")a.push(`ReviewState.checklist['${d}'] must be boolean`);let e=i.unresolvedCommentIds;if(!Array.isArray(e)||!e.every((d)=>typeof d==="string"&&d.trim().length>0)||new Set(e).size!==e.length)a.push("ReviewState.unresolvedCommentIds must be a unique nonblank string array");if(i.status==="approved"){if(!Ai(i.approvedAt))a.push("Approved ReviewState.approvedAt must be a valid nonblank ISO timestamp");if(typeof i.reviewer!=="string"||i.reviewer.trim().length===0)a.push("Approved ReviewState.reviewer must be a nonblank string");if(typeof i.approvalDigest!=="string"||!/^[0-9a-f]{64}$/.test(i.approvalDigest))a.push("Approved ReviewState.approvalDigest must be a canonical SHA-256 digest");if(Array.isArray(e)&&e.length>0)a.push("Approved ReviewState cannot contain unresolved comments")}else if(i.approvedAt!==void 0||i.reviewer!==void 0||i.approvalDigest!==void 0)a.push("Nonapproved ReviewState cannot retain approval metadata");return a}function Ti(s,i){let a=[];for(let e of s)for(let d of k(e.body)){let c=es(d);if(e.type==="QuestionForm"&&c[3]==="required"){let f=i.answers[c[0]];if(!(typeof f==="string"?f.trim().length>0:Array.isArray(f)&&f.some((t)=>t.trim().length>0)))a.push(`Required question '${c[0]}' must be answered`)}if(e.type==="Checklist"&&c[2]==="required"&&i.checklist[c[0]]!==!0)a.push(`Required checklist item '${c[0]}' must be checked`)}return a}var oi=/^[A-Za-z][A-Za-z0-9_-]*$/,ou=Object.freeze({iframe:!0,noembed:!0,noframes:!0,plaintext:!0,script:!0,style:!0,textarea:!0,title:!0,xmp:!0});function hu(s){return"tagName"in s}function Or(s,i){let a=i?Lr(s,{sourceCodeLocationInfo:!0}):Br(s,{sourceCodeLocationInfo:!0}),e=[{ids:[],name:i?"document":"fragment"}],d=0,c=0,f=(v,t)=>{if(hu(v)){let g=v.tagName==="template"?v.attrs.find(({name:x})=>x==="shadowrootmode")?.value.toLowerCase():void 0,y=g==="open"||g==="closed";if(!y){let x=v.attrs.find(({name:o})=>o==="id");if(x){let o=v.sourceCodeLocation?.attrs?.id;t.ids.push({hasValue:o?s.slice(o.startOffset,o.endOffset).includes("="):!0,value:x.value})}}if(v.tagName==="template"){let x=y?`shadow root ${++c}`:`template ${++d}`,o={ids:[],name:x};e.push(o),f(v.content,o);return}}if("childNodes"in v)for(let g of v.childNodes)f(g,t)};return f(a,e[0]),e}function Hu(s){for(let i=0;i<s.length;){let a=s.indexOf("<",i);if(a===-1)return;if(s.startsWith("<!--",a)){let t=s.indexOf("-->",a+4);if(t===-1)return"comment";i=t+3;continue}let e=s.slice(a).match(/^<([A-Za-z][A-Za-z0-9-]*)\b/);if(!e){i=a+1;continue}let d=qs(s,a+e[0].length);if(d===-1)return e[1].toLowerCase();let c=e[1].toLowerCase();if(i=d+1,!ou[c])continue;if(c==="plaintext")return c;let f=s.slice(i).search(new RegExp(`</${c}(?=[\\t\\n\\f\\r />])`,"i"));if(f===-1)return c;let v=qs(s,i+f+c.length+2);if(v===-1)return c;i=v+1}return}function Mr(s,i=[]){let a=Or(s,!0),e=[];for(let c of a){let f=new Set,v=c.name==="document"?"Rendered HTML":`Rendered HTML scope '${c.name}'`;for(let t of c.ids){if(!t.hasValue||!t.value){e.push(`${v} contains empty id`);continue}if(!oi.test(t.value))e.push(`${v} contains unsafe id '${t.value}'`);if(f.has(t.value))e.push(`${v} contains duplicate id '${t.value}'`);f.add(t.value)}}let d=a[0].ids.map(({value:c})=>c);for(let c of new Set(i)){let f=d.filter((v)=>v===c).length;if(f!==1)e.push(`Expected rendered HTML id '${c}' to materialize exactly once; found ${f}`)}return e}function Nr(s,i=[]){let a=[],e=new Set,d=new Set(i),c=new Set;for(let v of s){if(!os[v.type])a.push(`Unknown MDX component '${v.type}'${v.id?` at block '${v.id}'`:""}`);if(!v.id||typeof v.id!=="string")a.push(`MDX component '${v.type}' is missing required id`);else{if(!oi.test(v.id))a.push(`MDX component '${v.type}' has unsafe id '${v.id}'; use a letter followed by letters, numbers, underscores, or hyphens`);if(d.has(v.id))a.push(`MDX component id '${v.id}' collides with renderer-owned id '${v.id}'`),a.push(`Duplicate MDX component id '${v.id}'`);if(e.has(v.id))a.push(`Duplicate MDX component id '${v.id}'`);else e.add(v.id)}if(v.type==="Wireframe"&&/<\/?(?:html|head|body|script)\b/i.test(v.body))a.push(`Wireframe '${v.id}' must be an HTML fragment without html/head/body/script tags`);if(v.type==="QuestionForm"||v.type==="Checklist")for(let t of k(v.body)){let g=es(t),y=v.type==="QuestionForm"?[3,4]:[2,3];if(!y.includes(g.length)){a.push(`${v.type} '${v.id}' has invalid field count ${g.length}; expected ${y.join(" or ")}`);continue}if((v.type==="QuestionForm"?g.slice(0,3):g.slice(0,2)).some((W)=>W.length===0)){a.push(`${v.type} '${v.id}' has a blank required field`);continue}let o=g[0];if(c.has(o))a.push(`Duplicate readiness item id '${o}'`);else c.add(o);let j=v.type==="QuestionForm"?3:2,F=g[j];if(v.type==="QuestionForm"&&g.length===3&&(g[2]==="required"||g[2]==="advisory"))a.push(`QuestionForm '${v.id}' has readiness policy '${g[2]}' in the mode field`);else if(F!==void 0&&F!=="required"&&F!=="advisory")a.push(`${v.type} '${v.id}' has invalid readiness policy '${F}'`)}}let f=new Set([...e,...d]);for(let v of s){let t=Ma(v);if(v.type==="Tabs"||v.type==="DiffTabs"){ns(v.body).forEach((g,y)=>{if(!g)a.push(`${v.type} '${v.id}' contains an empty panel at position ${y+1}`)});for(let g of t){if(e.has(g))a.push(`Generated HTML id '${g}' for ${v.type} '${v.id}' collides with an authored block id`);else if(d.has(g))a.push(`Generated HTML id '${g}' for ${v.type} '${v.id}' collides with a renderer-owned id`);else if(f.has(g))a.push(`Generated HTML id '${g}' for ${v.type} '${v.id}' collides with another emitted id`);if(f.has(g))a.push(`Duplicate rendered id '${g}'`);f.add(g)}}else for(let g of t){if(f.has(g))a.push(`Duplicate rendered id '${g}'`);f.add(g)}}for(let v of s){if(v.type!=="Wireframe"&&v.type!=="StateGallery")continue;let t=Hu(v.body);if(t){a.push(`${v.type} '${v.id}' contains unterminated ${t}`);continue}let[g,...y]=Or(v.body,!1);for(let x of g.ids){if(!x.hasValue){a.push(`${v.type} '${v.id}' contains an id attribute without a value`);continue}if(!x.value){a.push(`${v.type} '${v.id}' contains an empty id attribute`);continue}if(!oi.test(x.value))a.push(`${v.type} descendant has unsafe id '${x.value}' in '${v.id}'`);if(f.has(x.value))a.push(`${v.type} descendant id '${x.value}' in '${v.id}' collides with another emitted id`);f.add(x.value)}for(let x of y){let o=new Set;for(let j of x.ids){if(!j.hasValue||!j.value){a.push(`${v.type} '${v.id}' ${x.name} contains empty id`);continue}if(!oi.test(j.value))a.push(`${v.type} '${v.id}' ${x.name} contains unsafe id '${j.value}'`);if(o.has(j.value))a.push(`${v.type} '${v.id}' ${x.name} contains duplicate id '${j.value}'`);o.add(j.value)}}}return a}function Sr(s){let i=Qs(s);if(s.status!=="approved")i.push("AgentHandoff cannot be generated unless ReviewState.status is approved");if(s.unresolvedCommentIds.length>0)i.push("AgentHandoff cannot be generated while unresolved blocking comments remain");return i}function qu(s){if(!s.startsWith(`---
`))return{frontmatter:{},body:s};let i=s.indexOf(`
---`,4);if(i===-1)return{frontmatter:{},body:s};let a=s.slice(4,i).trim(),e={};for(let d of a.split(/\r?\n/)){let c=d.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);if(c)e[c[1]]=c[2].replace(/^["']|["']$/g,"")}return{frontmatter:e,body:s.slice(i+5).replace(/^\n/,"")}}function ia(s){let i={},a=/([A-Za-z_:][A-Za-z0-9_:.-]*)(?:=("[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+))?/g;for(let e of s.matchAll(a)){let d=e[1];if(!e[2]){i[d]=d==="id"?"":!0;continue}let c=e[2].trim();if(c.startsWith('"')&&c.endsWith('"')||c.startsWith("'")&&c.endsWith("'"))c=c.slice(1,-1);else if(c.startsWith("{")&&c.endsWith("}"))c=c.slice(1,-1).trim().replace(/^["']|["']$/g,"");if(/^-?\d+(?:\.\d+)?$/.test(c))i[d]=Number(c);else if(c==="true"||c==="false")i[d]=c==="true";else i[d]=c}return i}function Wu(s,i,a){let e=[],d=new Set,c=(t,g)=>{if(g!==-1&&!d.has(t))d.add(t),e.push({start:t,end:g})},f=new RegExp(`^[\\t ]*</${a}\\s*>[\\t ]*\\r?$`,"gm");f.lastIndex=i;for(let t=f.exec(s);t;t=f.exec(s)){let g=t.index+t[0].indexOf("<");c(g,s.indexOf(">",g))}let v=`</${a}`;for(let t=s.indexOf(v,i);t!==-1;t=s.indexOf(v,t+v.length)){if(!/[\s>]/.test(s[t+v.length]??""))continue;c(t,qs(s,t+v.length))}return e.sort((t,g)=>t.start-g.start||t.end-g.end)}function zu(s){function i(a,e,d){for(;a<s.length;){if(e&&Ca[e.type]){let W=Wu(s,a,e.type);if(!W.length){let V=s.slice(a).match(/^[\t ]*<\/([A-Z][A-Za-z0-9]*)\s*>[\t ]*$/m);if(V&&os[V[1]])throw Error(`Malformed MDX component source: closing '${V[1]}' does not match open '${e.type}'`);throw Error(`Malformed MDX component source: unclosed '${e.type}'`)}let Z;for(let V of W){if(s.slice(V.start+e.type.length+2,V.end).trim()){Z=Error(`Malformed MDX component source: malformed closing '${e.type}'`);continue}let L=ia(e.attrs),J={id:typeof L.id==="string"?L.id:"",type:e.type,props:L,body:s.slice(e.bodyStart,V.start).trim()};try{return i(V.end+1,void 0,[...d,J])}catch(cs){Z=cs}}throw Z}let c=s.indexOf("<",a);if(c===-1)break;let f=s.slice(c),v=f.match(/^<(\/?)([A-Z][A-Za-z0-9]*)(?=[\s/>])/);if(!v){let W=f.match(/^<(\/?)([A-Z][A-Za-z0-9]*)/);if(W&&os[W[2]]){let Z=W[2],V=f[W[0].length];if(V!=="."&&V!==":"){let I=V===void 0?`incomplete tag '<${W[1]}${Z}'`:`illegal continuation '${V}' after supported component name '${Z}'`;throw Error(`Malformed MDX component source: ${I}`)}}a=c+1;continue}let t=v[1]==="/",g=v[2],y=Boolean(os[g]),x=qs(s,c+v[0].length);if(x===-1)throw Error(`Malformed MDX component source: incomplete tag '<${t?"/":""}${g}'`);let o=s.slice(c+v[0].length,x),j=/\/\s*$/.test(o);if(a=x+1,e&&os[e.type]&&!y)continue;if(t){if(o.trim())throw Error(`Malformed MDX component source: malformed closing '${g}'`);if(!e)throw Error(`Malformed MDX component source: unexpected closing '${g}'`);if(e.type!==g)throw Error(`Malformed MDX component source: closing '${g}' does not match open '${e.type}'`);let W=ia(e.attrs);d.push({id:typeof W.id==="string"?W.id:"",type:g,props:W,body:s.slice(e.bodyStart,c).trim()}),e=void 0;continue}if(e){if(y)throw Error(`Malformed MDX component source: nested '${g}' inside '${e.type}' is not supported`);continue}let F=j?o.replace(/\/\s*$/,""):o;if(j){let W=ia(F);d.push({id:typeof W.id==="string"?W.id:"",type:g,props:W,body:""})}else e={attrs:F,bodyStart:x+1,type:g}}if(e)throw Error(`Malformed MDX component source: unclosed '${e.type}'`);return d}return i(0,void 0,[])}function Dr(s){let{frontmatter:i,body:a}=qu(s),e=zu(a);if(e.length===0)e.push({id:String(i.slug??"markdown-body"),type:"Callout",props:{id:String(i.slug??"markdown-body"),tone:"note",title:i.title??"Plan"},body:a.trim()});return{frontmatter:i,blocks:e,raw:s}}function ps(s){return typeof s==="string"&&s.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(s)}function aa(s,i){if(Er(i)||/^[A-Za-z]:[\\/]/.test(i)||i.startsWith("\\\\")||i.includes("\x00")||i.replaceAll("\\","/").split("/").includes(".."))return!1;let a=Ir(s),e=Ir(a,i),d=ju(a,e);return d.length>0&&!d.startsWith(`..${process.platform==="win32"?"\\":"/"}`)&&!Er(d)}function Xu(s,i,a){let e={kind:i.frontmatter.kind??"plan",slug:i.frontmatter.slug??$r(s),title:i.frontmatter.title??i.frontmatter.slug??$r(s),createdAt:i.frontmatter.createdAt??"1970-01-01T00:00:00.000Z",source:[],entry:"plan.mdx",dist:"dist",localOnly:!0},d={};if(a!==void 0){let v=JSON.parse(a);if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Visual plan manifest must be an object");d=v;let t={kind:!0,slug:!0,title:!0,createdAt:!0,source:!0,entry:!0,dist:!0,localOnly:!0},g=Object.keys(d).filter((y)=>!t[y]);if(g.length)throw Error(`Visual plan manifest contains unknown field '${g[0]}'`)}let c={...e,...d},f=[];if(c.kind!=="plan"&&c.kind!=="recap"&&c.kind!=="styleguide")f.push("kind must be plan, recap, or styleguide");if(!ps(c.slug))f.push("slug must be a nonblank single-line string");if(!ps(c.title))f.push("title must be a nonblank single-line string");if(!ps(c.createdAt)||!Number.isFinite(Date.parse(c.createdAt))||new Date(c.createdAt).toISOString()!==c.createdAt)f.push("createdAt must be a canonical ISO timestamp");if(!Array.isArray(c.source)||c.source.some((v)=>!ps(v)||!aa(s,v)))f.push("source must be an array of nonblank single-line relative paths confined beneath the plan root");if(c.entry!=="plan.mdx"||!aa(s,c.entry))f.push("entry must identify the loaded plan.mdx beneath the plan root");if(!ps(c.dist)||!aa(s,c.dist))f.push("dist must be a nonblank relative path confined beneath the plan root");if(c.localOnly!==!0)f.push("localOnly must be true");if(f.length)throw Error(`Invalid visual plan manifest:
${f.join(`
`)}`);return c}function ra(s,i){let a=Dr(i.plan),e=i.canvas===void 0?void 0:Dr(i.canvas),d=Xu(s,a,i.manifest),c=Nr([...a.blocks,...e?.blocks??[]],e?["canvas"]:[]);if(c.length)throw Error(`Invalid plan source:
${c.join(`
`)}`);return{rootDir:s,manifest:d,plan:a,canvas:e}}async function kr(s){try{return await Gr(s,"utf8")}catch(i){if(typeof i==="object"&&i!==null&&"code"in i&&i.code==="ENOENT")return;throw i}}async function pr(s){let[i,a,e]=await Promise.all([Gr(sa(s,"plan.mdx"),"utf8"),kr(sa(s,"canvas.mdx")),kr(sa(s,"visual-explainer.json"))]);return ra(s,{plan:i,canvas:a,manifest:e})}var Vu=`<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{{TITLE}}</title>
<style>{{FONTS}}</style>
<style>{{STYLE}}</style>
</head>
<body data-review-status="draft" data-review-authority="{{REVIEW_AUTHORITY}}">
  <aside class="ve-ip-nav"><strong>{{KIND}}</strong>{{NAV}}</aside>
  <div class="ve-ip-chrome" aria-label="Display settings"><span>Theme</span><button type="button" class="ve-ip-theme-toggle" data-theme-toggle aria-pressed="false"><span data-theme-toggle-label>Light</span></button></div>
  <main class="ve-ip-main">
    <header class="ve-ip-page-header"><p class="ve-ip-kicker">Muse interactive {{KIND}}</p><h1>{{TITLE}}</h1><p>{{SUBTITLE}}</p></header>
    {{EXPLORER}}
    {{REVIEW_SYNC}}
    {{CONTENT}}
  </main>
<script src="{{MERMAID_URL}}" integrity="sha384-{{MERMAID_SRI}}" crossorigin="anonymous"></script>
<script type="module">{{CLIENT}}</script>
</body>
</html>`,Zu=`
:root {
  color-scheme: light;
  --bg: oklch(98% 0.006 230);
  --bg-radial: oklch(89% 0.035 205 / 0.48);
  --surface: oklch(100% 0 0);
  --surface-elevated: oklch(96% 0.011 230);
  --surface-recessed: oklch(93% 0.014 232);
  --border: oklch(34% 0.025 235 / 0.14);
  --border-strong: oklch(34% 0.025 235 / 0.28);
  --text: oklch(24% 0.022 235);
  --text-dim: oklch(45% 0.024 235);
  --accent: oklch(51% 0.13 43);
  --accent-soft: oklch(92% 0.05 61);
  --accent-sage: oklch(49% 0.095 142);
  --accent-teal: oklch(48% 0.105 212);
  --accent-gold: oklch(72% 0.13 78);
  --ok: oklch(50% 0.12 151);
  --warn: oklch(64% 0.14 72);
  --danger: oklch(52% 0.16 23);
  --shadow-soft: 0 8px 24px oklch(24% 0.022 235 / 0.08);
  --font-body: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Fragment Mono", "SF Mono", Consolas, monospace;
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: oklch(18% 0.018 244);
  --bg-radial: oklch(45% 0.08 214 / 0.22);
  --surface: oklch(22% 0.02 244);
  --surface-elevated: oklch(27% 0.024 244);
  --surface-recessed: oklch(16% 0.016 244);
  --border: oklch(86% 0.012 238 / 0.12);
  --border-strong: oklch(86% 0.012 238 / 0.24);
  --text: oklch(94% 0.008 236);
  --text-dim: oklch(75% 0.018 236);
  --accent: oklch(70% 0.13 54);
  --accent-soft: oklch(32% 0.052 54);
  --accent-sage: oklch(70% 0.09 147);
  --accent-teal: oklch(73% 0.098 205);
  --accent-gold: oklch(80% 0.12 82);
  --ok: oklch(72% 0.11 154);
  --warn: oklch(80% 0.12 82);
  --danger: oklch(72% 0.14 22);
  --shadow-soft: 0 10px 28px oklch(0% 0 0 / 0.22);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at 18% -10%, var(--bg-radial), transparent 34rem),
    linear-gradient(135deg, var(--bg), var(--surface-recessed));
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.55;
}
button, input { font: inherit; }
code, pre, .ve-ip-label, .ve-ip-kicker, .ve-ip-nav, .code-file__header { font-family: var(--font-mono); }
.ve-ip-nav {
  position: fixed;
  inset: 1rem auto 1rem 1rem;
  width: min(15rem, calc(100vw - 2rem));
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: color-mix(in oklch, var(--surface) 88%, transparent);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: .45rem;
  z-index: 5;
  overflow-y: auto;
  scrollbar-gutter: stable;
}
.ve-ip-nav strong {
  color: var(--accent);
  font-size: .78rem;
  letter-spacing: .03em;
  text-transform: uppercase;
}
.ve-ip-nav a {
  color: var(--text-dim);
  text-decoration: none;
  padding: .35rem .45rem;
  border-radius: 10px;
}
.ve-ip-nav a:hover { color: var(--text); background: var(--surface-elevated); }
.ve-ip-chrome {
  position: fixed;
  right: 1rem;
  top: 1rem;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  padding: .45rem .55rem .45rem .75rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in oklch, var(--surface) 90%, transparent);
  box-shadow: var(--shadow-soft);
  color: var(--text-dim);
  font-size: .86rem;
}
.ve-ip-theme-toggle, .ve-ip-actions button, .ve-ip-persistence button, .ve-ip-review-sync button, .zoom-controls button {
  border: 1px solid var(--border-strong);
  color: var(--text);
  background: var(--surface-elevated);
  border-radius: 999px;
  cursor: pointer;
}
.ve-ip-theme-toggle { padding: .35rem .75rem; }
.ve-ip-review-sync {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .5rem 1rem;
  margin: 0 0 1rem;
  padding: .85rem 1rem;
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent-teal);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}
.ve-ip-review-sync strong { color: var(--text); }
.ve-ip-review-sync span { flex: 1 1 22rem; color: var(--text-dim); }
.ve-ip-review-sync button, .ve-ip-persistence button { padding: .3rem .65rem; }
[data-review-authority="failed"] .ve-ip-review-sync { border-left-color: var(--danger); }
[data-review-control]:disabled { cursor: not-allowed; opacity: .55; }
.ve-ip-main {
  width: min(74rem, calc(100vw - 2rem));
  margin: 0 auto;
  padding: 4.5rem 0 5rem 15.5rem;
}
.ve-ip-page-header {
  min-height: 38vh;
  display: grid;
  align-content: end;
  padding: 3rem 0 4rem;
}
.ve-ip-kicker, .ve-ip-label {
  color: var(--accent);
  font-size: .78rem;
  letter-spacing: .05em;
  text-transform: uppercase;
}
.ve-ip-page-header h1 {
  max-width: 12ch;
  margin: .4rem 0 .7rem;
  font-size: clamp(3.25rem, 10vw, 5.8rem);
  line-height: .93;
  letter-spacing: -.035em;
  text-wrap: balance;
}
.ve-ip-page-header p:last-child {
  max-width: 58ch;
  margin: 0;
  color: var(--text-dim);
  font-size: clamp(1.05rem, 2vw, 1.3rem);
}
.ve-ip-explorer {
  margin-bottom: 1.2rem;
  border: 1px solid var(--border-strong);
  border-radius: 16px;
  padding: 1.2rem;
  background: var(--surface);
}
.ve-ip-explorer-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, .55fr);
  gap: 1.5rem;
  align-items: end;
}
.ve-ip-explorer .ve-ip-label { padding: 0; }
.ve-ip-explorer h2 {
  margin: .25rem 0 .4rem;
  font-size: 2rem;
  letter-spacing: -.025em;
  text-wrap: balance;
}
.ve-ip-explorer-intro p:last-child {
  max-width: 62ch;
  margin: 0;
  color: var(--text-dim);
}
.ve-ip-search {
  display: grid;
  gap: .35rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: .78rem;
}
.ve-ip-search input {
  width: 100%;
  min-height: 2.8rem;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  padding: .65rem .8rem;
  color: var(--text);
  background: var(--surface-elevated);
}
.ve-ip-search input:focus-visible,
.ve-ip-filter-row button:focus-visible,
.ve-ip-source button:focus-visible {
  outline: 3px solid color-mix(in oklch, var(--accent-teal) 45%, transparent);
  outline-offset: 2px;
}
.ve-ip-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
  margin-top: 1rem;
}
.ve-ip-filter-row button,
.ve-ip-source button {
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  padding: .38rem .7rem;
  color: var(--text-dim);
  background: transparent;
  cursor: pointer;
}
.ve-ip-filter-row button[aria-pressed="true"] {
  color: var(--surface);
  background: var(--text);
}
.ve-ip-results {
  margin: .85rem 0 0;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: .78rem;
}
.ve-ip-block {
  margin: 0 0 1.2rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  overflow: hidden;
}
.ve-ip-block > h2 {
  margin: .2rem 0 0;
  padding: 0 1.15rem;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  letter-spacing: -.025em;
  text-wrap: balance;
}
.ve-ip-label { display: block; padding: 1rem 1.15rem 0; }
.ve-ip-body { padding: 1rem 1.15rem 1.15rem; }
.ve-ip-hero {
  background: linear-gradient(145deg, var(--surface-elevated), var(--surface));
  box-shadow: var(--shadow-soft);
}
.ve-ip-hero .ve-ip-body { padding: 1.25rem; }
.ve-ip-summary {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}
.ve-ip-summary p {
  max-width: 62ch;
  margin: 0;
  color: var(--text-dim);
  font-size: 1.08rem;
}
.ve-ip-pill {
  display: inline-flex;
  align-items: center;
  width: max-content;
  border-radius: 999px;
  padding: .22rem .55rem;
  background: var(--accent-soft);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: .74rem;
}
.ve-ip-pill--high, .ve-ip-pill--critical { background: color-mix(in oklch, var(--danger) 20%, transparent); }
.ve-ip-pill--medium { background: color-mix(in oklch, var(--warn) 24%, transparent); }
.ve-ip-pill--low { background: color-mix(in oklch, var(--ok) 20%, transparent); }
table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
}
th, td {
  padding: .75rem .8rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}
th {
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: .78rem;
  font-weight: 400;
}
tr:last-child td { border-bottom: 0; }
.ve-ip-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: .75rem;
}
.ve-ip-kpi {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: .9rem;
  background: var(--surface-elevated);
}
.ve-ip-kpi strong { display: block; font-size: 1.75rem; letter-spacing: -.03em; }
.ve-ip-kpi span, .ve-ip-kpi small, .ve-ip-muted { color: var(--text-dim); }
.ve-ip-timeline {
  counter-reset: timeline;
  display: grid;
  gap: .75rem;
  padding: 0;
  margin: 0;
  list-style: none;
}
.ve-ip-timeline li {
  display: grid;
  grid-template-columns: 2.2rem 1fr;
  gap: .75rem;
  align-items: start;
}
.ve-ip-timeline li > span {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  background: var(--accent-soft);
  font-family: var(--font-mono);
}
.ve-ip-file-tree {
  display: grid;
  gap: .4rem;
  padding: 0;
  margin: 0;
  list-style: none;
}
.ve-ip-file-tree code, code {
  border-radius: 8px;
  background: var(--surface-recessed);
  padding: .14rem .32rem;
}
.code-file {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface-recessed);
}
.code-file__header {
  padding: .65rem .8rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-dim);
}
.code-block {
  margin: 0;
  padding: 1rem;
  overflow: auto;
  white-space: pre-wrap;
}
.ve-ip-tabs [role="tablist"] {
  display: flex;
  gap: .45rem;
  flex-wrap: wrap;
  margin-bottom: .75rem;
}
.ve-ip-tabs [role="tab"] {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: .42rem .7rem;
  color: var(--text-dim);
  background: var(--surface-elevated);
  cursor: pointer;
}
.ve-ip-tabs [aria-selected="true"] {
  color: var(--text);
  border-color: var(--accent);
}
.diagram-shell {
  display: grid;
  gap: .7rem;
}
.diagram-shell__hint {
  color: var(--text-dim);
  font-size: .9rem;
}
.mermaid-wrap {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface-recessed);
}
.zoom-controls {
  display: flex;
  justify-content: flex-end;
  gap: .35rem;
  padding: .55rem;
  border-bottom: 1px solid var(--border);
}
.zoom-controls button { min-width: 2.1rem; padding: .32rem .55rem; }
.mermaid-viewport {
  min-height: 24rem;
  overflow: hidden;
  display: grid;
  place-items: center;
  cursor: grab;
  touch-action: none;
}
.mermaid-canvas {
  transform-origin: center center;
  transition: transform .18s ease-out;
  min-width: min(48rem, 100%);
}
.mermaid-canvas svg {
  max-width: 100%;
  height: auto;
}
.mermaid-source {
  margin: 0;
  padding: 1rem;
  color: var(--text-dim);
  white-space: pre-wrap;
}
.mermaid-wrap[data-render-state="rendered"] .mermaid-source { display: none; }
.mermaid-error {
  color: var(--danger);
  white-space: pre-wrap;
}
.ve-ip-question, .ve-ip-check {
  display: grid;
  gap: .4rem;
  margin-bottom: .75rem;
}
.ve-ip-field-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .75rem;
}
.ve-ip-readiness-policy {
  flex: none;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  padding: .16rem .48rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: .7rem;
}
.ve-ip-readiness-policy--required {
  border-color: var(--accent-terracotta);
  color: var(--text);
}
.ve-ip-question input {
  width: 100%;
  min-height: 2.75rem;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  padding: .65rem .8rem;
  color: var(--text);
  background: var(--surface-elevated);
}
.ve-ip-check {
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
}
.ve-ip-check input { width: 1.15rem; height: 1.15rem; accent-color: var(--accent-sage); }
.ve-ip-field, .ve-ip-check-row { margin-bottom: .85rem; }
.ve-ip-field .ve-ip-question, .ve-ip-check-row .ve-ip-check { margin-bottom: .3rem; }
.ve-ip-readiness-copy {
  margin: 0 0 1rem;
  color: var(--text-dim);
  font-size: .88rem;
}
.ve-ip-persistence {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  min-height: 1.5rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: .72rem;
}
.ve-ip-persistence[data-persistence-state="pending"] { color: var(--accent-teal); }
.ve-ip-persistence[data-persistence-state="saved"] { color: var(--accent-sage); }
.ve-ip-persistence[data-persistence-state="failed"] { color: var(--danger); }
.ve-ip-comment-control { display: inline-flex; flex-wrap: wrap; align-items: center; gap: .65rem; }
.ve-ip-review-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem 1rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: .78rem;
}
.ve-ip-approval-readiness {
  margin: .85rem 0;
  padding: .7rem .8rem;
  border-left: 3px solid var(--accent-gold);
  background: var(--surface-recessed);
}
.ve-ip-approval-readiness[data-ready="true"] { border-left-color: var(--accent-sage); }
.ve-ip-review-comments {
  margin-top: 1rem;
  padding-top: .85rem;
  border-top: 1px solid var(--border);
}
.ve-ip-review-comments h3 { margin-top: 0; }
.ve-ip-review-comments ul { padding-left: 1.2rem; }
.ve-ip-review-comments li { margin-bottom: .65rem; }
.ve-ip-approval-receipt {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--accent-sage);
  border-radius: 14px;
  background: color-mix(in oklch, var(--accent-sage) 9%, var(--surface));
}
.ve-ip-approval-receipt h3 { margin-top: 0; }
.ve-ip-approval-receipt pre {
  padding: .75rem;
  background: var(--surface-recessed);
  white-space: pre-wrap;
  overflow: auto;
}
.ve-ip-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 1rem;
}
.ve-ip-actions button {
  padding: .65rem .9rem;
}
.ve-ip-actions button:first-child {
  background: var(--text);
  color: var(--surface);
}
.ve-ip-before-after {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: .8rem;
}
.ve-ip-before-after > div, .ve-ip-callout {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
  background: var(--surface-elevated);
}
.ve-ip-callout--risk { background: color-mix(in oklch, var(--danger) 10%, var(--surface)); }
.ve-ip-callout--warning { background: color-mix(in oklch, var(--warn) 14%, var(--surface)); }
.ve-ip-callout--decision { background: color-mix(in oklch, var(--accent-teal) 12%, var(--surface)); }
.ve-ip-wireframe {
  border: 1px solid var(--border);
  border-radius: 14px;
  min-height: 18rem;
  overflow: hidden;
  background: var(--surface-recessed);
}
.wf-muted { color: var(--text-dim); }
.primary {
  border: 0;
  border-radius: 999px;
  padding: .7rem 1rem;
  background: var(--text);
  color: var(--surface);
}
.ve-ip-component-meta {
  display: grid;
  grid-template-columns: minmax(7rem, .25fr) 1fr;
  gap: 1rem;
  align-items: baseline;
  border-top: 1px solid var(--border);
  padding: .85rem 1.15rem;
  color: var(--text-dim);
}
.ve-ip-component-meta span {
  color: var(--accent-teal);
  font-family: var(--font-mono);
  font-size: .76rem;
}
.ve-ip-component-meta p { margin: 0; }
.ve-ip-source { border-top: 1px solid var(--border); }
.ve-ip-source summary {
  padding: .8rem 1.15rem;
  color: var(--text-dim);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: .78rem;
}
.ve-ip-source-toolbar {
  display: flex;
  justify-content: end;
  padding: 0 1.15rem .65rem;
}
.ve-ip-source pre {
  margin: 0;
  border-radius: 0;
  max-height: 24rem;
}
.ve-ip-source button[data-copy-state="copied"] {
  color: var(--surface);
  background: var(--accent-sage);
}
.ve-ip-third-party-notices > summary {
  padding: 1rem 1.15rem;
  color: var(--text-dim);
  cursor: pointer;
  font-family: var(--font-mono);
}
.ve-ip-third-party-notices[open] > summary { border-bottom: 1px solid var(--border); }
.ve-ip-third-party-notices__body { padding: 1rem 1.15rem 1.15rem; }
.ve-ip-third-party-notices article + article {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
}
.ve-ip-third-party-notices h3 { margin-bottom: .4rem; }
.ve-ip-third-party-notices article > p { margin: .35rem 0; }
.ve-ip-third-party-notices pre { max-height: 24rem; border-radius: 14px; background: var(--surface-recessed); }
.ve-ip-block[hidden] { display: none; }
@media (max-width: 860px) {
  .ve-ip-nav {
    position: sticky;
    top: 0;
    inset: auto;
    width: auto;
    margin: .75rem;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .ve-ip-nav a { flex: 0 0 auto; white-space: nowrap; }
  .ve-ip-main {
    width: min(100% - 1.5rem, 74rem);
    padding: 1rem 0 4rem;
  }
  .ve-ip-chrome {
    position: static;
    display: flex;
    width: max-content;
    margin: .75rem .75rem 0 auto;
  }
  .ve-ip-page-header { min-height: 24rem; }
  .ve-ip-explorer-intro { grid-template-columns: 1fr; }
  .ve-ip-component-meta { grid-template-columns: 1fr; gap: .25rem; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .mermaid-canvas { transition: none; }
}
`;async function Tr(){try{return await Fu("plugins/Muse/skills/muse/templates/interactive-plan-shell.html","utf8")}catch{return Vu}}function Ju(s){if(s.manifest.kind!=="styleguide")return"";let a=['<button type="button" data-component-filter="" aria-pressed="true">All</button>',...Array.from(new Set(Rs.map((f)=>ai[f].category))).map((f)=>`<button type="button" data-component-filter="${q(f)}" aria-pressed="false">${q(f)}</button>`)].join(""),e=s.plan.blocks.length,d=new Set(s.plan.blocks.map((f)=>f.type)).size,c=`${e} ${e===1?"example":"examples"} \xB7 ${d} unique of canonical ${Rs.length}`;return`<section class="ve-ip-explorer" data-component-explorer data-component-example-count="${e}" data-component-count="${d}" data-component-canonical-count="${Rs.length}" aria-labelledby="component-explorer-title"><div class="ve-ip-explorer-intro"><div><p class="ve-ip-label">Component reference</p><h2 id="component-explorer-title">Catalog</h2><p>Browse ${c}. Search by component name or purpose, filter by family, inspect the rendered result, then copy the exact MDX source.</p></div><label class="ve-ip-search"><span>Search components</span><input type="search" data-component-search placeholder="Try \u201Cdiagram\u201D, \u201Crisk\u201D, or \u201Creview\u201D" autocomplete="off" /></label></div><div class="ve-ip-filter-row" role="group" aria-label="Component families">${a}</div><p class="ve-ip-results" data-component-results aria-live="polite">${c}</p></section>`}function Yu(s){return s.plan.blocks.map((i)=>{let a=s.manifest.kind==="styleguide"?i.type:i.props.title??i.type;return`<a href="#${q(i.id)}">${q(a)}</a>`}).join("")}async function Ku(){return`<details class="ve-ip-block ve-ip-card ve-ip-third-party-notices"><summary>Third-party font notices</summary><div class="ve-ip-third-party-notices__body"><p>Copyright notices and SIL Open Font License 1.1 terms for fonts embedded in this portable file.</p>${(await Ra()).map((a)=>{let e=a.assets.map((d)=>`<li><code>${q(d)}</code></li>`).join("");return`<article><h3>${q(a.package)} ${q(a.version)}</h3><p>Embedded assets:</p><ul>${e}</ul><pre class="code-block">${q(a.text)}</pre></article>`}).join("")}</div></details>`}async function Ar(s,i=!1,a){let e=a??await Tr(),d=s.manifest.kind==="styleguide",c=[Bi(s.plan.blocks,{staticMode:i,componentExplorer:d}),s.canvas?`<section class="ve-ip-block ve-ip-card" id="canvas"><div class="ve-ip-label">Canvas</div><h2>Canvas</h2>${Bi(s.canvas.blocks,{staticMode:i,componentExplorer:!1})}</section>`:"",i?await Ku():""].join(`
`),f=await Ua(i),v=i?"":'<section class="ve-ip-review-sync" data-review-sync aria-live="polite"><strong data-review-sync-title>Loading saved review\u2026</strong><span data-review-sync-detail>Review controls unlock after server state and comments load.</span><button type="button" data-review-retry hidden>Retry</button></section>',t=e.replaceAll("{{TITLE}}",q(s.manifest.title)).replaceAll("{{KIND}}",q(s.manifest.kind)).replaceAll("{{SUBTITLE}}",d?"A human-facing reference for every renderer-owned MDX component.":i?"Static export. Interactive persistence requires the local review bridge.":"Local interactive review surface.").replaceAll("{{REVIEW_AUTHORITY}}",i?"static":"loading").replaceAll("{{EXPLORER}}",Ju(s)).replaceAll("{{REVIEW_SYNC}}",v).replaceAll("{{NAV}}",Yu(s)).replaceAll("{{CONTENT}}",c).replaceAll("{{FONTS}}",f).replaceAll("{{STYLE}}",Zu).replaceAll("{{MERMAID_URL}}",Ya).replaceAll("{{MERMAID_SRI}}",Ka).replaceAll("{{CLIENT}}",i?Ba:Pa),g=[...s.plan.blocks,...s.canvas?.blocks??[]],y=d?new Set(s.plan.blocks):void 0,x=g.map(({id:j})=>j);if(s.canvas)x.push("canvas");for(let j of g){if(j.type!=="CommentAnchor"||y?.has(j))x.push(..._(j,"title"));if(x.push(..._(j,"instructions")),i)continue;x.push(..._(j,"tabs"),..._(j,"panels"))}let o=Mr(t,x);if(o.length)throw Error(`Invalid rendered HTML:
${o.join(`
`)}`);return t}async function ji(s){let i=await pr(s),a=ea(s,i.manifest.dist);await Qu(a,{recursive:!0}),await na(a);let e=ea(a,"index.html"),d=ea(a,"static-export.html"),c=await Tr();return await _r(e,await Ar(i,!1,c)),await _r(d,await Ar(i,!0,c)),{indexPath:e,staticExportPath:d}}import{readFile as Ke,realpath as gv}from"fs/promises";import{join as Ue}from"path";import{createHash as rv,randomUUID as fs}from"crypto";import{constants as G}from"fs";import{link as ev,lstat as Q,mkdir as wa,open as Ji,readdir as _s,readlink as ya,realpath as Zs,rename as ls,rm as A,symlink as Yi,writeFile as xe}from"fs/promises";import{basename as dv,join as z,resolve as Js}from"path";import{isDeepStrictEqual as Xi}from"util";import{join as se}from"path";var Uu=/[\\\u0000-\u001f\u007f-\u00a0<>&#*_`\[\]()!|]/g;function ms(s){return String(s??"").replace(Uu,(i)=>`\\u${i.charCodeAt(0).toString(16).padStart(4,"0")}`)}function Ru(s){let i={};for(let a of s.plan.blocks){let e=k(a.body);if(e.length)(i[a.type]??=[]).push(...e)}return i}function da(s,i){let a=Sr(i);if(a.length)throw Error(a.join(`
`));let e=Ru(s);return{status:"approved",planSlug:s.manifest.slug,planPath:se(s.rootDir,s.manifest.entry),approvedAt:i.approvedAt??new Date().toISOString(),approvedScope:e.ImplementationTimeline??[],decisions:e.DecisionMatrix??[],answers:i.answers,implementationEntry:se(s.rootDir,s.manifest.entry),approvalDigest:i.approvalDigest,verification:e.Checklist??[],openRisks:e.RiskRegister??[]}}function ie(s){let i=[...s.matchAll(/^Canonical-Handoff: ([A-Za-z0-9_-]+)$/gm)];if(i.length!==1)throw Error("Agent handoff Markdown must contain exactly one canonical payload");let a=JSON.parse(Buffer.from(i[0][1],"base64url").toString("utf8")),e=Gs(a);if(e.length)throw Error(e.join(`
`));return a}function ca(s){let i=(d)=>d.length?d.map((c)=>`- ${ms(c)}`).join(`
`):"- None recorded",a=Object.entries(s.answers).length?Object.entries(s.answers).sort(([d],[c])=>d.localeCompare(c)).map(([d,c])=>`- ${ms(d)} = ${ms(JSON.stringify(c))}`).join(`
`):"- None recorded",e=Buffer.from(JSON.stringify(s),"utf8").toString("base64url");return`# Agent Handoff: ${ms(s.planSlug)}

Status: ${ms(s.status)}
Approved: ${ms(s.approvedAt)}
Plan: ${ms(s.planPath)}
Implementation-Entry: ${ms(s.implementationEntry)}
Approval-Digest: ${ms(s.approvalDigest)}
Canonical-Handoff: ${e}

## Approved Scope

${i(s.approvedScope)}

## Decisions

${i(s.decisions)}

## Answers

${a}

## Verification

${i(s.verification)}

## Open Risks

${i(s.openRisks)}
`}import{constants as ws}from"fs";import{lstat as Fs,open as me,readFile as nu,realpath as Lu}from"fs/promises";import{resolve as qi}from"path";import{dlopen as va,FFIType as R,ptr as ae,read as Bu}from"bun:ffi";var ma=".muse-review.lock",Pu=2,Cu=4,Ou=8,Wi=500,Mu=3221225472,Nu=3,Su=4,$u=128,Eu=2097152,Iu=3,Du=32,ku=33,Gu=0xffffffffffffffffn,pu,re={flock:{args:[R.i32,R.i32],returns:R.i32}};function ee(s,i){if(s===null)throw Error(`${i} returned a null errno pointer`);return Bu.i32(s)}function ua(s,i){if(i==="darwin"){let e=va(s,{...re,__error:{args:[],returns:R.ptr}});return{flock:(d,c)=>e.symbols.flock(d,c),errno:()=>ee(e.symbols.__error(),"__error")}}let a=va(s,{...re,__errno_location:{args:[],returns:R.ptr}});return{flock:(e,d)=>a.symbols.flock(e,d),errno:()=>ee(a.symbols.__errno_location(),"__errno_location")}}function _u(s,i){return(i==="darwin"?{5:"EIO",9:"EBADF",35:"EWOULDBLOCK",45:"ENOTSUP",77:"ENOLCK",102:"EOPNOTSUPP"}:{5:"EIO",9:"EBADF",11:"EWOULDBLOCK",37:"ENOLCK",38:"ENOSYS",95:"EOPNOTSUPP"})[s]??`ERRNO_${s}`}function de(s,i,a,e){let d=_u(a,e),c=Object.assign(Error(`${d}: flock ${i} failed for ${s}`),{code:d,errno:a,syscall:"flock",path:s});return Error(`Could not ${i} review lock at ${s}: ${d} (${a})`,{cause:c})}function ce(s,i,a,e,d){if(s(a,Pu|Cu)!==0){let c=i();if(c===(d==="darwin"?35:11))return;throw de(e,"acquire",c,d)}return{release(){if(s(a,Ou)!==0)throw de(e,"release",i(),d)}}}function Au(s){let i=new Uint16Array(s.length+1);for(let a=0;a<s.length;a+=1)i[a]=s.charCodeAt(a);return i}async function Tu(){if(process.platform==="win32"){let e=va("kernel32.dll",{CreateFileW:{args:[R.ptr,R.u32,R.u32,R.ptr,R.u32,R.u32,R.u64],returns:R.u64},LockFileEx:{args:[R.u64,R.u32,R.u32,R.u32,R.u32,R.ptr],returns:R.i32},CloseHandle:{args:[R.u64],returns:R.i32},GetLastError:{args:[],returns:R.u32}});return{kind:"windows",async tryLock(d){let c=qi(d.path,ma),f=Au(c),v=e.symbols.CreateFileW(ae(f),Mu,Nu,null,Su,$u|Eu,0n);if(v===Gu){let y=e.symbols.GetLastError();if(y===Du)return;throw Error(`CreateFileW failed for the review lock with Windows error ${y}`)}let t;try{if(t=await Fs(c,{bigint:!0}),!t.isFile()||t.isSymbolicLink())throw Error(`Review lock path must be a regular non-symlink file at ${c}`)}catch(y){throw e.symbols.CloseHandle(v),y}let g=new Uint8Array(32);for(let y=0;y<Wi;y+=1){if(e.symbols.LockFileEx(v,Iu,0,4294967295,4294967295,ae(g))!==0){try{let o=await Fs(c,{bigint:!0});if(!o.isFile()||o.isSymbolicLink()||o.dev!==t.dev||o.ino!==t.ino||o.size!==t.size||o.mtimeNs!==t.mtimeNs||o.ctimeNs!==t.ctimeNs)throw Error(`Review lock path generation changed during Windows acquisition at ${c}`)}catch(o){throw e.symbols.CloseHandle(v),o}return{release(){e.symbols.CloseHandle(v)}}}let x=e.symbols.GetLastError();if(x!==ku)throw e.symbols.CloseHandle(v),Error(`LockFileEx failed for the review lock with Windows error ${x}`);if(y+1===Wi)throw e.symbols.CloseHandle(v),Error(`Timed out waiting for Windows review lock at ${c}`);await Bun.sleep(10)}throw e.symbols.CloseHandle(v),Error(`Timed out waiting for Windows review lock at ${c}`)}}}if(process.platform!=="darwin"&&process.platform!=="linux")throw Error(`Review locking is unsupported on ${process.platform}`);let s=process.platform,i;if(s==="darwin")i=ua("/usr/lib/libSystem.B.dylib",s);else{let e=process.arch==="x64"?"x86_64":process.arch==="arm64"?"aarch64":process.arch,d=["libc.so.6","libc.so",`ld-musl-${e}.so.1`,`/lib/ld-musl-${e}.so.1`];for(let c of d)try{i=ua(c,s);break}catch{}if(!i){let c="";try{c=await nu("/proc/self/maps","utf8")}catch{throw Error("Could not resolve Linux libc for review locking")}let v=(c.match(/\/\S*(?:libc\.so(?:\.\d+)*|ld-musl-[^\s/]+\.so\.1)/g)??[]).find((t)=>!t.includes("libcap")&&!t.includes("libcrypto"));if(!v)throw Error("Could not resolve the loaded Linux libc for review locking");i=ua(v,s)}}if(!i)throw Error("Could not initialize Unix libc review locking");let a=i;return{kind:"unix",async tryLock(e){return ce(a.flock,a.errno,e.handle.fd,e.path,s)},async tryLegacyLock(e){return ce(a.flock,a.errno,e.handle.fd,e.path,s)}}}async function sv(s){let i=await Lu(s),a=await me(i,ws.O_RDONLY|ws.O_DIRECTORY|ws.O_NOFOLLOW|ws.O_NONBLOCK);try{let[e,d]=await Promise.all([a.stat({bigint:!0}),Fs(i,{bigint:!0})]);if(!e.isDirectory()||!d.isDirectory()||d.isSymbolicLink()||e.dev!==d.dev||e.ino!==d.ino)throw Error(`Plan root is not bound to its opened generation at ${i}`);return{path:i,handle:a,descriptor:e}}catch(e){throw await a.close(),e}}async function ue(s){let[i,a]=await Promise.all([s.handle.stat({bigint:!0}),Fs(s.path,{bigint:!0})]);if(!i.isDirectory()||!a.isDirectory()||a.isSymbolicLink()||i.dev!==s.descriptor.dev||i.ino!==s.descriptor.ino||a.dev!==i.dev||a.ino!==i.ino)throw Error(`Plan root generation changed at ${s.path}`)}async function iv(s){let i=qi(s.path,ma),a=await me(i,ws.O_RDWR|ws.O_CREAT|ws.O_NOFOLLOW|ws.O_NONBLOCK,384);try{let[e,d]=await Promise.all([a.stat({bigint:!0}),Fs(i,{bigint:!0})]);if(!e.isFile()||!d.isFile()||d.isSymbolicLink()||e.dev!==d.dev||e.ino!==d.ino)throw Error(`Review lock path is not bound to its opened file at ${i}`);return{path:i,handle:a,descriptor:e}}catch(e){throw await a.close(),e}}async function av(s){let[i,a]=await Promise.all([s.handle.stat({bigint:!0}),Fs(s.path,{bigint:!0})]);if(!i.isFile()||!a.isFile()||a.isSymbolicLink()||i.dev!==s.descriptor.dev||i.ino!==s.descriptor.ino||a.dev!==i.dev||a.ino!==i.ino)throw Error(`Review lock path generation changed at ${s.path}`)}async function ve(s,i,a,e){let d=[];try{a?.release()}catch(c){d.push(c)}try{await e?.handle.close()}catch(c){d.push(c)}try{s.release()}catch(c){d.push(c)}try{await i.handle.close()}catch(c){d.push(c)}return d}async function fa(s){let i=await(pu??=Tu());for(let a=0;a<Wi;a+=1){let e=await sv(s),d;try{d=await i.tryLock(e)}catch(v){throw await e.handle.close(),v}if(d===void 0){await e.handle.close(),await Bun.sleep(10);continue}let c,f;try{if(i.kind==="unix"){c=await iv(e);for(let y=0;y<Wi;y+=1){if(await ue(e),f=await i.tryLegacyLock(c),f!==void 0)break;await Bun.sleep(10)}if(!f)throw Error(`Timed out waiting for legacy review lock at ${qi(e.path,ma)}`)}let v=!1,t=async()=>{if(v)throw Error(`Review lock was already released for ${e.path}`);await ue(e)},g=async()=>{if(await t(),c)await av(c)};return await g(),{assertOwned:g,assertCanonicalOwned:t,async release(){if(v)return;v=!0;let y=await ve(d,e,f,c);if(y.length)throw AggregateError(y,`Review lock release failed for ${e.path}`)}}}catch(v){let t=await ve(d,e,f,c);if(t.length)throw AggregateError([v,...t],`Review lock acquisition cleanup failed for ${e.path}`);throw v}}throw Error(`Timed out waiting for review lock for ${qi(s)}`)}var Qi=".muse-review",p="current",oe="initialized",js=["plan-state.json","comments.json","agent-handoff.json","agent-handoff.md"],cv=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;class ts extends Error{failure;constructor(s,i){super(i);this.failure=s;this.name="ReviewOperationError"}}class xa extends Error{published;restorable;constructor(s,i,a){super("Published review snapshot failed canonical postcommit verification",{cause:a});this.published=s;this.restorable=i;this.name="SnapshotCommitVerificationError"}}function n(s,i){return s.dev===i.dev&&s.ino===i.ino&&s.size===i.size&&s.mtimeNs===i.mtimeNs&&s.ctimeNs===i.ctimeNs}function Vs(s,i){return s.dev===i.dev&&s.ino===i.ino}async function T(s){let i=await Ji(s,G.O_RDONLY|G.O_DIRECTORY|G.O_NOFOLLOW|G.O_NONBLOCK);try{let[a,e]=await Promise.all([i.stat({bigint:!0}),Q(s,{bigint:!0})]);if(!a.isDirectory()||!e.isDirectory()||e.isSymbolicLink()||a.dev!==e.dev||a.ino!==e.ino)throw Error(`Directory path is not bound to its opened generation at ${s}`);return{path:s,handle:i,stats:a}}catch(a){throw await i.close(),a}}async function K(s){let[i,a]=await Promise.all([s.handle.stat({bigint:!0}),Q(s.path,{bigint:!0})]);if(i.dev!==s.stats.dev||i.ino!==s.stats.ino||a.dev!==s.stats.dev||a.ino!==s.stats.ino)throw Error(`Directory path generation changed at ${s.path}`)}async function oa(s,i){if(i>BigInt(Number.MAX_SAFE_INTEGER))throw Error("Plan authority file is too large to read safely");let a=Buffer.alloc(Number(i)),e=0;while(e<a.length){let d=await s.read(a,e,a.length-e,e);if(d.bytesRead===0)throw Error("Plan authority file ended while being read");e+=d.bytesRead}return a}async function la(s,i){let a;try{a=await Ji(s,G.O_RDONLY|G.O_NOFOLLOW|G.O_NONBLOCK)}catch(e){if(!i&&typeof e==="object"&&e!==null&&"code"in e&&e.code==="ENOENT")return{path:s,exists:!1};throw e}try{let[e,d]=await Promise.all([a.stat({bigint:!0}),Q(s,{bigint:!0})]);if(!e.isFile()||!d.isFile()||d.isSymbolicLink()||e.dev!==d.dev||e.ino!==d.ino)throw Error(`Plan authority path is not bound to its opened file at ${s}`);let c=await oa(a,e.size),[f,v]=await Promise.all([a.stat({bigint:!0}),Q(s,{bigint:!0})]);if(!n(e,f)||!n(e,v))throw Error(`Plan authority changed while being captured at ${s}`);return{path:s,exists:!0,bytes:c,handle:a,stats:e}}catch(e){throw await a.close(),e}}async function he(s){let i=await Q(s,{bigint:!0});if(!i.isDirectory()||i.isSymbolicLink())throw Error(`Plan root must be a non-symlink directory at ${s}`);let a=await Promise.allSettled([la(z(s,"plan.mdx"),!0),la(z(s,"canvas.mdx"),!1),la(z(s,"visual-explainer.json"),!1)]),e=a.find((c)=>c.status==="rejected");if(e)throw await Promise.allSettled(a.filter((c)=>c.status==="fulfilled").map((c)=>c.value.handle?.close())),e.reason;let d=a.map((c)=>c.value);try{let c=await Q(s,{bigint:!0});if(!n(i,c))throw Error(`Plan root changed while authority was captured at ${s}`);let[f,v,t]=d;return{root:i,files:d,plan:ra(s,{plan:f.bytes.toString("utf8"),canvas:v.bytes?.toString("utf8"),manifest:t.bytes?.toString("utf8")})}}catch(c){throw await Promise.allSettled(d.map((f)=>f.handle?.close())),c}}async function ha(s,i){let a=await Q(s,{bigint:!0});if(i.root.dev!==a.dev||i.root.ino!==a.ino)throw Error(`Plan root generation changed at ${s}`);for(let e of i.files){if(!e.exists){if(await qe(e.path))throw Error(`Plan source appeared during approval at ${e.path}`);continue}let[d,c,f]=await Promise.all([e.handle.stat({bigint:!0}),Q(e.path,{bigint:!0}),oa(e.handle,e.stats.size)]);if(!n(e.stats,d)||!n(e.stats,c)||!f.equals(e.bytes))throw Error(`Plan source changed during approval at ${e.path}`)}}async function He(s){if(s)await Promise.allSettled(s.files.map((i)=>i.handle?.close()))}async function rs(s,i){let a=z(s,Qi);if(i)try{await wa(a)}catch(f){if(!(typeof f==="object"&&f!==null&&("code"in f)&&f.code==="EEXIST"))throw f}let e=await Q(a);if(!e.isDirectory()||e.isSymbolicLink())throw Error(`Review store must be a plan-local non-symlink directory at ${a}`);let[d,c]=await Promise.all([Zs(s),Zs(a)]);if(c!==Js(d,Qi))throw Error(`Review store escapes the plan directory at ${a}`);return a}async function Ki(s,i){let a=await rs(s,i),e=z(a,"bundles");if(i)try{await wa(e)}catch(v){if(!(typeof v==="object"&&v!==null&&("code"in v)&&v.code==="EEXIST"))throw v}let d=await Q(e);if(!d.isDirectory()||d.isSymbolicLink())throw Error(`Review bundles root must be a plan-local non-symlink directory at ${e}`);let[c,f]=await Promise.all([Zs(a),Zs(e)]);if(f!==Js(c,"bundles"))throw Error(`Review bundles root escapes the review store at ${e}`);return e}async function Ys(s,i){let a=await rs(s,!1),e=await Ki(s,!1),d=await Q(i,{bigint:!0});if(!d.isSymbolicLink())throw Error(`Current review pointer is not a symlink at ${i}`);let c=await ya(i),f=c.replaceAll("\\","/"),v=f.match(/^bundles\/([0-9a-f-]+)$/);if(!v||!cv.test(v[1]))throw Error(`Invalid current review bundle target '${c}'`);let t=z(e,v[1]),[g,y]=await Promise.all([Q(t,{bigint:!0}),Q(i,{bigint:!0})]);if(!n(d,y))throw Error(`Current review pointer generation changed at ${i}`);if(!g.isDirectory()||g.isSymbolicLink()||Js(a,f)!==Js(t))throw Error(`Current review bundle is not a regular directory at ${t}`);return{id:v[1],path:t,directory:g,pointer:d}}async function Fi(s){let i=await rs(s,!1);return Ys(s,z(i,p))}async function je(s){let i;try{i=await rs(s,!1)}catch(a){if(typeof a==="object"&&a!==null&&"code"in a&&a.code==="ENOENT")return;throw a}try{await Q(z(i,p))}catch(a){if(typeof a==="object"&&a!==null&&"code"in a&&a.code==="ENOENT")return;throw a}return Fi(s)}async function qe(s){try{return await Q(s),!0}catch(i){if(typeof i==="object"&&i!==null&&"code"in i&&i.code==="ENOENT")return!1;throw i}}function fe(s){return typeof s==="string"&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s}function We(s){if(s===void 0)return[];let i=JSON.parse(s);if(!Array.isArray(i))throw Error("Comments must be an array");let a={id:!0,blockId:!0,anchor:!0,body:!0,status:!0,createdAt:!0,resolvedAt:!0},e=new Set;for(let d of i){if(!d||typeof d!=="object"||Array.isArray(d))throw Error("Each comment must be an object");let c=d,f=Object.keys(c).find((t)=>!a[t]);if(f)throw Error(`Comment contains unknown field '${f}'`);let v=c.status==="resolved";if(typeof c.id!=="string"||c.id.trim().length===0||e.has(c.id)||typeof c.blockId!=="string"||c.blockId.trim().length===0||typeof c.body!=="string"||c.body.trim().length===0||!fe(c.createdAt)||c.status!=="open"&&!v||c.anchor!==void 0&&(typeof c.anchor!=="string"||c.anchor.trim().length===0)||v&&(!fe(c.resolvedAt)||Date.parse(c.resolvedAt)<Date.parse(c.createdAt))||!v&&c.resolvedAt!==void 0)throw Error("Comments must have unique nonblank ids, valid timestamps, and coherent open/resolved fields");e.add(c.id)}return i}function ze(s,i){return[...s.plan.blocks,...s.canvas?.blocks??[]].some((a)=>a.id===i)}function Ha(s,i){let a=i.find((e)=>!ze(s,e.blockId));if(a)throw Error(`Persisted comment '${a.id}' references unknown blockId '${a.blockId}'`)}async function xs(s,i,a){let e=await Xe(s,a);return Ha(i.plan,e.comments),e}function ta(s){if(Array.isArray(s))return s.map(ta);if(!s||typeof s!=="object")return s;return Object.fromEntries(Object.entries(s).sort(([i],[a])=>i.localeCompare(a)).map(([i,a])=>[i,ta(a)]))}function As(s,i,a){let{approvalDigest:e,...d}=i,c=ta({sources:Object.fromEntries(s.files.map((f)=>[dv(f.path),f.exists?{exists:!0,bytes:f.bytes.toString("base64")}:{exists:!1}])),state:d,comments:a});return rv("sha256").update(JSON.stringify(c)).digest("hex")}function ja(s,i){if(i.state.status!=="approved"||i.handoffJson===void 0||i.handoffMarkdown===void 0||i.state.approvalDigest!==As(s,i.state,i.comments))throw Error("No coherent approved handoff is published");let a=JSON.parse(i.handoffJson),e=da(s.plan,i.state);if(Gs(a).length>0||!Xi(a,e)||i.handoffMarkdown!==ca(e)||!Xi(ie(i.handoffMarkdown),e))throw Error("No coherent approved handoff is published")}async function uv(s,i){let a=z(s,i),e;try{e=await Ji(a,G.O_RDONLY|G.O_NOFOLLOW|G.O_NONBLOCK)}catch(f){if(typeof f==="object"&&f!==null&&"code"in f&&f.code==="ELOOP")throw Error(`Review bundle member '${i}' must be a regular non-symlink file`);throw f}let[d,c]=await Promise.all([e.stat({bigint:!0}),Q(a,{bigint:!0})]);if(!d.isFile()||!c.isFile()||c.isSymbolicLink()||d.dev!==c.dev||d.ino!==c.ino)throw await e.close(),Error(`Review bundle member '${i}' must be a stable regular non-symlink file`);return{file:i,path:a,handle:e,before:d}}async function Xe(s,i){let a=await Q(s,{bigint:!0});if(i&&!n(i,a))throw Error(`Review bundle path generation changed before it was read at ${s}`);let e=(await _s(s)).sort();for(let x of e)if(!js.includes(x))throw Error(`Review bundle contains unexpected member '${x}' at ${s}`);for(let x of["plan-state.json","comments.json"])if(!e.includes(x))throw Error(`Review bundle is missing ${x} at ${s}`);if(["agent-handoff.json","agent-handoff.md"].filter((x)=>e.includes(x)).length===1)throw Error(`Review bundle must contain a coherent handoff pair at ${s}`);let c={},f=[];try{for(let x of e)f.push(await uv(s,x));for(let x of f)c[x.file]=await x.handle.readFile("utf8");for(let x of f){let[o,j]=await Promise.all([x.handle.stat({bigint:!0}),Q(x.path,{bigint:!0})]);if(!n(o,x.before)||!n(j,x.before))throw Error(`Review bundle member '${x.file}' changed or was rebound while it was being read at ${s}`)}}finally{await Promise.allSettled(f.map((x)=>x.handle.close()))}let[v,t]=await Promise.all([_s(s).then((x)=>x.sort()),Q(s,{bigint:!0})]);if(!Xi(v,e)||!n(t,a)||i!==void 0&&!n(t,i))throw Error(`Review bundle changed or was rebound while it was being read at ${s}`);let g=JSON.parse(c["plan-state.json"]),y=Qs(g);if(y.length)throw Error(y.join(`
`));return{state:g,comments:We(c["comments.json"]),handoffJson:c["agent-handoff.json"],handoffMarkdown:c["agent-handoff.md"]}}async function le(s,i){Ha(i.plan,s.comments);let a=i.plan,e=s.comments.filter((y)=>y.status==="open").map((y)=>y.id),d={...s.state,unresolvedCommentIds:e},{handoffJson:c,handoffMarkdown:f}=s,v=!1,t=e.length===0&&Ti([...a.plan.blocks,...a.canvas?.blocks??[]],d).length===0,g=d.status!=="approved"||d.approvalDigest===As(i,d,s.comments);if(d.status==="approved"&&t&&g)try{ja(i,{...s,state:d}),v=!0}catch{v=!1}if(d.status==="approved"&&(!t||!g||!v)){let{approvedAt:y,reviewer:x,approvalDigest:o,...j}=d;d={...j,status:"needs_revision"}}if(d.status!=="approved")c=void 0,f=void 0;return{state:d,comments:s.comments,handoffJson:c,handoffMarkdown:f}}function vv(s,i){if(i==="plan-state.json")return`${JSON.stringify(s.state,null,2)}
`;if(i==="comments.json")return`${JSON.stringify(s.comments,null,2)}
`;if(i==="agent-handoff.json")return s.handoffJson;return s.handoffMarkdown}async function Vi(s,i,a,e){let d=`${i}.${fs()}.invalid`;await K(s),await e(),await ls(i,d);let c=await O(d),f,v;try{f=await Ys(Js(s.path,".."),d)}catch(t){v=t}if(c.stats&&Vs(c.stats,a.pointer)){if(v!==void 0)throw AggregateError([v],"Moved expected review pointer could not be verified");if(!f||f.id!==a.id||!n(f.directory,a.directory))throw Error("Moved expected review pointer resolved a different publication");return!0}try{if(c.kind!=="symlink")throw Error(`Moved review pointer is not a symlink at ${d}`);await K(s),await e(),await Yi(c.target,i);let t=await Ys(Js(s.path,".."),i);if(f&&(t.id!==f.id||!n(t.directory,f.directory)))throw Error("Restored review successor does not resolve the moved publication");let g={path:i,kind:"symlink",target:c.target,stats:t.pointer};await e(),await Promise.all([ba(g),qa(c)]),await A(d,{force:!0})}catch(t){throw AggregateError([...v===void 0?[]:[v],t],f?"Distinct review successor could not be restored after conditional quarantine":"Moved review pointer could not be verified and restoration was incomplete")}if(v!==void 0)throw v;return!1}async function ys(s,i,a,e,d,c=!1){let f=await rs(s,!0),v=await Ki(s,!0),[t,g]=await Promise.all([T(f),T(v)]),y=fs(),x=z(v,`${y}.staging`),o=z(v,y),j=z(f,`current.${y}.pointer`),F=!1,W,Z,V=async()=>{await Promise.allSettled([W?.handle.close(),g.handle.close(),t.handle.close()])},I=async()=>{let D=!0;try{if(await Promise.all([K(t),K(g)]),F){let gs=await Q(o,{bigint:!0});D=gs.dev===W.stats.dev&&gs.ino===W.stats.ino}}catch{D=!1}if(D)await a(),await Promise.allSettled([A(x,{recursive:!0,force:!0}),A(j,{force:!0}),...F?[A(o,{recursive:!0,force:!0})]:[]])};try{await K(g),await a(),await wa(x),W=await T(x);for(let D of js){let gs=vv(i,D);if(gs!==void 0)await K(W),await a(),await xe(z(x,D),gs,{flag:"wx"})}await K(W),await K(g),await a(),await ls(x,o),F=!0,Z=await Q(o,{bigint:!0}),await K(t),await a(),await Yi(`bundles/${y}`,j),await d?.(),await K(t)}catch(D){throw await I(),await V(),D}if(!Z)throw await V(),Error("Published review bundle generation was not captured");let L=await Ys(s,j),J={id:y,path:o,directory:Z,pointer:L.pointer};if(L.id!==J.id||!n(L.directory,J.directory))throw await I(),await V(),Error("Prepared current pointer does not resolve the published review generation");await Promise.allSettled([W?.handle.close(),g.handle.close()]),await a(),await ls(j,z(f,p)),e?.(J);let cs=!1,Ja=!1;try{await K(t),cs=!0;let D=await Fi(s);if(Ja=!0,D.id!==J.id||!n(D.directory,J.directory)||!Vs(D.pointer,J.pointer))throw Error("Canonical current pointer does not resolve the published review generation")}catch(D){let gs=cs&&c&&!Ja;if(cs&&!gs)await Vi(t,z(f,p),J,a);throw new xa(J,gs,D)}finally{await t.handle.close().catch(()=>{return})}return J}async function ga(s,i,a,e,d){let c=await rs(s,!1),f=await T(c),v=z(c,`current.${fs()}.rollback`),t,g=!1;try{let y=await Fi(s);if(y.id!==e.id||!n(y.directory,e.directory)||!Vs(y.pointer,e.pointer))throw Error("Published approval generation changed before rollback");await Yi(`bundles/${i.id}`,v),await K(a),await K(f),t=await Q(v,{bigint:!0});let x=await Q(z(c,p),{bigint:!0});if(!Vs(x,e.pointer))throw Error("Published approval pointer generation changed before rollback");await d(),await ls(v,z(c,p)),g=!0,await K(f);let o=await Fi(s);if(o.id!==i.id||!n(o.directory,i.directory)||!Vs(o.pointer,t))throw Error("Canonical current pointer does not resolve the restored prior generation")}catch(y){let x=[];try{if(g&&t)await Vi(f,z(c,p),{...i,pointer:t},d);else await K(f),await Vi(f,z(c,p),e,d)}catch(o){x.push(o)}if(!g)try{await A(v,{force:!0})}catch(o){x.push(o)}if(await Promise.allSettled([a.handle.close(),f.handle.close()]),x.length)throw AggregateError([y,...x],"Prior review publication rollback failed and cleanup was incomplete");throw y}await Promise.allSettled([a.handle.close(),f.handle.close()])}async function mv(s,i,a,e){let d=await rs(s,!1),c=z(d,`current.${fs()}.invalid`);if(await e(),await ls(z(d,p),c),(await Ys(s,c)).id!==i.id)throw Error("Current approval generation changed while being invalidated");let v=await ys(s,a,e);try{await e(),await A(c,{force:!0})}catch(t){console.warn(`Invalidation committed; deferred pointer cleanup: ${t instanceof Error?t.message:String(t)}`)}return v}async function fv(s){let i=await rs(s,!1),a=(await _s(i)).filter((e)=>e.startsWith("current.")&&e.endsWith(".invalid"));if(a.length===0)return;if(a.length!==1)throw Error("Review store has multiple invalidated approval generations");return Ys(s,z(i,a[0]))}class C extends Error{}async function O(s){let i;try{i=await Q(s,{bigint:!0})}catch(e){if(typeof e==="object"&&e!==null&&"code"in e&&e.code==="ENOENT")return{path:s,kind:"missing"};throw e}if(i.isSymbolicLink()){let e=await ya(s),d=await Q(s,{bigint:!0});if(!n(i,d))throw new C(`Legacy path changed while captured at ${s}`);return{path:s,kind:"symlink",target:e,stats:i}}if(!i.isFile())throw Error(`Unsupported compatibility path at ${s}`);let a=await Ji(s,G.O_RDONLY|G.O_NOFOLLOW|G.O_NONBLOCK);try{let e=await a.stat({bigint:!0});if(e.dev!==i.dev||e.ino!==i.ino)throw new C(`Legacy path was rebound while captured at ${s}`);let d=await oa(a,e.size),[c,f]=await Promise.all([a.stat({bigint:!0}),Q(s,{bigint:!0})]);if(!n(e,c)||!n(e,f))throw new C(`Legacy path changed while captured at ${s}`);return{path:s,kind:"file",content:d,stats:e}}finally{await a.close()}}async function Qe(s){return Promise.all(js.map((i)=>O(z(s,i))))}async function ba(s){let i=await O(s.path);if(!(i.kind===s.kind&&(i.kind==="missing"||n(i.stats,s.stats)&&(i.kind==="file"?i.content.equals(s.content):i.target===s.target))))throw new C(`Legacy path generation changed at ${s.path}`)}function Fe(s){let i=(c)=>{let f=s[js.indexOf(c)];if(f.kind==="symlink")throw Error(`Legacy review path must not be a symlink at ${f.path}`);return f.content?.toString("utf8")},a=i("plan-state.json"),e=a===void 0?Cr():JSON.parse(a),d=Qs(e).filter((c)=>c!=="Approved ReviewState.approvalDigest must be a canonical SHA-256 digest");if(d.length)throw Error(d.join(`
`));return{state:e,comments:We(i("comments.json")),handoffJson:i("agent-handoff.json"),handoffMarkdown:i("agent-handoff.md")}}function Ks(s,i){return s.kind===i.kind&&s.kind!=="missing"&&s.stats.dev===i.stats.dev&&s.stats.ino===i.stats.ino&&(s.kind==="file"?s.content.equals(i.content):s.target===i.target)}function te(s,i){if(s.stats!==void 0)return Ks(s,i);return s.kind==="symlink"&&i.kind==="symlink"&&s.target===i.target}async function qa(s){let i=await O(s.path);if(!(s.kind==="missing"?i.kind==="missing":Ks(s,i)))throw new C(`Legacy path generation changed at ${s.path}`)}async function Zi(s,i,a){let e=await O(i);if(!Ks(s,e))throw new C(`Quarantined compatibility generation changed at ${s.path}`);await a(),await ev(i,s.path),await qa(s),await a(),await A(i,{force:!0})}async function zi(s,i){let a=`${s.original.path}.${fs()}.rollback`;await i();let e=await O(s.original.path);if(!s.created||!te(s.installed,e))throw new C(`Compatibility path changed before rollback at ${s.original.path}`);if(s.quarantine){let c=await O(s.quarantine);if(!Ks(s.original,c))throw new C(`Quarantined compatibility generation changed at ${s.original.path}`)}else if(s.original.kind!=="missing")throw Error(`Compatibility rollback is missing quarantine authority at ${s.original.path}`);await i(),await ls(s.original.path,a);let d=await O(a);if(!te(s.installed,d))throw new C(`Compatibility path changed during rollback at ${s.original.path}`);try{if((await O(s.original.path)).kind!=="missing")throw new C(`External compatibility successor appeared during rollback at ${s.original.path}`);if(s.quarantine)await Zi(s.original,s.quarantine,i);else await qa(s.original)}catch(c){let f=[c];try{if((await O(s.original.path)).kind==="missing")await Zi({...d,path:s.original.path},a,i)}catch(v){f.push(v)}throw AggregateError(f,`Compatibility rollback retained ambiguous generations at ${s.original.path}`)}await i(),await A(a,{force:!0})}async function lv(s,i,a){let e=await T(s),d=[];try{for(let c=0;c<js.length;c+=1){let f=js[c],v=i[c],t=z(s,f),g=z(Qi,p,f),y;if(await K(e),await ba(v),v.kind!=="missing"){y=z(s,`.${f}.${fs()}.legacy`),await a(),await ls(t,y);let o=await O(y);if(!Ks(v,o)){let j=new C(`Legacy path changed during conditional migration at ${t}`);try{await Zi({...o,path:t},y,a)}catch(F){throw AggregateError([j,F],`Conditional compatibility migration rollback failed at ${t}`)}throw j}}let x={original:v,installed:{path:t,kind:"symlink",target:g},quarantine:y,created:!1};d.push(x);try{await K(e),await a(),await Yi(g,t),x.created=!0;let o=await Q(t,{bigint:!0});if(!o.isSymbolicLink())throw Error(`Installed compatibility path is not a symlink at ${t}`);x.installed={...x.installed,stats:o},await ba(x.installed)}catch(o){let j=[];if(!x.created){if(d.pop()!==x)throw Error(`Compatibility replacement bookkeeping changed at ${t}`)}if(!x.created&&y){let F=!1;try{let W=await O(t),Z=await O(y);if(!Ks(v,Z))throw new C(`Quarantined compatibility generation changed at ${t}`);if(W.kind!=="missing")throw F=!0,await a(),await A(y,{force:!0}),new C(`Compatibility destination changed during migration at ${t}`);await Zi(v,y,a)}catch(W){if(F)throw W;j.push(W)}}if(j.length)throw AggregateError([o,...j],`Compatibility installation failed and rollback was incomplete at ${t}`);if(o instanceof C)throw o;if(typeof o==="object"&&o!==null&&"code"in o&&o.code==="EEXIST")throw new C(`Compatibility destination changed during migration at ${t}`);throw o}}return d}catch(c){let f=[];for(let v of d.reverse())try{await K(e),await zi(v,a)}catch(t){f.push(t)}if(f.length)throw AggregateError([c,...f],"Compatibility setup failed and rollback was incomplete");throw c}finally{await e.handle.close()}}async function ge(s){for(let i of js)try{if(await ya(z(s,i))!==z(Qi,p,i))return!1}catch(a){if(typeof a==="object"&&a!==null&&"code"in a&&(a.code==="ENOENT"||a.code==="EINVAL"))return!1;throw a}return!0}async function be(s,i,a){let e=await T(s);try{await K(e),await a(),await xe(i,`v1
`,{flag:"wx"})}finally{await e.handle.close()}}async function tv(s,i,a,e,d=!0){await e();let c=await rs(s,!0);await Ki(s,!0);let f=z(c,oe);if(await qe(f)){if(!await ge(s))throw Error("Initialized review store has missing or replaced compatibility paths");let g=i===void 0,y=i??await fv(s);if(!y)throw Error("Initialized review store is missing its current bundle");if(!d)return y;let x=await Xe(y.path,y.directory),o=await le(x,a);if(g&&o.state.status==="approved"){let{approvedAt:j,reviewer:F,approvalDigest:W,...Z}=o.state;o={state:{...Z,status:"needs_revision"},comments:o.comments}}if(Xi(o,x))return y;if(g)return ys(s,o,e);return x.state.status==="approved"&&o.state.status!=="approved"?mv(s,y,o,e):ys(s,o,e)}if(i&&await ge(s))return await be(c,f,e),i;let t;for(let g=0;g<10;g+=1){let y=await Qe(s),x=z(c,p),o=await O(x),j=await ys(s,await le(Fe(y),a),e),F=await O(x),W=[];try{W=await lv(s,y,e),await be(c,f,e);for(let Z of W)if(Z.quarantine)await e(),await A(Z.quarantine,{force:!0});t=j;break}catch(Z){let V=[],I=await O(f);if(I.kind!=="missing")try{await zi({original:{path:f,kind:"missing"},installed:I,created:!0},e)}catch(L){V.push(L)}for(let L of W.reverse())try{await zi(L,e)}catch(J){V.push(J)}try{await zi({original:o,installed:F,created:!0},e)}catch(L){V.push(L)}if(V.length)throw AggregateError([Z,...V],"Review-store initialization failed and rollback was incomplete");if(!(Z instanceof C))throw Z}}if(!t)throw Error("Legacy review state kept changing during migration");return await Wa(s,t,e),t}async function Wa(s,i,a){await a();let e=await rs(s,!1),d=await Ki(s,!1),[c,f]=await Promise.all([T(e),T(d)]);try{let v=await _s(d);for(let g of v.filter((y)=>y.endsWith(".staging")||y!==i.id)){await K(f);let y=z(d,g),x;try{x=await T(y)}catch(j){if(typeof j==="object"&&j!==null&&"code"in j&&j.code==="ENOENT")continue;throw j}let o=z(d,`.cleanup-${fs()}`);try{await K(x),await K(f),await a(),await ls(y,o);let j=await Q(o,{bigint:!0});if(j.dev!==x.stats.dev||j.ino!==x.stats.ino){console.warn(`Retained rebound review bundle cleanup candidate at ${o}`);continue}let F=await x.handle.stat({bigint:!0});if(F.dev!==j.dev||F.ino!==j.ino){console.warn(`Retained changed review bundle cleanup candidate at ${o}`);continue}await a(),await A(o,{recursive:!0})}finally{await x.handle.close()}}let t=await _s(e);for(let g of t.filter((y)=>y.startsWith("current.")&&(y.endsWith(".pointer")||y.endsWith(".invalid")||y.endsWith(".rollback"))||y.startsWith(`${oe}.`)&&y.endsWith(".tmp"))){await K(c);let y=z(e,g),x=await Q(y,{bigint:!0}),o=z(e,`.cleanup-${fs()}`);await a(),await ls(y,o);let j=await Q(o,{bigint:!0});if(x.dev!==j.dev||x.ino!==j.ino){console.warn(`Retained rebound temporary review-store path at ${o}`);continue}await a(),await A(o)}}finally{await Promise.allSettled([c.handle.close(),f.handle.close()])}}async function we(s,i,a,e,d){await d();let c;try{c=await rs(s,!1)}catch(t){if(typeof t==="object"&&t!==null&&"code"in t&&t.code==="ENOENT")return;throw t}let f=z(c,p),v=await O(f);if(v.kind==="missing"||!v.stats||!Vs(v.stats,e.pointer))return;try{await K(a)}catch(t){let g=await T(c);try{if(!await Vi(g,f,e,d))throw Error("Committed review pointer changed before failed transaction recovery")}catch(y){throw AggregateError([t,y],"Prior review generation was unavailable and the failed transaction could not be conditionally quarantined")}finally{await g.handle.close().catch(()=>{return})}throw AggregateError([t],"Prior review generation was unavailable; the failed transaction was quarantined without approved authority")}await ga(s,i,a,e,d)}async function Ts(s,i,a={}){s=await Zs(s);let e=await fa(s),d,c;try{await e.assertOwned();let f=await je(s);d=await he(s);let v=!1;if(f){let o=await xs(f.path,d,f.directory);await a.preflight?.(o,d),v=!0}else{let o=await Qe(s);if(!o.some((j)=>j.kind==="symlink")){let j=Fe(o);Ha(d.plan,j.comments),await a.preflight?.(j,d),v=!0}}await e.assertOwned();let t=await tv(s,f,d,e.assertOwned,a.normalize);if(!v&&a.preflight){let o=await xs(t.path,d,t.directory);await a.preflight(o,d)}if(a.cleanup!==!1)await Wa(s,t,e.assertOwned);if(a.mutating)c=await T(t.path);let g,y=(o)=>{if(g)throw Error("A review transaction cannot publish more than one current generation");g=o},x;try{x=await i(t,d,e.assertOwned,s,y)}catch(o){if(g&&c)try{await we(s,t,c,g,e.assertCanonicalOwned)}catch(j){throw AggregateError([o,j],"Review transaction failed after publication and recovery was incomplete")}throw o}if(a.mutating)try{await e.assertOwned()}catch(o){if(g&&c)try{await we(s,t,c,g,e.assertCanonicalOwned)}catch(j){throw AggregateError([o,j],"Review transaction lost ownership after publication and recovery was incomplete")}throw o}return x}finally{await c?.handle.close().catch(()=>{return}),await He(d),await e.release()}}async function za(s){return Ts(s,async(i,a,e,d)=>{let c=await xs(i.path,a,i.directory);if(c.state.status==="approved"&&c.state.approvalDigest!==As(a,c.state,c.comments))throw Error("Approved review identity changed while it was being read");if(c.state.status==="approved")await e(),await ha(d,a);return{...c,generation:i.id}})}async function Xa(s,i){s=await Zs(s);let a=await fa(s),e;try{await a.assertOwned();let d=await je(s);if(!d)throw new ts("not_found","No coherent approved handoff is published");e=await he(s);let c=await xs(d.path,e,d.directory);try{ja(e,c)}catch{throw new ts("not_found","No coherent approved handoff is published")}return await a.assertOwned(),await ha(s,e),i==="agent-handoff.json"?c.handoffJson:c.handoffMarkdown}finally{await He(e),await a.release()}}function Ui(s,i,a){return{...s,...i,answers:{...s.answers,...i.answers??{}},checklist:{...s.checklist,...i.checklist??{}},unresolvedCommentIds:a.filter((e)=>e.status==="open").map((e)=>e.id)}}async function Ve(s,i){if(i&&typeof i==="object"&&!Array.isArray(i)){let d=i;if(d.status==="approved"||"approvedAt"in d||"reviewer"in d||"approvalDigest"in d)throw Error("Approval status and metadata can only be set through /api/approve")}let a=Hi(i);if(a.length)throw Error(a.join(`
`));let e=i;return Ts(s,async(d,c,f,v,t)=>{let g=await xs(d.path,c,d.directory),y=Ui(g.state,e,g.comments),x=g.handoffJson,o=g.handoffMarkdown;if(g.state.status==="approved"&&(e.status!==void 0||e.answers!==void 0||e.checklist!==void 0)){let{approvedAt:F,reviewer:W,approvalDigest:Z,...V}=y;y={...V,status:"needs_revision"},x=void 0,o=void 0}let j=Qs(y);if(j.length)throw Error(j.join(`
`));return await ys(v,{...g,state:y,handoffJson:x,handoffMarkdown:o},f,t),y},{mutating:!0})}async function Ze(s,i){if(typeof i.blockId!=="string"||i.blockId.trim().length===0)throw Error("Comment blockId must be nonblank");if(typeof i.body!=="string"||i.body.trim().length===0)throw Error("Comment body must be nonblank");if(i.anchor!==void 0&&(typeof i.anchor!=="string"||i.anchor.trim().length===0))throw Error("Comment anchor must be nonblank when present");let a=(e)=>{if(!ze(e.plan,i.blockId))throw new ts("unprocessable",`Unknown comment blockId '${i.blockId}'`)};return Ts(s,async(e,d,c,f,v)=>{a(d);let t=await xs(e.path,d,e.directory),g=i.id??`c-${fs()}`;if(g.trim().length===0)throw Error("Comment id must be nonblank");let y=t.comments.find((Z)=>Z.id===g);if(y){if(y.blockId===i.blockId&&y.anchor===i.anchor&&y.body===i.body)return y;throw new ts("conflict",`Comment id '${g}' is already bound to a different payload`)}let x={id:g,blockId:i.blockId,anchor:i.anchor,body:i.body,status:"open",createdAt:new Date().toISOString()},o=[...t.comments,x],j=Ui(t.state,{},o),F=t.handoffJson,W=t.handoffMarkdown;if(t.state.status==="approved"){let{approvedAt:Z,reviewer:V,approvalDigest:I,...L}=j;j={...L,status:"needs_revision"},F=void 0,W=void 0}return await ys(f,{...t,state:j,comments:o,handoffJson:F,handoffMarkdown:W},c,v),x},{mutating:!0,preflight:(e,d)=>a(d)})}async function Je(s,i){let a=(e)=>{if(e.comments.filter((c)=>c.id===i).length!==1)throw new ts("not_found",`Unknown or ambiguous comment id '${i}'`)};return Ts(s,async(e,d,c,f,v)=>{let t=await xs(e.path,d,e.directory);if(a(t),t.comments.find((x)=>x.id===i).status==="resolved")return t.comments;let g=t.comments.map((x)=>x.id===i?{...x,status:"resolved",resolvedAt:new Date().toISOString()}:x),y=Ui(t.state,{},g);return await ys(f,{...t,state:y,comments:g},c,v),g},{mutating:!0,preflight:a})}function ye(s,i){let a=[...s.plan.blocks,...s.canvas?.blocks??[]],e=[...i.comments.some((d)=>d.status==="open")?["AgentHandoff cannot be generated while unresolved blocking comments remain"]:[],...Ti(a,i.state)];if(e.length)throw new ts("unprocessable",e.join(`
`))}async function Ye(s,i="local-reviewer"){if(i.trim().length===0)throw Error("Approval reviewer must be nonblank");return Ts(s,async(a,e,d,c,f)=>{let v=e.plan,t=await xs(a.path,e,a.directory);ye(v,t);let g=new Date().toISOString(),y=Ui(t.state,{status:"approved",approvedAt:g,reviewer:i,approvalDigest:void 0},t.comments),x={...y,approvalDigest:As(e,y,t.comments)},o=Qs(x);if(o.length)throw Error(o.join(`
`));let j=da(v,x),F=Gs(j);if(F.length)throw Error(F.join(`
`));let W=`${JSON.stringify(j,null,2)}
`,Z=ca(j);ja(e,{state:x,comments:t.comments,handoffJson:W,handoffMarkdown:Z});let V=async()=>{if(await d(),await ha(c,e),x.approvalDigest!==As(e,x,t.comments))throw Error("Plan source or review state changed during approval")},I=await T(a.path),L;try{L=await ys(c,{state:x,comments:t.comments,handoffJson:W,handoffMarkdown:Z},d,f,V,!0)}catch(J){if(J instanceof xa&&J.restorable)try{await ga(c,a,I,J.published,d)}catch(cs){throw AggregateError([J,cs],"Approval publication verification failed and prior authority could not be restored")}else await I.handle.close().catch(()=>{return});throw J}try{await V()}catch(J){try{await ga(c,a,I,L,d)}catch(cs){throw AggregateError([J,cs],"Approval identity failed and prior authority could not be restored")}throw J}await I.handle.close().catch(()=>{return});try{await Wa(c,L,d)}catch(J){console.warn(`Approval committed; deferred review-store cleanup: ${J instanceof Error?J.message:String(J)}`)}return j},{mutating:!0,normalize:!1,cleanup:!1,preflight:(a,e)=>ye(e.plan,a)})}async function Qa(s){try{return await s.json()}catch{throw new Response("Invalid JSON",{status:400})}}function Re(s){if(!s||typeof s!=="object"||Array.isArray(s))throw new Response("JSON body must be an object",{status:400});return s}function bv(s,i,a){let e=s.headers.get("origin");if(e!==null){let d;try{d=new URL(e)}catch{}let c=i.hostname==="localhost"||i.hostname==="127.0.0.1"||i.hostname==="[::1]";if(!d||e==="null"||d.origin!==i.origin||!c||Number(i.port)!==a)throw new Response("Foreign mutation origin",{status:403})}if(s.headers.get("content-type")?.split(";",1)[0].trim().toLowerCase()!=="application/json")throw new Response("Mutating API requests require application/json",{status:415})}function wv(s,i){let a=Object.keys(s);if("resolveId"in s){if(a.length!==1||typeof s.resolveId!=="string"||s.resolveId.trim().length===0)throw new Response("Comment resolution body must be exactly { resolveId: nonblank string }",{status:400});return{mode:"resolve",resolveId:s.resolveId}}let e=s.id??i??void 0;if(a.some((d)=>d!=="id"&&d!=="blockId"&&d!=="anchor"&&d!=="body")||e!==void 0&&(typeof e!=="string"||e.trim().length===0)||i!==null&&(i.trim().length===0||e!==i)||typeof s.blockId!=="string"||s.blockId.trim().length===0||typeof s.body!=="string"||s.body.trim().length===0||s.anchor!==void 0&&(typeof s.anchor!=="string"||s.anchor.trim().length===0))throw new Response("Comment body must contain matching optional id/idempotency-key plus nonblank blockId, body, and optional anchor",{status:400});return{mode:"add",id:e,blockId:s.blockId,anchor:s.anchor,body:s.body}}async function ne(s,i=7374,a){s=await gv(s),await ji(s),a?.throwIfAborted();let e=Bun.serve({port:i,async fetch(c){let f=new URL(c.url);try{if(f.pathname.startsWith("/assets/")){let v=f.pathname.slice(8);if(!La(v))return new Response("Not found",{status:404});return new Response(await Ke(Ue(s,"dist","assets",v)),{headers:{"cache-control":"public, max-age=31536000, immutable","content-type":"font/woff2"}})}if(f.pathname==="/"||f.pathname==="/index.html"||f.pathname==="/static-export.html"){let v=f.pathname==="/static-export.html"?"static-export.html":"index.html";return new Response(await Ke(Ue(s,"dist",v),"utf8"),{headers:{"content-type":"text/html; charset=utf-8"}})}if(f.pathname==="/plan-state.json"){let v=await za(s);return Response.json(v.state,{headers:{"x-muse-review-generation":v.generation}})}if(f.pathname==="/comments.json"){let v=await za(s);return Response.json(v.comments,{headers:{"x-muse-review-generation":v.generation}})}if(f.pathname==="/agent-handoff.json")return new Response(await Xa(s,"agent-handoff.json"),{headers:{"content-type":"application/json; charset=utf-8"}});if(f.pathname==="/agent-handoff.md")return new Response(await Xa(s,"agent-handoff.md"),{headers:{"content-type":"text/markdown; charset=utf-8"}});if(f.pathname.startsWith("/api/")&&c.method==="POST")bv(c,f,e.port??i);if(f.pathname==="/api/state"&&c.method==="POST"){let v=await Qa(c);if(v&&typeof v==="object"&&!Array.isArray(v)){let g=v;if(g.status==="approved"||"approvedAt"in g||"reviewer"in g||"approvalDigest"in g)throw new Response("Approval status and metadata can only be set through /api/approve",{status:409})}let t=Hi(v);if(t.length)throw new Response(t.join(`
`),{status:400});return Response.json(await Ve(s,v))}if(f.pathname==="/api/comments"&&c.method==="POST"){let v=wv(Re(await Qa(c)),c.headers.get("idempotency-key"));if(v.mode==="resolve")return Response.json(await Je(s,v.resolveId));return Response.json(await Ze(s,{id:v.id,blockId:v.blockId,anchor:v.anchor,body:v.body}))}if(f.pathname==="/api/approve"&&c.method==="POST"){let v=Re(await Qa(c)),t=Object.keys(v),g=v.reviewer;if(t.some((y)=>y!=="reviewer")||t.length>1||g!==void 0&&(typeof g!=="string"||g.trim().length===0))return new Response("Approval body must be exactly {} or { reviewer: nonblank string }",{status:400});return Response.json(await Ye(s,g))}return new Response("Not found",{status:404})}catch(v){if(v instanceof Response)return v;if(v instanceof ts){let t=v.failure==="not_found"?404:v.failure==="conflict"?409:422;return new Response(v.message,{status:t})}return new Response(v instanceof Error?v.message:String(v),{status:500})}}}),d=()=>e.stop(!0);if(a?.addEventListener("abort",d,{once:!0}),a?.aborted)d(),a.throwIfAborted();return e}function Fa(){throw Error("Usage: bun runtime.mjs <render|serve> <plan-dir> [port]")}var[Va,Za,yv]=process.argv.slice(2);if(!Va||!Za)Fa();if(Va==="render"){let s=await ji(Za);console.log(`Rendered ${s.indexPath}`),console.log(`Static ${s.staticExportPath}`)}else if(Va==="serve"){let s=Number(yv??7374);if(!Number.isInteger(s)||s<0||s>65535)Fa();let i=await ne(Za,s);console.log(`muse plan review: http://localhost:${i.port}/`)}else Fa();
