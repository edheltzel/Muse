// @bun
import{mkdir as Pv,readFile as Cv,writeFile as dd}from"fs/promises";import{join as ca}from"path";import{copyFile as kd,cp as Dd,mkdir as Gd,readFile as ni}from"fs/promises";import{join as vs}from"path";var ri=Object.freeze([{filename:"bricolage-grotesque-latin-500-normal.woff2",family:"Bricolage Grotesque",weight:500,sha256:"b62688707e0820a9cf2a98e9b0349fbb348fd17f76b70a05b53e7a668e3f406f",sha384:"qn7O2kwYDNO8BB07VtIMUe0lUqq3WYJ/okIrACPResGQn0vViFROEt3SGde7RySe"},{filename:"bricolage-grotesque-latin-600-normal.woff2",family:"Bricolage Grotesque",weight:600,sha256:"b34fc8c1ef0ac8798455ac2979eae4b4f90f0d327e3584d1032fa77a8a9a66ca",sha384:"Ilh1L/tmtUzFnpC1cwkNgBNnW+urzfbLETMexxhppi4RurOQbreAwtqAuodE8gcS"},{filename:"bricolage-grotesque-latin-700-normal.woff2",family:"Bricolage Grotesque",weight:700,sha256:"4c373ce3c1cca41c864eb3e27c059a59fc6310547ab9c9b6cd780d387ba24206",sha384:"I1AMB8Mhv2nNTsttl0xrwLBvxe4XMocWs9FDGXH6AqBsgZTPNWagTukzMpe7LPST"},{filename:"fragment-mono-latin-400-normal.woff2",family:"Fragment Mono",weight:400,sha256:"44c4e39bff5e76652a24a872cbebabccbcfb20f62c4633b27c1f2745cba86b56",sha384:"5pPJBXVgEAccmDzYsxRokikcIMqnLiJSV7qWM3TpHdoPoqSh8vUGD1DWsnEZB0BL"}]),_d="11.16.0",Ca=`https://cdn.jsdelivr.net/npm/mermaid@${_d}/dist/mermaid.min.js`;var Oa="T/0lMUdJpd2S1ZHtRiofG3htU3xPCrFVeAQ1UUE2TJwlEJSV5NUwn30kP28n238E",Rs=vs(import.meta.dir,"assets"),pd="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";async function na(s){return(await Promise.all(ri.map(async(i)=>{let a=s?`data:font/woff2;base64,${(await ni(vs(Rs,i.filename))).toString("base64")}`:`/assets/${i.filename}`;return`@font-face { font-family: "${i.family}"; font-style: normal; font-display: swap; font-weight: ${i.weight}; src: url("${a}") format("woff2"); unicode-range: ${pd}; }`}))).join(`
`)}async function Ma(){let s=JSON.parse(await ni(vs(Rs,"notices","manifest.json"),"utf8")),i=new Set(ri.map((d)=>d.filename)),a=new Map;for(let d of s.assets){if(!i.has(d.asset))continue;let m=`${d.package}\x00${d.version}\x00${d.notice}`,u=a.get(m);if(u)u.assets.push(d.asset);else a.set(m,{package:d.package,version:d.version,assets:[d.asset],notice:d.notice});i.delete(d.asset)}if(i.size>0)throw Error(`Missing font notice metadata for: ${[...i].join(", ")}`);return Promise.all([...a.values()].map(async({notice:d,...m})=>({...m,text:await ni(vs(Rs,d),"utf8")})))}async function Na(s){let i=vs(s,"assets");await Gd(i,{recursive:!0}),await Promise.all([...ri.map((a)=>kd(vs(Rs,a.filename),vs(i,a.filename))),Dd(vs(Rs,"notices"),vs(i,"notices"),{recursive:!0})])}function Sa(s){return ri.some((i)=>i.filename===s)}var $a=`
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
})();`;var Ea=`
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
})();`;var Ls=["PlanSummary","StatusDashboard","DecisionMatrix","ArchitectureDiagram","ImplementationTimeline","RiskRegister","FileMap","FileTree","AnnotatedCode","DiffTabs","ApiSurface","DataModel","Wireframe","BeforeAfter","StateGallery","ApprovalGate","QuestionForm","Checklist","CommentAnchor","Callout","Tabs","Table"],mi=Object.freeze({PlanSummary:{category:"Overview",summary:"Lead with scope, status, and the outcome narrative."},StatusDashboard:{category:"Overview",summary:"Show compact status indicators and review metrics."},DecisionMatrix:{category:"Planning",summary:"Compare decisions, rationale, and acceptance state."},ArchitectureDiagram:{category:"Diagram",summary:"Render Mermaid architecture with zoom and pan controls."},ImplementationTimeline:{category:"Planning",summary:"Present an ordered implementation or rollout sequence."},RiskRegister:{category:"Planning",summary:"Pair delivery risks with mitigations and severity."},FileMap:{category:"Evidence",summary:"List source files involved in the proposed change."},FileTree:{category:"Evidence",summary:"Show a compact project or generated-artifact hierarchy."},AnnotatedCode:{category:"Evidence",summary:"Display a focused code excerpt with file context."},DiffTabs:{category:"Evidence",summary:"Review file-specific changes in tabbed diff panels."},ApiSurface:{category:"Contracts",summary:"Document endpoints, methods, and responsibilities."},DataModel:{category:"Contracts",summary:"Describe fields, types, and persistence semantics."},Wireframe:{category:"Product UI",summary:"Embed a constrained HTML fragment for a proposed interface."},BeforeAfter:{category:"Product UI",summary:"Contrast the current state with the proposed outcome."},StateGallery:{category:"Product UI",summary:"Compare meaningful interface or workflow states."},ApprovalGate:{category:"Review",summary:"Capture approval or revision decisions at handoff."},QuestionForm:{category:"Review",summary:"Collect unresolved reviewer decisions through the local bridge."},Checklist:{category:"Review",summary:"Track explicit completion and verification criteria."},CommentAnchor:{category:"Review",summary:"Provide a stable target for contextual review comments."},Callout:{category:"Review",summary:"Highlight guidance, decisions, warnings, or risks."},Tabs:{category:"Evidence",summary:"Organize related reference content into compact panels."},Table:{category:"Contracts",summary:"Render general structured data with semantic table markup."}}),hs=Object.freeze(Object.fromEntries(Ls.map((s)=>[s,!0]))),Ia=Object.freeze({ArchitectureDiagram:!0,FileMap:!0,FileTree:!0,AnnotatedCode:!0,DiffTabs:!0,ApiSurface:!0,DataModel:!0,Wireframe:!0,StateGallery:!0,Tabs:!0,Table:!0});function Vs(s,i){let a="";for(let d=i;d<s.length;d+=1){let m=s[d];if(a){if(m===a&&s[d-1]!=="\\")a=""}else if(m==='"'||m==="'")a=m;else if(m===">")return d}return-1}var di=(s)=>(i)=>Bs(i.body).map((a,d)=>`${i.id}-${s}-${d}`),ka={ArchitectureDiagram:{instructions:(s)=>[`${s.id}-instructions`],renderRoot:(s)=>[`ve-mermaid-${s.id}`]},DiffTabs:{tabs:di("tab"),panels:di("panel")},Tabs:{tabs:di("tab"),panels:di("panel")}};function p(s,i){if(i==="title")return[`${s.id}-title`];return ka[s.type]?.[i]?.(s)??[]}function Da(s){let i=ka[s.type],a=i?Object.values(i).flatMap((d)=>d(s)):[];if(s.type!=="CommentAnchor")a.unshift(...p(s,"title"));return a}function D(s){return s.split(/\r?\n/).map((i)=>i.trim()).filter(Boolean)}function ds(s){return s.split("|").map((i)=>i.trim())}function Bs(s){return s.split(/^---\s*$/m).map((i)=>i.trim())}function Q(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function Zs(s){return Q(s).replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/^# (.*)$/gm,"<h1>$1</h1>").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\n\n/g,"</p><p>")}function Ni(s){return Q(s.props.title??s.props.label??s.type)}function P(s,i,a){let d=Q(p(s,"title")[0]);return`<section class="ve-ip-block ${i}" id="${Q(s.id)}" data-block-id="${Q(s.id)}" data-block-type="${Q(s.type)}" aria-labelledby="${d}"><div class="ve-ip-label">${Q(s.type)}</div><h2 id="${d}">${Ni(s)}</h2><div class="ve-ip-body">${a??`<p>${Zs(s.body)}</p>`}</div></section>`}function Td(s){let i=Object.entries(s.props).map(([d,m])=>{if(typeof m==="boolean")return m?d:`${d}={false}`;if(typeof m==="number")return`${d}={${m}}`;return`${d}=${JSON.stringify(m)}`}).join(" "),a=`<${s.type}${i?` ${i}`:""}`;return s.body?`${a}>
${s.body}
</${s.type}>`:`${a} />`}function Ad(s,i){let a=s.type,d=mi[a],m=Td(s),u=`${a} ${d.category} ${d.summary}`,c=`<div class="ve-ip-component-meta"><span>${Q(d.category)}</span><p>${Q(d.summary)}</p></div><details class="ve-ip-source"><summary>MDX source</summary><div class="ve-ip-source-toolbar"><button type="button" data-copy-mdx>Copy MDX</button></div><pre><code data-mdx-source>${Q(m)}</code></pre></details>`,f=i.replace("<section ",`<section data-component-category="${Q(d.category)}" data-component-search-text="${Q(u)}" `),g=f.lastIndexOf("</section>");return g===-1?f:`${f.slice(0,g)}${c}${f.slice(g)}`}function sm(s){let i=Q(s.props.status??"Draft");return P(s,"ve-ip-hero",`<div class="ve-ip-summary"><p>${Zs(s.body)}</p><span class="ve-ip-pill">${i}</span></div>`)}function im(s){let i=D(s.body).map((a)=>{let[d=a,m="",u=""]=ds(a);return`<tr><td>${Q(d)}</td><td>${Q(m)}</td><td><span class="ve-ip-pill">${Q(u)}</span></td></tr>`}).join("");return P(s,"ve-ip-card",`<table><thead><tr><th>Decision</th><th>Rationale</th><th>Status</th></tr></thead><tbody>${i}</tbody></table>`)}function am(s){let i=Q(p(s,"instructions")[0]),a=Q(p(s,"renderRoot")[0]);return P(s,"ve-ip-card ve-ip-diagram",`<div class="diagram-shell"><div class="diagram-shell__hint" id="${i}">Use arrow keys to pan. Hold Ctrl or Command while scrolling to zoom, drag to pan, or expand for full size.</div><div class="mermaid-wrap" data-diagram-id="${Q(s.id)}" data-mermaid-render-id="${a}"><div class="zoom-controls"><button type="button" data-zoom="out" aria-label="Zoom out">\u2212</button><button type="button" data-zoom="reset" aria-label="Reset zoom and position">100%</button><button type="button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-expand aria-label="Expand diagram">\u26F6</button></div><div class="mermaid-viewport" tabindex="0" role="region" aria-label="${Ni(s)} interactive diagram" aria-describedby="${i}"><pre class="mermaid-source">${Q(s.body)}</pre><div class="mermaid-canvas" aria-label="${Ni(s)} diagram"></div></div></div></div>`)}function rm(s){let i=D(s.body).map((a,d)=>`<li><span>${d+1}</span><p>${Zs(a)}</p></li>`).join("");return P(s,"ve-ip-card",`<ol class="ve-ip-timeline">${i}</ol>`)}function dm(s){let i=D(s.body).map((a)=>{let[d=a,m="",u="medium"]=ds(a);return`<tr><td>${Q(d)}</td><td>${Q(m)}</td><td><span class="ve-ip-pill ve-ip-pill--${Q(u.toLowerCase())}">${Q(u)}</span></td></tr>`}).join("");return P(s,"ve-ip-card",`<table><thead><tr><th>Risk</th><th>Mitigation</th><th>Severity</th></tr></thead><tbody>${i}</tbody></table>`)}function Ga(s){let i=D(s.body).map((a)=>`<li><code>${Q(a)}</code></li>`).join("");return P(s,"ve-ip-card",`<ul class="ve-ip-file-tree">${i}</ul>`)}function mm(s){return P(s,"ve-ip-code-card",`<div class="code-file"><div class="code-file__header">${Q(s.props.file??s.props.title??"code")}</div><pre class="code-block code-block--scroll"><code>${Q(s.body)}</code></pre></div>`)}function _a(s,i){let a=Bs(s.body),d=p(s,"panels"),m=p(s,"tabs"),u=a.map((t,y)=>{let x=t.match(/^[^\r\n]*/)?.[0]??"",b=`${s.type==="DiffTabs"?"Diff":"Panel"} ${y+1}`;return{chunk:t,label:x.replace(/^file:\s*/,"")||b,panelId:d[y],tabId:m[y]}});if(i.staticMode){let t=u.map(({chunk:y,label:x})=>`<section class="ve-ip-static-tab-panel"><h3>${Q(x)}</h3><pre class="code-block code-block--scroll"><code>${Q(y)}</code></pre></section>`).join("");return P(s,"ve-ip-card",`<div class="ve-ip-tabs ve-ip-tabs--static">${t}</div>`)}let c=u.map(({label:t,panelId:y,tabId:x},b)=>`<button type="button" role="tab" id="${Q(x)}" aria-controls="${Q(y)}" aria-selected="${b===0}" tabindex="${b===0?0:-1}" data-tab-target="${Q(y)}">${Q(t)}</button>`).join(""),f=u.map(({chunk:t,panelId:y,tabId:x},b)=>`<div role="tabpanel" id="${Q(y)}" aria-labelledby="${Q(x)}" tabindex="0"${b===0?"":" hidden"}><pre class="code-block code-block--scroll"><code>${Q(t)}</code></pre></div>`).join(""),g=`${String(s.props.label??s.props.title??s.type)} tabs (${s.id})`;return P(s,"ve-ip-card",`<div class="ve-ip-tabs"><div class="ve-ip-tab-list" role="tablist" aria-label="${Q(g)}">${c}</div>${f}</div>`)}function Ta(s){let i=s==="required"?"required":"advisory";return{value:i,html:`<span class="ve-ip-readiness-policy ve-ip-readiness-policy--${i}">${i==="required"?"Required":"Advisory"}</span>`}}function zs(s){return`<span class="ve-ip-persistence" data-persistence-key="${Q(s)}" data-persistence-state="loading" aria-live="polite"><span data-persistence-message>Loading\u2026</span><button type="button" data-persistence-retry hidden>Retry</button></span>`}function Ps(s,i){return s.staticMode?"disabled":`data-operation-key="${Q(i)}" data-review-control disabled`}function um(s,i){let a=D(s.body).map((d)=>{let[m=d,u=d,c="freeform",f]=ds(d),g=Ta(f),t=i.staticMode?"":zs(`answer:${m}`);return`<div class="ve-ip-field"><label class="ve-ip-question" data-question-id="${Q(m)}" data-readiness-policy="${g.value}"><span class="ve-ip-field-heading"><span>${Q(u)}</span>${g.html}</span><input name="${Q(m)}" data-question-mode="${Q(c)}" ${Ps(i,`answer:${m}`)} /></label>${t}</div>`}).join("");return P(s,"ve-ip-card ve-ip-interactive",`<p class="ve-ip-readiness-copy">Required values gate approval; advisory values are saved but never block it.</p><form data-plan-questions>${a}</form>`)}function vm(s,i){let a=D(s.body).map((d,m)=>{let[u=`item-${m+1}`,c=d,f]=ds(d),g=Ta(f),t=i.staticMode?"":zs(`checklist:${u}`);return`<div class="ve-ip-check-row"><label class="ve-ip-check" data-readiness-policy="${g.value}"><input type="checkbox" data-checklist-id="${Q(u)}" ${Ps(i,`checklist:${u}`)} /> <span>${Q(c)}</span>${g.html}</label>${t}</div>`}).join("");return P(s,"ve-ip-card ve-ip-interactive",`<p class="ve-ip-readiness-copy">Required values gate approval; advisory values are saved but never block it.</p><div data-plan-checklist>${a}</div>`)}function em(s,i){let a=i.staticMode?'<p class="ve-ip-muted">Static export: copy this page with the generated handoff packet. Agent-readable approval persistence requires the local bridge.</p>':"",d=i.staticMode?"":'<div class="ve-ip-review-metadata" data-review-metadata><span>Status <strong data-review-status-label>Loading\u2026</strong></span><span data-review-reviewer hidden>Reviewer <strong></strong></span><span data-review-approved-at hidden>Approved <strong></strong></span></div><p class="ve-ip-approval-readiness" data-approval-readiness>Loading approval readiness\u2026</p><div class="ve-ip-review-comments" data-review-comments><h3>Review comments</h3><p>Loading comments\u2026</p></div>',m=i.staticMode?"":`${zs("approval")}${zs("revision")}<template data-persistence-template>${zs("")}</template>`,u=i.staticMode?"":'<section class="ve-ip-approval-receipt" data-approval-receipt hidden><h3>Approval recorded</h3><p data-approval-receipt-summary></p><p>Generated artifacts:</p><ul><li><a href="/agent-handoff.json">agent-handoff.json</a></li><li><a href="/agent-handoff.md">agent-handoff.md</a></li></ul><details data-approval-technical><summary>Technical details</summary><pre data-approval-technical-json></pre></details></section>';return P(s,"ve-ip-card ve-ip-approval",`<p>${Zs(s.body||"Approve this plan once the scope and open questions are settled.")}</p>${d}<div class="ve-ip-actions"><button type="button" data-approve-plan ${Ps(i,"approval")}>Approve plan</button><button type="button" data-needs-revision ${Ps(i,"revision")}>Needs revision</button></div>${m}${a}${u}`)}function pa(s){return P(s,"ve-ip-card",`<div class="ve-ip-wireframe" data-surface="${Q(s.props.surface??"browser")}">${s.body}</div>`)}function fm(s){let[i="",a=""]=s.body.split(/^---\s*$/m);return P(s,"ve-ip-card",`<div class="ve-ip-before-after"><div><h3>Before</h3><p>${Zs(i.trim())}</p></div><div><h3>After</h3><p>${Zs((a??"").trim())}</p></div></div>`)}function cm(s){let i=D(s.body).map((a)=>{let[d=a,m="",u=""]=ds(a);return`<div class="ve-ip-kpi"><strong>${Q(m)}</strong><span>${Q(d)}</span><small>${Q(u)}</small></div>`}).join("");return P(s,"ve-ip-card",`<div class="ve-ip-dashboard">${i}</div>`)}function Mi(s){let i=D(s.body).map(ds),a=i.shift();if(!a)return P(s,"ve-ip-card","<table><tbody></tbody></table>");i.forEach((u,c)=>{if(u.length!==a.length)throw Error(`${s.type} '${s.id}' row ${c+2} has ${u.length} columns; expected ${a.length}`)});let d=`<thead><tr>${a.map((u)=>`<th scope="col">${Q(u)}</th>`).join("")}</tr></thead>`,m=i.map((u)=>`<tr>${u.map((c)=>`<td>${Q(c)}</td>`).join("")}</tr>`).join("");return P(s,"ve-ip-card",`<table>${d}<tbody>${m}</tbody></table>`)}var lm={PlanSummary:sm,StatusDashboard:cm,DecisionMatrix:im,ArchitectureDiagram:am,ImplementationTimeline:rm,RiskRegister:dm,FileMap:Ga,FileTree:Ga,AnnotatedCode:mm,DiffTabs:_a,ApiSurface:Mi,DataModel:Mi,Wireframe:pa,BeforeAfter:fm,StateGallery:pa,ApprovalGate:em,QuestionForm:um,Checklist:vm,CommentAnchor:(s,i)=>i.componentExplorer?P(s,"ve-ip-card",`<p class="ve-ip-muted">Invisible in generated plans; visible here so humans can inspect and copy its MDX contract.</p><span class="ve-ip-comment-anchor" data-comment-anchor="${Q(s.id)}"></span>`):i.staticMode?`<button type="button" id="${Q(s.id)}" class="ve-ip-comment-anchor" data-comment-anchor="${Q(s.id)}" disabled>Add comment</button>`:`<span class="ve-ip-comment-control"><button type="button" id="${Q(s.id)}" class="ve-ip-comment-anchor" data-comment-anchor="${Q(s.id)}" ${Ps(i,`comment:${s.id}`)}>Add comment</button>${zs(`comment:${s.id}`)}</span>`,Callout:(s)=>P(s,`ve-ip-callout ve-ip-callout--${Q(s.props.tone??"note")}`),Tabs:_a,Table:Mi};function gm(s,i){let a=lm[s.type];if(!a)throw Error(`No renderer registered for ${s.type}`);let d=a(s,i);return i.componentExplorer?Ad(s,d):d}function Si(s,i){return s.map((a)=>gm(a,i)).join(`
`)}import{readFile as ad}from"fs/promises";import{basename as pr,isAbsolute as Tr,join as ua,relative as Uv,resolve as Ar}from"path";var tm=new Set([65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111]),K="\uFFFD",v;(function(s){s[s.EOF=-1]="EOF",s[s.NULL=0]="NULL",s[s.TABULATION=9]="TABULATION",s[s.CARRIAGE_RETURN=13]="CARRIAGE_RETURN",s[s.LINE_FEED=10]="LINE_FEED",s[s.FORM_FEED=12]="FORM_FEED",s[s.SPACE=32]="SPACE",s[s.EXCLAMATION_MARK=33]="EXCLAMATION_MARK",s[s.QUOTATION_MARK=34]="QUOTATION_MARK",s[s.AMPERSAND=38]="AMPERSAND",s[s.APOSTROPHE=39]="APOSTROPHE",s[s.HYPHEN_MINUS=45]="HYPHEN_MINUS",s[s.SOLIDUS=47]="SOLIDUS",s[s.DIGIT_0=48]="DIGIT_0",s[s.DIGIT_9=57]="DIGIT_9",s[s.SEMICOLON=59]="SEMICOLON",s[s.LESS_THAN_SIGN=60]="LESS_THAN_SIGN",s[s.EQUALS_SIGN=61]="EQUALS_SIGN",s[s.GREATER_THAN_SIGN=62]="GREATER_THAN_SIGN",s[s.QUESTION_MARK=63]="QUESTION_MARK",s[s.LATIN_CAPITAL_A=65]="LATIN_CAPITAL_A",s[s.LATIN_CAPITAL_Z=90]="LATIN_CAPITAL_Z",s[s.RIGHT_SQUARE_BRACKET=93]="RIGHT_SQUARE_BRACKET",s[s.GRAVE_ACCENT=96]="GRAVE_ACCENT",s[s.LATIN_SMALL_A=97]="LATIN_SMALL_A",s[s.LATIN_SMALL_Z=122]="LATIN_SMALL_Z"})(v||(v={}));var $={DASH_DASH:"--",CDATA_START:"[CDATA[",DOCTYPE:"doctype",SCRIPT:"script",PUBLIC:"public",SYSTEM:"system"};function ui(s){return s>=55296&&s<=57343}function Aa(s){return s>=56320&&s<=57343}function sr(s,i){return(s-55296)*1024+9216+i}function vi(s){return s!==32&&s!==10&&s!==13&&s!==9&&s!==12&&s>=1&&s<=31||s>=127&&s<=159}function ei(s){return s>=64976&&s<=65007||tm.has(s)}var h;(function(s){s.controlCharacterInInputStream="control-character-in-input-stream",s.noncharacterInInputStream="noncharacter-in-input-stream",s.surrogateInInputStream="surrogate-in-input-stream",s.nonVoidHtmlElementStartTagWithTrailingSolidus="non-void-html-element-start-tag-with-trailing-solidus",s.endTagWithAttributes="end-tag-with-attributes",s.endTagWithTrailingSolidus="end-tag-with-trailing-solidus",s.unexpectedSolidusInTag="unexpected-solidus-in-tag",s.unexpectedNullCharacter="unexpected-null-character",s.unexpectedQuestionMarkInsteadOfTagName="unexpected-question-mark-instead-of-tag-name",s.invalidFirstCharacterOfTagName="invalid-first-character-of-tag-name",s.unexpectedEqualsSignBeforeAttributeName="unexpected-equals-sign-before-attribute-name",s.missingEndTagName="missing-end-tag-name",s.unexpectedCharacterInAttributeName="unexpected-character-in-attribute-name",s.unknownNamedCharacterReference="unknown-named-character-reference",s.missingSemicolonAfterCharacterReference="missing-semicolon-after-character-reference",s.unexpectedCharacterAfterDoctypeSystemIdentifier="unexpected-character-after-doctype-system-identifier",s.unexpectedCharacterInUnquotedAttributeValue="unexpected-character-in-unquoted-attribute-value",s.eofBeforeTagName="eof-before-tag-name",s.eofInTag="eof-in-tag",s.missingAttributeValue="missing-attribute-value",s.missingWhitespaceBetweenAttributes="missing-whitespace-between-attributes",s.missingWhitespaceAfterDoctypePublicKeyword="missing-whitespace-after-doctype-public-keyword",s.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers="missing-whitespace-between-doctype-public-and-system-identifiers",s.missingWhitespaceAfterDoctypeSystemKeyword="missing-whitespace-after-doctype-system-keyword",s.missingQuoteBeforeDoctypePublicIdentifier="missing-quote-before-doctype-public-identifier",s.missingQuoteBeforeDoctypeSystemIdentifier="missing-quote-before-doctype-system-identifier",s.missingDoctypePublicIdentifier="missing-doctype-public-identifier",s.missingDoctypeSystemIdentifier="missing-doctype-system-identifier",s.abruptDoctypePublicIdentifier="abrupt-doctype-public-identifier",s.abruptDoctypeSystemIdentifier="abrupt-doctype-system-identifier",s.cdataInHtmlContent="cdata-in-html-content",s.incorrectlyOpenedComment="incorrectly-opened-comment",s.eofInScriptHtmlCommentLikeText="eof-in-script-html-comment-like-text",s.eofInDoctype="eof-in-doctype",s.nestedComment="nested-comment",s.abruptClosingOfEmptyComment="abrupt-closing-of-empty-comment",s.eofInComment="eof-in-comment",s.incorrectlyClosedComment="incorrectly-closed-comment",s.eofInCdata="eof-in-cdata",s.absenceOfDigitsInNumericCharacterReference="absence-of-digits-in-numeric-character-reference",s.nullCharacterReference="null-character-reference",s.surrogateCharacterReference="surrogate-character-reference",s.characterReferenceOutsideUnicodeRange="character-reference-outside-unicode-range",s.controlCharacterReference="control-character-reference",s.noncharacterCharacterReference="noncharacter-character-reference",s.missingWhitespaceBeforeDoctypeName="missing-whitespace-before-doctype-name",s.missingDoctypeName="missing-doctype-name",s.invalidCharacterSequenceAfterDoctypeName="invalid-character-sequence-after-doctype-name",s.duplicateAttribute="duplicate-attribute",s.nonConformingDoctype="non-conforming-doctype",s.missingDoctype="missing-doctype",s.misplacedDoctype="misplaced-doctype",s.endTagWithoutMatchingOpenElement="end-tag-without-matching-open-element",s.closingOfElementWithOpenChildElements="closing-of-element-with-open-child-elements",s.disallowedContentInNoscriptInHead="disallowed-content-in-noscript-in-head",s.openElementsLeftAfterEof="open-elements-left-after-eof",s.abandonedHeadElementChild="abandoned-head-element-child",s.misplacedStartTagForHeadElement="misplaced-start-tag-for-head-element",s.nestedNoscriptInHead="nested-noscript-in-head",s.eofInElementThatCanContainOnlyText="eof-in-element-that-can-contain-only-text"})(h||(h={}));var wm=65536;class $i{constructor(s){this.handler=s,this.html="",this.pos=-1,this.lastGapPos=-2,this.gapStack=[],this.skipNextNewLine=!1,this.lastChunkWritten=!1,this.endOfChunkHit=!1,this.bufferWaterline=wm,this.isEol=!1,this.lineStartPos=0,this.droppedBufferSize=0,this.line=1,this.lastErrOffset=-1}get col(){return this.pos-this.lineStartPos+Number(this.lastGapPos!==this.pos)}get offset(){return this.droppedBufferSize+this.pos}getError(s,i){let{line:a,col:d,offset:m}=this,u=d+i,c=m+i;return{code:s,startLine:a,endLine:a,startCol:u,endCol:u,startOffset:c,endOffset:c}}_err(s){if(this.handler.onParseError&&this.lastErrOffset!==this.offset)this.lastErrOffset=this.offset,this.handler.onParseError(this.getError(s,0))}_addGap(){this.gapStack.push(this.lastGapPos),this.lastGapPos=this.pos}_processSurrogate(s){if(this.pos!==this.html.length-1){let i=this.html.charCodeAt(this.pos+1);if(Aa(i))return this.pos++,this._addGap(),sr(s,i)}else if(!this.lastChunkWritten)return this.endOfChunkHit=!0,v.EOF;return this._err(h.surrogateInInputStream),s}willDropParsedChunk(){return this.pos>this.bufferWaterline}dropParsedChunk(){if(this.willDropParsedChunk())this.html=this.html.substring(this.pos),this.lineStartPos-=this.pos,this.droppedBufferSize+=this.pos,this.pos=0,this.lastGapPos=-2,this.gapStack.length=0}write(s,i){if(this.html.length>0)this.html+=s;else this.html=s;this.endOfChunkHit=!1,this.lastChunkWritten=i}insertHtmlAtCurrentPos(s){this.html=this.html.substring(0,this.pos+1)+s+this.html.substring(this.pos+1),this.endOfChunkHit=!1}startsWith(s,i){if(this.pos+s.length>this.html.length)return this.endOfChunkHit=!this.lastChunkWritten,!1;if(i)return this.html.startsWith(s,this.pos);for(let a=0;a<s.length;a++)if((this.html.charCodeAt(this.pos+a)|32)!==s.charCodeAt(a))return!1;return!0}peek(s){let i=this.pos+s;if(i>=this.html.length)return this.endOfChunkHit=!this.lastChunkWritten,v.EOF;let a=this.html.charCodeAt(i);return a===v.CARRIAGE_RETURN?v.LINE_FEED:a}advance(){if(this.pos++,this.isEol)this.isEol=!1,this.line++,this.lineStartPos=this.pos;if(this.pos>=this.html.length)return this.endOfChunkHit=!this.lastChunkWritten,v.EOF;let s=this.html.charCodeAt(this.pos);if(s===v.CARRIAGE_RETURN)return this.isEol=!0,this.skipNextNewLine=!0,v.LINE_FEED;if(s===v.LINE_FEED){if(this.isEol=!0,this.skipNextNewLine)return this.line--,this.skipNextNewLine=!1,this._addGap(),this.advance()}if(this.skipNextNewLine=!1,ui(s))s=this._processSurrogate(s);if(!(this.handler.onParseError===null||s>31&&s<127||s===v.LINE_FEED||s===v.CARRIAGE_RETURN||s>159&&s<64976))this._checkForProblematicCharacters(s);return s}_checkForProblematicCharacters(s){if(vi(s))this._err(h.controlCharacterInInputStream);else if(ei(s))this._err(h.noncharacterInInputStream)}retreat(s){this.pos-=s;while(this.pos<this.lastGapPos)this.lastGapPos=this.gapStack.pop(),this.pos--;this.isEol=!1}}var W;(function(s){s[s.CHARACTER=0]="CHARACTER",s[s.NULL_CHARACTER=1]="NULL_CHARACTER",s[s.WHITESPACE_CHARACTER=2]="WHITESPACE_CHARACTER",s[s.START_TAG=3]="START_TAG",s[s.END_TAG=4]="END_TAG",s[s.COMMENT=5]="COMMENT",s[s.DOCTYPE=6]="DOCTYPE",s[s.EOF=7]="EOF",s[s.HIBERNATION=8]="HIBERNATION"})(W||(W={}));function fi(s,i){for(let a=s.attrs.length-1;a>=0;a--)if(s.attrs[a].name===i)return s.attrs[a].value;return null}var ym=new Map([[0,65533],[128,8364],[130,8218],[131,402],[132,8222],[133,8230],[134,8224],[135,8225],[136,710],[137,8240],[138,352],[139,8249],[140,338],[142,381],[145,8216],[146,8217],[147,8220],[148,8221],[149,8226],[150,8211],[151,8212],[152,732],[153,8482],[154,353],[155,8250],[156,339],[158,382],[159,376]]);function ir(s){if(s>=55296&&s<=57343||s>1114111)return 65533;return ym.get(s)??s}function ar(s){let i=atob(s),a=i.length&-2,d=new Uint16Array(a/2);for(let m=0,u=0;m<a;m+=2){let c=i.charCodeAt(m),f=i.charCodeAt(m+1);d[u++]=c|f<<8}return d}var Ei=ar("QR08ALkAAgH6AYsDNQR2BO0EPgXZBQEGLAbdBxMISQrvCmQLfQurDKQNLw4fD4YPpA+6D/IPAAAAAAAAAAAAAAAAKhBMEY8TmxUWF2EYLBkxGuAa3RsJHDscWR8YIC8jSCSIJcMl6ie3Ku8rEC0CLjoupS7kLgAIRU1hYmNmZ2xtbm9wcnN0dVQAWgBeAGUAaQBzAHcAfgCBAIQAhwCSAJoAoACsALMAbABpAGcAO4DGAMZAUAA7gCYAJkBjAHUAdABlADuAwQDBQHIiZXZlAAJhAAFpeW0AcgByAGMAO4DCAMJAEGRyAADgNdgE3XIAYQB2AGUAO4DAAMBA8CFoYZFj4SFjcgBhZAAAoFMqAAFncIsAjgBvAG4ABGFmAADgNdg43fAlbHlGdW5jdGlvbgCgYSBpAG4AZwA7gMUAxUAAAWNzpACoAHIAAOA12Jzc6SFnbgCgVCJpAGwAZABlADuAwwDDQG0AbAA7gMQAxEAABGFjZWZvcnN1xQDYANoA7QDxAPYA+QD8AAABY3LJAM8AayNzbGFzaAAAoBYidgHTANUAAKDnKmUAZAAAoAYjeQARZIABY3J0AOAA5QDrAGEidXNlAACgNSLuI291bGxpcwCgLCFhAJJjcgAA4DXYBd1wAGYAAOA12Dnd5SF2ZdhiYwDyAOoAbSJwZXEAAKBOIgAHSE9hY2RlZmhpbG9yc3UXARoBHwE6AVIBVQFiAWQBZgGCAakB6QHtAfIBYwB5ACdkUABZADuAqQCpQIABY3B5ACUBKAE1AfUhdGUGYWmg0iJ0KGFsRGlmZmVyZW50aWFsRAAAoEUhbCJleXMAAKAtIQACYWVpb0EBRAFKAU0B8iFvbgxhZABpAGwAO4DHAMdAcgBjAAhhbiJpbnQAAKAwIm8AdAAKYQABZG5ZAV0BaSJsbGEAuGB0I2VyRG90ALdg8gA5AWkAp2NyImNsZQAAAkRNUFRwAXQBeQF9AW8AdAAAoJkiaSJudXMAAKCWIuwhdXMAoJUiaSJtZXMAAKCXIm8AAAFjc4cBlAFrKndpc2VDb250b3VySW50ZWdyYWwAAKAyImUjQ3VybHkAAAFEUZwBpAFvJXVibGVRdW90ZQAAoB0gdSJvdGUAAKAZIAACbG5wdbABtgHNAdgBbwBuAGWgNyIAoHQqgAFnaXQAvAHBAcUB8iJ1ZW50AKBhIm4AdAAAoC8i7yV1ckludGVncmFsAKAuIgABZnLRAdMBAKACIe8iZHVjdACgECJuLnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbAAAoDMi7yFzcwCgLypjAHIAAOA12J7ccABDoNMiYQBwAACgTSKABURKU1phY2VmaW9zAAsCEgIVAhgCGwIsAjQCOQI9AnMCfwNvoEUh9CJyYWhkAKARKWMAeQACZGMAeQAFZGMAeQAPZIABZ3JzACECJQIoAuchZXIAoCEgcgAAoKEhaAB2AACg5CoAAWF5MAIzAvIhb24OYRRkbAB0oAciYQCUY3IAAOA12AfdAAFhZkECawIAAWNtRQJnAvIjaXRpY2FsAAJBREdUUAJUAl8CYwJjInV0ZQC0YG8AdAFZAloC2WJiJGxlQWN1dGUA3WJyImF2ZQBgYGkibGRlANxi7yFuZACgxCJmJWVyZW50aWFsRAAAoEYhcAR9AgAAAAAAAIECjgIAABoDZgAA4DXYO91EoagAhQKJAm8AdAAAoNwgcSJ1YWwAAKBQIuIhbGUAA0NETFJVVpkCqAK1Au8C/wIRA28AbgB0AG8AdQByAEkAbgB0AGUAZwByAGEA7ADEAW8AdAKvAgAAAACwAqhgbiNBcnJvdwAAoNMhAAFlb7kC0AJmAHQAgAFBUlQAwQLGAs0CciJyb3cAAKDQIekkZ2h0QXJyb3cAoNQhZQDlACsCbgBnAAABTFLWAugC5SFmdAABQVLcAuECciJyb3cAAKD4J+kkZ2h0QXJyb3cAoPon6SRnaHRBcnJvdwCg+SdpImdodAAAAUFU9gL7AnIicm93AACg0iFlAGUAAKCoInAAQQIGAwAAAAALA3Iicm93AACg0SFvJHduQXJyb3cAAKDVIWUlcnRpY2FsQmFyAACgJSJuAAADQUJMUlRhJAM2AzoDWgNxA3oDciJyb3cAAKGTIUJVLAMwA2EAcgAAoBMpcCNBcnJvdwAAoPUhciJldmUAEWPlIWZ00gJDAwAASwMAAFIDaSVnaHRWZWN0b3IAAKBQKWUkZVZlY3RvcgAAoF4p5SJjdG9yQqC9IWEAcgAAoFYpaSJnaHQA1AFiAwAAaQNlJGVWZWN0b3IAAKBfKeUiY3RvckKgwSFhAHIAAKBXKWUAZQBBoKQiciJyb3cAAKCnIXIAcgBvAPcAtAIAAWN0gwOHA3IA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YwAAoN8i4SFycnCgtiEAoD0pgKIqImJjZG9zACsVMBU6FT4VQRVyImNhcAAAoEgqAAFhdTQVNxVwAACgRipwAACgSipvAHQAAKCNInIAAKBFKgDgKiIA/gACYWxydksVURVuFXMVcgByAG2gtyEAoDwpeQCAAWV2dwBYFWUVaRVxAHACXxUAAAAAYxVyAGUA4wAXFXUA4wAZFWUAZQAAoM4iZSJkZ2UAAKDPImUAbgA7gKQApEBlI2Fycm93AAABbHJ7FX8V5SFmdACgtiFpImdodAAAoLchZQDkAG0VAAFjaYsVkRVvAG4AaQBuAPQAkwFuAHQAAKAxImwiY3R5AACgLSOACUFIYWJjZGVmaGlqbG9yc3R1d3oAuBW7Fb8V1RXgFegV+RUKFhUWHxZUFlcWZRbFFtsW7xb7FgUXChdyAPIAtAJhAHIAAKBlKQACZ2xyc8YVyhXOFdAV5yFlcgCgICDlIXRoAKA4IfIA9QxoAHagECAAoKMiawHZFd4VYSJyb3cAAKAPKWEA4wBfAgABYXnkFecV8iFvbg9hNGQAoUYhYW/tFfQVAAFnciEC8RVyAACgyiF0InNlcQAAoHcqgAFnbG0A/xUCFgUWO4CwALBAdABhALRjcCJ0eXYAAKCxKQABaXIOFhIW8yFodACgfykA4DXYId1hAHIAAAFschsWHRYAoMMhAKDCIYACYWVnc3YAKBauAjYWOhY+Fm0AAKHEIm9zLhY0Fm4AZABzoMQi9SFpdACgZiZhIm1tYQDdY2kAbgAAoPIiAKH3AGlvQxZRFmQAZQAAgfcAO29KFksW90BuI3RpbWVzAACgxyJuAPgAUBZjAHkAUmRjAG8CXhYAAAAAYhZyAG4AAKAeI28AcAAAoA0jgAJscHR1dwBuFnEWdRaSFp4W7CFhciRgZgAA4DXYVd0AotkCZW1wc30WhBaJFo0WcQBkoFAibwB0AACgUSJpIm51cwAAoDgi7CF1cwCgFCLxInVhcmUAoKEiYgBsAGUAYgBhAHIAdwBlAGQAZwDlANcAbgCAAWFkaAClFqoWtBZyAHIAbwD3APUMbwB3AG4AYQByAHIAbwB3APMA8xVhI3Jwb29uAAABbHK8FsAWZQBmAPQAHBZpAGcAaAD0AB4WYgHJFs8WawBhAHIAbwD3AJILbwLUFgAAAADYFnIAbgAAoB8jbwBwAACgDCOAAWNvdADhFukW7BYAAXJ55RboFgDgNdi53FVkbAAAoPYp8iFvaxFhAAFkcvMW9xZvAHQAAKDxImkA5qC/JVsSAAFhaP8WAhdyAPIANQNhAPIA1wvhIm5nbGUAoKYpAAFjaQ4XEBd5AF9k5yJyYXJyAKD/JwAJRGFjZGVmZ2xtbm9wcXJzdHV4MRc4F0YXWxcyBF4XaRd5F40XrBe0F78X2RcVGCEYLRg1GEAYAAFEbzUXgRZvAPQA+BUAAWNzPBdCF3UAdABlADuA6QDpQPQhZXIAoG4qAAJhaW95TRdQF1YXWhfyIW9uG2FyAGOgViI7gOoA6kDsIW9uAKBVIk1kbwB0ABdhAAFEcmIXZhdvAHQAAKBSIgDgNdgi3XKhmipuF3QXYQB2AGUAO4DoAOhAZKCWKm8AdAAAoJgqgKGZKmlscwCAF4UXhxfuInRlcnMAoOcjAKATIWSglSpvAHQAAKCXKoABYXBzAJMXlheiF2MAcgATYXQAeQBzogUinxcAAAAAoRdlAHQAAKAFInAAMaADIDMBqRerFwCgBCAAoAUgAAFnc7AXsRdLYXAAAKACIAABZ3C4F7sXbwBuABlhZgAA4DXYVt2AAWFscwDFF8sXzxdyAHOg1SJsAACg4yl1AHMAAKBxKmkAAKG1A2x21RfYF28AbgC1Y/VjAAJjc3V24BfoF/0XEBgAAWlv5BdWF3IAYwAAoFYiaQLuFwAAAADwF+0ADQThIW50AAFnbPUX+Rd0AHIAAKCWKuUhc3MAoJUqgAFhZWkAAxgGGAoYbABzAD1gcwB0AACgXyJ2AESgYSJEAACgeCrwImFyc2wAoOUpAAFEYRkYHRhvAHQAAKBTInIAcgAAoHEpgAFjZGkAJxgqGO0XcgAAoC8hbwD0AIwCAAFhaDEYMhi3YzuA8ADwQAABbXI5GD0YbAA7gOsA60BvAACgrCCAAWNpcABGGEgYSxhsACFgcwD0ACwEAAFlb08YVxhjAHQAYQB0AGkAbwDuABoEbgBlAG4AdABpAGEAbADlADME4Ql1GAAAgRgAAIMYiBgAAAAAoRilGAAAqhgAALsYvhjRGAAA1xgnGWwAbABpAG4AZwBkAG8AdABzAGUA8QBlF3kARGRtImFsZQAAoEAmgAFpbHIAjRiRGJ0Y7CFpZwCgA/tpApcYAAAAAJoYZwAAoAD7aQBnAACgBPsA4DXYI93sIWlnAKAB++whaWcA4GYAagCAAWFsdACvGLIYthh0AACgbSZpAGcAAKAC+24AcwAAoLElbwBmAJJh8AHCGAAAxhhmAADgNdhX3QABYWvJGMwYbADsAGsEdqDUIgCg2SphI3J0aW50AACgDSoAAWFv2hgiGQABY3PeGB8ZsQPnGP0YBRkSGRUZAAAdGbID7xjyGPQY9xj5GAAA+xg7gL0AvUAAoFMhO4C8ALxAAKBVIQCgWSEAoFshswEBGQAAAxkAoFQhAKBWIbQCCxkOGQAAAAAQGTuAvgC+QACgVyEAoFwhNQAAoFghtgEZGQAAGxkAoFohAKBdITgAAKBeIWwAAKBEIHcAbgAAoCIjYwByAADgNdi73IAIRWFiY2RlZmdpamxub3JzdHYARhlKGVoZXhlmGWkZkhmWGZkZnRmgGa0ZxhnLGc8Z4BkjGmygZyIAoIwqgAFjbXAAUBlTGVgZ9SF0ZfVhbQBhAOSgswM6FgCghipyImV2ZQAfYQABaXliGWUZcgBjAB1hM2RvAHQAIWGAoWUibHFzAMYEcBl6GfGhZSLOBAAAdhlsAGEAbgD0AN8EgKF+KmNkbACBGYQZjBljAACgqSpvAHQAb6CAKmyggioAoIQqZeDbIgD+cwAAoJQqcgAA4DXYJN3noGsirATtIWVsAKA3IWMAeQBTZIChdyJFYWoApxmpGasZAKCSKgCgpSoAoKQqAAJFYWVztBm2Gb0ZwhkAoGkicABwoIoq8iFveACgiipxoIgq8aCIKrUZaQBtAACg5yJwAGYAAOA12FjdYQB2AOUAYwIAAWNp0xnWGXIAAKAKIW0AAKFzImVs3BneGQCgjioAoJAqAIM+ADtjZGxxco0E6xn0GfgZ/BkBGgABY2nvGfEZAKCnKnIAAKB6Km8AdAAAoNci0CFhcgCglSl1ImVzdAAAoHwqgAJhZGVscwAKGvQZFhrVBCAa8AEPGgAAFBpwAHIAbwD4AFkZcgAAoHgpcQAAAWxxxAQbGmwAZQBzAPMASRlpAO0A5AQAAWVuJxouGnIjdG5lcXEAAOBpIgD+xQAsGgAFQWFiY2Vma29zeUAaQxpmGmoabRqDGocalhrCGtMacgDyAMwCAAJpbG1yShpOGlAaVBpyAHMA8ABxD2YAvWBpAGwA9AASBQABZHJYGlsaYwB5AEpkAKGUIWN3YBpkGmkAcgAAoEgpAKCtIWEAcgAAoA8h6SFyYyVhgAFhbHIAcxp7Gn8a8iF0c3WgZSZpAHQAAKBlJuwhaXAAoCYg4yFvbgCguSJyAADgNdgl3XMAAAFld4wakRphInJvdwAAoCUpYSJyb3cAAKAmKYACYW1vcHIAnxqjGqcauhq+GnIAcgAAoP8h9CFodACgOyJrAAABbHKsGrMaZSRmdGFycm93AACgqSHpJGdodGFycm93AKCqIWYAAOA12Fnd4iFhcgCgFSCAAWNsdADIGswa0BpyAADgNdi93GEAcwDoAGka8iFvaydhAAFicNca2xr1IWxsAKBDIOghZW4AoBAg4Qr2GgAA/RoAAAgbExsaGwAAIRs7GwAAAAA+G2IbmRuVG6sbAACyG80b0htjAHUAdABlADuA7QDtQAChYyBpeQEbBhtyAGMAO4DuAO5AOGQAAWN4CxsNG3kANWRjAGwAO4ChAKFAAAFmcssCFhsA4DXYJt1yAGEAdgBlADuA7ADsQIChSCFpbm8AJxsyGzYbAAFpbisbLxtuAHQAAKAMKnQAAKAtIuYhaW4AoNwpdABhAACgKSHsIWlnM2GAAWFvcABDG1sbXhuAAWNndABJG0sbWRtyACthgAFlbHAAcQVRG1UbaQBuAOUAyAVhAHIA9AByBWgAMWFmAACgtyJlAGQAtWEAoggiY2ZvdGkbbRt1G3kb4SFyZQCgBSFpAG4AdKAeImkAZQAAoN0pZABvAPQAWxsAoisiY2VscIEbhRuPG5QbYQBsAACguiIAAWdyiRuNG2UAcgDzACMQ4wCCG2EicmhrAACgFyryIW9kAKA8KgACY2dwdJ8boRukG6gbeQBRZG8AbgAvYWYAAOA12FrdYQC5Y3UAZQBzAHQAO4C/AL9AAAFjabUbuRtyAADgNdi+3G4AAKIIIkVkc3bCG8QbyBvQAwCg+SJvAHQAAKD1Inag9CIAoPMiaaBiIOwhZGUpYesB1hsAANkbYwB5AFZkbAA7gO8A70AAA2NmbW9zdeYb7hvyG/Ub+hsFHAABaXnqG+0bcgBjADVhOWRyAADgNdgn3eEhdGg3YnAAZgAA4DXYW93jAf8bAAADHHIAAOA12L/c8iFjeVhk6yFjeVRkAARhY2ZnaGpvcxUcGhwiHCYcKhwtHDAcNRzwIXBhdqC6A/BjAAFleR4cIRzkIWls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ZmdobG1vcHJzdHV3CiwNLBEsHSwnLDEsQCxLLFIsYix6LIQsjyzLLOgs7Sz/LAotcgDyAAkDYQByAACgYykAAWNyFSwbLHUAdABlADuA+gD6QPIACQ1yAOMBIywAACUseQBeZHYAZQBtYQABaXkrLDAscgBjADuA+wD7QENkgAFhYmgANyw6LD0scgDyANEO7CFhY3FhYQDyAOAOAAFpckQsSCzzIWh0AKB+KQDgNdgy3XIAYQB2AGUAO4D5APlAYQFWLF8scgAAAWxyWixcLACgvyEAoL4hbABrAACggCUAAWN0Zix2LG8CbCwAAAAAcyxyAG4AZaAcI3IAAKAcI28AcAAAoA8jcgBpAACg+CUAAWFsfiyBLGMAcgBrYTuAqACoQAABZ3CILIssbwBuAHNhZgAA4DXYZt0AA2FkaGxzdZksniynLLgsuyzFLHIAcgBvAPcACQ1vAHcAbgBhAHIAcgBvAPcA2A5hI3Jwb29uAAABbHKvLLMsZQBmAPQAWyxpAGcAaAD0AF0sdQDzAKYOaQAAocUDaGzBLMIs0mNvAG4AxWPwI2Fycm93cwCgyCGAAWNpdADRLOEs5CxvAtcsAAAAAN4scgBuAGWgHSNyAACgHSNvAHAAAKAOI24AZwBvYXIAaQAAoPklYwByAADgNdjK3IABZGlyAPMs9yz6LG8AdAAAoPAi7CFkZWlhaQBmoLUlAKC0JQABYW0DLQYtcgDyAMosbAA7gPwA/EDhIm5nbGUAoKcpgAdBQkRhY2RlZmxub3Byc3oAJy0qLTAtNC2bLZ0toS2/LcMtxy3TLdgt3C3gLfwtcgDyABADYQByAHag6CoAoOkqYQBzAOgA/gIAAW5yOC08LechcnQAoJwpgANla25wcnN0AJkpSC1NLVQtXi1iLYItYQBwAHAA4QAaHG8AdABoAGkAbgDnAKEXgAFoaXIAoSmzJFotbwBwAPQAdCVooJUh7wD4JgABaXVmLWotZwBtAOEAuygAAWJwbi14LXMjZXRuZXEAceCKIgD+AODLKgD+cyNldG5lcQBx4IsiAP4A4MwqAP4AAWhyhi2KLWUAdADhABIraSNhbmdsZQAAAWxyki2WLeUhZnQAoLIiaSJnaHQAAKCzInkAMmThIXNoAKCiIoABZWxyAKcttC24LWKiKCKuLQAAAACyLWEAcgAAoLsicQAAoFoi7CFpcACg7iIAAWJ0vC1eD2EA8gBfD3IAAOA12DPddAByAOkAlS1zAHUAAAFicM0t0C0A4IIi0iAA4IMi0iBwAGYAAOA12GfdcgBvAPAAWQt0AHIA6QCaLQABY3XkLegtcgAA4DXYy9wAAWJw7C30LW4AAAFFZXUt8S0A4IoiAP5uAAABRWV/LfktAOCLIgD+6SJnemFnAKCaKYADY2Vmb3BycwANLhAuJS4pLiMuLi40LukhcmN1YQABZGkULiEuAAFiZxguHC5hAHIAAKBfKmUAcaAnIgCgWSLlIXJwAKAYIXIAAOA12DTdcABmAADgNdho3WWgQCJhAHQA6ABqD2MAcgAA4DXYzNzjCuQRUC4AAFQuAABYLmIuAAAAAGMubS5wLnQuAAAAAIguki4AAJouJxIqEnQAcgDpAB0ScgAA4DXYNd0AAUFhWy5eLnIA8gDnAnIA8gCTB75jAAFBYWYuaS5yAPIA4AJyAPIAjAdhAPAAeh5pAHMAAKD7IoABZHB0APgReS6DLgABZmx9LoAuAOA12GnddQDzAP8RaQBtAOUABBIAAUFhiy6OLnIA8gDuAnIA8gCaBwABY3GVLgoScgAA4DXYzdwAAXB0nS6hLmwAdQDzACUScgDpACASAARhY2VmaW9zdbEuvC7ELsguzC7PLtQu2S5jAAABdXm2LrsudABlADuA/QD9QE9kAAFpecAuwy5yAGMAd2FLZG4AO4ClAKVAcgAA4DXYNt1jAHkAV2RwAGYAAOA12GrdYwByAADgNdjO3AABY23dLt8ueQBOZGwAO4D/AP9AAAVhY2RlZmhpb3N38y73Lv8uAi8MLxAvEy8YLx0vIi9jInV0ZQB6YQABYXn7Lv4u8iFvbn5hN2RvAHQAfGEAAWV0Bi8KL3QAcgDmAB8QYQC2Y3IAAOA12DfdYwB5ADZk5yJyYXJyAKDdIXAAZgAA4DXYa91jAHIAAOA12M/cAAFqbiYvKC8AoA0gagAAoAwg");var M;(function(s){s[s.VALUE_LENGTH=49152]="VALUE_LENGTH",s[s.FLAG13=8192]="FLAG13",s[s.BRANCH_LENGTH=8064]="BRANCH_LENGTH",s[s.JUMP_TABLE=127]="JUMP_TABLE"})(M||(M={}));var o;(function(s){s[s.NUM=35]="NUM",s[s.SEMI=59]="SEMI",s[s.EQUALS=61]="EQUALS",s[s.ZERO=48]="ZERO",s[s.NINE=57]="NINE",s[s.LOWER_A=97]="LOWER_A",s[s.LOWER_F=102]="LOWER_F",s[s.LOWER_X=120]="LOWER_X",s[s.LOWER_Z=122]="LOWER_Z",s[s.UPPER_A=65]="UPPER_A",s[s.UPPER_F=70]="UPPER_F",s[s.UPPER_Z=90]="UPPER_Z"})(o||(o={}));var rr=32;function Ii(s){return s>=o.ZERO&&s<=o.NINE}function hm(s){return s>=o.UPPER_A&&s<=o.UPPER_F||s>=o.LOWER_A&&s<=o.LOWER_F}function Hm(s){return s>=o.UPPER_A&&s<=o.UPPER_Z||s>=o.LOWER_A&&s<=o.LOWER_Z||Ii(s)}function qm(s){return s===o.EQUALS||Hm(s)}var C;(function(s){s[s.EntityStart=0]="EntityStart",s[s.NumericStart=1]="NumericStart",s[s.NumericDecimal=2]="NumericDecimal",s[s.NumericHex=3]="NumericHex",s[s.NamedEntity=4]="NamedEntity"})(C||(C={}));var ms;(function(s){s[s.Legacy=0]="Legacy",s[s.Strict=1]="Strict",s[s.Attribute=2]="Attribute"})(ms||(ms={}));class ki{decodeTree;emitCodePoint;errors;constructor(s,i,a){this.decodeTree=s,this.emitCodePoint=i,this.errors=a}state=C.EntityStart;consumed=1;result=0;treeIndex=0;excess=1;decodeMode=ms.Strict;runConsumed=0;startEntity(s){this.decodeMode=s,this.state=C.EntityStart,this.result=0,this.treeIndex=0,this.excess=1,this.consumed=1,this.runConsumed=0}write(s,i){switch(this.state){case C.EntityStart:{if(s.charCodeAt(i)===o.NUM)return this.state=C.NumericStart,this.consumed+=1,this.stateNumericStart(s,i+1);return this.state=C.NamedEntity,this.stateNamedEntity(s,i)}case C.NumericStart:return this.stateNumericStart(s,i);case C.NumericDecimal:return this.stateNumericDecimal(s,i);case C.NumericHex:return this.stateNumericHex(s,i);case C.NamedEntity:return this.stateNamedEntity(s,i)}}stateNumericStart(s,i){if(i>=s.length)return-1;if((s.charCodeAt(i)|rr)===o.LOWER_X)return this.state=C.NumericHex,this.consumed+=1,this.stateNumericHex(s,i+1);return this.state=C.NumericDecimal,this.stateNumericDecimal(s,i)}stateNumericHex(s,i){while(i<s.length){let a=s.charCodeAt(i);if(Ii(a)||hm(a)){let d=a<=o.NINE?a-o.ZERO:(a|rr)-o.LOWER_A+10;this.result=this.result*16+d,this.consumed++,i++}else return this.emitNumericEntity(a,3)}return-1}stateNumericDecimal(s,i){while(i<s.length){let a=s.charCodeAt(i);if(Ii(a))this.result=this.result*10+(a-o.ZERO),this.consumed++,i++;else return this.emitNumericEntity(a,2)}return-1}emitNumericEntity(s,i){if(this.consumed<=i)return this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed),0;if(s===o.SEMI)this.consumed+=1;else if(this.decodeMode===ms.Strict)return 0;if(this.emitCodePoint(ir(this.result),this.consumed),this.errors){if(s!==o.SEMI)this.errors.missingSemicolonAfterCharacterReference();this.errors.validateNumericCharacterReference(this.result)}return this.consumed}stateNamedEntity(s,i){let{decodeTree:a}=this,d=a[this.treeIndex],m=(d&M.VALUE_LENGTH)>>14;while(i<s.length){if(m===0&&(d&M.FLAG13)!==0){let c=(d&M.BRANCH_LENGTH)>>7;if(this.runConsumed===0){let f=d&M.JUMP_TABLE;if(s.charCodeAt(i)!==f)return this.result===0?0:this.emitNotTerminatedNamedEntity();i++,this.excess++,this.runConsumed++}while(this.runConsumed<c){if(i>=s.length)return-1;let f=this.runConsumed-1,g=a[this.treeIndex+1+(f>>1)],t=f%2===0?g&255:g>>8&255;if(s.charCodeAt(i)!==t)return this.runConsumed=0,this.result===0?0:this.emitNotTerminatedNamedEntity();i++,this.excess++,this.runConsumed++}this.runConsumed=0,this.treeIndex+=1+(c>>1),d=a[this.treeIndex],m=(d&M.VALUE_LENGTH)>>14}if(i>=s.length)break;let u=s.charCodeAt(i);if(u===o.SEMI&&m!==0&&(d&M.FLAG13)!==0)return this.emitNamedEntityData(this.treeIndex,m,this.consumed+this.excess);if(this.treeIndex=Xm(a,d,this.treeIndex+Math.max(1,m),u),this.treeIndex<0)return this.result===0||this.decodeMode===ms.Attribute&&(m===0||qm(u))?0:this.emitNotTerminatedNamedEntity();if(d=a[this.treeIndex],m=(d&M.VALUE_LENGTH)>>14,m!==0){if(u===o.SEMI)return this.emitNamedEntityData(this.treeIndex,m,this.consumed+this.excess);if(this.decodeMode!==ms.Strict&&(d&M.FLAG13)===0)this.result=this.treeIndex,this.consumed+=this.excess,this.excess=0}i++,this.excess++}return-1}emitNotTerminatedNamedEntity(){let{result:s,decodeTree:i}=this,a=(i[s]&M.VALUE_LENGTH)>>14;return this.emitNamedEntityData(s,a,this.consumed),this.errors?.missingSemicolonAfterCharacterReference(),this.consumed}emitNamedEntityData(s,i,a){let{decodeTree:d}=this;if(this.emitCodePoint(i===1?d[s]&~(M.VALUE_LENGTH|M.FLAG13):d[s+1],a),i===3)this.emitCodePoint(d[s+2],a);return a}end(){switch(this.state){case C.NamedEntity:return this.result!==0&&(this.decodeMode!==ms.Attribute||this.result===this.treeIndex)?this.emitNotTerminatedNamedEntity():0;case C.NumericDecimal:return this.emitNumericEntity(0,2);case C.NumericHex:return this.emitNumericEntity(0,3);case C.NumericStart:return this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed),0;case C.EntityStart:return 0}}}function Xm(s,i,a,d){let m=(i&M.BRANCH_LENGTH)>>7,u=i&M.JUMP_TABLE;if(m===0)return u!==0&&d===u?a:-1;if(u){let t=d-u;return t<0||t>=m?-1:s[a+t]-1}let c=m+1>>1,f=0,g=m-1;while(f<=g){let t=f+g>>>1,y=t>>1,b=s[a+y]>>(t&1)*8&255;if(b<d)f=t+1;else if(b>d)g=t-1;else return s[a+c+t]}return-1}var H;(function(s){s.HTML="http://www.w3.org/1999/xhtml",s.MATHML="http://www.w3.org/1998/Math/MathML",s.SVG="http://www.w3.org/2000/svg",s.XLINK="http://www.w3.org/1999/xlink",s.XML="http://www.w3.org/XML/1998/namespace",s.XMLNS="http://www.w3.org/2000/xmlns/"})(H||(H={}));var es;(function(s){s.TYPE="type",s.ACTION="action",s.ENCODING="encoding",s.PROMPT="prompt",s.NAME="name",s.COLOR="color",s.FACE="face",s.SIZE="size"})(es||(es={}));var E;(function(s){s.NO_QUIRKS="no-quirks",s.QUIRKS="quirks",s.LIMITED_QUIRKS="limited-quirks"})(E||(E={}));var w;(function(s){s.A="a",s.ADDRESS="address",s.ANNOTATION_XML="annotation-xml",s.APPLET="applet",s.AREA="area",s.ARTICLE="article",s.ASIDE="aside",s.B="b",s.BASE="base",s.BASEFONT="basefont",s.BGSOUND="bgsound",s.BIG="big",s.BLOCKQUOTE="blockquote",s.BODY="body",s.BR="br",s.BUTTON="button",s.CAPTION="caption",s.CENTER="center",s.CODE="code",s.COL="col",s.COLGROUP="colgroup",s.DD="dd",s.DESC="desc",s.DETAILS="details",s.DIALOG="dialog",s.DIR="dir",s.DIV="div",s.DL="dl",s.DT="dt",s.EM="em",s.EMBED="embed",s.FIELDSET="fieldset",s.FIGCAPTION="figcaption",s.FIGURE="figure",s.FONT="font",s.FOOTER="footer",s.FOREIGN_OBJECT="foreignObject",s.FORM="form",s.FRAME="frame",s.FRAMESET="frameset",s.H1="h1",s.H2="h2",s.H3="h3",s.H4="h4",s.H5="h5",s.H6="h6",s.HEAD="head",s.HEADER="header",s.HGROUP="hgroup",s.HR="hr",s.HTML="html",s.I="i",s.IMG="img",s.IMAGE="image",s.INPUT="input",s.IFRAME="iframe",s.KEYGEN="keygen",s.LABEL="label",s.LI="li",s.LINK="link",s.LISTING="listing",s.MAIN="main",s.MALIGNMARK="malignmark",s.MARQUEE="marquee",s.MATH="math",s.MENU="menu",s.META="meta",s.MGLYPH="mglyph",s.MI="mi",s.MO="mo",s.MN="mn",s.MS="ms",s.MTEXT="mtext",s.NAV="nav",s.NOBR="nobr",s.NOFRAMES="noframes",s.NOEMBED="noembed",s.NOSCRIPT="noscript",s.OBJECT="object",s.OL="ol",s.OPTGROUP="optgroup",s.OPTION="option",s.P="p",s.PARAM="param",s.PLAINTEXT="plaintext",s.PRE="pre",s.RB="rb",s.RP="rp",s.RT="rt",s.RTC="rtc",s.RUBY="ruby",s.S="s",s.SCRIPT="script",s.SEARCH="search",s.SECTION="section",s.SELECT="select",s.SOURCE="source",s.SMALL="small",s.SPAN="span",s.STRIKE="strike",s.STRONG="strong",s.STYLE="style",s.SUB="sub",s.SUMMARY="summary",s.SUP="sup",s.TABLE="table",s.TBODY="tbody",s.TEMPLATE="template",s.TEXTAREA="textarea",s.TFOOT="tfoot",s.TD="td",s.TH="th",s.THEAD="thead",s.TITLE="title",s.TR="tr",s.TRACK="track",s.TT="tt",s.U="u",s.UL="ul",s.SVG="svg",s.VAR="var",s.WBR="wbr",s.XMP="xmp"})(w||(w={}));var r;(function(s){s[s.UNKNOWN=0]="UNKNOWN",s[s.A=1]="A",s[s.ADDRESS=2]="ADDRESS",s[s.ANNOTATION_XML=3]="ANNOTATION_XML",s[s.APPLET=4]="APPLET",s[s.AREA=5]="AREA",s[s.ARTICLE=6]="ARTICLE",s[s.ASIDE=7]="ASIDE",s[s.B=8]="B",s[s.BASE=9]="BASE",s[s.BASEFONT=10]="BASEFONT",s[s.BGSOUND=11]="BGSOUND",s[s.BIG=12]="BIG",s[s.BLOCKQUOTE=13]="BLOCKQUOTE",s[s.BODY=14]="BODY",s[s.BR=15]="BR",s[s.BUTTON=16]="BUTTON",s[s.CAPTION=17]="CAPTION",s[s.CENTER=18]="CENTER",s[s.CODE=19]="CODE",s[s.COL=20]="COL",s[s.COLGROUP=21]="COLGROUP",s[s.DD=22]="DD",s[s.DESC=23]="DESC",s[s.DETAILS=24]="DETAILS",s[s.DIALOG=25]="DIALOG",s[s.DIR=26]="DIR",s[s.DIV=27]="DIV",s[s.DL=28]="DL",s[s.DT=29]="DT",s[s.EM=30]="EM",s[s.EMBED=31]="EMBED",s[s.FIELDSET=32]="FIELDSET",s[s.FIGCAPTION=33]="FIGCAPTION",s[s.FIGURE=34]="FIGURE",s[s.FONT=35]="FONT",s[s.FOOTER=36]="FOOTER",s[s.FOREIGN_OBJECT=37]="FOREIGN_OBJECT",s[s.FORM=38]="FORM",s[s.FRAME=39]="FRAME",s[s.FRAMESET=40]="FRAMESET",s[s.H1=41]="H1",s[s.H2=42]="H2",s[s.H3=43]="H3",s[s.H4=44]="H4",s[s.H5=45]="H5",s[s.H6=46]="H6",s[s.HEAD=47]="HEAD",s[s.HEADER=48]="HEADER",s[s.HGROUP=49]="HGROUP",s[s.HR=50]="HR",s[s.HTML=51]="HTML",s[s.I=52]="I",s[s.IMG=53]="IMG",s[s.IMAGE=54]="IMAGE",s[s.INPUT=55]="INPUT",s[s.IFRAME=56]="IFRAME",s[s.KEYGEN=57]="KEYGEN",s[s.LABEL=58]="LABEL",s[s.LI=59]="LI",s[s.LINK=60]="LINK",s[s.LISTING=61]="LISTING",s[s.MAIN=62]="MAIN",s[s.MALIGNMARK=63]="MALIGNMARK",s[s.MARQUEE=64]="MARQUEE",s[s.MATH=65]="MATH",s[s.MENU=66]="MENU",s[s.META=67]="META",s[s.MGLYPH=68]="MGLYPH",s[s.MI=69]="MI",s[s.MO=70]="MO",s[s.MN=71]="MN",s[s.MS=72]="MS",s[s.MTEXT=73]="MTEXT",s[s.NAV=74]="NAV",s[s.NOBR=75]="NOBR",s[s.NOFRAMES=76]="NOFRAMES",s[s.NOEMBED=77]="NOEMBED",s[s.NOSCRIPT=78]="NOSCRIPT",s[s.OBJECT=79]="OBJECT",s[s.OL=80]="OL",s[s.OPTGROUP=81]="OPTGROUP",s[s.OPTION=82]="OPTION",s[s.P=83]="P",s[s.PARAM=84]="PARAM",s[s.PLAINTEXT=85]="PLAINTEXT",s[s.PRE=86]="PRE",s[s.RB=87]="RB",s[s.RP=88]="RP",s[s.RT=89]="RT",s[s.RTC=90]="RTC",s[s.RUBY=91]="RUBY",s[s.S=92]="S",s[s.SCRIPT=93]="SCRIPT",s[s.SEARCH=94]="SEARCH",s[s.SECTION=95]="SECTION",s[s.SELECT=96]="SELECT",s[s.SOURCE=97]="SOURCE",s[s.SMALL=98]="SMALL",s[s.SPAN=99]="SPAN",s[s.STRIKE=100]="STRIKE",s[s.STRONG=101]="STRONG",s[s.STYLE=102]="STYLE",s[s.SUB=103]="SUB",s[s.SUMMARY=104]="SUMMARY",s[s.SUP=105]="SUP",s[s.TABLE=106]="TABLE",s[s.TBODY=107]="TBODY",s[s.TEMPLATE=108]="TEMPLATE",s[s.TEXTAREA=109]="TEXTAREA",s[s.TFOOT=110]="TFOOT",s[s.TD=111]="TD",s[s.TH=112]="TH",s[s.THEAD=113]="THEAD",s[s.TITLE=114]="TITLE",s[s.TR=115]="TR",s[s.TRACK=116]="TRACK",s[s.TT=117]="TT",s[s.U=118]="U",s[s.UL=119]="UL",s[s.SVG=120]="SVG",s[s.VAR=121]="VAR",s[s.WBR=122]="WBR",s[s.XMP=123]="XMP"})(r||(r={}));var Qm=new Map([[w.A,r.A],[w.ADDRESS,r.ADDRESS],[w.ANNOTATION_XML,r.ANNOTATION_XML],[w.APPLET,r.APPLET],[w.AREA,r.AREA],[w.ARTICLE,r.ARTICLE],[w.ASIDE,r.ASIDE],[w.B,r.B],[w.BASE,r.BASE],[w.BASEFONT,r.BASEFONT],[w.BGSOUND,r.BGSOUND],[w.BIG,r.BIG],[w.BLOCKQUOTE,r.BLOCKQUOTE],[w.BODY,r.BODY],[w.BR,r.BR],[w.BUTTON,r.BUTTON],[w.CAPTION,r.CAPTION],[w.CENTER,r.CENTER],[w.CODE,r.CODE],[w.COL,r.COL],[w.COLGROUP,r.COLGROUP],[w.DD,r.DD],[w.DESC,r.DESC],[w.DETAILS,r.DETAILS],[w.DIALOG,r.DIALOG],[w.DIR,r.DIR],[w.DIV,r.DIV],[w.DL,r.DL],[w.DT,r.DT],[w.EM,r.EM],[w.EMBED,r.EMBED],[w.FIELDSET,r.FIELDSET],[w.FIGCAPTION,r.FIGCAPTION],[w.FIGURE,r.FIGURE],[w.FONT,r.FONT],[w.FOOTER,r.FOOTER],[w.FOREIGN_OBJECT,r.FOREIGN_OBJECT],[w.FORM,r.FORM],[w.FRAME,r.FRAME],[w.FRAMESET,r.FRAMESET],[w.H1,r.H1],[w.H2,r.H2],[w.H3,r.H3],[w.H4,r.H4],[w.H5,r.H5],[w.H6,r.H6],[w.HEAD,r.HEAD],[w.HEADER,r.HEADER],[w.HGROUP,r.HGROUP],[w.HR,r.HR],[w.HTML,r.HTML],[w.I,r.I],[w.IMG,r.IMG],[w.IMAGE,r.IMAGE],[w.INPUT,r.INPUT],[w.IFRAME,r.IFRAME],[w.KEYGEN,r.KEYGEN],[w.LABEL,r.LABEL],[w.LI,r.LI],[w.LINK,r.LINK],[w.LISTING,r.LISTING],[w.MAIN,r.MAIN],[w.MALIGNMARK,r.MALIGNMARK],[w.MARQUEE,r.MARQUEE],[w.MATH,r.MATH],[w.MENU,r.MENU],[w.META,r.META],[w.MGLYPH,r.MGLYPH],[w.MI,r.MI],[w.MO,r.MO],[w.MN,r.MN],[w.MS,r.MS],[w.MTEXT,r.MTEXT],[w.NAV,r.NAV],[w.NOBR,r.NOBR],[w.NOFRAMES,r.NOFRAMES],[w.NOEMBED,r.NOEMBED],[w.NOSCRIPT,r.NOSCRIPT],[w.OBJECT,r.OBJECT],[w.OL,r.OL],[w.OPTGROUP,r.OPTGROUP],[w.OPTION,r.OPTION],[w.P,r.P],[w.PARAM,r.PARAM],[w.PLAINTEXT,r.PLAINTEXT],[w.PRE,r.PRE],[w.RB,r.RB],[w.RP,r.RP],[w.RT,r.RT],[w.RTC,r.RTC],[w.RUBY,r.RUBY],[w.S,r.S],[w.SCRIPT,r.SCRIPT],[w.SEARCH,r.SEARCH],[w.SECTION,r.SECTION],[w.SELECT,r.SELECT],[w.SOURCE,r.SOURCE],[w.SMALL,r.SMALL],[w.SPAN,r.SPAN],[w.STRIKE,r.STRIKE],[w.STRONG,r.STRONG],[w.STYLE,r.STYLE],[w.SUB,r.SUB],[w.SUMMARY,r.SUMMARY],[w.SUP,r.SUP],[w.TABLE,r.TABLE],[w.TBODY,r.TBODY],[w.TEMPLATE,r.TEMPLATE],[w.TEXTAREA,r.TEXTAREA],[w.TFOOT,r.TFOOT],[w.TD,r.TD],[w.TH,r.TH],[w.THEAD,r.THEAD],[w.TITLE,r.TITLE],[w.TR,r.TR],[w.TRACK,r.TRACK],[w.TT,r.TT],[w.U,r.U],[w.UL,r.UL],[w.SVG,r.SVG],[w.VAR,r.VAR],[w.WBR,r.WBR],[w.XMP,r.XMP]]);function Hs(s){var i;return(i=Qm.get(s))!==null&&i!==void 0?i:r.UNKNOWN}var q=r,dr={[H.HTML]:new Set([q.ADDRESS,q.APPLET,q.AREA,q.ARTICLE,q.ASIDE,q.BASE,q.BASEFONT,q.BGSOUND,q.BLOCKQUOTE,q.BODY,q.BR,q.BUTTON,q.CAPTION,q.CENTER,q.COL,q.COLGROUP,q.DD,q.DETAILS,q.DIR,q.DIV,q.DL,q.DT,q.EMBED,q.FIELDSET,q.FIGCAPTION,q.FIGURE,q.FOOTER,q.FORM,q.FRAME,q.FRAMESET,q.H1,q.H2,q.H3,q.H4,q.H5,q.H6,q.HEAD,q.HEADER,q.HGROUP,q.HR,q.HTML,q.IFRAME,q.IMG,q.INPUT,q.LI,q.LINK,q.LISTING,q.MAIN,q.MARQUEE,q.MENU,q.META,q.NAV,q.NOEMBED,q.NOFRAMES,q.NOSCRIPT,q.OBJECT,q.OL,q.P,q.PARAM,q.PLAINTEXT,q.PRE,q.SCRIPT,q.SECTION,q.SELECT,q.SOURCE,q.STYLE,q.SUMMARY,q.TABLE,q.TBODY,q.TD,q.TEMPLATE,q.TEXTAREA,q.TFOOT,q.TH,q.THEAD,q.TITLE,q.TR,q.TRACK,q.UL,q.WBR,q.XMP]),[H.MATHML]:new Set([q.MI,q.MO,q.MN,q.MS,q.MTEXT,q.ANNOTATION_XML]),[H.SVG]:new Set([q.TITLE,q.FOREIGN_OBJECT,q.DESC]),[H.XLINK]:new Set,[H.XML]:new Set,[H.XMLNS]:new Set},Cs=new Set([q.H1,q.H2,q.H3,q.H4,q.H5,q.H6]),rf=new Set([w.STYLE,w.SCRIPT,w.XMP,w.IFRAME,w.NOEMBED,w.NOFRAMES,w.PLAINTEXT]);var e;(function(s){s[s.DATA=0]="DATA",s[s.RCDATA=1]="RCDATA",s[s.RAWTEXT=2]="RAWTEXT",s[s.SCRIPT_DATA=3]="SCRIPT_DATA",s[s.PLAINTEXT=4]="PLAINTEXT",s[s.TAG_OPEN=5]="TAG_OPEN",s[s.END_TAG_OPEN=6]="END_TAG_OPEN",s[s.TAG_NAME=7]="TAG_NAME",s[s.RCDATA_LESS_THAN_SIGN=8]="RCDATA_LESS_THAN_SIGN",s[s.RCDATA_END_TAG_OPEN=9]="RCDATA_END_TAG_OPEN",s[s.RCDATA_END_TAG_NAME=10]="RCDATA_END_TAG_NAME",s[s.RAWTEXT_LESS_THAN_SIGN=11]="RAWTEXT_LESS_THAN_SIGN",s[s.RAWTEXT_END_TAG_OPEN=12]="RAWTEXT_END_TAG_OPEN",s[s.RAWTEXT_END_TAG_NAME=13]="RAWTEXT_END_TAG_NAME",s[s.SCRIPT_DATA_LESS_THAN_SIGN=14]="SCRIPT_DATA_LESS_THAN_SIGN",s[s.SCRIPT_DATA_END_TAG_OPEN=15]="SCRIPT_DATA_END_TAG_OPEN",s[s.SCRIPT_DATA_END_TAG_NAME=16]="SCRIPT_DATA_END_TAG_NAME",s[s.SCRIPT_DATA_ESCAPE_START=17]="SCRIPT_DATA_ESCAPE_START",s[s.SCRIPT_DATA_ESCAPE_START_DASH=18]="SCRIPT_DATA_ESCAPE_START_DASH",s[s.SCRIPT_DATA_ESCAPED=19]="SCRIPT_DATA_ESCAPED",s[s.SCRIPT_DATA_ESCAPED_DASH=20]="SCRIPT_DATA_ESCAPED_DASH",s[s.SCRIPT_DATA_ESCAPED_DASH_DASH=21]="SCRIPT_DATA_ESCAPED_DASH_DASH",s[s.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN=22]="SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN",s[s.SCRIPT_DATA_ESCAPED_END_TAG_OPEN=23]="SCRIPT_DATA_ESCAPED_END_TAG_OPEN",s[s.SCRIPT_DATA_ESCAPED_END_TAG_NAME=24]="SCRIPT_DATA_ESCAPED_END_TAG_NAME",s[s.SCRIPT_DATA_DOUBLE_ESCAPE_START=25]="SCRIPT_DATA_DOUBLE_ESCAPE_START",s[s.SCRIPT_DATA_DOUBLE_ESCAPED=26]="SCRIPT_DATA_DOUBLE_ESCAPED",s[s.SCRIPT_DATA_DOUBLE_ESCAPED_DASH=27]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH",s[s.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH=28]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH",s[s.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN=29]="SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN",s[s.SCRIPT_DATA_DOUBLE_ESCAPE_END=30]="SCRIPT_DATA_DOUBLE_ESCAPE_END",s[s.BEFORE_ATTRIBUTE_NAME=31]="BEFORE_ATTRIBUTE_NAME",s[s.ATTRIBUTE_NAME=32]="ATTRIBUTE_NAME",s[s.AFTER_ATTRIBUTE_NAME=33]="AFTER_ATTRIBUTE_NAME",s[s.BEFORE_ATTRIBUTE_VALUE=34]="BEFORE_ATTRIBUTE_VALUE",s[s.ATTRIBUTE_VALUE_DOUBLE_QUOTED=35]="ATTRIBUTE_VALUE_DOUBLE_QUOTED",s[s.ATTRIBUTE_VALUE_SINGLE_QUOTED=36]="ATTRIBUTE_VALUE_SINGLE_QUOTED",s[s.ATTRIBUTE_VALUE_UNQUOTED=37]="ATTRIBUTE_VALUE_UNQUOTED",s[s.AFTER_ATTRIBUTE_VALUE_QUOTED=38]="AFTER_ATTRIBUTE_VALUE_QUOTED",s[s.SELF_CLOSING_START_TAG=39]="SELF_CLOSING_START_TAG",s[s.BOGUS_COMMENT=40]="BOGUS_COMMENT",s[s.MARKUP_DECLARATION_OPEN=41]="MARKUP_DECLARATION_OPEN",s[s.COMMENT_START=42]="COMMENT_START",s[s.COMMENT_START_DASH=43]="COMMENT_START_DASH",s[s.COMMENT=44]="COMMENT",s[s.COMMENT_LESS_THAN_SIGN=45]="COMMENT_LESS_THAN_SIGN",s[s.COMMENT_LESS_THAN_SIGN_BANG=46]="COMMENT_LESS_THAN_SIGN_BANG",s[s.COMMENT_LESS_THAN_SIGN_BANG_DASH=47]="COMMENT_LESS_THAN_SIGN_BANG_DASH",s[s.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH=48]="COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH",s[s.COMMENT_END_DASH=49]="COMMENT_END_DASH",s[s.COMMENT_END=50]="COMMENT_END",s[s.COMMENT_END_BANG=51]="COMMENT_END_BANG",s[s.DOCTYPE=52]="DOCTYPE",s[s.BEFORE_DOCTYPE_NAME=53]="BEFORE_DOCTYPE_NAME",s[s.DOCTYPE_NAME=54]="DOCTYPE_NAME",s[s.AFTER_DOCTYPE_NAME=55]="AFTER_DOCTYPE_NAME",s[s.AFTER_DOCTYPE_PUBLIC_KEYWORD=56]="AFTER_DOCTYPE_PUBLIC_KEYWORD",s[s.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER=57]="BEFORE_DOCTYPE_PUBLIC_IDENTIFIER",s[s.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED=58]="DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED",s[s.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED=59]="DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED",s[s.AFTER_DOCTYPE_PUBLIC_IDENTIFIER=60]="AFTER_DOCTYPE_PUBLIC_IDENTIFIER",s[s.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS=61]="BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS",s[s.AFTER_DOCTYPE_SYSTEM_KEYWORD=62]="AFTER_DOCTYPE_SYSTEM_KEYWORD",s[s.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER=63]="BEFORE_DOCTYPE_SYSTEM_IDENTIFIER",s[s.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED=64]="DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED",s[s.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED=65]="DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED",s[s.AFTER_DOCTYPE_SYSTEM_IDENTIFIER=66]="AFTER_DOCTYPE_SYSTEM_IDENTIFIER",s[s.BOGUS_DOCTYPE=67]="BOGUS_DOCTYPE",s[s.CDATA_SECTION=68]="CDATA_SECTION",s[s.CDATA_SECTION_BRACKET=69]="CDATA_SECTION_BRACKET",s[s.CDATA_SECTION_END=70]="CDATA_SECTION_END",s[s.CHARACTER_REFERENCE=71]="CHARACTER_REFERENCE",s[s.AMBIGUOUS_AMPERSAND=72]="AMBIGUOUS_AMPERSAND"})(e||(e={}));var N={DATA:e.DATA,RCDATA:e.RCDATA,RAWTEXT:e.RAWTEXT,SCRIPT_DATA:e.SCRIPT_DATA,PLAINTEXT:e.PLAINTEXT,CDATA_SECTION:e.CDATA_SECTION};function zm(s){return s>=v.DIGIT_0&&s<=v.DIGIT_9}function Os(s){return s>=v.LATIN_CAPITAL_A&&s<=v.LATIN_CAPITAL_Z}function Zm(s){return s>=v.LATIN_SMALL_A&&s<=v.LATIN_SMALL_Z}function bs(s){return Zm(s)||Os(s)}function mr(s){return bs(s)||zm(s)}function ci(s){return s+32}function vr(s){return s===v.SPACE||s===v.LINE_FEED||s===v.TABULATION||s===v.FORM_FEED}function ur(s){return vr(s)||s===v.SOLIDUS||s===v.GREATER_THAN_SIGN}function Wm(s){if(s===v.NULL)return h.nullCharacterReference;else if(s>1114111)return h.characterReferenceOutsideUnicodeRange;else if(ui(s))return h.surrogateCharacterReference;else if(ei(s))return h.noncharacterCharacterReference;else if(vi(s)||s===v.CARRIAGE_RETURN)return h.controlCharacterReference;return null}class li{constructor(s,i){this.options=s,this.handler=i,this.paused=!1,this.inLoop=!1,this.inForeignNode=!1,this.lastStartTagName="",this.active=!1,this.state=e.DATA,this.returnState=e.DATA,this.entityStartPos=0,this.consumedAfterSnapshot=-1,this.currentCharacterToken=null,this.currentToken=null,this.currentAttr={name:"",value:""},this.preprocessor=new $i(i),this.currentLocation=this.getCurrentLocation(-1),this.entityDecoder=new ki(Ei,(a,d)=>{this.preprocessor.pos=this.entityStartPos+d-1,this._flushCodePointConsumedAsCharacterReference(a)},i.onParseError?{missingSemicolonAfterCharacterReference:()=>{this._err(h.missingSemicolonAfterCharacterReference,1)},absenceOfDigitsInNumericCharacterReference:(a)=>{this._err(h.absenceOfDigitsInNumericCharacterReference,this.entityStartPos-this.preprocessor.pos+a)},validateNumericCharacterReference:(a)=>{let d=Wm(a);if(d)this._err(d,1)}}:void 0)}_err(s,i=0){var a,d;(d=(a=this.handler).onParseError)===null||d===void 0||d.call(a,this.preprocessor.getError(s,i))}getCurrentLocation(s){if(!this.options.sourceCodeLocationInfo)return null;return{startLine:this.preprocessor.line,startCol:this.preprocessor.col-s,startOffset:this.preprocessor.offset-s,endLine:-1,endCol:-1,endOffset:-1}}_runParsingLoop(){if(this.inLoop)return;this.inLoop=!0;while(this.active&&!this.paused){this.consumedAfterSnapshot=0;let s=this._consume();if(!this._ensureHibernation())this._callState(s)}this.inLoop=!1}pause(){this.paused=!0}resume(s){if(!this.paused)throw Error("Parser was already resumed");if(this.paused=!1,this.inLoop)return;if(this._runParsingLoop(),!this.paused)s===null||s===void 0||s()}write(s,i,a){if(this.active=!0,this.preprocessor.write(s,i),this._runParsingLoop(),!this.paused)a===null||a===void 0||a()}insertHtmlAtCurrentPos(s){this.active=!0,this.preprocessor.insertHtmlAtCurrentPos(s),this._runParsingLoop()}_ensureHibernation(){if(this.preprocessor.endOfChunkHit)return this.preprocessor.retreat(this.consumedAfterSnapshot),this.consumedAfterSnapshot=0,this.active=!1,!0;return!1}_consume(){return this.consumedAfterSnapshot++,this.preprocessor.advance()}_advanceBy(s){this.consumedAfterSnapshot+=s;for(let i=0;i<s;i++)this.preprocessor.advance()}_consumeSequenceIfMatch(s,i){if(this.preprocessor.startsWith(s,i))return this._advanceBy(s.length-1),!0;return!1}_createStartTagToken(){this.currentToken={type:W.START_TAG,tagName:"",tagID:r.UNKNOWN,selfClosing:!1,ackSelfClosing:!1,attrs:[],location:this.getCurrentLocation(1)}}_createEndTagToken(){this.currentToken={type:W.END_TAG,tagName:"",tagID:r.UNKNOWN,selfClosing:!1,ackSelfClosing:!1,attrs:[],location:this.getCurrentLocation(2)}}_createCommentToken(s){this.currentToken={type:W.COMMENT,data:"",location:this.getCurrentLocation(s)}}_createDoctypeToken(s){this.currentToken={type:W.DOCTYPE,name:s,forceQuirks:!1,publicId:null,systemId:null,location:this.currentLocation}}_createCharacterToken(s,i){this.currentCharacterToken={type:s,chars:i,location:this.currentLocation}}_createAttr(s){this.currentAttr={name:s,value:""},this.currentLocation=this.getCurrentLocation(0)}_leaveAttrName(){var s,i;let a=this.currentToken;if(fi(a,this.currentAttr.name)===null){if(a.attrs.push(this.currentAttr),a.location&&this.currentLocation){let d=(s=(i=a.location).attrs)!==null&&s!==void 0?s:i.attrs=Object.create(null);d[this.currentAttr.name]=this.currentLocation,this._leaveAttrValue()}}else this._err(h.duplicateAttribute)}_leaveAttrValue(){if(this.currentLocation)this.currentLocation.endLine=this.preprocessor.line,this.currentLocation.endCol=this.preprocessor.col,this.currentLocation.endOffset=this.preprocessor.offset}prepareToken(s){if(this._emitCurrentCharacterToken(s.location),this.currentToken=null,s.location)s.location.endLine=this.preprocessor.line,s.location.endCol=this.preprocessor.col+1,s.location.endOffset=this.preprocessor.offset+1;this.currentLocation=this.getCurrentLocation(-1)}emitCurrentTagToken(){let s=this.currentToken;if(this.prepareToken(s),s.tagID=Hs(s.tagName),s.type===W.START_TAG)this.lastStartTagName=s.tagName,this.handler.onStartTag(s);else{if(s.attrs.length>0)this._err(h.endTagWithAttributes);if(s.selfClosing)this._err(h.endTagWithTrailingSolidus);this.handler.onEndTag(s)}this.preprocessor.dropParsedChunk()}emitCurrentComment(s){this.prepareToken(s),this.handler.onComment(s),this.preprocessor.dropParsedChunk()}emitCurrentDoctype(s){this.prepareToken(s),this.handler.onDoctype(s),this.preprocessor.dropParsedChunk()}_emitCurrentCharacterToken(s){if(this.currentCharacterToken){if(s&&this.currentCharacterToken.location)this.currentCharacterToken.location.endLine=s.startLine,this.currentCharacterToken.location.endCol=s.startCol,this.currentCharacterToken.location.endOffset=s.startOffset;switch(this.currentCharacterToken.type){case W.CHARACTER:{this.handler.onCharacter(this.currentCharacterToken);break}case W.NULL_CHARACTER:{this.handler.onNullCharacter(this.currentCharacterToken);break}case W.WHITESPACE_CHARACTER:{this.handler.onWhitespaceCharacter(this.currentCharacterToken);break}}this.currentCharacterToken=null}}_emitEOFToken(){let s=this.getCurrentLocation(0);if(s)s.endLine=s.startLine,s.endCol=s.startCol,s.endOffset=s.startOffset;this._emitCurrentCharacterToken(s),this.handler.onEof({type:W.EOF,location:s}),this.active=!1}_appendCharToCurrentCharacterToken(s,i){if(this.currentCharacterToken)if(this.currentCharacterToken.type===s){this.currentCharacterToken.chars+=i;return}else this.currentLocation=this.getCurrentLocation(0),this._emitCurrentCharacterToken(this.currentLocation),this.preprocessor.dropParsedChunk();this._createCharacterToken(s,i)}_emitCodePoint(s){let i=vr(s)?W.WHITESPACE_CHARACTER:s===v.NULL?W.NULL_CHARACTER:W.CHARACTER;this._appendCharToCurrentCharacterToken(i,s<65536?String.fromCharCode(s):String.fromCodePoint(s))}_emitChars(s){this._appendCharToCurrentCharacterToken(W.CHARACTER,s)}_startCharacterReference(){this.returnState=this.state,this.state=e.CHARACTER_REFERENCE,this.entityStartPos=this.preprocessor.pos,this.entityDecoder.startEntity(this._isCharacterReferenceInAttribute()?ms.Attribute:ms.Legacy)}_isCharacterReferenceInAttribute(){return this.returnState===e.ATTRIBUTE_VALUE_DOUBLE_QUOTED||this.returnState===e.ATTRIBUTE_VALUE_SINGLE_QUOTED||this.returnState===e.ATTRIBUTE_VALUE_UNQUOTED}_flushCodePointConsumedAsCharacterReference(s){if(this._isCharacterReferenceInAttribute())this.currentAttr.value+=String.fromCodePoint(s);else this._emitCodePoint(s)}_callState(s){switch(this.state){case e.DATA:{this._stateData(s);break}case e.RCDATA:{this._stateRcdata(s);break}case e.RAWTEXT:{this._stateRawtext(s);break}case e.SCRIPT_DATA:{this._stateScriptData(s);break}case e.PLAINTEXT:{this._statePlaintext(s);break}case e.TAG_OPEN:{this._stateTagOpen(s);break}case e.END_TAG_OPEN:{this._stateEndTagOpen(s);break}case e.TAG_NAME:{this._stateTagName(s);break}case e.RCDATA_LESS_THAN_SIGN:{this._stateRcdataLessThanSign(s);break}case e.RCDATA_END_TAG_OPEN:{this._stateRcdataEndTagOpen(s);break}case e.RCDATA_END_TAG_NAME:{this._stateRcdataEndTagName(s);break}case e.RAWTEXT_LESS_THAN_SIGN:{this._stateRawtextLessThanSign(s);break}case e.RAWTEXT_END_TAG_OPEN:{this._stateRawtextEndTagOpen(s);break}case e.RAWTEXT_END_TAG_NAME:{this._stateRawtextEndTagName(s);break}case e.SCRIPT_DATA_LESS_THAN_SIGN:{this._stateScriptDataLessThanSign(s);break}case e.SCRIPT_DATA_END_TAG_OPEN:{this._stateScriptDataEndTagOpen(s);break}case e.SCRIPT_DATA_END_TAG_NAME:{this._stateScriptDataEndTagName(s);break}case e.SCRIPT_DATA_ESCAPE_START:{this._stateScriptDataEscapeStart(s);break}case e.SCRIPT_DATA_ESCAPE_START_DASH:{this._stateScriptDataEscapeStartDash(s);break}case e.SCRIPT_DATA_ESCAPED:{this._stateScriptDataEscaped(s);break}case e.SCRIPT_DATA_ESCAPED_DASH:{this._stateScriptDataEscapedDash(s);break}case e.SCRIPT_DATA_ESCAPED_DASH_DASH:{this._stateScriptDataEscapedDashDash(s);break}case e.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:{this._stateScriptDataEscapedLessThanSign(s);break}case e.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:{this._stateScriptDataEscapedEndTagOpen(s);break}case e.SCRIPT_DATA_ESCAPED_END_TAG_NAME:{this._stateScriptDataEscapedEndTagName(s);break}case e.SCRIPT_DATA_DOUBLE_ESCAPE_START:{this._stateScriptDataDoubleEscapeStart(s);break}case e.SCRIPT_DATA_DOUBLE_ESCAPED:{this._stateScriptDataDoubleEscaped(s);break}case e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH:{this._stateScriptDataDoubleEscapedDash(s);break}case e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH:{this._stateScriptDataDoubleEscapedDashDash(s);break}case e.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN:{this._stateScriptDataDoubleEscapedLessThanSign(s);break}case e.SCRIPT_DATA_DOUBLE_ESCAPE_END:{this._stateScriptDataDoubleEscapeEnd(s);break}case e.BEFORE_ATTRIBUTE_NAME:{this._stateBeforeAttributeName(s);break}case e.ATTRIBUTE_NAME:{this._stateAttributeName(s);break}case e.AFTER_ATTRIBUTE_NAME:{this._stateAfterAttributeName(s);break}case e.BEFORE_ATTRIBUTE_VALUE:{this._stateBeforeAttributeValue(s);break}case e.ATTRIBUTE_VALUE_DOUBLE_QUOTED:{this._stateAttributeValueDoubleQuoted(s);break}case e.ATTRIBUTE_VALUE_SINGLE_QUOTED:{this._stateAttributeValueSingleQuoted(s);break}case e.ATTRIBUTE_VALUE_UNQUOTED:{this._stateAttributeValueUnquoted(s);break}case e.AFTER_ATTRIBUTE_VALUE_QUOTED:{this._stateAfterAttributeValueQuoted(s);break}case e.SELF_CLOSING_START_TAG:{this._stateSelfClosingStartTag(s);break}case e.BOGUS_COMMENT:{this._stateBogusComment(s);break}case e.MARKUP_DECLARATION_OPEN:{this._stateMarkupDeclarationOpen(s);break}case e.COMMENT_START:{this._stateCommentStart(s);break}case e.COMMENT_START_DASH:{this._stateCommentStartDash(s);break}case e.COMMENT:{this._stateComment(s);break}case e.COMMENT_LESS_THAN_SIGN:{this._stateCommentLessThanSign(s);break}case e.COMMENT_LESS_THAN_SIGN_BANG:{this._stateCommentLessThanSignBang(s);break}case e.COMMENT_LESS_THAN_SIGN_BANG_DASH:{this._stateCommentLessThanSignBangDash(s);break}case e.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH:{this._stateCommentLessThanSignBangDashDash(s);break}case e.COMMENT_END_DASH:{this._stateCommentEndDash(s);break}case e.COMMENT_END:{this._stateCommentEnd(s);break}case e.COMMENT_END_BANG:{this._stateCommentEndBang(s);break}case e.DOCTYPE:{this._stateDoctype(s);break}case e.BEFORE_DOCTYPE_NAME:{this._stateBeforeDoctypeName(s);break}case e.DOCTYPE_NAME:{this._stateDoctypeName(s);break}case e.AFTER_DOCTYPE_NAME:{this._stateAfterDoctypeName(s);break}case e.AFTER_DOCTYPE_PUBLIC_KEYWORD:{this._stateAfterDoctypePublicKeyword(s);break}case e.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER:{this._stateBeforeDoctypePublicIdentifier(s);break}case e.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED:{this._stateDoctypePublicIdentifierDoubleQuoted(s);break}case e.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED:{this._stateDoctypePublicIdentifierSingleQuoted(s);break}case e.AFTER_DOCTYPE_PUBLIC_IDENTIFIER:{this._stateAfterDoctypePublicIdentifier(s);break}case e.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS:{this._stateBetweenDoctypePublicAndSystemIdentifiers(s);break}case e.AFTER_DOCTYPE_SYSTEM_KEYWORD:{this._stateAfterDoctypeSystemKeyword(s);break}case e.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER:{this._stateBeforeDoctypeSystemIdentifier(s);break}case e.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED:{this._stateDoctypeSystemIdentifierDoubleQuoted(s);break}case e.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED:{this._stateDoctypeSystemIdentifierSingleQuoted(s);break}case e.AFTER_DOCTYPE_SYSTEM_IDENTIFIER:{this._stateAfterDoctypeSystemIdentifier(s);break}case e.BOGUS_DOCTYPE:{this._stateBogusDoctype(s);break}case e.CDATA_SECTION:{this._stateCdataSection(s);break}case e.CDATA_SECTION_BRACKET:{this._stateCdataSectionBracket(s);break}case e.CDATA_SECTION_END:{this._stateCdataSectionEnd(s);break}case e.CHARACTER_REFERENCE:{this._stateCharacterReference();break}case e.AMBIGUOUS_AMPERSAND:{this._stateAmbiguousAmpersand(s);break}default:throw Error("Unknown state")}}_stateData(s){switch(s){case v.LESS_THAN_SIGN:{this.state=e.TAG_OPEN;break}case v.AMPERSAND:{this._startCharacterReference();break}case v.NULL:{this._err(h.unexpectedNullCharacter),this._emitCodePoint(s);break}case v.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateRcdata(s){switch(s){case v.AMPERSAND:{this._startCharacterReference();break}case v.LESS_THAN_SIGN:{this.state=e.RCDATA_LESS_THAN_SIGN;break}case v.NULL:{this._err(h.unexpectedNullCharacter),this._emitChars(K);break}case v.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateRawtext(s){switch(s){case v.LESS_THAN_SIGN:{this.state=e.RAWTEXT_LESS_THAN_SIGN;break}case v.NULL:{this._err(h.unexpectedNullCharacter),this._emitChars(K);break}case v.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateScriptData(s){switch(s){case v.LESS_THAN_SIGN:{this.state=e.SCRIPT_DATA_LESS_THAN_SIGN;break}case v.NULL:{this._err(h.unexpectedNullCharacter),this._emitChars(K);break}case v.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(s)}}_statePlaintext(s){switch(s){case v.NULL:{this._err(h.unexpectedNullCharacter),this._emitChars(K);break}case v.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateTagOpen(s){if(bs(s))this._createStartTagToken(),this.state=e.TAG_NAME,this._stateTagName(s);else switch(s){case v.EXCLAMATION_MARK:{this.state=e.MARKUP_DECLARATION_OPEN;break}case v.SOLIDUS:{this.state=e.END_TAG_OPEN;break}case v.QUESTION_MARK:{this._err(h.unexpectedQuestionMarkInsteadOfTagName),this._createCommentToken(1),this.state=e.BOGUS_COMMENT,this._stateBogusComment(s);break}case v.EOF:{this._err(h.eofBeforeTagName),this._emitChars("<"),this._emitEOFToken();break}default:this._err(h.invalidFirstCharacterOfTagName),this._emitChars("<"),this.state=e.DATA,this._stateData(s)}}_stateEndTagOpen(s){if(bs(s))this._createEndTagToken(),this.state=e.TAG_NAME,this._stateTagName(s);else switch(s){case v.GREATER_THAN_SIGN:{this._err(h.missingEndTagName),this.state=e.DATA;break}case v.EOF:{this._err(h.eofBeforeTagName),this._emitChars("</"),this._emitEOFToken();break}default:this._err(h.invalidFirstCharacterOfTagName),this._createCommentToken(2),this.state=e.BOGUS_COMMENT,this._stateBogusComment(s)}}_stateTagName(s){let i=this.currentToken;switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:{this.state=e.BEFORE_ATTRIBUTE_NAME;break}case v.SOLIDUS:{this.state=e.SELF_CLOSING_START_TAG;break}case v.GREATER_THAN_SIGN:{this.state=e.DATA,this.emitCurrentTagToken();break}case v.NULL:{this._err(h.unexpectedNullCharacter),i.tagName+=K;break}case v.EOF:{this._err(h.eofInTag),this._emitEOFToken();break}default:i.tagName+=String.fromCodePoint(Os(s)?ci(s):s)}}_stateRcdataLessThanSign(s){if(s===v.SOLIDUS)this.state=e.RCDATA_END_TAG_OPEN;else this._emitChars("<"),this.state=e.RCDATA,this._stateRcdata(s)}_stateRcdataEndTagOpen(s){if(bs(s))this.state=e.RCDATA_END_TAG_NAME,this._stateRcdataEndTagName(s);else this._emitChars("</"),this.state=e.RCDATA,this._stateRcdata(s)}handleSpecialEndTag(s){if(!this.preprocessor.startsWith(this.lastStartTagName,!1))return!this._ensureHibernation();this._createEndTagToken();let i=this.currentToken;switch(i.tagName=this.lastStartTagName,this.preprocessor.peek(this.lastStartTagName.length)){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:return this._advanceBy(this.lastStartTagName.length),this.state=e.BEFORE_ATTRIBUTE_NAME,!1;case v.SOLIDUS:return this._advanceBy(this.lastStartTagName.length),this.state=e.SELF_CLOSING_START_TAG,!1;case v.GREATER_THAN_SIGN:return this._advanceBy(this.lastStartTagName.length),this.emitCurrentTagToken(),this.state=e.DATA,!1;default:return!this._ensureHibernation()}}_stateRcdataEndTagName(s){if(this.handleSpecialEndTag(s))this._emitChars("</"),this.state=e.RCDATA,this._stateRcdata(s)}_stateRawtextLessThanSign(s){if(s===v.SOLIDUS)this.state=e.RAWTEXT_END_TAG_OPEN;else this._emitChars("<"),this.state=e.RAWTEXT,this._stateRawtext(s)}_stateRawtextEndTagOpen(s){if(bs(s))this.state=e.RAWTEXT_END_TAG_NAME,this._stateRawtextEndTagName(s);else this._emitChars("</"),this.state=e.RAWTEXT,this._stateRawtext(s)}_stateRawtextEndTagName(s){if(this.handleSpecialEndTag(s))this._emitChars("</"),this.state=e.RAWTEXT,this._stateRawtext(s)}_stateScriptDataLessThanSign(s){switch(s){case v.SOLIDUS:{this.state=e.SCRIPT_DATA_END_TAG_OPEN;break}case v.EXCLAMATION_MARK:{this.state=e.SCRIPT_DATA_ESCAPE_START,this._emitChars("<!");break}default:this._emitChars("<"),this.state=e.SCRIPT_DATA,this._stateScriptData(s)}}_stateScriptDataEndTagOpen(s){if(bs(s))this.state=e.SCRIPT_DATA_END_TAG_NAME,this._stateScriptDataEndTagName(s);else this._emitChars("</"),this.state=e.SCRIPT_DATA,this._stateScriptData(s)}_stateScriptDataEndTagName(s){if(this.handleSpecialEndTag(s))this._emitChars("</"),this.state=e.SCRIPT_DATA,this._stateScriptData(s)}_stateScriptDataEscapeStart(s){if(s===v.HYPHEN_MINUS)this.state=e.SCRIPT_DATA_ESCAPE_START_DASH,this._emitChars("-");else this.state=e.SCRIPT_DATA,this._stateScriptData(s)}_stateScriptDataEscapeStartDash(s){if(s===v.HYPHEN_MINUS)this.state=e.SCRIPT_DATA_ESCAPED_DASH_DASH,this._emitChars("-");else this.state=e.SCRIPT_DATA,this._stateScriptData(s)}_stateScriptDataEscaped(s){switch(s){case v.HYPHEN_MINUS:{this.state=e.SCRIPT_DATA_ESCAPED_DASH,this._emitChars("-");break}case v.LESS_THAN_SIGN:{this.state=e.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;break}case v.NULL:{this._err(h.unexpectedNullCharacter),this._emitChars(K);break}case v.EOF:{this._err(h.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateScriptDataEscapedDash(s){switch(s){case v.HYPHEN_MINUS:{this.state=e.SCRIPT_DATA_ESCAPED_DASH_DASH,this._emitChars("-");break}case v.LESS_THAN_SIGN:{this.state=e.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;break}case v.NULL:{this._err(h.unexpectedNullCharacter),this.state=e.SCRIPT_DATA_ESCAPED,this._emitChars(K);break}case v.EOF:{this._err(h.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=e.SCRIPT_DATA_ESCAPED,this._emitCodePoint(s)}}_stateScriptDataEscapedDashDash(s){switch(s){case v.HYPHEN_MINUS:{this._emitChars("-");break}case v.LESS_THAN_SIGN:{this.state=e.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;break}case v.GREATER_THAN_SIGN:{this.state=e.SCRIPT_DATA,this._emitChars(">");break}case v.NULL:{this._err(h.unexpectedNullCharacter),this.state=e.SCRIPT_DATA_ESCAPED,this._emitChars(K);break}case v.EOF:{this._err(h.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=e.SCRIPT_DATA_ESCAPED,this._emitCodePoint(s)}}_stateScriptDataEscapedLessThanSign(s){if(s===v.SOLIDUS)this.state=e.SCRIPT_DATA_ESCAPED_END_TAG_OPEN;else if(bs(s))this._emitChars("<"),this.state=e.SCRIPT_DATA_DOUBLE_ESCAPE_START,this._stateScriptDataDoubleEscapeStart(s);else this._emitChars("<"),this.state=e.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(s)}_stateScriptDataEscapedEndTagOpen(s){if(bs(s))this.state=e.SCRIPT_DATA_ESCAPED_END_TAG_NAME,this._stateScriptDataEscapedEndTagName(s);else this._emitChars("</"),this.state=e.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(s)}_stateScriptDataEscapedEndTagName(s){if(this.handleSpecialEndTag(s))this._emitChars("</"),this.state=e.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(s)}_stateScriptDataDoubleEscapeStart(s){if(this.preprocessor.startsWith($.SCRIPT,!1)&&ur(this.preprocessor.peek($.SCRIPT.length))){this._emitCodePoint(s);for(let i=0;i<$.SCRIPT.length;i++)this._emitCodePoint(this._consume());this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED}else if(!this._ensureHibernation())this.state=e.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(s)}_stateScriptDataDoubleEscaped(s){switch(s){case v.HYPHEN_MINUS:{this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH,this._emitChars("-");break}case v.LESS_THAN_SIGN:{this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN,this._emitChars("<");break}case v.NULL:{this._err(h.unexpectedNullCharacter),this._emitChars(K);break}case v.EOF:{this._err(h.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateScriptDataDoubleEscapedDash(s){switch(s){case v.HYPHEN_MINUS:{this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH,this._emitChars("-");break}case v.LESS_THAN_SIGN:{this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN,this._emitChars("<");break}case v.NULL:{this._err(h.unexpectedNullCharacter),this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitChars(K);break}case v.EOF:{this._err(h.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitCodePoint(s)}}_stateScriptDataDoubleEscapedDashDash(s){switch(s){case v.HYPHEN_MINUS:{this._emitChars("-");break}case v.LESS_THAN_SIGN:{this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN,this._emitChars("<");break}case v.GREATER_THAN_SIGN:{this.state=e.SCRIPT_DATA,this._emitChars(">");break}case v.NULL:{this._err(h.unexpectedNullCharacter),this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitChars(K);break}case v.EOF:{this._err(h.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitCodePoint(s)}}_stateScriptDataDoubleEscapedLessThanSign(s){if(s===v.SOLIDUS)this.state=e.SCRIPT_DATA_DOUBLE_ESCAPE_END,this._emitChars("/");else this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED,this._stateScriptDataDoubleEscaped(s)}_stateScriptDataDoubleEscapeEnd(s){if(this.preprocessor.startsWith($.SCRIPT,!1)&&ur(this.preprocessor.peek($.SCRIPT.length))){this._emitCodePoint(s);for(let i=0;i<$.SCRIPT.length;i++)this._emitCodePoint(this._consume());this.state=e.SCRIPT_DATA_ESCAPED}else if(!this._ensureHibernation())this.state=e.SCRIPT_DATA_DOUBLE_ESCAPED,this._stateScriptDataDoubleEscaped(s)}_stateBeforeAttributeName(s){switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:break;case v.SOLIDUS:case v.GREATER_THAN_SIGN:case v.EOF:{this.state=e.AFTER_ATTRIBUTE_NAME,this._stateAfterAttributeName(s);break}case v.EQUALS_SIGN:{this._err(h.unexpectedEqualsSignBeforeAttributeName),this._createAttr("="),this.state=e.ATTRIBUTE_NAME;break}default:this._createAttr(""),this.state=e.ATTRIBUTE_NAME,this._stateAttributeName(s)}}_stateAttributeName(s){switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:case v.SOLIDUS:case v.GREATER_THAN_SIGN:case v.EOF:{this._leaveAttrName(),this.state=e.AFTER_ATTRIBUTE_NAME,this._stateAfterAttributeName(s);break}case v.EQUALS_SIGN:{this._leaveAttrName(),this.state=e.BEFORE_ATTRIBUTE_VALUE;break}case v.QUOTATION_MARK:case v.APOSTROPHE:case v.LESS_THAN_SIGN:{this._err(h.unexpectedCharacterInAttributeName),this.currentAttr.name+=String.fromCodePoint(s);break}case v.NULL:{this._err(h.unexpectedNullCharacter),this.currentAttr.name+=K;break}default:this.currentAttr.name+=String.fromCodePoint(Os(s)?ci(s):s)}}_stateAfterAttributeName(s){switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:break;case v.SOLIDUS:{this.state=e.SELF_CLOSING_START_TAG;break}case v.EQUALS_SIGN:{this.state=e.BEFORE_ATTRIBUTE_VALUE;break}case v.GREATER_THAN_SIGN:{this.state=e.DATA,this.emitCurrentTagToken();break}case v.EOF:{this._err(h.eofInTag),this._emitEOFToken();break}default:this._createAttr(""),this.state=e.ATTRIBUTE_NAME,this._stateAttributeName(s)}}_stateBeforeAttributeValue(s){switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:break;case v.QUOTATION_MARK:{this.state=e.ATTRIBUTE_VALUE_DOUBLE_QUOTED;break}case v.APOSTROPHE:{this.state=e.ATTRIBUTE_VALUE_SINGLE_QUOTED;break}case v.GREATER_THAN_SIGN:{this._err(h.missingAttributeValue),this.state=e.DATA,this.emitCurrentTagToken();break}default:this.state=e.ATTRIBUTE_VALUE_UNQUOTED,this._stateAttributeValueUnquoted(s)}}_stateAttributeValueDoubleQuoted(s){switch(s){case v.QUOTATION_MARK:{this.state=e.AFTER_ATTRIBUTE_VALUE_QUOTED;break}case v.AMPERSAND:{this._startCharacterReference();break}case v.NULL:{this._err(h.unexpectedNullCharacter),this.currentAttr.value+=K;break}case v.EOF:{this._err(h.eofInTag),this._emitEOFToken();break}default:this.currentAttr.value+=String.fromCodePoint(s)}}_stateAttributeValueSingleQuoted(s){switch(s){case v.APOSTROPHE:{this.state=e.AFTER_ATTRIBUTE_VALUE_QUOTED;break}case v.AMPERSAND:{this._startCharacterReference();break}case v.NULL:{this._err(h.unexpectedNullCharacter),this.currentAttr.value+=K;break}case v.EOF:{this._err(h.eofInTag),this._emitEOFToken();break}default:this.currentAttr.value+=String.fromCodePoint(s)}}_stateAttributeValueUnquoted(s){switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:{this._leaveAttrValue(),this.state=e.BEFORE_ATTRIBUTE_NAME;break}case v.AMPERSAND:{this._startCharacterReference();break}case v.GREATER_THAN_SIGN:{this._leaveAttrValue(),this.state=e.DATA,this.emitCurrentTagToken();break}case v.NULL:{this._err(h.unexpectedNullCharacter),this.currentAttr.value+=K;break}case v.QUOTATION_MARK:case v.APOSTROPHE:case v.LESS_THAN_SIGN:case v.EQUALS_SIGN:case v.GRAVE_ACCENT:{this._err(h.unexpectedCharacterInUnquotedAttributeValue),this.currentAttr.value+=String.fromCodePoint(s);break}case v.EOF:{this._err(h.eofInTag),this._emitEOFToken();break}default:this.currentAttr.value+=String.fromCodePoint(s)}}_stateAfterAttributeValueQuoted(s){switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:{this._leaveAttrValue(),this.state=e.BEFORE_ATTRIBUTE_NAME;break}case v.SOLIDUS:{this._leaveAttrValue(),this.state=e.SELF_CLOSING_START_TAG;break}case v.GREATER_THAN_SIGN:{this._leaveAttrValue(),this.state=e.DATA,this.emitCurrentTagToken();break}case v.EOF:{this._err(h.eofInTag),this._emitEOFToken();break}default:this._err(h.missingWhitespaceBetweenAttributes),this.state=e.BEFORE_ATTRIBUTE_NAME,this._stateBeforeAttributeName(s)}}_stateSelfClosingStartTag(s){switch(s){case v.GREATER_THAN_SIGN:{let i=this.currentToken;i.selfClosing=!0,this.state=e.DATA,this.emitCurrentTagToken();break}case v.EOF:{this._err(h.eofInTag),this._emitEOFToken();break}default:this._err(h.unexpectedSolidusInTag),this.state=e.BEFORE_ATTRIBUTE_NAME,this._stateBeforeAttributeName(s)}}_stateBogusComment(s){let i=this.currentToken;switch(s){case v.GREATER_THAN_SIGN:{this.state=e.DATA,this.emitCurrentComment(i);break}case v.EOF:{this.emitCurrentComment(i),this._emitEOFToken();break}case v.NULL:{this._err(h.unexpectedNullCharacter),i.data+=K;break}default:i.data+=String.fromCodePoint(s)}}_stateMarkupDeclarationOpen(s){if(this._consumeSequenceIfMatch($.DASH_DASH,!0))this._createCommentToken($.DASH_DASH.length+1),this.state=e.COMMENT_START;else if(this._consumeSequenceIfMatch($.DOCTYPE,!1))this.currentLocation=this.getCurrentLocation($.DOCTYPE.length+1),this.state=e.DOCTYPE;else if(this._consumeSequenceIfMatch($.CDATA_START,!0))if(this.inForeignNode)this.state=e.CDATA_SECTION;else this._err(h.cdataInHtmlContent),this._createCommentToken($.CDATA_START.length+1),this.currentToken.data="[CDATA[",this.state=e.BOGUS_COMMENT;else if(!this._ensureHibernation())this._err(h.incorrectlyOpenedComment),this._createCommentToken(2),this.state=e.BOGUS_COMMENT,this._stateBogusComment(s)}_stateCommentStart(s){switch(s){case v.HYPHEN_MINUS:{this.state=e.COMMENT_START_DASH;break}case v.GREATER_THAN_SIGN:{this._err(h.abruptClosingOfEmptyComment),this.state=e.DATA;let i=this.currentToken;this.emitCurrentComment(i);break}default:this.state=e.COMMENT,this._stateComment(s)}}_stateCommentStartDash(s){let i=this.currentToken;switch(s){case v.HYPHEN_MINUS:{this.state=e.COMMENT_END;break}case v.GREATER_THAN_SIGN:{this._err(h.abruptClosingOfEmptyComment),this.state=e.DATA,this.emitCurrentComment(i);break}case v.EOF:{this._err(h.eofInComment),this.emitCurrentComment(i),this._emitEOFToken();break}default:i.data+="-",this.state=e.COMMENT,this._stateComment(s)}}_stateComment(s){let i=this.currentToken;switch(s){case v.HYPHEN_MINUS:{this.state=e.COMMENT_END_DASH;break}case v.LESS_THAN_SIGN:{i.data+="<",this.state=e.COMMENT_LESS_THAN_SIGN;break}case v.NULL:{this._err(h.unexpectedNullCharacter),i.data+=K;break}case v.EOF:{this._err(h.eofInComment),this.emitCurrentComment(i),this._emitEOFToken();break}default:i.data+=String.fromCodePoint(s)}}_stateCommentLessThanSign(s){let i=this.currentToken;switch(s){case v.EXCLAMATION_MARK:{i.data+="!",this.state=e.COMMENT_LESS_THAN_SIGN_BANG;break}case v.LESS_THAN_SIGN:{i.data+="<";break}default:this.state=e.COMMENT,this._stateComment(s)}}_stateCommentLessThanSignBang(s){if(s===v.HYPHEN_MINUS)this.state=e.COMMENT_LESS_THAN_SIGN_BANG_DASH;else this.state=e.COMMENT,this._stateComment(s)}_stateCommentLessThanSignBangDash(s){if(s===v.HYPHEN_MINUS)this.state=e.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH;else this.state=e.COMMENT_END_DASH,this._stateCommentEndDash(s)}_stateCommentLessThanSignBangDashDash(s){if(s!==v.GREATER_THAN_SIGN&&s!==v.EOF)this._err(h.nestedComment);this.state=e.COMMENT_END,this._stateCommentEnd(s)}_stateCommentEndDash(s){let i=this.currentToken;switch(s){case v.HYPHEN_MINUS:{this.state=e.COMMENT_END;break}case v.EOF:{this._err(h.eofInComment),this.emitCurrentComment(i),this._emitEOFToken();break}default:i.data+="-",this.state=e.COMMENT,this._stateComment(s)}}_stateCommentEnd(s){let i=this.currentToken;switch(s){case v.GREATER_THAN_SIGN:{this.state=e.DATA,this.emitCurrentComment(i);break}case v.EXCLAMATION_MARK:{this.state=e.COMMENT_END_BANG;break}case v.HYPHEN_MINUS:{i.data+="-";break}case v.EOF:{this._err(h.eofInComment),this.emitCurrentComment(i),this._emitEOFToken();break}default:i.data+="--",this.state=e.COMMENT,this._stateComment(s)}}_stateCommentEndBang(s){let i=this.currentToken;switch(s){case v.HYPHEN_MINUS:{i.data+="--!",this.state=e.COMMENT_END_DASH;break}case v.GREATER_THAN_SIGN:{this._err(h.incorrectlyClosedComment),this.state=e.DATA,this.emitCurrentComment(i);break}case v.EOF:{this._err(h.eofInComment),this.emitCurrentComment(i),this._emitEOFToken();break}default:i.data+="--!",this.state=e.COMMENT,this._stateComment(s)}}_stateDoctype(s){switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:{this.state=e.BEFORE_DOCTYPE_NAME;break}case v.GREATER_THAN_SIGN:{this.state=e.BEFORE_DOCTYPE_NAME,this._stateBeforeDoctypeName(s);break}case v.EOF:{this._err(h.eofInDoctype),this._createDoctypeToken(null);let i=this.currentToken;i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(h.missingWhitespaceBeforeDoctypeName),this.state=e.BEFORE_DOCTYPE_NAME,this._stateBeforeDoctypeName(s)}}_stateBeforeDoctypeName(s){if(Os(s))this._createDoctypeToken(String.fromCharCode(ci(s))),this.state=e.DOCTYPE_NAME;else switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:break;case v.NULL:{this._err(h.unexpectedNullCharacter),this._createDoctypeToken(K),this.state=e.DOCTYPE_NAME;break}case v.GREATER_THAN_SIGN:{this._err(h.missingDoctypeName),this._createDoctypeToken(null);let i=this.currentToken;i.forceQuirks=!0,this.emitCurrentDoctype(i),this.state=e.DATA;break}case v.EOF:{this._err(h.eofInDoctype),this._createDoctypeToken(null);let i=this.currentToken;i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._createDoctypeToken(String.fromCodePoint(s)),this.state=e.DOCTYPE_NAME}}_stateDoctypeName(s){let i=this.currentToken;switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:{this.state=e.AFTER_DOCTYPE_NAME;break}case v.GREATER_THAN_SIGN:{this.state=e.DATA,this.emitCurrentDoctype(i);break}case v.NULL:{this._err(h.unexpectedNullCharacter),i.name+=K;break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:i.name+=String.fromCodePoint(Os(s)?ci(s):s)}}_stateAfterDoctypeName(s){let i=this.currentToken;switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:break;case v.GREATER_THAN_SIGN:{this.state=e.DATA,this.emitCurrentDoctype(i);break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:if(this._consumeSequenceIfMatch($.PUBLIC,!1))this.state=e.AFTER_DOCTYPE_PUBLIC_KEYWORD;else if(this._consumeSequenceIfMatch($.SYSTEM,!1))this.state=e.AFTER_DOCTYPE_SYSTEM_KEYWORD;else if(!this._ensureHibernation())this._err(h.invalidCharacterSequenceAfterDoctypeName),i.forceQuirks=!0,this.state=e.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateAfterDoctypePublicKeyword(s){let i=this.currentToken;switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:{this.state=e.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER;break}case v.QUOTATION_MARK:{this._err(h.missingWhitespaceAfterDoctypePublicKeyword),i.publicId="",this.state=e.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;break}case v.APOSTROPHE:{this._err(h.missingWhitespaceAfterDoctypePublicKeyword),i.publicId="",this.state=e.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;break}case v.GREATER_THAN_SIGN:{this._err(h.missingDoctypePublicIdentifier),i.forceQuirks=!0,this.state=e.DATA,this.emitCurrentDoctype(i);break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(h.missingQuoteBeforeDoctypePublicIdentifier),i.forceQuirks=!0,this.state=e.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateBeforeDoctypePublicIdentifier(s){let i=this.currentToken;switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:break;case v.QUOTATION_MARK:{i.publicId="",this.state=e.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;break}case v.APOSTROPHE:{i.publicId="",this.state=e.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;break}case v.GREATER_THAN_SIGN:{this._err(h.missingDoctypePublicIdentifier),i.forceQuirks=!0,this.state=e.DATA,this.emitCurrentDoctype(i);break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(h.missingQuoteBeforeDoctypePublicIdentifier),i.forceQuirks=!0,this.state=e.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateDoctypePublicIdentifierDoubleQuoted(s){let i=this.currentToken;switch(s){case v.QUOTATION_MARK:{this.state=e.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;break}case v.NULL:{this._err(h.unexpectedNullCharacter),i.publicId+=K;break}case v.GREATER_THAN_SIGN:{this._err(h.abruptDoctypePublicIdentifier),i.forceQuirks=!0,this.emitCurrentDoctype(i),this.state=e.DATA;break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:i.publicId+=String.fromCodePoint(s)}}_stateDoctypePublicIdentifierSingleQuoted(s){let i=this.currentToken;switch(s){case v.APOSTROPHE:{this.state=e.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;break}case v.NULL:{this._err(h.unexpectedNullCharacter),i.publicId+=K;break}case v.GREATER_THAN_SIGN:{this._err(h.abruptDoctypePublicIdentifier),i.forceQuirks=!0,this.emitCurrentDoctype(i),this.state=e.DATA;break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:i.publicId+=String.fromCodePoint(s)}}_stateAfterDoctypePublicIdentifier(s){let i=this.currentToken;switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:{this.state=e.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS;break}case v.GREATER_THAN_SIGN:{this.state=e.DATA,this.emitCurrentDoctype(i);break}case v.QUOTATION_MARK:{this._err(h.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers),i.systemId="",this.state=e.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case v.APOSTROPHE:{this._err(h.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers),i.systemId="",this.state=e.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(h.missingQuoteBeforeDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=e.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateBetweenDoctypePublicAndSystemIdentifiers(s){let i=this.currentToken;switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:break;case v.GREATER_THAN_SIGN:{this.emitCurrentDoctype(i),this.state=e.DATA;break}case v.QUOTATION_MARK:{i.systemId="",this.state=e.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case v.APOSTROPHE:{i.systemId="",this.state=e.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(h.missingQuoteBeforeDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=e.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateAfterDoctypeSystemKeyword(s){let i=this.currentToken;switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:{this.state=e.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER;break}case v.QUOTATION_MARK:{this._err(h.missingWhitespaceAfterDoctypeSystemKeyword),i.systemId="",this.state=e.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case v.APOSTROPHE:{this._err(h.missingWhitespaceAfterDoctypeSystemKeyword),i.systemId="",this.state=e.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case v.GREATER_THAN_SIGN:{this._err(h.missingDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=e.DATA,this.emitCurrentDoctype(i);break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(h.missingQuoteBeforeDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=e.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateBeforeDoctypeSystemIdentifier(s){let i=this.currentToken;switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:break;case v.QUOTATION_MARK:{i.systemId="",this.state=e.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case v.APOSTROPHE:{i.systemId="",this.state=e.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case v.GREATER_THAN_SIGN:{this._err(h.missingDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=e.DATA,this.emitCurrentDoctype(i);break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(h.missingQuoteBeforeDoctypeSystemIdentifier),i.forceQuirks=!0,this.state=e.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateDoctypeSystemIdentifierDoubleQuoted(s){let i=this.currentToken;switch(s){case v.QUOTATION_MARK:{this.state=e.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;break}case v.NULL:{this._err(h.unexpectedNullCharacter),i.systemId+=K;break}case v.GREATER_THAN_SIGN:{this._err(h.abruptDoctypeSystemIdentifier),i.forceQuirks=!0,this.emitCurrentDoctype(i),this.state=e.DATA;break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:i.systemId+=String.fromCodePoint(s)}}_stateDoctypeSystemIdentifierSingleQuoted(s){let i=this.currentToken;switch(s){case v.APOSTROPHE:{this.state=e.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;break}case v.NULL:{this._err(h.unexpectedNullCharacter),i.systemId+=K;break}case v.GREATER_THAN_SIGN:{this._err(h.abruptDoctypeSystemIdentifier),i.forceQuirks=!0,this.emitCurrentDoctype(i),this.state=e.DATA;break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:i.systemId+=String.fromCodePoint(s)}}_stateAfterDoctypeSystemIdentifier(s){let i=this.currentToken;switch(s){case v.SPACE:case v.LINE_FEED:case v.TABULATION:case v.FORM_FEED:break;case v.GREATER_THAN_SIGN:{this.emitCurrentDoctype(i),this.state=e.DATA;break}case v.EOF:{this._err(h.eofInDoctype),i.forceQuirks=!0,this.emitCurrentDoctype(i),this._emitEOFToken();break}default:this._err(h.unexpectedCharacterAfterDoctypeSystemIdentifier),this.state=e.BOGUS_DOCTYPE,this._stateBogusDoctype(s)}}_stateBogusDoctype(s){let i=this.currentToken;switch(s){case v.GREATER_THAN_SIGN:{this.emitCurrentDoctype(i),this.state=e.DATA;break}case v.NULL:{this._err(h.unexpectedNullCharacter);break}case v.EOF:{this.emitCurrentDoctype(i),this._emitEOFToken();break}default:}}_stateCdataSection(s){switch(s){case v.RIGHT_SQUARE_BRACKET:{this.state=e.CDATA_SECTION_BRACKET;break}case v.EOF:{this._err(h.eofInCdata),this._emitEOFToken();break}default:this._emitCodePoint(s)}}_stateCdataSectionBracket(s){if(s===v.RIGHT_SQUARE_BRACKET)this.state=e.CDATA_SECTION_END;else this._emitChars("]"),this.state=e.CDATA_SECTION,this._stateCdataSection(s)}_stateCdataSectionEnd(s){switch(s){case v.GREATER_THAN_SIGN:{this.state=e.DATA;break}case v.RIGHT_SQUARE_BRACKET:{this._emitChars("]");break}default:this._emitChars("]]"),this.state=e.CDATA_SECTION,this._stateCdataSection(s)}}_stateCharacterReference(){let s=this.entityDecoder.write(this.preprocessor.html,this.preprocessor.pos);if(s<0)if(this.preprocessor.lastChunkWritten)s=this.entityDecoder.end();else{this.active=!1,this.preprocessor.pos=this.preprocessor.html.length-1,this.consumedAfterSnapshot=0,this.preprocessor.endOfChunkHit=!0;return}if(s===0)this.preprocessor.pos=this.entityStartPos,this._flushCodePointConsumedAsCharacterReference(v.AMPERSAND),this.state=!this._isCharacterReferenceInAttribute()&&mr(this.preprocessor.peek(1))?e.AMBIGUOUS_AMPERSAND:this.returnState;else this.state=this.returnState}_stateAmbiguousAmpersand(s){if(mr(s))this._flushCodePointConsumedAsCharacterReference(s);else{if(s===v.SEMICOLON)this._err(h.unknownNamedCharacterReference);this.state=this.returnState,this._callState(s)}}}var lr=new Set([r.DD,r.DT,r.LI,r.OPTGROUP,r.OPTION,r.P,r.RB,r.RP,r.RT,r.RTC]),er=new Set([...lr,r.CAPTION,r.COLGROUP,r.TBODY,r.TD,r.TFOOT,r.TH,r.THEAD,r.TR]),gi=new Set([r.APPLET,r.CAPTION,r.HTML,r.MARQUEE,r.OBJECT,r.TABLE,r.TD,r.TEMPLATE,r.TH]),Jm=new Set([...gi,r.OL,r.UL]),Ym=new Set([...gi,r.BUTTON]),fr=new Set([r.ANNOTATION_XML,r.MI,r.MN,r.MO,r.MS,r.MTEXT]),cr=new Set([r.DESC,r.FOREIGN_OBJECT,r.TITLE]),Fm=new Set([r.TR,r.TEMPLATE,r.HTML]),jm=new Set([r.TBODY,r.TFOOT,r.THEAD,r.TEMPLATE,r.HTML]),Km=new Set([r.TABLE,r.TEMPLATE,r.HTML]),Um=new Set([r.TD,r.TH]);class Di{get currentTmplContentOrNode(){return this._isInTemplate()?this.treeAdapter.getTemplateContent(this.current):this.current}constructor(s,i,a){this.treeAdapter=i,this.handler=a,this.items=[],this.tagIDs=[],this.stackTop=-1,this.tmplCount=0,this.currentTagId=r.UNKNOWN,this.current=s}_indexOf(s){return this.items.lastIndexOf(s,this.stackTop)}_isInTemplate(){return this.currentTagId===r.TEMPLATE&&this.treeAdapter.getNamespaceURI(this.current)===H.HTML}_updateCurrentElement(){this.current=this.items[this.stackTop],this.currentTagId=this.tagIDs[this.stackTop]}push(s,i){if(this.stackTop++,this.items[this.stackTop]=s,this.current=s,this.tagIDs[this.stackTop]=i,this.currentTagId=i,this._isInTemplate())this.tmplCount++;this.handler.onItemPush(s,i,!0)}pop(){let s=this.current;if(this.tmplCount>0&&this._isInTemplate())this.tmplCount--;this.stackTop--,this._updateCurrentElement(),this.handler.onItemPop(s,!0)}replace(s,i){let a=this._indexOf(s);if(this.items[a]=i,a===this.stackTop)this.current=i}insertAfter(s,i,a){let d=this._indexOf(s)+1;if(this.items.splice(d,0,i),this.tagIDs.splice(d,0,a),this.stackTop++,d===this.stackTop)this._updateCurrentElement();if(this.current&&this.currentTagId!==void 0)this.handler.onItemPush(this.current,this.currentTagId,d===this.stackTop)}popUntilTagNamePopped(s){let i=this.stackTop+1;do i=this.tagIDs.lastIndexOf(s,i-1);while(i>0&&this.treeAdapter.getNamespaceURI(this.items[i])!==H.HTML);this.shortenToLength(Math.max(i,0))}shortenToLength(s){while(this.stackTop>=s){let i=this.current;if(this.tmplCount>0&&this._isInTemplate())this.tmplCount-=1;this.stackTop--,this._updateCurrentElement(),this.handler.onItemPop(i,this.stackTop<s)}}popUntilElementPopped(s){let i=this._indexOf(s);this.shortenToLength(Math.max(i,0))}popUntilPopped(s,i){let a=this._indexOfTagNames(s,i);this.shortenToLength(Math.max(a,0))}popUntilNumberedHeaderPopped(){this.popUntilPopped(Cs,H.HTML)}popUntilTableCellPopped(){this.popUntilPopped(Um,H.HTML)}popAllUpToHtmlElement(){this.tmplCount=0,this.shortenToLength(1)}_indexOfTagNames(s,i){for(let a=this.stackTop;a>=0;a--)if(s.has(this.tagIDs[a])&&this.treeAdapter.getNamespaceURI(this.items[a])===i)return a;return-1}clearBackTo(s,i){let a=this._indexOfTagNames(s,i);this.shortenToLength(a+1)}clearBackToTableContext(){this.clearBackTo(Km,H.HTML)}clearBackToTableBodyContext(){this.clearBackTo(jm,H.HTML)}clearBackToTableRowContext(){this.clearBackTo(Fm,H.HTML)}remove(s){let i=this._indexOf(s);if(i>=0)if(i===this.stackTop)this.pop();else this.items.splice(i,1),this.tagIDs.splice(i,1),this.stackTop--,this._updateCurrentElement(),this.handler.onItemPop(s,!1)}tryPeekProperlyNestedBodyElement(){return this.stackTop>=1&&this.tagIDs[1]===r.BODY?this.items[1]:null}contains(s){return this._indexOf(s)>-1}getCommonAncestor(s){let i=this._indexOf(s)-1;return i>=0?this.items[i]:null}isRootHtmlElementCurrent(){return this.stackTop===0&&this.tagIDs[0]===r.HTML}hasInDynamicScope(s,i){for(let a=this.stackTop;a>=0;a--){let d=this.tagIDs[a];switch(this.treeAdapter.getNamespaceURI(this.items[a])){case H.HTML:{if(d===s)return!0;if(i.has(d))return!1;break}case H.SVG:{if(cr.has(d))return!1;break}case H.MATHML:{if(fr.has(d))return!1;break}}}return!0}hasInScope(s){return this.hasInDynamicScope(s,gi)}hasInListItemScope(s){return this.hasInDynamicScope(s,Jm)}hasInButtonScope(s){return this.hasInDynamicScope(s,Ym)}hasNumberedHeaderInScope(){for(let s=this.stackTop;s>=0;s--){let i=this.tagIDs[s];switch(this.treeAdapter.getNamespaceURI(this.items[s])){case H.HTML:{if(Cs.has(i))return!0;if(gi.has(i))return!1;break}case H.SVG:{if(cr.has(i))return!1;break}case H.MATHML:{if(fr.has(i))return!1;break}}}return!0}hasInTableScope(s){for(let i=this.stackTop;i>=0;i--){if(this.treeAdapter.getNamespaceURI(this.items[i])!==H.HTML)continue;switch(this.tagIDs[i]){case s:return!0;case r.TABLE:case r.HTML:return!1}}return!0}hasTableBodyContextInTableScope(){for(let s=this.stackTop;s>=0;s--){if(this.treeAdapter.getNamespaceURI(this.items[s])!==H.HTML)continue;switch(this.tagIDs[s]){case r.TBODY:case r.THEAD:case r.TFOOT:return!0;case r.TABLE:case r.HTML:return!1}}return!0}hasInSelectScope(s){for(let i=this.stackTop;i>=0;i--){if(this.treeAdapter.getNamespaceURI(this.items[i])!==H.HTML)continue;switch(this.tagIDs[i]){case s:return!0;case r.OPTION:case r.OPTGROUP:break;default:return!1}}return!0}generateImpliedEndTags(){while(this.currentTagId!==void 0&&lr.has(this.currentTagId))this.pop()}generateImpliedEndTagsThoroughly(){while(this.currentTagId!==void 0&&er.has(this.currentTagId))this.pop()}generateImpliedEndTagsWithExclusion(s){while(this.currentTagId!==void 0&&this.currentTagId!==s&&er.has(this.currentTagId))this.pop()}}var ss;(function(s){s[s.Marker=0]="Marker",s[s.Element=1]="Element"})(ss||(ss={}));var gr={type:ss.Marker};class Gi{constructor(s){this.treeAdapter=s,this.entries=[],this.bookmark=null}_getNoahArkConditionCandidates(s,i){let a=[],d=i.length,m=this.treeAdapter.getTagName(s),u=this.treeAdapter.getNamespaceURI(s);for(let c=0;c<this.entries.length;c++){let f=this.entries[c];if(f.type===ss.Marker)break;let{element:g}=f;if(this.treeAdapter.getTagName(g)===m&&this.treeAdapter.getNamespaceURI(g)===u){let t=this.treeAdapter.getAttrList(g);if(t.length===d)a.push({idx:c,attrs:t})}}return a}_ensureNoahArkCondition(s){if(this.entries.length<3)return;let i=this.treeAdapter.getAttrList(s),a=this._getNoahArkConditionCandidates(s,i);if(a.length<3)return;let d=new Map(i.map((u)=>[u.name,u.value])),m=0;for(let u=0;u<a.length;u++){let c=a[u];if(c.attrs.every((f)=>d.get(f.name)===f.value)){if(m+=1,m>=3)this.entries.splice(c.idx,1)}}}insertMarker(){this.entries.unshift(gr)}pushElement(s,i){this._ensureNoahArkCondition(s),this.entries.unshift({type:ss.Element,element:s,token:i})}insertElementAfterBookmark(s,i){let a=this.entries.indexOf(this.bookmark);this.entries.splice(a,0,{type:ss.Element,element:s,token:i})}removeEntry(s){let i=this.entries.indexOf(s);if(i!==-1)this.entries.splice(i,1)}clearToLastMarker(){let s=this.entries.indexOf(gr);if(s===-1)this.entries.length=0;else this.entries.splice(0,s+1)}getElementEntryInScopeWithTagName(s){let i=this.entries.find((a)=>a.type===ss.Marker||this.treeAdapter.getTagName(a.element)===s);return i&&i.type===ss.Element?i:null}getElementEntry(s){return this.entries.find((i)=>i.type===ss.Element&&i.element===s)}}var is={createDocument(){return{nodeName:"#document",mode:E.NO_QUIRKS,childNodes:[]}},createDocumentFragment(){return{nodeName:"#document-fragment",childNodes:[]}},createElement(s,i,a){return{nodeName:s,tagName:s,attrs:a,namespaceURI:i,childNodes:[],parentNode:null}},createCommentNode(s){return{nodeName:"#comment",data:s,parentNode:null}},createTextNode(s){return{nodeName:"#text",value:s,parentNode:null}},appendChild(s,i){s.childNodes.push(i),i.parentNode=s},insertBefore(s,i,a){let d=s.childNodes.indexOf(a);s.childNodes.splice(d,0,i),i.parentNode=s},setTemplateContent(s,i){s.content=i},getTemplateContent(s){return s.content},setDocumentType(s,i,a,d){let m=s.childNodes.find((u)=>u.nodeName==="#documentType");if(m)m.name=i,m.publicId=a,m.systemId=d;else{let u={nodeName:"#documentType",name:i,publicId:a,systemId:d,parentNode:null};is.appendChild(s,u)}},setDocumentMode(s,i){s.mode=i},getDocumentMode(s){return s.mode},detachNode(s){if(s.parentNode){let i=s.parentNode.childNodes.indexOf(s);s.parentNode.childNodes.splice(i,1),s.parentNode=null}},insertText(s,i){if(s.childNodes.length>0){let a=s.childNodes[s.childNodes.length-1];if(is.isTextNode(a)){a.value+=i;return}}is.appendChild(s,is.createTextNode(i))},insertTextBefore(s,i,a){let d=s.childNodes[s.childNodes.indexOf(a)-1];if(d&&is.isTextNode(d))d.value+=i;else is.insertBefore(s,is.createTextNode(i),a)},adoptAttributes(s,i){let a=new Set(s.attrs.map((d)=>d.name));for(let d=0;d<i.length;d++)if(!a.has(i[d].name))s.attrs.push(i[d])},getFirstChild(s){return s.childNodes[0]},getChildNodes(s){return s.childNodes},getParentNode(s){return s.parentNode},getAttrList(s){return s.attrs},getTagName(s){return s.tagName},getNamespaceURI(s){return s.namespaceURI},getTextNodeContent(s){return s.value},getCommentNodeContent(s){return s.data},getDocumentTypeNodeName(s){return s.name},getDocumentTypeNodePublicId(s){return s.publicId},getDocumentTypeNodeSystemId(s){return s.systemId},isTextNode(s){return s.nodeName==="#text"},isCommentNode(s){return s.nodeName==="#comment"},isDocumentTypeNode(s){return s.nodeName==="#documentType"},isElementNode(s){return Object.prototype.hasOwnProperty.call(s,"tagName")},setNodeSourceCodeLocation(s,i){s.sourceCodeLocation=i},getNodeSourceCodeLocation(s){return s.sourceCodeLocation},updateNodeSourceCodeLocation(s,i){s.sourceCodeLocation={...s.sourceCodeLocation,...i}}};var br="html",om="about:legacy-compat",Rm="http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd",wr=["+//silmaril//dtd html pro v0r11 19970101//","-//as//dtd html 3.0 aswedit + extensions//","-//advasoft ltd//dtd html 3.0 aswedit + extensions//","-//ietf//dtd html 2.0 level 1//","-//ietf//dtd html 2.0 level 2//","-//ietf//dtd html 2.0 strict level 1//","-//ietf//dtd html 2.0 strict level 2//","-//ietf//dtd html 2.0 strict//","-//ietf//dtd html 2.0//","-//ietf//dtd html 2.1e//","-//ietf//dtd html 3.0//","-//ietf//dtd html 3.2 final//","-//ietf//dtd html 3.2//","-//ietf//dtd html 3//","-//ietf//dtd html level 0//","-//ietf//dtd html level 1//","-//ietf//dtd html level 2//","-//ietf//dtd html level 3//","-//ietf//dtd html strict level 0//","-//ietf//dtd html strict level 1//","-//ietf//dtd html strict level 2//","-//ietf//dtd html strict level 3//","-//ietf//dtd html strict//","-//ietf//dtd html//","-//metrius//dtd metrius presentational//","-//microsoft//dtd internet explorer 2.0 html strict//","-//microsoft//dtd internet explorer 2.0 html//","-//microsoft//dtd internet explorer 2.0 tables//","-//microsoft//dtd internet explorer 3.0 html strict//","-//microsoft//dtd internet explorer 3.0 html//","-//microsoft//dtd internet explorer 3.0 tables//","-//netscape comm. corp.//dtd html//","-//netscape comm. corp.//dtd strict html//","-//o'reilly and associates//dtd html 2.0//","-//o'reilly and associates//dtd html extended 1.0//","-//o'reilly and associates//dtd html extended relaxed 1.0//","-//sq//dtd html 2.0 hotmetal + extensions//","-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//","-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//","-//spyglass//dtd html 2.0 extended//","-//sun microsystems corp.//dtd hotjava html//","-//sun microsystems corp.//dtd hotjava strict html//","-//w3c//dtd html 3 1995-03-24//","-//w3c//dtd html 3.2 draft//","-//w3c//dtd html 3.2 final//","-//w3c//dtd html 3.2//","-//w3c//dtd html 3.2s draft//","-//w3c//dtd html 4.0 frameset//","-//w3c//dtd html 4.0 transitional//","-//w3c//dtd html experimental 19960712//","-//w3c//dtd html experimental 970421//","-//w3c//dtd w3 html//","-//w3o//dtd w3 html 3.0//","-//webtechs//dtd mozilla html 2.0//","-//webtechs//dtd mozilla html//"],Lm=[...wr,"-//w3c//dtd html 4.01 frameset//","-//w3c//dtd html 4.01 transitional//"],Bm=new Set(["-//w3o//dtd w3 html strict 3.0//en//","-/w3c/dtd html 4.0 transitional/en","html"]),xr=["-//w3c//dtd xhtml 1.0 frameset//","-//w3c//dtd xhtml 1.0 transitional//"],Pm=[...xr,"-//w3c//dtd html 4.01 frameset//","-//w3c//dtd html 4.01 transitional//"];function tr(s,i){return i.some((a)=>s.startsWith(a))}function yr(s){return s.name===br&&s.publicId===null&&(s.systemId===null||s.systemId===om)}function hr(s){if(s.name!==br)return E.QUIRKS;let{systemId:i}=s;if(i&&i.toLowerCase()===Rm)return E.QUIRKS;let{publicId:a}=s;if(a!==null){if(a=a.toLowerCase(),Bm.has(a))return E.QUIRKS;let d=i===null?Lm:wr;if(tr(a,d))return E.QUIRKS;if(d=i===null?xr:Pm,tr(a,d))return E.LIMITED_QUIRKS}return E.NO_QUIRKS}var Hr={TEXT_HTML:"text/html",APPLICATION_XML:"application/xhtml+xml"},Om="definitionurl",nm="definitionURL",Mm=new Map(["attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map((s)=>[s.toLowerCase(),s])),Nm=new Map([["xlink:actuate",{prefix:"xlink",name:"actuate",namespace:H.XLINK}],["xlink:arcrole",{prefix:"xlink",name:"arcrole",namespace:H.XLINK}],["xlink:href",{prefix:"xlink",name:"href",namespace:H.XLINK}],["xlink:role",{prefix:"xlink",name:"role",namespace:H.XLINK}],["xlink:show",{prefix:"xlink",name:"show",namespace:H.XLINK}],["xlink:title",{prefix:"xlink",name:"title",namespace:H.XLINK}],["xlink:type",{prefix:"xlink",name:"type",namespace:H.XLINK}],["xml:lang",{prefix:"xml",name:"lang",namespace:H.XML}],["xml:space",{prefix:"xml",name:"space",namespace:H.XML}],["xmlns",{prefix:"",name:"xmlns",namespace:H.XMLNS}],["xmlns:xlink",{prefix:"xmlns",name:"xlink",namespace:H.XMLNS}]]),Sm=new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map((s)=>[s.toLowerCase(),s])),$m=new Set([r.B,r.BIG,r.BLOCKQUOTE,r.BODY,r.BR,r.CENTER,r.CODE,r.DD,r.DIV,r.DL,r.DT,r.EM,r.EMBED,r.H1,r.H2,r.H3,r.H4,r.H5,r.H6,r.HEAD,r.HR,r.I,r.IMG,r.LI,r.LISTING,r.MENU,r.META,r.NOBR,r.OL,r.P,r.PRE,r.RUBY,r.S,r.SMALL,r.SPAN,r.STRONG,r.STRIKE,r.SUB,r.SUP,r.TABLE,r.TT,r.U,r.UL,r.VAR]);function qr(s){let i=s.tagID;return i===r.FONT&&s.attrs.some(({name:d})=>d===es.COLOR||d===es.SIZE||d===es.FACE)||$m.has(i)}function _i(s){for(let i=0;i<s.attrs.length;i++)if(s.attrs[i].name===Om){s.attrs[i].name=nm;break}}function pi(s){for(let i=0;i<s.attrs.length;i++){let a=Mm.get(s.attrs[i].name);if(a!=null)s.attrs[i].name=a}}function ti(s){for(let i=0;i<s.attrs.length;i++){let a=Nm.get(s.attrs[i].name);if(a)s.attrs[i].prefix=a.prefix,s.attrs[i].name=a.name,s.attrs[i].namespace=a.namespace}}function Xr(s){let i=Sm.get(s.tagName);if(i!=null)s.tagName=i,s.tagID=Hs(s.tagName)}function Em(s,i){return i===H.MATHML&&(s===r.MI||s===r.MO||s===r.MN||s===r.MS||s===r.MTEXT)}function Im(s,i,a){if(i===H.MATHML&&s===r.ANNOTATION_XML){for(let d=0;d<a.length;d++)if(a[d].name===es.ENCODING){let m=a[d].value.toLowerCase();return m===Hr.TEXT_HTML||m===Hr.APPLICATION_XML}}return i===H.SVG&&(s===r.FOREIGN_OBJECT||s===r.DESC||s===r.TITLE)}function Qr(s,i,a,d){return(!d||d===H.HTML)&&Im(s,i,a)||(!d||d===H.MATHML)&&Em(s,i)}var km="hidden",Dm=8,Gm=3,l;(function(s){s[s.INITIAL=0]="INITIAL",s[s.BEFORE_HTML=1]="BEFORE_HTML",s[s.BEFORE_HEAD=2]="BEFORE_HEAD",s[s.IN_HEAD=3]="IN_HEAD",s[s.IN_HEAD_NO_SCRIPT=4]="IN_HEAD_NO_SCRIPT",s[s.AFTER_HEAD=5]="AFTER_HEAD",s[s.IN_BODY=6]="IN_BODY",s[s.TEXT=7]="TEXT",s[s.IN_TABLE=8]="IN_TABLE",s[s.IN_TABLE_TEXT=9]="IN_TABLE_TEXT",s[s.IN_CAPTION=10]="IN_CAPTION",s[s.IN_COLUMN_GROUP=11]="IN_COLUMN_GROUP",s[s.IN_TABLE_BODY=12]="IN_TABLE_BODY",s[s.IN_ROW=13]="IN_ROW",s[s.IN_CELL=14]="IN_CELL",s[s.IN_SELECT=15]="IN_SELECT",s[s.IN_SELECT_IN_TABLE=16]="IN_SELECT_IN_TABLE",s[s.IN_TEMPLATE=17]="IN_TEMPLATE",s[s.AFTER_BODY=18]="AFTER_BODY",s[s.IN_FRAMESET=19]="IN_FRAMESET",s[s.AFTER_FRAMESET=20]="AFTER_FRAMESET",s[s.AFTER_AFTER_BODY=21]="AFTER_AFTER_BODY",s[s.AFTER_AFTER_FRAMESET=22]="AFTER_AFTER_FRAMESET"})(l||(l={}));var _m={startLine:-1,startCol:-1,startOffset:-1,endLine:-1,endCol:-1,endOffset:-1},Jr=new Set([r.TABLE,r.TBODY,r.TFOOT,r.THEAD,r.TR]),zr={scriptingEnabled:!0,sourceCodeLocationInfo:!1,treeAdapter:is,onParseError:null};class Ds{constructor(s,i,a=null,d=null){if(this.fragmentContext=a,this.scriptHandler=d,this.currentToken=null,this.stopped=!1,this.insertionMode=l.INITIAL,this.originalInsertionMode=l.INITIAL,this.headElement=null,this.formElement=null,this.currentNotInHTML=!1,this.tmplInsertionModeStack=[],this.pendingCharacterTokens=[],this.hasNonWhitespacePendingCharacterToken=!1,this.framesetOk=!0,this.skipNextNewLine=!1,this.fosterParentingEnabled=!1,this.options={...zr,...s},this.treeAdapter=this.options.treeAdapter,this.onParseError=this.options.onParseError,this.onParseError)this.options.sourceCodeLocationInfo=!0;this.document=i!==null&&i!==void 0?i:this.treeAdapter.createDocument(),this.tokenizer=new li(this.options,this),this.activeFormattingElements=new Gi(this.treeAdapter),this.fragmentContextID=a?Hs(this.treeAdapter.getTagName(a)):r.UNKNOWN,this._setContextModes(a!==null&&a!==void 0?a:this.document,this.fragmentContextID),this.openElements=new Di(this.document,this.treeAdapter,this)}static parse(s,i){let a=new this(i);return a.tokenizer.write(s,!0),a.document}static getFragmentParser(s,i){let a={...zr,...i};s!==null&&s!==void 0||(s=a.treeAdapter.createElement(w.TEMPLATE,H.HTML,[]));let d=a.treeAdapter.createElement("documentmock",H.HTML,[]),m=new this(a,d,s);if(m.fragmentContextID===r.TEMPLATE)m.tmplInsertionModeStack.unshift(l.IN_TEMPLATE);return m._initTokenizerForFragmentParsing(),m._insertFakeRootElement(),m._resetInsertionMode(),m._findFormInFragmentContext(),m}getFragment(){let s=this.treeAdapter.getFirstChild(this.document),i=this.treeAdapter.createDocumentFragment();return this._adoptNodes(s,i),i}_err(s,i,a){var d;if(!this.onParseError)return;let m=(d=s.location)!==null&&d!==void 0?d:_m,u={code:i,startLine:m.startLine,startCol:m.startCol,startOffset:m.startOffset,endLine:a?m.startLine:m.endLine,endCol:a?m.startCol:m.endCol,endOffset:a?m.startOffset:m.endOffset};this.onParseError(u)}onItemPush(s,i,a){var d,m;if((m=(d=this.treeAdapter).onItemPush)===null||m===void 0||m.call(d,s),a&&this.openElements.stackTop>0)this._setContextModes(s,i)}onItemPop(s,i){var a,d;if(this.options.sourceCodeLocationInfo)this._setEndLocation(s,this.currentToken);if((d=(a=this.treeAdapter).onItemPop)===null||d===void 0||d.call(a,s,this.openElements.current),i){let m,u;if(this.openElements.stackTop===0&&this.fragmentContext)m=this.fragmentContext,u=this.fragmentContextID;else({current:m,currentTagId:u}=this.openElements);this._setContextModes(m,u)}}_setContextModes(s,i){let a=s===this.document||s&&this.treeAdapter.getNamespaceURI(s)===H.HTML;this.currentNotInHTML=!a,this.tokenizer.inForeignNode=!a&&s!==void 0&&i!==void 0&&!this._isIntegrationPoint(i,s)}_switchToTextParsing(s,i){this._insertElement(s,H.HTML),this.tokenizer.state=i,this.originalInsertionMode=this.insertionMode,this.insertionMode=l.TEXT}switchToPlaintextParsing(){this.insertionMode=l.TEXT,this.originalInsertionMode=l.IN_BODY,this.tokenizer.state=N.PLAINTEXT}_getAdjustedCurrentElement(){return this.openElements.stackTop===0&&this.fragmentContext?this.fragmentContext:this.openElements.current}_findFormInFragmentContext(){let s=this.fragmentContext;while(s){if(this.treeAdapter.getTagName(s)===w.FORM){this.formElement=s;break}s=this.treeAdapter.getParentNode(s)}}_initTokenizerForFragmentParsing(){if(!this.fragmentContext||this.treeAdapter.getNamespaceURI(this.fragmentContext)!==H.HTML)return;switch(this.fragmentContextID){case r.TITLE:case r.TEXTAREA:{this.tokenizer.state=N.RCDATA;break}case r.STYLE:case r.XMP:case r.IFRAME:case r.NOEMBED:case r.NOFRAMES:case r.NOSCRIPT:{this.tokenizer.state=N.RAWTEXT;break}case r.SCRIPT:{this.tokenizer.state=N.SCRIPT_DATA;break}case r.PLAINTEXT:{this.tokenizer.state=N.PLAINTEXT;break}default:}}_setDocumentType(s){let i=s.name||"",a=s.publicId||"",d=s.systemId||"";if(this.treeAdapter.setDocumentType(this.document,i,a,d),s.location){let u=this.treeAdapter.getChildNodes(this.document).find((c)=>this.treeAdapter.isDocumentTypeNode(c));if(u)this.treeAdapter.setNodeSourceCodeLocation(u,s.location)}}_attachElementToTree(s,i){if(this.options.sourceCodeLocationInfo){let a=i&&{...i,startTag:i};this.treeAdapter.setNodeSourceCodeLocation(s,a)}if(this._shouldFosterParentOnInsertion())this._fosterParentElement(s);else{let a=this.openElements.currentTmplContentOrNode;this.treeAdapter.appendChild(a!==null&&a!==void 0?a:this.document,s)}}_appendElement(s,i){let a=this.treeAdapter.createElement(s.tagName,i,s.attrs);this._attachElementToTree(a,s.location)}_insertElement(s,i){let a=this.treeAdapter.createElement(s.tagName,i,s.attrs);this._attachElementToTree(a,s.location),this.openElements.push(a,s.tagID)}_insertFakeElement(s,i){let a=this.treeAdapter.createElement(s,H.HTML,[]);this._attachElementToTree(a,null),this.openElements.push(a,i)}_insertTemplate(s){let i=this.treeAdapter.createElement(s.tagName,H.HTML,s.attrs),a=this.treeAdapter.createDocumentFragment();if(this.treeAdapter.setTemplateContent(i,a),this._attachElementToTree(i,s.location),this.openElements.push(i,s.tagID),this.options.sourceCodeLocationInfo)this.treeAdapter.setNodeSourceCodeLocation(a,null)}_insertFakeRootElement(){let s=this.treeAdapter.createElement(w.HTML,H.HTML,[]);if(this.options.sourceCodeLocationInfo)this.treeAdapter.setNodeSourceCodeLocation(s,null);this.treeAdapter.appendChild(this.openElements.current,s),this.openElements.push(s,r.HTML)}_appendCommentNode(s,i){let a=this.treeAdapter.createCommentNode(s.data);if(this.treeAdapter.appendChild(i,a),this.options.sourceCodeLocationInfo)this.treeAdapter.setNodeSourceCodeLocation(a,s.location)}_insertCharacters(s){let i,a;if(this._shouldFosterParentOnInsertion())if({parent:i,beforeElement:a}=this._findFosterParentingLocation(),a)this.treeAdapter.insertTextBefore(i,s.chars,a);else this.treeAdapter.insertText(i,s.chars);else i=this.openElements.currentTmplContentOrNode,this.treeAdapter.insertText(i,s.chars);if(!s.location)return;let d=this.treeAdapter.getChildNodes(i),m=a?d.lastIndexOf(a):d.length,u=d[m-1];if(this.treeAdapter.getNodeSourceCodeLocation(u)){let{endLine:f,endCol:g,endOffset:t}=s.location;this.treeAdapter.updateNodeSourceCodeLocation(u,{endLine:f,endCol:g,endOffset:t})}else if(this.options.sourceCodeLocationInfo)this.treeAdapter.setNodeSourceCodeLocation(u,s.location)}_adoptNodes(s,i){for(let a=this.treeAdapter.getFirstChild(s);a;a=this.treeAdapter.getFirstChild(s))this.treeAdapter.detachNode(a),this.treeAdapter.appendChild(i,a)}_setEndLocation(s,i){if(this.treeAdapter.getNodeSourceCodeLocation(s)&&i.location){let a=i.location,d=this.treeAdapter.getTagName(s),m=i.type===W.END_TAG&&d===i.tagName?{endTag:{...a},endLine:a.endLine,endCol:a.endCol,endOffset:a.endOffset}:{endLine:a.startLine,endCol:a.startCol,endOffset:a.startOffset};this.treeAdapter.updateNodeSourceCodeLocation(s,m)}}shouldProcessStartTagTokenInForeignContent(s){if(!this.currentNotInHTML)return!1;let i,a;if(this.openElements.stackTop===0&&this.fragmentContext)i=this.fragmentContext,a=this.fragmentContextID;else({current:i,currentTagId:a}=this.openElements);if(s.tagID===r.SVG&&this.treeAdapter.getTagName(i)===w.ANNOTATION_XML&&this.treeAdapter.getNamespaceURI(i)===H.MATHML)return!1;return this.tokenizer.inForeignNode||(s.tagID===r.MGLYPH||s.tagID===r.MALIGNMARK)&&a!==void 0&&!this._isIntegrationPoint(a,i,H.HTML)}_processToken(s){switch(s.type){case W.CHARACTER:{this.onCharacter(s);break}case W.NULL_CHARACTER:{this.onNullCharacter(s);break}case W.COMMENT:{this.onComment(s);break}case W.DOCTYPE:{this.onDoctype(s);break}case W.START_TAG:{this._processStartTag(s);break}case W.END_TAG:{this.onEndTag(s);break}case W.EOF:{this.onEof(s);break}case W.WHITESPACE_CHARACTER:{this.onWhitespaceCharacter(s);break}}}_isIntegrationPoint(s,i,a){let d=this.treeAdapter.getNamespaceURI(i),m=this.treeAdapter.getAttrList(i);return Qr(s,d,m,a)}_reconstructActiveFormattingElements(){let s=this.activeFormattingElements.entries.length;if(s){let i=this.activeFormattingElements.entries.findIndex((d)=>d.type===ss.Marker||this.openElements.contains(d.element)),a=i===-1?s-1:i-1;for(let d=a;d>=0;d--){let m=this.activeFormattingElements.entries[d];this._insertElement(m.token,this.treeAdapter.getNamespaceURI(m.element)),m.element=this.openElements.current}}}_closeTableCell(){this.openElements.generateImpliedEndTags(),this.openElements.popUntilTableCellPopped(),this.activeFormattingElements.clearToLastMarker(),this.insertionMode=l.IN_ROW}_closePElement(){this.openElements.generateImpliedEndTagsWithExclusion(r.P),this.openElements.popUntilTagNamePopped(r.P)}_resetInsertionMode(){for(let s=this.openElements.stackTop;s>=0;s--)switch(s===0&&this.fragmentContext?this.fragmentContextID:this.openElements.tagIDs[s]){case r.TR:{this.insertionMode=l.IN_ROW;return}case r.TBODY:case r.THEAD:case r.TFOOT:{this.insertionMode=l.IN_TABLE_BODY;return}case r.CAPTION:{this.insertionMode=l.IN_CAPTION;return}case r.COLGROUP:{this.insertionMode=l.IN_COLUMN_GROUP;return}case r.TABLE:{this.insertionMode=l.IN_TABLE;return}case r.BODY:{this.insertionMode=l.IN_BODY;return}case r.FRAMESET:{this.insertionMode=l.IN_FRAMESET;return}case r.SELECT:{this._resetInsertionModeForSelect(s);return}case r.TEMPLATE:{this.insertionMode=this.tmplInsertionModeStack[0];return}case r.HTML:{this.insertionMode=this.headElement?l.AFTER_HEAD:l.BEFORE_HEAD;return}case r.TD:case r.TH:{if(s>0){this.insertionMode=l.IN_CELL;return}break}case r.HEAD:{if(s>0){this.insertionMode=l.IN_HEAD;return}break}}this.insertionMode=l.IN_BODY}_resetInsertionModeForSelect(s){if(s>0)for(let i=s-1;i>0;i--){let a=this.openElements.tagIDs[i];if(a===r.TEMPLATE)break;else if(a===r.TABLE){this.insertionMode=l.IN_SELECT_IN_TABLE;return}}this.insertionMode=l.IN_SELECT}_isElementCausesFosterParenting(s){return Jr.has(s)}_shouldFosterParentOnInsertion(){return this.fosterParentingEnabled&&this.openElements.currentTagId!==void 0&&this._isElementCausesFosterParenting(this.openElements.currentTagId)}_findFosterParentingLocation(){for(let s=this.openElements.stackTop;s>=0;s--){let i=this.openElements.items[s];switch(this.openElements.tagIDs[s]){case r.TEMPLATE:{if(this.treeAdapter.getNamespaceURI(i)===H.HTML)return{parent:this.treeAdapter.getTemplateContent(i),beforeElement:null};break}case r.TABLE:{let a=this.treeAdapter.getParentNode(i);if(a)return{parent:a,beforeElement:i};return{parent:this.openElements.items[s-1],beforeElement:null}}default:}}return{parent:this.openElements.items[0],beforeElement:null}}_fosterParentElement(s){let i=this._findFosterParentingLocation();if(i.beforeElement)this.treeAdapter.insertBefore(i.parent,s,i.beforeElement);else this.treeAdapter.appendChild(i.parent,s)}_isSpecialElement(s,i){let a=this.treeAdapter.getNamespaceURI(s);return dr[a].has(i)}onCharacter(s){if(this.skipNextNewLine=!1,this.tokenizer.inForeignNode){Wv(this,s);return}switch(this.insertionMode){case l.INITIAL:{ns(this,s);break}case l.BEFORE_HTML:{Ns(this,s);break}case l.BEFORE_HEAD:{Ss(this,s);break}case l.IN_HEAD:{$s(this,s);break}case l.IN_HEAD_NO_SCRIPT:{Es(this,s);break}case l.AFTER_HEAD:{Is(this,s);break}case l.IN_BODY:case l.IN_CAPTION:case l.IN_CELL:case l.IN_TEMPLATE:{Fr(this,s);break}case l.TEXT:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:{this._insertCharacters(s);break}case l.IN_TABLE:case l.IN_TABLE_BODY:case l.IN_ROW:{Ti(this,s);break}case l.IN_TABLE_TEXT:{Lr(this,s);break}case l.IN_COLUMN_GROUP:{wi(this,s);break}case l.AFTER_BODY:{xi(this,s);break}case l.AFTER_AFTER_BODY:{bi(this,s);break}default:}}onNullCharacter(s){if(this.skipNextNewLine=!1,this.tokenizer.inForeignNode){Zv(this,s);return}switch(this.insertionMode){case l.INITIAL:{ns(this,s);break}case l.BEFORE_HTML:{Ns(this,s);break}case l.BEFORE_HEAD:{Ss(this,s);break}case l.IN_HEAD:{$s(this,s);break}case l.IN_HEAD_NO_SCRIPT:{Es(this,s);break}case l.AFTER_HEAD:{Is(this,s);break}case l.TEXT:{this._insertCharacters(s);break}case l.IN_TABLE:case l.IN_TABLE_BODY:case l.IN_ROW:{Ti(this,s);break}case l.IN_COLUMN_GROUP:{wi(this,s);break}case l.AFTER_BODY:{xi(this,s);break}case l.AFTER_AFTER_BODY:{bi(this,s);break}default:}}onComment(s){if(this.skipNextNewLine=!1,this.currentNotInHTML){Ai(this,s);return}switch(this.insertionMode){case l.INITIAL:case l.BEFORE_HTML:case l.BEFORE_HEAD:case l.IN_HEAD:case l.IN_HEAD_NO_SCRIPT:case l.AFTER_HEAD:case l.IN_BODY:case l.IN_TABLE:case l.IN_CAPTION:case l.IN_COLUMN_GROUP:case l.IN_TABLE_BODY:case l.IN_ROW:case l.IN_CELL:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:case l.IN_TEMPLATE:case l.IN_FRAMESET:case l.AFTER_FRAMESET:{Ai(this,s);break}case l.IN_TABLE_TEXT:{Ms(this,s);break}case l.AFTER_BODY:{ru(this,s);break}case l.AFTER_AFTER_BODY:case l.AFTER_AFTER_FRAMESET:{du(this,s);break}default:}}onDoctype(s){switch(this.skipNextNewLine=!1,this.insertionMode){case l.INITIAL:{mu(this,s);break}case l.BEFORE_HEAD:case l.IN_HEAD:case l.IN_HEAD_NO_SCRIPT:case l.AFTER_HEAD:{this._err(s,h.misplacedDoctype);break}case l.IN_TABLE_TEXT:{Ms(this,s);break}default:}}onStartTag(s){if(this.skipNextNewLine=!1,this.currentToken=s,this._processStartTag(s),s.selfClosing&&!s.ackSelfClosing)this._err(s,h.nonVoidHtmlElementStartTagWithTrailingSolidus)}_processStartTag(s){if(this.shouldProcessStartTagTokenInForeignContent(s))Jv(this,s);else this._startTagOutsideForeignContent(s)}_startTagOutsideForeignContent(s){switch(this.insertionMode){case l.INITIAL:{ns(this,s);break}case l.BEFORE_HTML:{uu(this,s);break}case l.BEFORE_HEAD:{eu(this,s);break}case l.IN_HEAD:{as(this,s);break}case l.IN_HEAD_NO_SCRIPT:{lu(this,s);break}case l.AFTER_HEAD:{tu(this,s);break}case l.IN_BODY:{S(this,s);break}case l.IN_TABLE:{Ws(this,s);break}case l.IN_TABLE_TEXT:{Ms(this,s);break}case l.IN_CAPTION:{fv(this,s);break}case l.IN_COLUMN_GROUP:{ra(this,s);break}case l.IN_TABLE_BODY:{Hi(this,s);break}case l.IN_ROW:{qi(this,s);break}case l.IN_CELL:{gv(this,s);break}case l.IN_SELECT:{Cr(this,s);break}case l.IN_SELECT_IN_TABLE:{bv(this,s);break}case l.IN_TEMPLATE:{xv(this,s);break}case l.AFTER_BODY:{hv(this,s);break}case l.IN_FRAMESET:{Hv(this,s);break}case l.AFTER_FRAMESET:{Xv(this,s);break}case l.AFTER_AFTER_BODY:{Vv(this,s);break}case l.AFTER_AFTER_FRAMESET:{zv(this,s);break}default:}}onEndTag(s){if(this.skipNextNewLine=!1,this.currentToken=s,this.currentNotInHTML)Yv(this,s);else this._endTagOutsideForeignContent(s)}_endTagOutsideForeignContent(s){switch(this.insertionMode){case l.INITIAL:{ns(this,s);break}case l.BEFORE_HTML:{vu(this,s);break}case l.BEFORE_HEAD:{fu(this,s);break}case l.IN_HEAD:{cu(this,s);break}case l.IN_HEAD_NO_SCRIPT:{gu(this,s);break}case l.AFTER_HEAD:{bu(this,s);break}case l.IN_BODY:{hi(this,s);break}case l.TEXT:{Au(this,s);break}case l.IN_TABLE:{ks(this,s);break}case l.IN_TABLE_TEXT:{Ms(this,s);break}case l.IN_CAPTION:{cv(this,s);break}case l.IN_COLUMN_GROUP:{lv(this,s);break}case l.IN_TABLE_BODY:{sa(this,s);break}case l.IN_ROW:{Pr(this,s);break}case l.IN_CELL:{tv(this,s);break}case l.IN_SELECT:{Or(this,s);break}case l.IN_SELECT_IN_TABLE:{wv(this,s);break}case l.IN_TEMPLATE:{yv(this,s);break}case l.AFTER_BODY:{Mr(this,s);break}case l.IN_FRAMESET:{qv(this,s);break}case l.AFTER_FRAMESET:{Qv(this,s);break}case l.AFTER_AFTER_BODY:{bi(this,s);break}default:}}onEof(s){switch(this.insertionMode){case l.INITIAL:{ns(this,s);break}case l.BEFORE_HTML:{Ns(this,s);break}case l.BEFORE_HEAD:{Ss(this,s);break}case l.IN_HEAD:{$s(this,s);break}case l.IN_HEAD_NO_SCRIPT:{Es(this,s);break}case l.AFTER_HEAD:{Is(this,s);break}case l.IN_BODY:case l.IN_TABLE:case l.IN_CAPTION:case l.IN_COLUMN_GROUP:case l.IN_TABLE_BODY:case l.IN_ROW:case l.IN_CELL:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:{or(this,s);break}case l.TEXT:{sv(this,s);break}case l.IN_TABLE_TEXT:{Ms(this,s);break}case l.IN_TEMPLATE:{nr(this,s);break}case l.AFTER_BODY:case l.IN_FRAMESET:case l.AFTER_FRAMESET:case l.AFTER_AFTER_BODY:case l.AFTER_AFTER_FRAMESET:{aa(this,s);break}default:}}onWhitespaceCharacter(s){if(this.skipNextNewLine){if(this.skipNextNewLine=!1,s.chars.charCodeAt(0)===v.LINE_FEED){if(s.chars.length===1)return;s.chars=s.chars.substr(1)}}if(this.tokenizer.inForeignNode){this._insertCharacters(s);return}switch(this.insertionMode){case l.IN_HEAD:case l.IN_HEAD_NO_SCRIPT:case l.AFTER_HEAD:case l.TEXT:case l.IN_COLUMN_GROUP:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:case l.IN_FRAMESET:case l.AFTER_FRAMESET:{this._insertCharacters(s);break}case l.IN_BODY:case l.IN_CAPTION:case l.IN_CELL:case l.IN_TEMPLATE:case l.AFTER_BODY:case l.AFTER_AFTER_BODY:case l.AFTER_AFTER_FRAMESET:{Yr(this,s);break}case l.IN_TABLE:case l.IN_TABLE_BODY:case l.IN_ROW:{Ti(this,s);break}case l.IN_TABLE_TEXT:{Rr(this,s);break}default:}}}function pm(s,i){let a=s.activeFormattingElements.getElementEntryInScopeWithTagName(i.tagName);if(a){if(!s.openElements.contains(a.element))s.activeFormattingElements.removeEntry(a),a=null;else if(!s.openElements.hasInScope(i.tagID))a=null}else Ur(s,i);return a}function Tm(s,i){let a=null,d=s.openElements.stackTop;for(;d>=0;d--){let m=s.openElements.items[d];if(m===i.element)break;if(s._isSpecialElement(m,s.openElements.tagIDs[d]))a=m}if(!a)s.openElements.shortenToLength(Math.max(d,0)),s.activeFormattingElements.removeEntry(i);return a}function Am(s,i,a){let d=i,m=s.openElements.getCommonAncestor(i);for(let u=0,c=m;c!==a;u++,c=m){m=s.openElements.getCommonAncestor(c);let f=s.activeFormattingElements.getElementEntry(c),g=f&&u>=Gm;if(!f||g){if(g)s.activeFormattingElements.removeEntry(f);s.openElements.remove(c)}else{if(c=su(s,f),d===i)s.activeFormattingElements.bookmark=f;s.treeAdapter.detachNode(d),s.treeAdapter.appendChild(c,d),d=c}}return d}function su(s,i){let a=s.treeAdapter.getNamespaceURI(i.element),d=s.treeAdapter.createElement(i.token.tagName,a,i.token.attrs);return s.openElements.replace(i.element,d),i.element=d,d}function iu(s,i,a){let d=s.treeAdapter.getTagName(i),m=Hs(d);if(s._isElementCausesFosterParenting(m))s._fosterParentElement(a);else{let u=s.treeAdapter.getNamespaceURI(i);if(m===r.TEMPLATE&&u===H.HTML)i=s.treeAdapter.getTemplateContent(i);s.treeAdapter.appendChild(i,a)}}function au(s,i,a){let d=s.treeAdapter.getNamespaceURI(a.element),{token:m}=a,u=s.treeAdapter.createElement(m.tagName,d,m.attrs);s._adoptNodes(i,u),s.treeAdapter.appendChild(i,u),s.activeFormattingElements.insertElementAfterBookmark(u,m),s.activeFormattingElements.removeEntry(a),s.openElements.remove(a.element),s.openElements.insertAfter(i,u,m.tagID)}function ia(s,i){for(let a=0;a<Dm;a++){let d=pm(s,i);if(!d)break;let m=Tm(s,d);if(!m)break;s.activeFormattingElements.bookmark=d;let u=Am(s,m,d.element),c=s.openElements.getCommonAncestor(d.element);if(s.treeAdapter.detachNode(u),c)iu(s,c,u);au(s,m,d)}}function Ai(s,i){s._appendCommentNode(i,s.openElements.currentTmplContentOrNode)}function ru(s,i){s._appendCommentNode(i,s.openElements.items[0])}function du(s,i){s._appendCommentNode(i,s.document)}function aa(s,i){if(s.stopped=!0,i.location){let a=s.fragmentContext?0:2;for(let d=s.openElements.stackTop;d>=a;d--)s._setEndLocation(s.openElements.items[d],i);if(!s.fragmentContext&&s.openElements.stackTop>=0){let d=s.openElements.items[0],m=s.treeAdapter.getNodeSourceCodeLocation(d);if(m&&!m.endTag){if(s._setEndLocation(d,i),s.openElements.stackTop>=1){let u=s.openElements.items[1],c=s.treeAdapter.getNodeSourceCodeLocation(u);if(c&&!c.endTag)s._setEndLocation(u,i)}}}}}function mu(s,i){s._setDocumentType(i);let a=i.forceQuirks?E.QUIRKS:hr(i);if(!yr(i))s._err(i,h.nonConformingDoctype);s.treeAdapter.setDocumentMode(s.document,a),s.insertionMode=l.BEFORE_HTML}function ns(s,i){s._err(i,h.missingDoctype,!0),s.treeAdapter.setDocumentMode(s.document,E.QUIRKS),s.insertionMode=l.BEFORE_HTML,s._processToken(i)}function uu(s,i){if(i.tagID===r.HTML)s._insertElement(i,H.HTML),s.insertionMode=l.BEFORE_HEAD;else Ns(s,i)}function vu(s,i){let a=i.tagID;if(a===r.HTML||a===r.HEAD||a===r.BODY||a===r.BR)Ns(s,i)}function Ns(s,i){s._insertFakeRootElement(),s.insertionMode=l.BEFORE_HEAD,s._processToken(i)}function eu(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.HEAD:{s._insertElement(i,H.HTML),s.headElement=s.openElements.current,s.insertionMode=l.IN_HEAD;break}default:Ss(s,i)}}function fu(s,i){let a=i.tagID;if(a===r.HEAD||a===r.BODY||a===r.HTML||a===r.BR)Ss(s,i);else s._err(i,h.endTagWithoutMatchingOpenElement)}function Ss(s,i){s._insertFakeElement(w.HEAD,r.HEAD),s.headElement=s.openElements.current,s.insertionMode=l.IN_HEAD,s._processToken(i)}function as(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.BASE:case r.BASEFONT:case r.BGSOUND:case r.LINK:case r.META:{s._appendElement(i,H.HTML),i.ackSelfClosing=!0;break}case r.TITLE:{s._switchToTextParsing(i,N.RCDATA);break}case r.NOSCRIPT:{if(s.options.scriptingEnabled)s._switchToTextParsing(i,N.RAWTEXT);else s._insertElement(i,H.HTML),s.insertionMode=l.IN_HEAD_NO_SCRIPT;break}case r.NOFRAMES:case r.STYLE:{s._switchToTextParsing(i,N.RAWTEXT);break}case r.SCRIPT:{s._switchToTextParsing(i,N.SCRIPT_DATA);break}case r.TEMPLATE:{s._insertTemplate(i),s.activeFormattingElements.insertMarker(),s.framesetOk=!1,s.insertionMode=l.IN_TEMPLATE,s.tmplInsertionModeStack.unshift(l.IN_TEMPLATE);break}case r.HEAD:{s._err(i,h.misplacedStartTagForHeadElement);break}default:$s(s,i)}}function cu(s,i){switch(i.tagID){case r.HEAD:{s.openElements.pop(),s.insertionMode=l.AFTER_HEAD;break}case r.BODY:case r.BR:case r.HTML:{$s(s,i);break}case r.TEMPLATE:{qs(s,i);break}default:s._err(i,h.endTagWithoutMatchingOpenElement)}}function qs(s,i){if(s.openElements.tmplCount>0){if(s.openElements.generateImpliedEndTagsThoroughly(),s.openElements.currentTagId!==r.TEMPLATE)s._err(i,h.closingOfElementWithOpenChildElements);s.openElements.popUntilTagNamePopped(r.TEMPLATE),s.activeFormattingElements.clearToLastMarker(),s.tmplInsertionModeStack.shift(),s._resetInsertionMode()}else s._err(i,h.endTagWithoutMatchingOpenElement)}function $s(s,i){s.openElements.pop(),s.insertionMode=l.AFTER_HEAD,s._processToken(i)}function lu(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.BASEFONT:case r.BGSOUND:case r.HEAD:case r.LINK:case r.META:case r.NOFRAMES:case r.STYLE:{as(s,i);break}case r.NOSCRIPT:{s._err(i,h.nestedNoscriptInHead);break}default:Es(s,i)}}function gu(s,i){switch(i.tagID){case r.NOSCRIPT:{s.openElements.pop(),s.insertionMode=l.IN_HEAD;break}case r.BR:{Es(s,i);break}default:s._err(i,h.endTagWithoutMatchingOpenElement)}}function Es(s,i){let a=i.type===W.EOF?h.openElementsLeftAfterEof:h.disallowedContentInNoscriptInHead;s._err(i,a),s.openElements.pop(),s.insertionMode=l.IN_HEAD,s._processToken(i)}function tu(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.BODY:{s._insertElement(i,H.HTML),s.framesetOk=!1,s.insertionMode=l.IN_BODY;break}case r.FRAMESET:{s._insertElement(i,H.HTML),s.insertionMode=l.IN_FRAMESET;break}case r.BASE:case r.BASEFONT:case r.BGSOUND:case r.LINK:case r.META:case r.NOFRAMES:case r.SCRIPT:case r.STYLE:case r.TEMPLATE:case r.TITLE:{s._err(i,h.abandonedHeadElementChild),s.openElements.push(s.headElement,r.HEAD),as(s,i),s.openElements.remove(s.headElement);break}case r.HEAD:{s._err(i,h.misplacedStartTagForHeadElement);break}default:Is(s,i)}}function bu(s,i){switch(i.tagID){case r.BODY:case r.HTML:case r.BR:{Is(s,i);break}case r.TEMPLATE:{qs(s,i);break}default:s._err(i,h.endTagWithoutMatchingOpenElement)}}function Is(s,i){s._insertFakeElement(w.BODY,r.BODY),s.insertionMode=l.IN_BODY,yi(s,i)}function yi(s,i){switch(i.type){case W.CHARACTER:{Fr(s,i);break}case W.WHITESPACE_CHARACTER:{Yr(s,i);break}case W.COMMENT:{Ai(s,i);break}case W.START_TAG:{S(s,i);break}case W.END_TAG:{hi(s,i);break}case W.EOF:{or(s,i);break}default:}}function Yr(s,i){s._reconstructActiveFormattingElements(),s._insertCharacters(i)}function Fr(s,i){s._reconstructActiveFormattingElements(),s._insertCharacters(i),s.framesetOk=!1}function wu(s,i){if(s.openElements.tmplCount===0)s.treeAdapter.adoptAttributes(s.openElements.items[0],i.attrs)}function xu(s,i){let a=s.openElements.tryPeekProperlyNestedBodyElement();if(a&&s.openElements.tmplCount===0)s.framesetOk=!1,s.treeAdapter.adoptAttributes(a,i.attrs)}function yu(s,i){let a=s.openElements.tryPeekProperlyNestedBodyElement();if(s.framesetOk&&a)s.treeAdapter.detachNode(a),s.openElements.popAllUpToHtmlElement(),s._insertElement(i,H.HTML),s.insertionMode=l.IN_FRAMESET}function hu(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._insertElement(i,H.HTML)}function Hu(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();if(s.openElements.currentTagId!==void 0&&Cs.has(s.openElements.currentTagId))s.openElements.pop();s._insertElement(i,H.HTML)}function qu(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._insertElement(i,H.HTML),s.skipNextNewLine=!0,s.framesetOk=!1}function Xu(s,i){let a=s.openElements.tmplCount>0;if(!s.formElement||a){if(s.openElements.hasInButtonScope(r.P))s._closePElement();if(s._insertElement(i,H.HTML),!a)s.formElement=s.openElements.current}}function Qu(s,i){s.framesetOk=!1;let a=i.tagID;for(let d=s.openElements.stackTop;d>=0;d--){let m=s.openElements.tagIDs[d];if(a===r.LI&&m===r.LI||(a===r.DD||a===r.DT)&&(m===r.DD||m===r.DT)){s.openElements.generateImpliedEndTagsWithExclusion(m),s.openElements.popUntilTagNamePopped(m);break}if(m!==r.ADDRESS&&m!==r.DIV&&m!==r.P&&s._isSpecialElement(s.openElements.items[d],m))break}if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._insertElement(i,H.HTML)}function Vu(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._insertElement(i,H.HTML),s.tokenizer.state=N.PLAINTEXT}function zu(s,i){if(s.openElements.hasInScope(r.BUTTON))s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(r.BUTTON);s._reconstructActiveFormattingElements(),s._insertElement(i,H.HTML),s.framesetOk=!1}function Zu(s,i){let a=s.activeFormattingElements.getElementEntryInScopeWithTagName(w.A);if(a)ia(s,i),s.openElements.remove(a.element),s.activeFormattingElements.removeEntry(a);s._reconstructActiveFormattingElements(),s._insertElement(i,H.HTML),s.activeFormattingElements.pushElement(s.openElements.current,i)}function Wu(s,i){s._reconstructActiveFormattingElements(),s._insertElement(i,H.HTML),s.activeFormattingElements.pushElement(s.openElements.current,i)}function Ju(s,i){if(s._reconstructActiveFormattingElements(),s.openElements.hasInScope(r.NOBR))ia(s,i),s._reconstructActiveFormattingElements();s._insertElement(i,H.HTML),s.activeFormattingElements.pushElement(s.openElements.current,i)}function Yu(s,i){s._reconstructActiveFormattingElements(),s._insertElement(i,H.HTML),s.activeFormattingElements.insertMarker(),s.framesetOk=!1}function Fu(s,i){if(s.treeAdapter.getDocumentMode(s.document)!==E.QUIRKS&&s.openElements.hasInButtonScope(r.P))s._closePElement();s._insertElement(i,H.HTML),s.framesetOk=!1,s.insertionMode=l.IN_TABLE}function jr(s,i){s._reconstructActiveFormattingElements(),s._appendElement(i,H.HTML),s.framesetOk=!1,i.ackSelfClosing=!0}function Kr(s){let i=fi(s,es.TYPE);return i!=null&&i.toLowerCase()===km}function ju(s,i){if(s._reconstructActiveFormattingElements(),s._appendElement(i,H.HTML),!Kr(i))s.framesetOk=!1;i.ackSelfClosing=!0}function Ku(s,i){s._appendElement(i,H.HTML),i.ackSelfClosing=!0}function Uu(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._appendElement(i,H.HTML),s.framesetOk=!1,i.ackSelfClosing=!0}function ou(s,i){i.tagName=w.IMG,i.tagID=r.IMG,jr(s,i)}function Ru(s,i){s._insertElement(i,H.HTML),s.skipNextNewLine=!0,s.tokenizer.state=N.RCDATA,s.originalInsertionMode=s.insertionMode,s.framesetOk=!1,s.insertionMode=l.TEXT}function Lu(s,i){if(s.openElements.hasInButtonScope(r.P))s._closePElement();s._reconstructActiveFormattingElements(),s.framesetOk=!1,s._switchToTextParsing(i,N.RAWTEXT)}function Bu(s,i){s.framesetOk=!1,s._switchToTextParsing(i,N.RAWTEXT)}function Zr(s,i){s._switchToTextParsing(i,N.RAWTEXT)}function Pu(s,i){s._reconstructActiveFormattingElements(),s._insertElement(i,H.HTML),s.framesetOk=!1,s.insertionMode=s.insertionMode===l.IN_TABLE||s.insertionMode===l.IN_CAPTION||s.insertionMode===l.IN_TABLE_BODY||s.insertionMode===l.IN_ROW||s.insertionMode===l.IN_CELL?l.IN_SELECT_IN_TABLE:l.IN_SELECT}function Cu(s,i){if(s.openElements.currentTagId===r.OPTION)s.openElements.pop();s._reconstructActiveFormattingElements(),s._insertElement(i,H.HTML)}function Ou(s,i){if(s.openElements.hasInScope(r.RUBY))s.openElements.generateImpliedEndTags();s._insertElement(i,H.HTML)}function nu(s,i){if(s.openElements.hasInScope(r.RUBY))s.openElements.generateImpliedEndTagsWithExclusion(r.RTC);s._insertElement(i,H.HTML)}function Mu(s,i){if(s._reconstructActiveFormattingElements(),_i(i),ti(i),i.selfClosing)s._appendElement(i,H.MATHML);else s._insertElement(i,H.MATHML);i.ackSelfClosing=!0}function Nu(s,i){if(s._reconstructActiveFormattingElements(),pi(i),ti(i),i.selfClosing)s._appendElement(i,H.SVG);else s._insertElement(i,H.SVG);i.ackSelfClosing=!0}function Wr(s,i){s._reconstructActiveFormattingElements(),s._insertElement(i,H.HTML)}function S(s,i){switch(i.tagID){case r.I:case r.S:case r.B:case r.U:case r.EM:case r.TT:case r.BIG:case r.CODE:case r.FONT:case r.SMALL:case r.STRIKE:case r.STRONG:{Wu(s,i);break}case r.A:{Zu(s,i);break}case r.H1:case r.H2:case r.H3:case r.H4:case r.H5:case r.H6:{Hu(s,i);break}case r.P:case r.DL:case r.OL:case r.UL:case r.DIV:case r.DIR:case r.NAV:case r.MAIN:case r.MENU:case r.ASIDE:case r.CENTER:case r.FIGURE:case r.FOOTER:case r.HEADER:case r.HGROUP:case r.DIALOG:case r.DETAILS:case r.ADDRESS:case r.ARTICLE:case r.SEARCH:case r.SECTION:case r.SUMMARY:case r.FIELDSET:case r.BLOCKQUOTE:case r.FIGCAPTION:{hu(s,i);break}case r.LI:case r.DD:case r.DT:{Qu(s,i);break}case r.BR:case r.IMG:case r.WBR:case r.AREA:case r.EMBED:case r.KEYGEN:{jr(s,i);break}case r.HR:{Uu(s,i);break}case r.RB:case r.RTC:{Ou(s,i);break}case r.RT:case r.RP:{nu(s,i);break}case r.PRE:case r.LISTING:{qu(s,i);break}case r.XMP:{Lu(s,i);break}case r.SVG:{Nu(s,i);break}case r.HTML:{wu(s,i);break}case r.BASE:case r.LINK:case r.META:case r.STYLE:case r.TITLE:case r.SCRIPT:case r.BGSOUND:case r.BASEFONT:case r.TEMPLATE:{as(s,i);break}case r.BODY:{xu(s,i);break}case r.FORM:{Xu(s,i);break}case r.NOBR:{Ju(s,i);break}case r.MATH:{Mu(s,i);break}case r.TABLE:{Fu(s,i);break}case r.INPUT:{ju(s,i);break}case r.PARAM:case r.TRACK:case r.SOURCE:{Ku(s,i);break}case r.IMAGE:{ou(s,i);break}case r.BUTTON:{zu(s,i);break}case r.APPLET:case r.OBJECT:case r.MARQUEE:{Yu(s,i);break}case r.IFRAME:{Bu(s,i);break}case r.SELECT:{Pu(s,i);break}case r.OPTION:case r.OPTGROUP:{Cu(s,i);break}case r.NOEMBED:case r.NOFRAMES:{Zr(s,i);break}case r.FRAMESET:{yu(s,i);break}case r.TEXTAREA:{Ru(s,i);break}case r.NOSCRIPT:{if(s.options.scriptingEnabled)Zr(s,i);else Wr(s,i);break}case r.PLAINTEXT:{Vu(s,i);break}case r.COL:case r.TH:case r.TD:case r.TR:case r.HEAD:case r.FRAME:case r.TBODY:case r.TFOOT:case r.THEAD:case r.CAPTION:case r.COLGROUP:break;default:Wr(s,i)}}function Su(s,i){if(s.openElements.hasInScope(r.BODY)){if(s.insertionMode=l.AFTER_BODY,s.options.sourceCodeLocationInfo){let a=s.openElements.tryPeekProperlyNestedBodyElement();if(a)s._setEndLocation(a,i)}}}function $u(s,i){if(s.openElements.hasInScope(r.BODY))s.insertionMode=l.AFTER_BODY,Mr(s,i)}function Eu(s,i){let a=i.tagID;if(s.openElements.hasInScope(a))s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(a)}function Iu(s){let i=s.openElements.tmplCount>0,{formElement:a}=s;if(!i)s.formElement=null;if((a||i)&&s.openElements.hasInScope(r.FORM)){if(s.openElements.generateImpliedEndTags(),i)s.openElements.popUntilTagNamePopped(r.FORM);else if(a)s.openElements.remove(a)}}function ku(s){if(!s.openElements.hasInButtonScope(r.P))s._insertFakeElement(w.P,r.P);s._closePElement()}function Du(s){if(s.openElements.hasInListItemScope(r.LI))s.openElements.generateImpliedEndTagsWithExclusion(r.LI),s.openElements.popUntilTagNamePopped(r.LI)}function Gu(s,i){let a=i.tagID;if(s.openElements.hasInScope(a))s.openElements.generateImpliedEndTagsWithExclusion(a),s.openElements.popUntilTagNamePopped(a)}function _u(s){if(s.openElements.hasNumberedHeaderInScope())s.openElements.generateImpliedEndTags(),s.openElements.popUntilNumberedHeaderPopped()}function pu(s,i){let a=i.tagID;if(s.openElements.hasInScope(a))s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(a),s.activeFormattingElements.clearToLastMarker()}function Tu(s){s._reconstructActiveFormattingElements(),s._insertFakeElement(w.BR,r.BR),s.openElements.pop(),s.framesetOk=!1}function Ur(s,i){let{tagName:a,tagID:d}=i;for(let m=s.openElements.stackTop;m>0;m--){let u=s.openElements.items[m],c=s.openElements.tagIDs[m];if(d===c&&(d!==r.UNKNOWN||s.treeAdapter.getTagName(u)===a)){if(s.openElements.generateImpliedEndTagsWithExclusion(d),s.openElements.stackTop>=m)s.openElements.shortenToLength(m);break}if(s._isSpecialElement(u,c))break}}function hi(s,i){switch(i.tagID){case r.A:case r.B:case r.I:case r.S:case r.U:case r.EM:case r.TT:case r.BIG:case r.CODE:case r.FONT:case r.NOBR:case r.SMALL:case r.STRIKE:case r.STRONG:{ia(s,i);break}case r.P:{ku(s);break}case r.DL:case r.UL:case r.OL:case r.DIR:case r.DIV:case r.NAV:case r.PRE:case r.MAIN:case r.MENU:case r.ASIDE:case r.BUTTON:case r.CENTER:case r.FIGURE:case r.FOOTER:case r.HEADER:case r.HGROUP:case r.DIALOG:case r.ADDRESS:case r.ARTICLE:case r.DETAILS:case r.SEARCH:case r.SECTION:case r.SUMMARY:case r.LISTING:case r.FIELDSET:case r.BLOCKQUOTE:case r.FIGCAPTION:{Eu(s,i);break}case r.LI:{Du(s);break}case r.DD:case r.DT:{Gu(s,i);break}case r.H1:case r.H2:case r.H3:case r.H4:case r.H5:case r.H6:{_u(s);break}case r.BR:{Tu(s);break}case r.BODY:{Su(s,i);break}case r.HTML:{$u(s,i);break}case r.FORM:{Iu(s);break}case r.APPLET:case r.OBJECT:case r.MARQUEE:{pu(s,i);break}case r.TEMPLATE:{qs(s,i);break}default:Ur(s,i)}}function or(s,i){if(s.tmplInsertionModeStack.length>0)nr(s,i);else aa(s,i)}function Au(s,i){var a;if(i.tagID===r.SCRIPT)(a=s.scriptHandler)===null||a===void 0||a.call(s,s.openElements.current);s.openElements.pop(),s.insertionMode=s.originalInsertionMode}function sv(s,i){s._err(i,h.eofInElementThatCanContainOnlyText),s.openElements.pop(),s.insertionMode=s.originalInsertionMode,s.onEof(i)}function Ti(s,i){if(s.openElements.currentTagId!==void 0&&Jr.has(s.openElements.currentTagId))switch(s.pendingCharacterTokens.length=0,s.hasNonWhitespacePendingCharacterToken=!1,s.originalInsertionMode=s.insertionMode,s.insertionMode=l.IN_TABLE_TEXT,i.type){case W.CHARACTER:{Lr(s,i);break}case W.WHITESPACE_CHARACTER:{Rr(s,i);break}}else Gs(s,i)}function iv(s,i){s.openElements.clearBackToTableContext(),s.activeFormattingElements.insertMarker(),s._insertElement(i,H.HTML),s.insertionMode=l.IN_CAPTION}function av(s,i){s.openElements.clearBackToTableContext(),s._insertElement(i,H.HTML),s.insertionMode=l.IN_COLUMN_GROUP}function rv(s,i){s.openElements.clearBackToTableContext(),s._insertFakeElement(w.COLGROUP,r.COLGROUP),s.insertionMode=l.IN_COLUMN_GROUP,ra(s,i)}function dv(s,i){s.openElements.clearBackToTableContext(),s._insertElement(i,H.HTML),s.insertionMode=l.IN_TABLE_BODY}function mv(s,i){s.openElements.clearBackToTableContext(),s._insertFakeElement(w.TBODY,r.TBODY),s.insertionMode=l.IN_TABLE_BODY,Hi(s,i)}function uv(s,i){if(s.openElements.hasInTableScope(r.TABLE))s.openElements.popUntilTagNamePopped(r.TABLE),s._resetInsertionMode(),s._processStartTag(i)}function vv(s,i){if(Kr(i))s._appendElement(i,H.HTML);else Gs(s,i);i.ackSelfClosing=!0}function ev(s,i){if(!s.formElement&&s.openElements.tmplCount===0)s._insertElement(i,H.HTML),s.formElement=s.openElements.current,s.openElements.pop()}function Ws(s,i){switch(i.tagID){case r.TD:case r.TH:case r.TR:{mv(s,i);break}case r.STYLE:case r.SCRIPT:case r.TEMPLATE:{as(s,i);break}case r.COL:{rv(s,i);break}case r.FORM:{ev(s,i);break}case r.TABLE:{uv(s,i);break}case r.TBODY:case r.TFOOT:case r.THEAD:{dv(s,i);break}case r.INPUT:{vv(s,i);break}case r.CAPTION:{iv(s,i);break}case r.COLGROUP:{av(s,i);break}default:Gs(s,i)}}function ks(s,i){switch(i.tagID){case r.TABLE:{if(s.openElements.hasInTableScope(r.TABLE))s.openElements.popUntilTagNamePopped(r.TABLE),s._resetInsertionMode();break}case r.TEMPLATE:{qs(s,i);break}case r.BODY:case r.CAPTION:case r.COL:case r.COLGROUP:case r.HTML:case r.TBODY:case r.TD:case r.TFOOT:case r.TH:case r.THEAD:case r.TR:break;default:Gs(s,i)}}function Gs(s,i){let a=s.fosterParentingEnabled;s.fosterParentingEnabled=!0,yi(s,i),s.fosterParentingEnabled=a}function Rr(s,i){s.pendingCharacterTokens.push(i)}function Lr(s,i){s.pendingCharacterTokens.push(i),s.hasNonWhitespacePendingCharacterToken=!0}function Ms(s,i){let a=0;if(s.hasNonWhitespacePendingCharacterToken)for(;a<s.pendingCharacterTokens.length;a++)Gs(s,s.pendingCharacterTokens[a]);else for(;a<s.pendingCharacterTokens.length;a++)s._insertCharacters(s.pendingCharacterTokens[a]);s.insertionMode=s.originalInsertionMode,s._processToken(i)}var Br=new Set([r.CAPTION,r.COL,r.COLGROUP,r.TBODY,r.TD,r.TFOOT,r.TH,r.THEAD,r.TR]);function fv(s,i){let a=i.tagID;if(Br.has(a)){if(s.openElements.hasInTableScope(r.CAPTION))s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(r.CAPTION),s.activeFormattingElements.clearToLastMarker(),s.insertionMode=l.IN_TABLE,Ws(s,i)}else S(s,i)}function cv(s,i){let a=i.tagID;switch(a){case r.CAPTION:case r.TABLE:{if(s.openElements.hasInTableScope(r.CAPTION)){if(s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(r.CAPTION),s.activeFormattingElements.clearToLastMarker(),s.insertionMode=l.IN_TABLE,a===r.TABLE)ks(s,i)}break}case r.BODY:case r.COL:case r.COLGROUP:case r.HTML:case r.TBODY:case r.TD:case r.TFOOT:case r.TH:case r.THEAD:case r.TR:break;default:hi(s,i)}}function ra(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.COL:{s._appendElement(i,H.HTML),i.ackSelfClosing=!0;break}case r.TEMPLATE:{as(s,i);break}default:wi(s,i)}}function lv(s,i){switch(i.tagID){case r.COLGROUP:{if(s.openElements.currentTagId===r.COLGROUP)s.openElements.pop(),s.insertionMode=l.IN_TABLE;break}case r.TEMPLATE:{qs(s,i);break}case r.COL:break;default:wi(s,i)}}function wi(s,i){if(s.openElements.currentTagId===r.COLGROUP)s.openElements.pop(),s.insertionMode=l.IN_TABLE,s._processToken(i)}function Hi(s,i){switch(i.tagID){case r.TR:{s.openElements.clearBackToTableBodyContext(),s._insertElement(i,H.HTML),s.insertionMode=l.IN_ROW;break}case r.TH:case r.TD:{s.openElements.clearBackToTableBodyContext(),s._insertFakeElement(w.TR,r.TR),s.insertionMode=l.IN_ROW,qi(s,i);break}case r.CAPTION:case r.COL:case r.COLGROUP:case r.TBODY:case r.TFOOT:case r.THEAD:{if(s.openElements.hasTableBodyContextInTableScope())s.openElements.clearBackToTableBodyContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE,Ws(s,i);break}default:Ws(s,i)}}function sa(s,i){let a=i.tagID;switch(i.tagID){case r.TBODY:case r.TFOOT:case r.THEAD:{if(s.openElements.hasInTableScope(a))s.openElements.clearBackToTableBodyContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE;break}case r.TABLE:{if(s.openElements.hasTableBodyContextInTableScope())s.openElements.clearBackToTableBodyContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE,ks(s,i);break}case r.BODY:case r.CAPTION:case r.COL:case r.COLGROUP:case r.HTML:case r.TD:case r.TH:case r.TR:break;default:ks(s,i)}}function qi(s,i){switch(i.tagID){case r.TH:case r.TD:{s.openElements.clearBackToTableRowContext(),s._insertElement(i,H.HTML),s.insertionMode=l.IN_CELL,s.activeFormattingElements.insertMarker();break}case r.CAPTION:case r.COL:case r.COLGROUP:case r.TBODY:case r.TFOOT:case r.THEAD:case r.TR:{if(s.openElements.hasInTableScope(r.TR))s.openElements.clearBackToTableRowContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE_BODY,Hi(s,i);break}default:Ws(s,i)}}function Pr(s,i){switch(i.tagID){case r.TR:{if(s.openElements.hasInTableScope(r.TR))s.openElements.clearBackToTableRowContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE_BODY;break}case r.TABLE:{if(s.openElements.hasInTableScope(r.TR))s.openElements.clearBackToTableRowContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE_BODY,sa(s,i);break}case r.TBODY:case r.TFOOT:case r.THEAD:{if(s.openElements.hasInTableScope(i.tagID)||s.openElements.hasInTableScope(r.TR))s.openElements.clearBackToTableRowContext(),s.openElements.pop(),s.insertionMode=l.IN_TABLE_BODY,sa(s,i);break}case r.BODY:case r.CAPTION:case r.COL:case r.COLGROUP:case r.HTML:case r.TD:case r.TH:break;default:ks(s,i)}}function gv(s,i){let a=i.tagID;if(Br.has(a)){if(s.openElements.hasInTableScope(r.TD)||s.openElements.hasInTableScope(r.TH))s._closeTableCell(),qi(s,i)}else S(s,i)}function tv(s,i){let a=i.tagID;switch(a){case r.TD:case r.TH:{if(s.openElements.hasInTableScope(a))s.openElements.generateImpliedEndTags(),s.openElements.popUntilTagNamePopped(a),s.activeFormattingElements.clearToLastMarker(),s.insertionMode=l.IN_ROW;break}case r.TABLE:case r.TBODY:case r.TFOOT:case r.THEAD:case r.TR:{if(s.openElements.hasInTableScope(a))s._closeTableCell(),Pr(s,i);break}case r.BODY:case r.CAPTION:case r.COL:case r.COLGROUP:case r.HTML:break;default:hi(s,i)}}function Cr(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.OPTION:{if(s.openElements.currentTagId===r.OPTION)s.openElements.pop();s._insertElement(i,H.HTML);break}case r.OPTGROUP:{if(s.openElements.currentTagId===r.OPTION)s.openElements.pop();if(s.openElements.currentTagId===r.OPTGROUP)s.openElements.pop();s._insertElement(i,H.HTML);break}case r.HR:{if(s.openElements.currentTagId===r.OPTION)s.openElements.pop();if(s.openElements.currentTagId===r.OPTGROUP)s.openElements.pop();s._appendElement(i,H.HTML),i.ackSelfClosing=!0;break}case r.INPUT:case r.KEYGEN:case r.TEXTAREA:case r.SELECT:{if(s.openElements.hasInSelectScope(r.SELECT)){if(s.openElements.popUntilTagNamePopped(r.SELECT),s._resetInsertionMode(),i.tagID!==r.SELECT)s._processStartTag(i)}break}case r.SCRIPT:case r.TEMPLATE:{as(s,i);break}default:}}function Or(s,i){switch(i.tagID){case r.OPTGROUP:{if(s.openElements.stackTop>0&&s.openElements.currentTagId===r.OPTION&&s.openElements.tagIDs[s.openElements.stackTop-1]===r.OPTGROUP)s.openElements.pop();if(s.openElements.currentTagId===r.OPTGROUP)s.openElements.pop();break}case r.OPTION:{if(s.openElements.currentTagId===r.OPTION)s.openElements.pop();break}case r.SELECT:{if(s.openElements.hasInSelectScope(r.SELECT))s.openElements.popUntilTagNamePopped(r.SELECT),s._resetInsertionMode();break}case r.TEMPLATE:{qs(s,i);break}default:}}function bv(s,i){let a=i.tagID;if(a===r.CAPTION||a===r.TABLE||a===r.TBODY||a===r.TFOOT||a===r.THEAD||a===r.TR||a===r.TD||a===r.TH)s.openElements.popUntilTagNamePopped(r.SELECT),s._resetInsertionMode(),s._processStartTag(i);else Cr(s,i)}function wv(s,i){let a=i.tagID;if(a===r.CAPTION||a===r.TABLE||a===r.TBODY||a===r.TFOOT||a===r.THEAD||a===r.TR||a===r.TD||a===r.TH){if(s.openElements.hasInTableScope(a))s.openElements.popUntilTagNamePopped(r.SELECT),s._resetInsertionMode(),s.onEndTag(i)}else Or(s,i)}function xv(s,i){switch(i.tagID){case r.BASE:case r.BASEFONT:case r.BGSOUND:case r.LINK:case r.META:case r.NOFRAMES:case r.SCRIPT:case r.STYLE:case r.TEMPLATE:case r.TITLE:{as(s,i);break}case r.CAPTION:case r.COLGROUP:case r.TBODY:case r.TFOOT:case r.THEAD:{s.tmplInsertionModeStack[0]=l.IN_TABLE,s.insertionMode=l.IN_TABLE,Ws(s,i);break}case r.COL:{s.tmplInsertionModeStack[0]=l.IN_COLUMN_GROUP,s.insertionMode=l.IN_COLUMN_GROUP,ra(s,i);break}case r.TR:{s.tmplInsertionModeStack[0]=l.IN_TABLE_BODY,s.insertionMode=l.IN_TABLE_BODY,Hi(s,i);break}case r.TD:case r.TH:{s.tmplInsertionModeStack[0]=l.IN_ROW,s.insertionMode=l.IN_ROW,qi(s,i);break}default:s.tmplInsertionModeStack[0]=l.IN_BODY,s.insertionMode=l.IN_BODY,S(s,i)}}function yv(s,i){if(i.tagID===r.TEMPLATE)qs(s,i)}function nr(s,i){if(s.openElements.tmplCount>0)s.openElements.popUntilTagNamePopped(r.TEMPLATE),s.activeFormattingElements.clearToLastMarker(),s.tmplInsertionModeStack.shift(),s._resetInsertionMode(),s.onEof(i);else aa(s,i)}function hv(s,i){if(i.tagID===r.HTML)S(s,i);else xi(s,i)}function Mr(s,i){var a;if(i.tagID===r.HTML){if(!s.fragmentContext)s.insertionMode=l.AFTER_AFTER_BODY;if(s.options.sourceCodeLocationInfo&&s.openElements.tagIDs[0]===r.HTML){s._setEndLocation(s.openElements.items[0],i);let d=s.openElements.items[1];if(d&&!((a=s.treeAdapter.getNodeSourceCodeLocation(d))===null||a===void 0?void 0:a.endTag))s._setEndLocation(d,i)}}else xi(s,i)}function xi(s,i){s.insertionMode=l.IN_BODY,yi(s,i)}function Hv(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.FRAMESET:{s._insertElement(i,H.HTML);break}case r.FRAME:{s._appendElement(i,H.HTML),i.ackSelfClosing=!0;break}case r.NOFRAMES:{as(s,i);break}default:}}function qv(s,i){if(i.tagID===r.FRAMESET&&!s.openElements.isRootHtmlElementCurrent()){if(s.openElements.pop(),!s.fragmentContext&&s.openElements.currentTagId!==r.FRAMESET)s.insertionMode=l.AFTER_FRAMESET}}function Xv(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.NOFRAMES:{as(s,i);break}default:}}function Qv(s,i){if(i.tagID===r.HTML)s.insertionMode=l.AFTER_AFTER_FRAMESET}function Vv(s,i){if(i.tagID===r.HTML)S(s,i);else bi(s,i)}function bi(s,i){s.insertionMode=l.IN_BODY,yi(s,i)}function zv(s,i){switch(i.tagID){case r.HTML:{S(s,i);break}case r.NOFRAMES:{as(s,i);break}default:}}function Zv(s,i){i.chars=K,s._insertCharacters(i)}function Wv(s,i){s._insertCharacters(i),s.framesetOk=!1}function Nr(s){while(s.treeAdapter.getNamespaceURI(s.openElements.current)!==H.HTML&&s.openElements.currentTagId!==void 0&&!s._isIntegrationPoint(s.openElements.currentTagId,s.openElements.current))s.openElements.pop()}function Jv(s,i){if(qr(i))Nr(s),s._startTagOutsideForeignContent(i);else{let a=s._getAdjustedCurrentElement(),d=s.treeAdapter.getNamespaceURI(a);if(d===H.MATHML)_i(i);else if(d===H.SVG)Xr(i),pi(i);if(ti(i),i.selfClosing)s._appendElement(i,d);else s._insertElement(i,d);i.ackSelfClosing=!0}}function Yv(s,i){if(i.tagID===r.P||i.tagID===r.BR){Nr(s),s._endTagOutsideForeignContent(i);return}for(let a=s.openElements.stackTop;a>0;a--){let d=s.openElements.items[a];if(s.treeAdapter.getNamespaceURI(d)===H.HTML){s._endTagOutsideForeignContent(i);break}let m=s.treeAdapter.getTagName(d);if(m.toLowerCase()===i.tagName){i.tagName=m,s.openElements.shortenToLength(a);break}}}var Ff=new Set([w.AREA,w.BASE,w.BASEFONT,w.BGSOUND,w.BR,w.COL,w.EMBED,w.FRAME,w.HR,w.IMG,w.INPUT,w.KEYGEN,w.LINK,w.META,w.PARAM,w.SOURCE,w.TRACK,w.WBR]);function Sr(s,i){return Ds.parse(s,i)}function $r(s,i,a){if(typeof s==="string")a=i,i=s,s=null;let d=Ds.getFragmentParser(s,a);return d.tokenizer.write(i,!0),d.getFragment()}var Qi=["draft","in_review","needs_revision","approved"],Er=["status","approvedAt","reviewer","approvalDigest","answers","checklist","unresolvedCommentIds"];function da(s){if(typeof s!=="string"||s.trim()!==s)return!1;let i=s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/);if(!i||!Number.isFinite(Date.parse(s)))return!1;let[,a,d,m,u,c,f,,g="00",t="00"]=i,y=Number(d);return y>=1&&y<=12&&Number(m)>=1&&Number(m)<=new Date(Date.UTC(Number(a),y,0)).getUTCDate()&&Number(u)<=23&&Number(c)<=59&&Number(f)<=59&&Number(g)<=23&&Number(t)<=59}function Ir(){return{status:"draft",answers:{},checklist:{},unresolvedCommentIds:[]}}function Vi(s){if(!s||typeof s!=="object"||Array.isArray(s))return["ReviewState patch must be an object"];let i=s,a=[],d=Er;for(let m of Object.keys(i))if(!d.includes(m))a.push(`ReviewState patch contains unknown field '${m}'`);if("status"in i&&!Qi.includes(i.status))a.push(`ReviewState patch status must be one of ${Qi.join(", ")}`);if("approvedAt"in i&&!da(i.approvedAt))a.push("ReviewState patch approvedAt must be a valid nonblank ISO timestamp");if("reviewer"in i&&(typeof i.reviewer!=="string"||i.reviewer.trim().length===0))a.push("ReviewState patch reviewer must be a nonblank string");if("answers"in i){if(!i.answers||typeof i.answers!=="object"||Array.isArray(i.answers))a.push("ReviewState patch answers must be an object");else for(let[m,u]of Object.entries(i.answers))if(typeof u!=="string"&&!(Array.isArray(u)&&u.every((c)=>typeof c==="string")))a.push(`ReviewState patch answers['${m}'] must be a string or string array`)}if("checklist"in i){if(!i.checklist||typeof i.checklist!=="object"||Array.isArray(i.checklist))a.push("ReviewState patch checklist must be an object");else for(let[m,u]of Object.entries(i.checklist))if(typeof u!=="boolean")a.push(`ReviewState patch checklist['${m}'] must be boolean`)}if("unresolvedCommentIds"in i&&(!Array.isArray(i.unresolvedCommentIds)||!i.unresolvedCommentIds.every((m)=>typeof m==="string")))a.push("ReviewState patch unresolvedCommentIds must be a string array");return a}function _s(s){if(!s||typeof s!=="object"||Array.isArray(s))return["AgentHandoff must be an object"];let i=s,a=[],d=["status","planSlug","planPath","approvedAt","approvedScope","decisions","answers","implementationEntry","verification","openRisks","approvalDigest"];for(let u of Object.keys(i))if(!d.includes(u))a.push(`AgentHandoff contains unknown field '${u}'`);if(i.status!=="approved")a.push("AgentHandoff.status must be approved");for(let u of["planSlug","planPath","implementationEntry"])if(typeof i[u]!=="string"||i[u].trim().length===0)a.push(`AgentHandoff.${u} must be a nonblank string`);if(!da(i.approvedAt))a.push("AgentHandoff.approvedAt must be a valid nonblank ISO timestamp");if(typeof i.approvalDigest!=="string"||!/^[0-9a-f]{64}$/.test(i.approvalDigest))a.push("AgentHandoff.approvalDigest must be a canonical SHA-256 digest");for(let u of["approvedScope","decisions","verification","openRisks"]){let c=i[u];if(!Array.isArray(c)||!c.every((f)=>typeof f==="string"))a.push(`AgentHandoff.${u} must be a string array`)}let m=i.answers;if(!m||typeof m!=="object"||Array.isArray(m))a.push("AgentHandoff.answers must be an object");else for(let[u,c]of Object.entries(m))if(typeof c!=="string"&&!(Array.isArray(c)&&c.every((f)=>typeof f==="string")))a.push(`AgentHandoff.answers['${u}'] must be a string or string array`);return a}function Js(s){if(!s||typeof s!=="object"||Array.isArray(s))return["ReviewState must be an object"];let i=s,a=[];for(let m of Object.keys(i))if(!Er.includes(m))a.push(`ReviewState contains unknown field '${m}'`);if(!Qi.includes(i.status))a.push(`ReviewState.status must be one of ${Qi.join(", ")}`);if(!i.answers||typeof i.answers!=="object"||Array.isArray(i.answers))a.push("ReviewState.answers must be an object");else for(let[m,u]of Object.entries(i.answers))if(typeof u!=="string"&&!(Array.isArray(u)&&u.every((c)=>typeof c==="string")))a.push(`ReviewState.answers['${m}'] must be a string or string array`);if(!i.checklist||typeof i.checklist!=="object"||Array.isArray(i.checklist))a.push("ReviewState.checklist must be an object");else for(let[m,u]of Object.entries(i.checklist))if(typeof u!=="boolean")a.push(`ReviewState.checklist['${m}'] must be boolean`);let d=i.unresolvedCommentIds;if(!Array.isArray(d)||!d.every((m)=>typeof m==="string"&&m.trim().length>0)||new Set(d).size!==d.length)a.push("ReviewState.unresolvedCommentIds must be a unique nonblank string array");if(i.status==="approved"){if(!da(i.approvedAt))a.push("Approved ReviewState.approvedAt must be a valid nonblank ISO timestamp");if(typeof i.reviewer!=="string"||i.reviewer.trim().length===0)a.push("Approved ReviewState.reviewer must be a nonblank string");if(typeof i.approvalDigest!=="string"||!/^[0-9a-f]{64}$/.test(i.approvalDigest))a.push("Approved ReviewState.approvalDigest must be a canonical SHA-256 digest");if(Array.isArray(d)&&d.length>0)a.push("Approved ReviewState cannot contain unresolved comments")}else if(i.approvedAt!==void 0||i.reviewer!==void 0||i.approvalDigest!==void 0)a.push("Nonapproved ReviewState cannot retain approval metadata");return a}function ma(s,i){let a=[];for(let d of s)for(let m of D(d.body)){let u=ds(m);if(d.type==="QuestionForm"&&u[3]==="required"){let c=i.answers[u[0]];if(!(typeof c==="string"?c.trim().length>0:Array.isArray(c)&&c.some((g)=>g.trim().length>0)))a.push(`Required question '${u[0]}' must be answered`)}if(d.type==="Checklist"&&u[2]==="required"&&i.checklist[u[0]]!==!0)a.push(`Required checklist item '${u[0]}' must be checked`)}return a}var Xi=/^[A-Za-z][A-Za-z0-9_-]*$/,Fv=Object.freeze({iframe:!0,noembed:!0,noframes:!0,plaintext:!0,script:!0,style:!0,textarea:!0,title:!0,xmp:!0});function jv(s){return"tagName"in s}function kr(s,i){let a=i?Sr(s,{sourceCodeLocationInfo:!0}):$r(s,{sourceCodeLocationInfo:!0}),d=[{ids:[],name:i?"document":"fragment"}],m=0,u=0,c=(f,g)=>{if(jv(f)){let t=f.tagName==="template"?f.attrs.find(({name:x})=>x==="shadowrootmode")?.value.toLowerCase():void 0,y=t==="open"||t==="closed";if(!y){let x=f.attrs.find(({name:b})=>b==="id");if(x){let b=f.sourceCodeLocation?.attrs?.id;g.ids.push({hasValue:b?s.slice(b.startOffset,b.endOffset).includes("="):!0,value:x.value})}}if(f.tagName==="template"){let x=y?`shadow root ${++u}`:`template ${++m}`,b={ids:[],name:x};d.push(b),c(f.content,b);return}}if("childNodes"in f)for(let t of f.childNodes)c(t,g)};return c(a,d[0]),d}function Kv(s){for(let i=0;i<s.length;){let a=s.indexOf("<",i);if(a===-1)return;if(s.startsWith("<!--",a)){let g=s.indexOf("-->",a+4);if(g===-1)return"comment";i=g+3;continue}let d=s.slice(a).match(/^<([A-Za-z][A-Za-z0-9-]*)\b/);if(!d){i=a+1;continue}let m=Vs(s,a+d[0].length);if(m===-1)return d[1].toLowerCase();let u=d[1].toLowerCase();if(i=m+1,!Fv[u])continue;if(u==="plaintext")return u;let c=s.slice(i).search(new RegExp(`</${u}(?=[\\t\\n\\f\\r />])`,"i"));if(c===-1)return u;let f=Vs(s,i+c+u.length+2);if(f===-1)return u;i=f+1}return}function Dr(s,i=[]){let a=kr(s,!0),d=[];for(let u of a){let c=new Set,f=u.name==="document"?"Rendered HTML":`Rendered HTML scope '${u.name}'`;for(let g of u.ids){if(!g.hasValue||!g.value){d.push(`${f} contains empty id`);continue}if(!Xi.test(g.value))d.push(`${f} contains unsafe id '${g.value}'`);if(c.has(g.value))d.push(`${f} contains duplicate id '${g.value}'`);c.add(g.value)}}let m=a[0].ids.map(({value:u})=>u);for(let u of new Set(i)){let c=m.filter((f)=>f===u).length;if(c!==1)d.push(`Expected rendered HTML id '${u}' to materialize exactly once; found ${c}`)}return d}function Gr(s,i=[]){let a=[],d=new Set,m=new Set(i),u=new Set;for(let f of s){if(!hs[f.type])a.push(`Unknown MDX component '${f.type}'${f.id?` at block '${f.id}'`:""}`);if(!f.id||typeof f.id!=="string")a.push(`MDX component '${f.type}' is missing required id`);else{if(!Xi.test(f.id))a.push(`MDX component '${f.type}' has unsafe id '${f.id}'; use a letter followed by letters, numbers, underscores, or hyphens`);if(m.has(f.id))a.push(`MDX component id '${f.id}' collides with renderer-owned id '${f.id}'`),a.push(`Duplicate MDX component id '${f.id}'`);if(d.has(f.id))a.push(`Duplicate MDX component id '${f.id}'`);else d.add(f.id)}if(f.type==="Wireframe"&&/<\/?(?:html|head|body|script)\b/i.test(f.body))a.push(`Wireframe '${f.id}' must be an HTML fragment without html/head/body/script tags`);if(f.type==="QuestionForm"||f.type==="Checklist")for(let g of D(f.body)){let t=ds(g),y=f.type==="QuestionForm"?[3,4]:[2,3];if(!y.includes(t.length)){a.push(`${f.type} '${f.id}' has invalid field count ${t.length}; expected ${y.join(" or ")}`);continue}if((f.type==="QuestionForm"?t.slice(0,3):t.slice(0,2)).some((V)=>V.length===0)){a.push(`${f.type} '${f.id}' has a blank required field`);continue}let b=t[0];if(u.has(b))a.push(`Duplicate readiness item id '${b}'`);else u.add(b);let X=f.type==="QuestionForm"?3:2,z=t[X];if(f.type==="QuestionForm"&&t.length===3&&(t[2]==="required"||t[2]==="advisory"))a.push(`QuestionForm '${f.id}' has readiness policy '${t[2]}' in the mode field`);else if(z!==void 0&&z!=="required"&&z!=="advisory")a.push(`${f.type} '${f.id}' has invalid readiness policy '${z}'`)}}let c=new Set([...d,...m]);for(let f of s){let g=Da(f);if(f.type==="Tabs"||f.type==="DiffTabs"){Bs(f.body).forEach((t,y)=>{if(!t)a.push(`${f.type} '${f.id}' contains an empty panel at position ${y+1}`)});for(let t of g){if(d.has(t))a.push(`Generated HTML id '${t}' for ${f.type} '${f.id}' collides with an authored block id`);else if(m.has(t))a.push(`Generated HTML id '${t}' for ${f.type} '${f.id}' collides with a renderer-owned id`);else if(c.has(t))a.push(`Generated HTML id '${t}' for ${f.type} '${f.id}' collides with another emitted id`);if(c.has(t))a.push(`Duplicate rendered id '${t}'`);c.add(t)}}else for(let t of g){if(c.has(t))a.push(`Duplicate rendered id '${t}'`);c.add(t)}}for(let f of s){if(f.type!=="Wireframe"&&f.type!=="StateGallery")continue;let g=Kv(f.body);if(g){a.push(`${f.type} '${f.id}' contains unterminated ${g}`);continue}let[t,...y]=kr(f.body,!1);for(let x of t.ids){if(!x.hasValue){a.push(`${f.type} '${f.id}' contains an id attribute without a value`);continue}if(!x.value){a.push(`${f.type} '${f.id}' contains an empty id attribute`);continue}if(!Xi.test(x.value))a.push(`${f.type} descendant has unsafe id '${x.value}' in '${f.id}'`);if(c.has(x.value))a.push(`${f.type} descendant id '${x.value}' in '${f.id}' collides with another emitted id`);c.add(x.value)}for(let x of y){let b=new Set;for(let X of x.ids){if(!X.hasValue||!X.value){a.push(`${f.type} '${f.id}' ${x.name} contains empty id`);continue}if(!Xi.test(X.value))a.push(`${f.type} '${f.id}' ${x.name} contains unsafe id '${X.value}'`);if(b.has(X.value))a.push(`${f.type} '${f.id}' ${x.name} contains duplicate id '${X.value}'`);b.add(X.value)}}}return a}function _r(s){let i=Js(s);if(s.status!=="approved")i.push("AgentHandoff cannot be generated unless ReviewState.status is approved");if(s.unresolvedCommentIds.length>0)i.push("AgentHandoff cannot be generated while unresolved blocking comments remain");return i}function ov(s){if(!s.startsWith(`---
`))return{frontmatter:{},body:s};let i=s.indexOf(`
---`,4);if(i===-1)return{frontmatter:{},body:s};let a=s.slice(4,i).trim(),d={};for(let m of a.split(/\r?\n/)){let u=m.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);if(u)d[u[1]]=u[2].replace(/^["']|["']$/g,"")}return{frontmatter:d,body:s.slice(i+5).replace(/^\n/,"")}}function va(s){let i={},a=/([A-Za-z_:][A-Za-z0-9_:.-]*)(?:=("[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+))?/g;for(let d of s.matchAll(a)){let m=d[1];if(!d[2]){i[m]=m==="id"?"":!0;continue}let u=d[2].trim();if(u.startsWith('"')&&u.endsWith('"')||u.startsWith("'")&&u.endsWith("'"))u=u.slice(1,-1);else if(u.startsWith("{")&&u.endsWith("}"))u=u.slice(1,-1).trim().replace(/^["']|["']$/g,"");if(/^-?\d+(?:\.\d+)?$/.test(u))i[m]=Number(u);else if(u==="true"||u==="false")i[m]=u==="true";else i[m]=u}return i}function Rv(s,i,a){let d=[],m=new Set,u=(g,t)=>{if(t!==-1&&!m.has(g))m.add(g),d.push({start:g,end:t})},c=new RegExp(`^[\\t ]*</${a}\\s*>[\\t ]*\\r?$`,"gm");c.lastIndex=i;for(let g=c.exec(s);g;g=c.exec(s)){let t=g.index+g[0].indexOf("<");u(t,s.indexOf(">",t))}let f=`</${a}`;for(let g=s.indexOf(f,i);g!==-1;g=s.indexOf(f,g+f.length)){if(!/[\s>]/.test(s[g+f.length]??""))continue;u(g,Vs(s,g+f.length))}return d.sort((g,t)=>g.start-t.start||g.end-t.end)}function Lv(s){function i(a,d,m){for(;a<s.length;){if(d&&Ia[d.type]){let V=Rv(s,a,d.type);if(!V.length){let Y=s.slice(a).match(/^[\t ]*<\/([A-Z][A-Za-z0-9]*)\s*>[\t ]*$/m);if(Y&&hs[Y[1]])throw Error(`Malformed MDX component source: closing '${Y[1]}' does not match open '${d.type}'`);throw Error(`Malformed MDX component source: unclosed '${d.type}'`)}let F;for(let Y of V){if(s.slice(Y.start+d.type.length+2,Y.end).trim()){F=Error(`Malformed MDX component source: malformed closing '${d.type}'`);continue}let B=va(d.attrs),j={id:typeof B.id==="string"?B.id:"",type:d.type,props:B,body:s.slice(d.bodyStart,Y.start).trim()};try{return i(Y.end+1,void 0,[...m,j])}catch(us){F=us}}throw F}let u=s.indexOf("<",a);if(u===-1)break;let c=s.slice(u),f=c.match(/^<(\/?)([A-Z][A-Za-z0-9]*)(?=[\s/>])/);if(!f){let V=c.match(/^<(\/?)([A-Z][A-Za-z0-9]*)/);if(V&&hs[V[2]]){let F=V[2],Y=c[V[0].length];if(Y!=="."&&Y!==":"){let I=Y===void 0?`incomplete tag '<${V[1]}${F}'`:`illegal continuation '${Y}' after supported component name '${F}'`;throw Error(`Malformed MDX component source: ${I}`)}}a=u+1;continue}let g=f[1]==="/",t=f[2],y=Boolean(hs[t]),x=Vs(s,u+f[0].length);if(x===-1)throw Error(`Malformed MDX component source: incomplete tag '<${g?"/":""}${t}'`);let b=s.slice(u+f[0].length,x),X=/\/\s*$/.test(b);if(a=x+1,d&&hs[d.type]&&!y)continue;if(g){if(b.trim())throw Error(`Malformed MDX component source: malformed closing '${t}'`);if(!d)throw Error(`Malformed MDX component source: unexpected closing '${t}'`);if(d.type!==t)throw Error(`Malformed MDX component source: closing '${t}' does not match open '${d.type}'`);let V=va(d.attrs);m.push({id:typeof V.id==="string"?V.id:"",type:t,props:V,body:s.slice(d.bodyStart,u).trim()}),d=void 0;continue}if(d){if(y)throw Error(`Malformed MDX component source: nested '${t}' inside '${d.type}' is not supported`);continue}let z=X?b.replace(/\/\s*$/,""):b;if(X){let V=va(z);m.push({id:typeof V.id==="string"?V.id:"",type:t,props:V,body:""})}else d={attrs:z,bodyStart:x+1,type:t}}if(d)throw Error(`Malformed MDX component source: unclosed '${d.type}'`);return m}return i(0,void 0,[])}function sd(s){let{frontmatter:i,body:a}=ov(s),d=Lv(a);if(d.length===0)d.push({id:String(i.slug??"markdown-body"),type:"Callout",props:{id:String(i.slug??"markdown-body"),tone:"note",title:i.title??"Plan"},body:a.trim()});return{frontmatter:i,blocks:d,raw:s}}function ps(s){return typeof s==="string"&&s.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(s)}function ea(s,i){if(Tr(i)||/^[A-Za-z]:[\\/]/.test(i)||i.startsWith("\\\\")||i.includes("\x00")||i.replaceAll("\\","/").split("/").includes(".."))return!1;let a=Ar(s),d=Ar(a,i),m=Uv(a,d);return m.length>0&&!m.startsWith(`..${process.platform==="win32"?"\\":"/"}`)&&!Tr(m)}function Bv(s,i,a){let d={kind:i.frontmatter.kind??"plan",slug:i.frontmatter.slug??pr(s),title:i.frontmatter.title??i.frontmatter.slug??pr(s),createdAt:i.frontmatter.createdAt??"1970-01-01T00:00:00.000Z",source:[],entry:"plan.mdx",dist:"dist",localOnly:!0},m={};if(a!==void 0){let f=JSON.parse(a);if(!f||typeof f!=="object"||Array.isArray(f))throw Error("Visual plan manifest must be an object");m=f;let g={kind:!0,slug:!0,title:!0,createdAt:!0,source:!0,entry:!0,dist:!0,localOnly:!0},t=Object.keys(m).filter((y)=>!g[y]);if(t.length)throw Error(`Visual plan manifest contains unknown field '${t[0]}'`)}let u={...d,...m},c=[];if(u.kind!=="plan"&&u.kind!=="recap"&&u.kind!=="styleguide")c.push("kind must be plan, recap, or styleguide");if(!ps(u.slug))c.push("slug must be a nonblank single-line string");if(!ps(u.title))c.push("title must be a nonblank single-line string");if(!ps(u.createdAt)||!Number.isFinite(Date.parse(u.createdAt))||new Date(u.createdAt).toISOString()!==u.createdAt)c.push("createdAt must be a canonical ISO timestamp");if(!Array.isArray(u.source)||u.source.some((f)=>!ps(f)||!ea(s,f)))c.push("source must be an array of nonblank single-line relative paths confined beneath the plan root");if(u.entry!=="plan.mdx"||!ea(s,u.entry))c.push("entry must identify the loaded plan.mdx beneath the plan root");if(!ps(u.dist)||!ea(s,u.dist))c.push("dist must be a nonblank relative path confined beneath the plan root");if(u.localOnly!==!0)c.push("localOnly must be true");if(c.length)throw Error(`Invalid visual plan manifest:
${c.join(`
`)}`);return u}function fa(s,i){let a=sd(i.plan),d=i.canvas===void 0?void 0:sd(i.canvas),m=Bv(s,a,i.manifest),u=Gr([...a.blocks,...d?.blocks??[]],d?["canvas"]:[]);if(u.length)throw Error(`Invalid plan source:
${u.join(`
`)}`);return{rootDir:s,manifest:m,plan:a,canvas:d}}async function id(s){try{return await ad(s,"utf8")}catch(i){if(typeof i==="object"&&i!==null&&"code"in i&&i.code==="ENOENT")return;throw i}}async function rd(s){let[i,a,d]=await Promise.all([ad(ua(s,"plan.mdx"),"utf8"),id(ua(s,"canvas.mdx")),id(ua(s,"visual-explainer.json"))]);return fa(s,{plan:i,canvas:a,manifest:d})}var Ov=`<!DOCTYPE html>
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
</html>`,nv=`
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
`;async function ud(){try{return await Cv("plugins/Muse/skills/muse/templates/interactive-plan-shell.html","utf8")}catch{return Ov}}function Mv(s){if(s.manifest.kind!=="styleguide")return"";let a=['<button type="button" data-component-filter="" aria-pressed="true">All</button>',...Array.from(new Set(Ls.map((c)=>mi[c].category))).map((c)=>`<button type="button" data-component-filter="${Q(c)}" aria-pressed="false">${Q(c)}</button>`)].join(""),d=s.plan.blocks.length,m=new Set(s.plan.blocks.map((c)=>c.type)).size,u=`${d} ${d===1?"example":"examples"} \xB7 ${m} unique of canonical ${Ls.length}`;return`<section class="ve-ip-explorer" data-component-explorer data-component-example-count="${d}" data-component-count="${m}" data-component-canonical-count="${Ls.length}" aria-labelledby="component-explorer-title"><div class="ve-ip-explorer-intro"><div><p class="ve-ip-label">Component reference</p><h2 id="component-explorer-title">Catalog</h2><p>Browse ${u}. Search by component name or purpose, filter by family, inspect the rendered result, then copy the exact MDX source.</p></div><label class="ve-ip-search"><span>Search components</span><input type="search" data-component-search placeholder="Try \u201Cdiagram\u201D, \u201Crisk\u201D, or \u201Creview\u201D" autocomplete="off" /></label></div><div class="ve-ip-filter-row" role="group" aria-label="Component families">${a}</div><p class="ve-ip-results" data-component-results aria-live="polite">${u}</p></section>`}function Nv(s){return s.plan.blocks.map((i)=>{let a=s.manifest.kind==="styleguide"?i.type:i.props.title??i.type;return`<a href="#${Q(i.id)}">${Q(a)}</a>`}).join("")}async function Sv(){return`<details class="ve-ip-block ve-ip-card ve-ip-third-party-notices"><summary>Third-party font notices</summary><div class="ve-ip-third-party-notices__body"><p>Copyright notices and SIL Open Font License 1.1 terms for fonts embedded in this portable file.</p>${(await Ma()).map((a)=>{let d=a.assets.map((m)=>`<li><code>${Q(m)}</code></li>`).join("");return`<article><h3>${Q(a.package)} ${Q(a.version)}</h3><p>Embedded assets:</p><ul>${d}</ul><pre class="code-block">${Q(a.text)}</pre></article>`}).join("")}</div></details>`}async function md(s,i=!1,a){let d=a??await ud(),m=s.manifest.kind==="styleguide",u=[Si(s.plan.blocks,{staticMode:i,componentExplorer:m}),s.canvas?`<section class="ve-ip-block ve-ip-card" id="canvas"><div class="ve-ip-label">Canvas</div><h2>Canvas</h2>${Si(s.canvas.blocks,{staticMode:i,componentExplorer:!1})}</section>`:"",i?await Sv():""].join(`
`),c=await na(i),f=i?"":'<section class="ve-ip-review-sync" data-review-sync aria-live="polite"><strong data-review-sync-title>Loading saved review\u2026</strong><span data-review-sync-detail>Review controls unlock after server state and comments load.</span><button type="button" data-review-retry hidden>Retry</button></section>',g=d.replaceAll("{{TITLE}}",Q(s.manifest.title)).replaceAll("{{KIND}}",Q(s.manifest.kind)).replaceAll("{{SUBTITLE}}",m?"A human-facing reference for every renderer-owned MDX component.":i?"Static export. Interactive persistence requires the local review bridge.":"Local interactive review surface.").replaceAll("{{REVIEW_AUTHORITY}}",i?"static":"loading").replaceAll("{{EXPLORER}}",Mv(s)).replaceAll("{{REVIEW_SYNC}}",f).replaceAll("{{NAV}}",Nv(s)).replaceAll("{{CONTENT}}",u).replaceAll("{{FONTS}}",c).replaceAll("{{STYLE}}",nv).replaceAll("{{MERMAID_URL}}",Ca).replaceAll("{{MERMAID_SRI}}",Oa).replaceAll("{{CLIENT}}",i?$a:Ea),t=[...s.plan.blocks,...s.canvas?.blocks??[]],y=m?new Set(s.plan.blocks):void 0,x=t.map(({id:X})=>X);if(s.canvas)x.push("canvas");for(let X of t){if(X.type!=="CommentAnchor"||y?.has(X))x.push(...p(X,"title"));if(x.push(...p(X,"instructions")),i)continue;x.push(...p(X,"tabs"),...p(X,"panels"))}let b=Dr(g,x);if(b.length)throw Error(`Invalid rendered HTML:
${b.join(`
`)}`);return g}async function zi(s){let i=await rd(s),a=ca(s,i.manifest.dist);await Pv(a,{recursive:!0}),await Na(a);let d=ca(a,"index.html"),m=ca(a,"static-export.html"),u=await ud();return await dd(d,await md(i,!1,u)),await dd(m,await md(i,!0,u)),{indexPath:d,staticExportPath:m}}import{readFile as Nd,realpath as We}from"fs/promises";import{join as Sd}from"path";import{createHash as be,randomUUID as cs}from"crypto";import{constants as G,realpathSync as we}from"fs";import{link as xe,lstat as J,mkdir as Qa,open as Li,readdir as As,readlink as Va,realpath as Xs,rename as ls,rm as T,symlink as Bi,writeFile as zd}from"fs/promises";import{basename as ye,join as Z,resolve as js}from"path";import{isDeepStrictEqual as ji}from"util";import{join as vd}from"path";var $v=/[\\\u0000-\u001f\u007f-\u00a0<>&#*_`\[\]()!|]/g;function fs(s){return String(s??"").replace($v,(i)=>`\\u${i.charCodeAt(0).toString(16).padStart(4,"0")}`)}function Ev(s){let i={};for(let a of s.plan.blocks){let d=D(a.body);if(d.length)(i[a.type]??=[]).push(...d)}return i}function la(s,i){let a=_r(i);if(a.length)throw Error(a.join(`
`));let d=Ev(s);return{status:"approved",planSlug:s.manifest.slug,planPath:vd(s.rootDir,s.manifest.entry),approvedAt:i.approvedAt??new Date().toISOString(),approvedScope:d.ImplementationTimeline??[],decisions:d.DecisionMatrix??[],answers:i.answers,implementationEntry:vd(s.rootDir,s.manifest.entry),approvalDigest:i.approvalDigest,verification:d.Checklist??[],openRisks:d.RiskRegister??[]}}function ed(s){let i=[...s.matchAll(/^Canonical-Handoff: ([A-Za-z0-9_-]+)$/gm)];if(i.length!==1)throw Error("Agent handoff Markdown must contain exactly one canonical payload");let a=JSON.parse(Buffer.from(i[0][1],"base64url").toString("utf8")),d=_s(a);if(d.length)throw Error(d.join(`
`));return a}function ga(s){let i=(m)=>m.length?m.map((u)=>`- ${fs(u)}`).join(`
`):"- None recorded",a=Object.entries(s.answers).length?Object.entries(s.answers).sort(([m],[u])=>m.localeCompare(u)).map(([m,u])=>`- ${fs(m)} = ${fs(JSON.stringify(u))}`).join(`
`):"- None recorded",d=Buffer.from(JSON.stringify(s),"utf8").toString("base64url");return`# Agent Handoff: ${fs(s.planSlug)}

Status: ${fs(s.status)}
Approved: ${fs(s.approvedAt)}
Plan: ${fs(s.planPath)}
Implementation-Entry: ${fs(s.implementationEntry)}
Approval-Digest: ${fs(s.approvalDigest)}
Canonical-Handoff: ${d}

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
`}import{constants as ws}from"fs";import{lstat as Ys,open as xd,readFile as Iv,realpath as kv}from"fs/promises";import{resolve as Zi}from"path";import{dlopen as ba,FFIType as R,ptr as fd,read as Dv}from"bun:ffi";var wa=".muse-review.lock",Gv=2,_v=4,pv=8,Wi=500,Tv=3221225472,Av=3,se=4,ie=128,ae=2097152,re=3,de=32,me=33,ue=0xffffffffffffffffn,ve,cd={flock:{args:[R.i32,R.i32],returns:R.i32}};function ld(s,i){if(s===null)throw Error(`${i} returned a null errno pointer`);return Dv.i32(s)}function ta(s,i){if(i==="darwin"){let d=ba(s,{...cd,__error:{args:[],returns:R.ptr}});return{flock:(m,u)=>d.symbols.flock(m,u),errno:()=>ld(d.symbols.__error(),"__error")}}let a=ba(s,{...cd,__errno_location:{args:[],returns:R.ptr}});return{flock:(d,m)=>a.symbols.flock(d,m),errno:()=>ld(a.symbols.__errno_location(),"__errno_location")}}function ee(s,i){return(i==="darwin"?{5:"EIO",9:"EBADF",35:"EWOULDBLOCK",45:"ENOTSUP",77:"ENOLCK",102:"EOPNOTSUPP"}:{5:"EIO",9:"EBADF",11:"EWOULDBLOCK",37:"ENOLCK",38:"ENOSYS",95:"EOPNOTSUPP"})[s]??`ERRNO_${s}`}function gd(s,i,a,d){let m=ee(a,d),u=Object.assign(Error(`${m}: flock ${i} failed for ${s}`),{code:m,errno:a,syscall:"flock",path:s});return Error(`Could not ${i} review lock at ${s}: ${m} (${a})`,{cause:u})}function td(s,i,a,d,m){if(s(a,Gv|_v)!==0){let u=i();if(u===(m==="darwin"?35:11))return;throw gd(d,"acquire",u,m)}return{release(){if(s(a,pv)!==0)throw gd(d,"release",i(),m)}}}function fe(s){let i=new Uint16Array(s.length+1);for(let a=0;a<s.length;a+=1)i[a]=s.charCodeAt(a);return i}async function ce(){if(process.platform==="win32"){let d=ba("kernel32.dll",{CreateFileW:{args:[R.ptr,R.u32,R.u32,R.ptr,R.u32,R.u32,R.u64],returns:R.u64},LockFileEx:{args:[R.u64,R.u32,R.u32,R.u32,R.u32,R.ptr],returns:R.i32},CloseHandle:{args:[R.u64],returns:R.i32},GetLastError:{args:[],returns:R.u32}});return{kind:"windows",async tryLock(m){let u=Zi(m.path,wa),c=fe(u),f=d.symbols.CreateFileW(fd(c),Tv,Av,null,se,ie|ae,0n);if(f===ue){let y=d.symbols.GetLastError();if(y===de)return;throw Error(`CreateFileW failed for the review lock with Windows error ${y}`)}let g;try{if(g=await Ys(u,{bigint:!0}),!g.isFile()||g.isSymbolicLink())throw Error(`Review lock path must be a regular non-symlink file at ${u}`)}catch(y){throw d.symbols.CloseHandle(f),y}let t=new Uint8Array(32);for(let y=0;y<Wi;y+=1){if(d.symbols.LockFileEx(f,re,0,4294967295,4294967295,fd(t))!==0){try{let b=await Ys(u,{bigint:!0});if(!b.isFile()||b.isSymbolicLink()||b.dev!==g.dev||b.ino!==g.ino||b.size!==g.size||b.mtimeNs!==g.mtimeNs||b.ctimeNs!==g.ctimeNs)throw Error(`Review lock path generation changed during Windows acquisition at ${u}`)}catch(b){throw d.symbols.CloseHandle(f),b}return{release(){d.symbols.CloseHandle(f)}}}let x=d.symbols.GetLastError();if(x!==me)throw d.symbols.CloseHandle(f),Error(`LockFileEx failed for the review lock with Windows error ${x}`);if(y+1===Wi)throw d.symbols.CloseHandle(f),Error(`Timed out waiting for Windows review lock at ${u}`);await Bun.sleep(10)}throw d.symbols.CloseHandle(f),Error(`Timed out waiting for Windows review lock at ${u}`)}}}if(process.platform!=="darwin"&&process.platform!=="linux")throw Error(`Review locking is unsupported on ${process.platform}`);let s=process.platform,i;if(s==="darwin")i=ta("/usr/lib/libSystem.B.dylib",s);else{let d=process.arch==="x64"?"x86_64":process.arch==="arm64"?"aarch64":process.arch,m=["libc.so.6","libc.so",`ld-musl-${d}.so.1`,`/lib/ld-musl-${d}.so.1`];for(let u of m)try{i=ta(u,s);break}catch{}if(!i){let u="";try{u=await Iv("/proc/self/maps","utf8")}catch{throw Error("Could not resolve Linux libc for review locking")}let f=(u.match(/\/\S*(?:libc\.so(?:\.\d+)*|ld-musl-[^\s/]+\.so\.1)/g)??[]).find((g)=>!g.includes("libcap")&&!g.includes("libcrypto"));if(!f)throw Error("Could not resolve the loaded Linux libc for review locking");i=ta(f,s)}}if(!i)throw Error("Could not initialize Unix libc review locking");let a=i;return{kind:"unix",async tryLock(d){return td(a.flock,a.errno,d.handle.fd,d.path,s)},async tryLegacyLock(d){return td(a.flock,a.errno,d.handle.fd,d.path,s)}}}async function le(s){let i=await kv(s),a=await xd(i,ws.O_RDONLY|ws.O_DIRECTORY|ws.O_NOFOLLOW|ws.O_NONBLOCK);try{let[d,m]=await Promise.all([a.stat({bigint:!0}),Ys(i,{bigint:!0})]);if(!d.isDirectory()||!m.isDirectory()||m.isSymbolicLink()||d.dev!==m.dev||d.ino!==m.ino)throw Error(`Plan root is not bound to its opened generation at ${i}`);return{path:i,handle:a,descriptor:d}}catch(d){throw await a.close(),d}}async function bd(s){let[i,a]=await Promise.all([s.handle.stat({bigint:!0}),Ys(s.path,{bigint:!0})]);if(!i.isDirectory()||!a.isDirectory()||a.isSymbolicLink()||i.dev!==s.descriptor.dev||i.ino!==s.descriptor.ino||a.dev!==i.dev||a.ino!==i.ino)throw Error(`Plan root generation changed at ${s.path}`)}async function ge(s){let i=Zi(s.path,wa),a=await xd(i,ws.O_RDWR|ws.O_CREAT|ws.O_NOFOLLOW|ws.O_NONBLOCK,384);try{let[d,m]=await Promise.all([a.stat({bigint:!0}),Ys(i,{bigint:!0})]);if(!d.isFile()||!m.isFile()||m.isSymbolicLink()||d.dev!==m.dev||d.ino!==m.ino)throw Error(`Review lock path is not bound to its opened file at ${i}`);return{path:i,handle:a,descriptor:d}}catch(d){throw await a.close(),d}}async function te(s){let[i,a]=await Promise.all([s.handle.stat({bigint:!0}),Ys(s.path,{bigint:!0})]);if(!i.isFile()||!a.isFile()||a.isSymbolicLink()||i.dev!==s.descriptor.dev||i.ino!==s.descriptor.ino||a.dev!==i.dev||a.ino!==i.ino)throw Error(`Review lock path generation changed at ${s.path}`)}async function wd(s,i,a,d){let m=[];try{a?.release()}catch(u){m.push(u)}try{await d?.handle.close()}catch(u){m.push(u)}try{s.release()}catch(u){m.push(u)}try{await i.handle.close()}catch(u){m.push(u)}return m}async function xa(s){let i=await(ve??=ce());for(let a=0;a<Wi;a+=1){let d=await le(s),m;try{m=await i.tryLock(d)}catch(f){throw await d.handle.close(),f}if(m===void 0){await d.handle.close(),await Bun.sleep(10);continue}let u,c;try{if(i.kind==="unix"){u=await ge(d);for(let y=0;y<Wi;y+=1){if(await bd(d),c=await i.tryLegacyLock(u),c!==void 0)break;await Bun.sleep(10)}if(!c)throw Error(`Timed out waiting for legacy review lock at ${Zi(d.path,wa)}`)}let f=!1,g=async()=>{if(f)throw Error(`Review lock was already released for ${d.path}`);await bd(d)},t=async()=>{if(await g(),u)await te(u)};return await t(),{assertOwned:t,assertCanonicalOwned:g,async release(){if(f)return;f=!0;let y=await wd(m,d,c,u);if(y.length)throw AggregateError(y,`Review lock release failed for ${d.path}`)}}}catch(f){let g=await wd(m,d,c,u);if(g.length)throw AggregateError([f,...g],`Review lock acquisition cleanup failed for ${d.path}`);throw f}}throw Error(`Timed out waiting for review lock for ${Zi(s)}`)}var Ki=".muse-review",_="current",Zd="initialized",Qs=["plan-state.json","comments.json","agent-handoff.json","agent-handoff.md"],he=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,Wd=64;class Pi extends Error{constructor(){super(`Review wait limit exceeded; at most ${Wd} waiters are supported`);this.name="ReviewWaiterLimitError"}}class ha extends Error{constructor(){super("Review wait aborted");this.name="ReviewWaitAbortedError"}}var Yi=new Map,Ts=new Map;function Ji(s){try{s?.()}catch{}}function He(s,i){let a={planDir:s,generation:i};for(let m of Yi.get(s)??[])try{m(a)}catch{}let d=Ts.get(s);if(!d)return;Ts.delete(s);for(let m of d)m.resolve(i)}function Jd(s,i){let a=we(s),d=Yi.get(a)??new Set;return d.add(i),Yi.set(a,d),()=>{if(d.delete(i),d.size===0)Yi.delete(a)}}async function Yd(s,i,a={}){let d=await Xs(s),m=Ts.get(d)??new Set;if(m.size>=Wd)throw new Pi;let u=!1,c=!1,f,g=(x)=>{if(m.delete(x),m.size===0)Ts.delete(d);if(f)a.signal?.removeEventListener("abort",f)},t,y=new Promise((x,b)=>{t={resolve:x,reject:b}});if(f=()=>{if(g(t),t.reject(new ha),u&&!c)c=!0,Ji(a.onCancelled)},a.signal?.aborted)throw f(),new ha;a.signal?.addEventListener("abort",f,{once:!0}),m.add(t),Ts.set(d,m);try{let x=await ii(d);if(x.generation!==i)return g(t),x;return u=!0,Ji(a.onParked),await y,g(t),c=!0,Ji(a.onDelivered),await ii(d)}catch(x){if(g(t),u&&!c)c=!0,Ji(a.onCancelled);throw x}}class gs extends Error{failure;constructor(s,i){super(i);this.failure=s;this.name="ReviewOperationError"}}class za extends Error{published;restorable;constructor(s,i,a){super("Published review snapshot failed canonical postcommit verification",{cause:a});this.published=s;this.restorable=i;this.name="SnapshotCommitVerificationError"}}function L(s,i){return s.dev===i.dev&&s.ino===i.ino&&s.size===i.size&&s.mtimeNs===i.mtimeNs&&s.ctimeNs===i.ctimeNs}function Fs(s,i){return s.dev===i.dev&&s.ino===i.ino}async function A(s){let i=await Li(s,G.O_RDONLY|G.O_DIRECTORY|G.O_NOFOLLOW|G.O_NONBLOCK);try{let[a,d]=await Promise.all([i.stat({bigint:!0}),J(s,{bigint:!0})]);if(!a.isDirectory()||!d.isDirectory()||d.isSymbolicLink()||a.dev!==d.dev||a.ino!==d.ino)throw Error(`Directory path is not bound to its opened generation at ${s}`);return{path:s,handle:i,stats:a}}catch(a){throw await i.close(),a}}async function U(s){let[i,a]=await Promise.all([s.handle.stat({bigint:!0}),J(s.path,{bigint:!0})]);if(i.dev!==s.stats.dev||i.ino!==s.stats.ino||a.dev!==s.stats.dev||a.ino!==s.stats.ino)throw Error(`Directory path generation changed at ${s.path}`)}async function Za(s,i){if(i>BigInt(Number.MAX_SAFE_INTEGER))throw Error("Plan authority file is too large to read safely");let a=Buffer.alloc(Number(i)),d=0;while(d<a.length){let m=await s.read(a,d,a.length-d,d);if(m.bytesRead===0)throw Error("Plan authority file ended while being read");d+=m.bytesRead}return a}async function ya(s,i){let a;try{a=await Li(s,G.O_RDONLY|G.O_NOFOLLOW|G.O_NONBLOCK)}catch(d){if(!i&&typeof d==="object"&&d!==null&&"code"in d&&d.code==="ENOENT")return{path:s,exists:!1};throw d}try{let[d,m]=await Promise.all([a.stat({bigint:!0}),J(s,{bigint:!0})]);if(!d.isFile()||!m.isFile()||m.isSymbolicLink()||d.dev!==m.dev||d.ino!==m.ino)throw Error(`Plan authority path is not bound to its opened file at ${s}`);let u=await Za(a,d.size),[c,f]=await Promise.all([a.stat({bigint:!0}),J(s,{bigint:!0})]);if(!L(d,c)||!L(d,f))throw Error(`Plan authority changed while being captured at ${s}`);return{path:s,exists:!0,bytes:u,handle:a,stats:d}}catch(d){throw await a.close(),d}}async function Fd(s){let i=await J(s,{bigint:!0});if(!i.isDirectory()||i.isSymbolicLink())throw Error(`Plan root must be a non-symlink directory at ${s}`);let a=await Promise.allSettled([ya(Z(s,"plan.mdx"),!0),ya(Z(s,"canvas.mdx"),!1),ya(Z(s,"visual-explainer.json"),!1)]),d=a.find((u)=>u.status==="rejected");if(d)throw await Promise.allSettled(a.filter((u)=>u.status==="fulfilled").map((u)=>u.value.handle?.close())),d.reason;let m=a.map((u)=>u.value);try{let u=await J(s,{bigint:!0});if(!L(i,u))throw Error(`Plan root changed while authority was captured at ${s}`);let[c,f,g]=m;return{root:i,files:m,plan:fa(s,{plan:c.bytes.toString("utf8"),canvas:f.bytes?.toString("utf8"),manifest:g.bytes?.toString("utf8")})}}catch(u){throw await Promise.allSettled(m.map((c)=>c.handle?.close())),u}}async function Wa(s,i){let a=await J(s,{bigint:!0});if(i.root.dev!==a.dev||i.root.ino!==a.ino)throw Error(`Plan root generation changed at ${s}`);for(let d of i.files){if(!d.exists){if(await Ud(d.path))throw Error(`Plan source appeared during approval at ${d.path}`);continue}let[m,u,c]=await Promise.all([d.handle.stat({bigint:!0}),J(d.path,{bigint:!0}),Za(d.handle,d.stats.size)]);if(!L(d.stats,m)||!L(d.stats,u)||!c.equals(d.bytes))throw Error(`Plan source changed during approval at ${d.path}`)}}async function jd(s){if(s)await Promise.allSettled(s.files.map((i)=>i.handle?.close()))}async function rs(s,i){let a=Z(s,Ki);if(i)try{await Qa(a)}catch(c){if(!(typeof c==="object"&&c!==null&&("code"in c)&&c.code==="EEXIST"))throw c}let d=await J(a);if(!d.isDirectory()||d.isSymbolicLink())throw Error(`Review store must be a plan-local non-symlink directory at ${a}`);let[m,u]=await Promise.all([Xs(s),Xs(a)]);if(u!==js(m,Ki))throw Error(`Review store escapes the plan directory at ${a}`);return a}async function Ci(s,i){let a=await rs(s,i),d=Z(a,"bundles");if(i)try{await Qa(d)}catch(f){if(!(typeof f==="object"&&f!==null&&("code"in f)&&f.code==="EEXIST"))throw f}let m=await J(d);if(!m.isDirectory()||m.isSymbolicLink())throw Error(`Review bundles root must be a plan-local non-symlink directory at ${d}`);let[u,c]=await Promise.all([Xs(a),Xs(d)]);if(c!==js(u,"bundles"))throw Error(`Review bundles root escapes the review store at ${d}`);return d}async function Ks(s,i){let a=await rs(s,!1),d=await Ci(s,!1),m=await J(i,{bigint:!0});if(!m.isSymbolicLink())throw Error(`Current review pointer is not a symlink at ${i}`);let u=await Va(i),c=u.replaceAll("\\","/"),f=c.match(/^bundles\/([0-9a-f-]+)$/);if(!f||!he.test(f[1]))throw Error(`Invalid current review bundle target '${u}'`);let g=Z(d,f[1]),[t,y]=await Promise.all([J(g,{bigint:!0}),J(i,{bigint:!0})]);if(!L(m,y))throw Error(`Current review pointer generation changed at ${i}`);if(!t.isDirectory()||t.isSymbolicLink()||js(a,c)!==js(g))throw Error(`Current review bundle is not a regular directory at ${g}`);return{id:f[1],path:g,directory:t,pointer:m}}async function Ui(s){let i=await rs(s,!1);return Ks(s,Z(i,_))}async function Kd(s){let i;try{i=await rs(s,!1)}catch(a){if(typeof a==="object"&&a!==null&&"code"in a&&a.code==="ENOENT")return;throw a}try{await J(Z(i,_))}catch(a){if(typeof a==="object"&&a!==null&&"code"in a&&a.code==="ENOENT")return;throw a}return Ui(s)}async function Ud(s){try{return await J(s),!0}catch(i){if(typeof i==="object"&&i!==null&&"code"in i&&i.code==="ENOENT")return!1;throw i}}function yd(s){return typeof s==="string"&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s}function od(s){if(s===void 0)return[];let i=JSON.parse(s);if(!Array.isArray(i))throw Error("Comments must be an array");let a={id:!0,blockId:!0,anchor:!0,body:!0,status:!0,createdAt:!0,resolvedAt:!0},d=new Set;for(let m of i){if(!m||typeof m!=="object"||Array.isArray(m))throw Error("Each comment must be an object");let u=m,c=Object.keys(u).find((g)=>!a[g]);if(c)throw Error(`Comment contains unknown field '${c}'`);let f=u.status==="resolved";if(typeof u.id!=="string"||u.id.trim().length===0||d.has(u.id)||typeof u.blockId!=="string"||u.blockId.trim().length===0||typeof u.body!=="string"||u.body.trim().length===0||!yd(u.createdAt)||u.status!=="open"&&!f||u.anchor!==void 0&&(typeof u.anchor!=="string"||u.anchor.trim().length===0)||f&&(!yd(u.resolvedAt)||Date.parse(u.resolvedAt)<Date.parse(u.createdAt))||!f&&u.resolvedAt!==void 0)throw Error("Comments must have unique nonblank ids, valid timestamps, and coherent open/resolved fields");d.add(u.id)}return i}function Rd(s,i){return[...s.plan.blocks,...s.canvas?.blocks??[]].some((a)=>a.id===i)}function Ja(s,i){let a=i.find((d)=>!Rd(s,d.blockId));if(a)throw Error(`Persisted comment '${a.id}' references unknown blockId '${a.blockId}'`)}async function ys(s,i,a){let d=await Ld(s,a);return Ja(i.plan,d.comments),d}function Ha(s){if(Array.isArray(s))return s.map(Ha);if(!s||typeof s!=="object")return s;return Object.fromEntries(Object.entries(s).sort(([i],[a])=>i.localeCompare(a)).map(([i,a])=>[i,Ha(a)]))}function si(s,i,a){let{approvalDigest:d,...m}=i,u=Ha({sources:Object.fromEntries(s.files.map((c)=>[ye(c.path),c.exists?{exists:!0,bytes:c.bytes.toString("base64")}:{exists:!1}])),state:m,comments:a});return be("sha256").update(JSON.stringify(u)).digest("hex")}function Ya(s,i){if(i.state.status!=="approved"||i.handoffJson===void 0||i.handoffMarkdown===void 0||i.state.approvalDigest!==si(s,i.state,i.comments))throw Error("No coherent approved handoff is published");let a=JSON.parse(i.handoffJson),d=la(s.plan,i.state);if(_s(a).length>0||!ji(a,d)||i.handoffMarkdown!==ga(d)||!ji(ed(i.handoffMarkdown),d))throw Error("No coherent approved handoff is published")}async function qe(s,i){let a=Z(s,i),d;try{d=await Li(a,G.O_RDONLY|G.O_NOFOLLOW|G.O_NONBLOCK)}catch(c){if(typeof c==="object"&&c!==null&&"code"in c&&c.code==="ELOOP")throw Error(`Review bundle member '${i}' must be a regular non-symlink file`);throw c}let[m,u]=await Promise.all([d.stat({bigint:!0}),J(a,{bigint:!0})]);if(!m.isFile()||!u.isFile()||u.isSymbolicLink()||m.dev!==u.dev||m.ino!==u.ino)throw await d.close(),Error(`Review bundle member '${i}' must be a stable regular non-symlink file`);return{file:i,path:a,handle:d,before:m}}async function Ld(s,i){let a=await J(s,{bigint:!0});if(i&&!L(i,a))throw Error(`Review bundle path generation changed before it was read at ${s}`);let d=(await As(s)).sort();for(let x of d)if(!Qs.includes(x))throw Error(`Review bundle contains unexpected member '${x}' at ${s}`);for(let x of["plan-state.json","comments.json"])if(!d.includes(x))throw Error(`Review bundle is missing ${x} at ${s}`);if(["agent-handoff.json","agent-handoff.md"].filter((x)=>d.includes(x)).length===1)throw Error(`Review bundle must contain a coherent handoff pair at ${s}`);let u={},c=[];try{for(let x of d)c.push(await qe(s,x));for(let x of c)u[x.file]=await x.handle.readFile("utf8");for(let x of c){let[b,X]=await Promise.all([x.handle.stat({bigint:!0}),J(x.path,{bigint:!0})]);if(!L(b,x.before)||!L(X,x.before))throw Error(`Review bundle member '${x.file}' changed or was rebound while it was being read at ${s}`)}}finally{await Promise.allSettled(c.map((x)=>x.handle.close()))}let[f,g]=await Promise.all([As(s).then((x)=>x.sort()),J(s,{bigint:!0})]);if(!ji(f,d)||!L(g,a)||i!==void 0&&!L(g,i))throw Error(`Review bundle changed or was rebound while it was being read at ${s}`);let t=JSON.parse(u["plan-state.json"]),y=Js(t);if(y.length)throw Error(y.join(`
`));return{state:t,comments:od(u["comments.json"]),handoffJson:u["agent-handoff.json"],handoffMarkdown:u["agent-handoff.md"]}}async function hd(s,i){Ja(i.plan,s.comments);let a=i.plan,d=s.comments.filter((y)=>y.status==="open").map((y)=>y.id),m={...s.state,unresolvedCommentIds:d},{handoffJson:u,handoffMarkdown:c}=s,f=!1,g=d.length===0&&ma([...a.plan.blocks,...a.canvas?.blocks??[]],m).length===0,t=m.status!=="approved"||m.approvalDigest===si(i,m,s.comments);if(m.status==="approved"&&g&&t)try{Ya(i,{...s,state:m}),f=!0}catch{f=!1}if(m.status==="approved"&&(!g||!t||!f)){let{approvedAt:y,reviewer:x,approvalDigest:b,...X}=m;m={...X,status:"needs_revision"}}if(m.status!=="approved")u=void 0,c=void 0;return{state:m,comments:s.comments,handoffJson:u,handoffMarkdown:c}}function Xe(s,i){if(i==="plan-state.json")return`${JSON.stringify(s.state,null,2)}
`;if(i==="comments.json")return`${JSON.stringify(s.comments,null,2)}
`;if(i==="agent-handoff.json")return s.handoffJson;return s.handoffMarkdown}async function oi(s,i,a,d){let m=`${i}.${cs()}.invalid`;await U(s),await d(),await ls(i,m);let u=await n(m),c,f;try{c=await Ks(js(s.path,".."),m)}catch(g){f=g}if(u.stats&&Fs(u.stats,a.pointer)){if(f!==void 0)throw AggregateError([f],"Moved expected review pointer could not be verified");if(!c||c.id!==a.id||!L(c.directory,a.directory))throw Error("Moved expected review pointer resolved a different publication");return!0}try{if(u.kind!=="symlink")throw Error(`Moved review pointer is not a symlink at ${m}`);await U(s),await d(),await Bi(u.target,i);let g=await Ks(js(s.path,".."),i);if(c&&(g.id!==c.id||!L(g.directory,c.directory)))throw Error("Restored review successor does not resolve the moved publication");let t={path:i,kind:"symlink",target:u.target,stats:g.pointer};await d(),await Promise.all([Xa(t),Fa(u)]),await T(m,{force:!0})}catch(g){throw AggregateError([...f===void 0?[]:[f],g],c?"Distinct review successor could not be restored after conditional quarantine":"Moved review pointer could not be verified and restoration was incomplete")}if(f!==void 0)throw f;return!1}async function xs(s,i,a,d,m,u=!1){let c=await rs(s,!0),f=await Ci(s,!0),[g,t]=await Promise.all([A(c),A(f)]),y=cs(),x=Z(f,`${y}.staging`),b=Z(f,y),X=Z(c,`current.${y}.pointer`),z=!1,V,F,Y=async()=>{await Promise.allSettled([V?.handle.close(),t.handle.close(),g.handle.close()])},I=async()=>{let k=!0;try{if(await Promise.all([U(g),U(t)]),z){let ts=await J(b,{bigint:!0});k=ts.dev===V.stats.dev&&ts.ino===V.stats.ino}}catch{k=!1}if(k)await a(),await Promise.allSettled([T(x,{recursive:!0,force:!0}),T(X,{force:!0}),...z?[T(b,{recursive:!0,force:!0})]:[]])};try{await U(t),await a(),await Qa(x),V=await A(x);for(let k of Qs){let ts=Xe(i,k);if(ts!==void 0)await U(V),await a(),await zd(Z(x,k),ts,{flag:"wx"})}await U(V),await U(t),await a(),await ls(x,b),z=!0,F=await J(b,{bigint:!0}),await U(g),await a(),await Bi(`bundles/${y}`,X),await m?.(),await U(g)}catch(k){throw await I(),await Y(),k}if(!F)throw await Y(),Error("Published review bundle generation was not captured");let B=await Ks(s,X),j={id:y,path:b,directory:F,pointer:B.pointer};if(B.id!==j.id||!L(B.directory,j.directory))throw await I(),await Y(),Error("Prepared current pointer does not resolve the published review generation");await Promise.allSettled([V?.handle.close(),t.handle.close()]),await a(),await ls(X,Z(c,_)),d?.(j);let us=!1,Pa=!1;try{await U(g),us=!0;let k=await Ui(s);if(Pa=!0,k.id!==j.id||!L(k.directory,j.directory)||!Fs(k.pointer,j.pointer))throw Error("Canonical current pointer does not resolve the published review generation")}catch(k){let ts=us&&u&&!Pa;if(us&&!ts)await oi(g,Z(c,_),j,a);throw new za(j,ts,k)}finally{await g.handle.close().catch(()=>{return})}return j}async function qa(s,i,a,d,m){let u=await rs(s,!1),c=await A(u),f=Z(u,`current.${cs()}.rollback`),g,t=!1;try{let y=await Ui(s);if(y.id!==d.id||!L(y.directory,d.directory)||!Fs(y.pointer,d.pointer))throw Error("Published approval generation changed before rollback");await Bi(`bundles/${i.id}`,f),await U(a),await U(c),g=await J(f,{bigint:!0});let x=await J(Z(u,_),{bigint:!0});if(!Fs(x,d.pointer))throw Error("Published approval pointer generation changed before rollback");await m(),await ls(f,Z(u,_)),t=!0,await U(c);let b=await Ui(s);if(b.id!==i.id||!L(b.directory,i.directory)||!Fs(b.pointer,g))throw Error("Canonical current pointer does not resolve the restored prior generation")}catch(y){let x=[];try{if(t&&g)await oi(c,Z(u,_),{...i,pointer:g},m);else await U(c),await oi(c,Z(u,_),d,m)}catch(b){x.push(b)}if(!t)try{await T(f,{force:!0})}catch(b){x.push(b)}if(await Promise.allSettled([a.handle.close(),c.handle.close()]),x.length)throw AggregateError([y,...x],"Prior review publication rollback failed and cleanup was incomplete");throw y}await Promise.allSettled([a.handle.close(),c.handle.close()])}async function Qe(s,i,a,d){let m=await rs(s,!1),u=Z(m,`current.${cs()}.invalid`);if(await d(),await ls(Z(m,_),u),(await Ks(s,u)).id!==i.id)throw Error("Current approval generation changed while being invalidated");let f=await xs(s,a,d);try{await d(),await T(u,{force:!0})}catch(g){console.warn(`Invalidation committed; deferred pointer cleanup: ${g instanceof Error?g.message:String(g)}`)}return f}async function Ve(s){let i=await rs(s,!1),a=(await As(i)).filter((d)=>d.startsWith("current.")&&d.endsWith(".invalid"));if(a.length===0)return;if(a.length!==1)throw Error("Review store has multiple invalidated approval generations");return Ks(s,Z(i,a[0]))}class O extends Error{}async function n(s){let i;try{i=await J(s,{bigint:!0})}catch(d){if(typeof d==="object"&&d!==null&&"code"in d&&d.code==="ENOENT")return{path:s,kind:"missing"};throw d}if(i.isSymbolicLink()){let d=await Va(s),m=await J(s,{bigint:!0});if(!L(i,m))throw new O(`Legacy path changed while captured at ${s}`);return{path:s,kind:"symlink",target:d,stats:i}}if(!i.isFile())throw Error(`Unsupported compatibility path at ${s}`);let a=await Li(s,G.O_RDONLY|G.O_NOFOLLOW|G.O_NONBLOCK);try{let d=await a.stat({bigint:!0});if(d.dev!==i.dev||d.ino!==i.ino)throw new O(`Legacy path was rebound while captured at ${s}`);let m=await Za(a,d.size),[u,c]=await Promise.all([a.stat({bigint:!0}),J(s,{bigint:!0})]);if(!L(d,u)||!L(d,c))throw new O(`Legacy path changed while captured at ${s}`);return{path:s,kind:"file",content:m,stats:d}}finally{await a.close()}}async function Bd(s){return Promise.all(Qs.map((i)=>n(Z(s,i))))}async function Xa(s){let i=await n(s.path);if(!(i.kind===s.kind&&(i.kind==="missing"||L(i.stats,s.stats)&&(i.kind==="file"?i.content.equals(s.content):i.target===s.target))))throw new O(`Legacy path generation changed at ${s.path}`)}function Pd(s){let i=(u)=>{let c=s[Qs.indexOf(u)];if(c.kind==="symlink")throw Error(`Legacy review path must not be a symlink at ${c.path}`);return c.content?.toString("utf8")},a=i("plan-state.json"),d=a===void 0?Ir():JSON.parse(a),m=Js(d).filter((u)=>u!=="Approved ReviewState.approvalDigest must be a canonical SHA-256 digest");if(m.length)throw Error(m.join(`
`));return{state:d,comments:od(i("comments.json")),handoffJson:i("agent-handoff.json"),handoffMarkdown:i("agent-handoff.md")}}function Us(s,i){return s.kind===i.kind&&s.kind!=="missing"&&s.stats.dev===i.stats.dev&&s.stats.ino===i.stats.ino&&(s.kind==="file"?s.content.equals(i.content):s.target===i.target)}function Hd(s,i){if(s.stats!==void 0)return Us(s,i);return s.kind==="symlink"&&i.kind==="symlink"&&s.target===i.target}async function Fa(s){let i=await n(s.path);if(!(s.kind==="missing"?i.kind==="missing":Us(s,i)))throw new O(`Legacy path generation changed at ${s.path}`)}async function Ri(s,i,a){let d=await n(i);if(!Us(s,d))throw new O(`Quarantined compatibility generation changed at ${s.path}`);await a(),await xe(i,s.path),await Fa(s),await a(),await T(i,{force:!0})}async function Fi(s,i){let a=`${s.original.path}.${cs()}.rollback`;await i();let d=await n(s.original.path);if(!s.created||!Hd(s.installed,d))throw new O(`Compatibility path changed before rollback at ${s.original.path}`);if(s.quarantine){let u=await n(s.quarantine);if(!Us(s.original,u))throw new O(`Quarantined compatibility generation changed at ${s.original.path}`)}else if(s.original.kind!=="missing")throw Error(`Compatibility rollback is missing quarantine authority at ${s.original.path}`);await i(),await ls(s.original.path,a);let m=await n(a);if(!Hd(s.installed,m))throw new O(`Compatibility path changed during rollback at ${s.original.path}`);try{if((await n(s.original.path)).kind!=="missing")throw new O(`External compatibility successor appeared during rollback at ${s.original.path}`);if(s.quarantine)await Ri(s.original,s.quarantine,i);else await Fa(s.original)}catch(u){let c=[u];try{if((await n(s.original.path)).kind==="missing")await Ri({...m,path:s.original.path},a,i)}catch(f){c.push(f)}throw AggregateError(c,`Compatibility rollback retained ambiguous generations at ${s.original.path}`)}await i(),await T(a,{force:!0})}async function ze(s,i,a){let d=await A(s),m=[];try{for(let u=0;u<Qs.length;u+=1){let c=Qs[u],f=i[u],g=Z(s,c),t=Z(Ki,_,c),y;if(await U(d),await Xa(f),f.kind!=="missing"){y=Z(s,`.${c}.${cs()}.legacy`),await a(),await ls(g,y);let b=await n(y);if(!Us(f,b)){let X=new O(`Legacy path changed during conditional migration at ${g}`);try{await Ri({...b,path:g},y,a)}catch(z){throw AggregateError([X,z],`Conditional compatibility migration rollback failed at ${g}`)}throw X}}let x={original:f,installed:{path:g,kind:"symlink",target:t},quarantine:y,created:!1};m.push(x);try{await U(d),await a(),await Bi(t,g),x.created=!0;let b=await J(g,{bigint:!0});if(!b.isSymbolicLink())throw Error(`Installed compatibility path is not a symlink at ${g}`);x.installed={...x.installed,stats:b},await Xa(x.installed)}catch(b){let X=[];if(!x.created){if(m.pop()!==x)throw Error(`Compatibility replacement bookkeeping changed at ${g}`)}if(!x.created&&y){let z=!1;try{let V=await n(g),F=await n(y);if(!Us(f,F))throw new O(`Quarantined compatibility generation changed at ${g}`);if(V.kind!=="missing")throw z=!0,await a(),await T(y,{force:!0}),new O(`Compatibility destination changed during migration at ${g}`);await Ri(f,y,a)}catch(V){if(z)throw V;X.push(V)}}if(X.length)throw AggregateError([b,...X],`Compatibility installation failed and rollback was incomplete at ${g}`);if(b instanceof O)throw b;if(typeof b==="object"&&b!==null&&"code"in b&&b.code==="EEXIST")throw new O(`Compatibility destination changed during migration at ${g}`);throw b}}return m}catch(u){let c=[];for(let f of m.reverse())try{await U(d),await Fi(f,a)}catch(g){c.push(g)}if(c.length)throw AggregateError([u,...c],"Compatibility setup failed and rollback was incomplete");throw u}finally{await d.handle.close()}}async function qd(s){for(let i of Qs)try{if(await Va(Z(s,i))!==Z(Ki,_,i))return!1}catch(a){if(typeof a==="object"&&a!==null&&"code"in a&&(a.code==="ENOENT"||a.code==="EINVAL"))return!1;throw a}return!0}async function Xd(s,i,a){let d=await A(s);try{await U(d),await a(),await zd(i,`v1
`,{flag:"wx"})}finally{await d.handle.close()}}async function Ze(s,i,a,d,m=!0){await d();let u=await rs(s,!0);await Ci(s,!0);let c=Z(u,Zd);if(await Ud(c)){if(!await qd(s))throw Error("Initialized review store has missing or replaced compatibility paths");let t=i===void 0,y=i??await Ve(s);if(!y)throw Error("Initialized review store is missing its current bundle");if(!m)return y;let x=await Ld(y.path,y.directory),b=await hd(x,a);if(t&&b.state.status==="approved"){let{approvedAt:X,reviewer:z,approvalDigest:V,...F}=b.state;b={state:{...F,status:"needs_revision"},comments:b.comments}}if(ji(b,x))return y;if(t)return xs(s,b,d);return x.state.status==="approved"&&b.state.status!=="approved"?Qe(s,y,b,d):xs(s,b,d)}if(i&&await qd(s))return await Xd(u,c,d),i;let g;for(let t=0;t<10;t+=1){let y=await Bd(s),x=Z(u,_),b=await n(x),X=await xs(s,await hd(Pd(y),a),d),z=await n(x),V=[];try{V=await ze(s,y,d),await Xd(u,c,d);for(let F of V)if(F.quarantine)await d(),await T(F.quarantine,{force:!0});g=X;break}catch(F){let Y=[],I=await n(c);if(I.kind!=="missing")try{await Fi({original:{path:c,kind:"missing"},installed:I,created:!0},d)}catch(B){Y.push(B)}for(let B of V.reverse())try{await Fi(B,d)}catch(j){Y.push(j)}try{await Fi({original:b,installed:z,created:!0},d)}catch(B){Y.push(B)}if(Y.length)throw AggregateError([F,...Y],"Review-store initialization failed and rollback was incomplete");if(!(F instanceof O))throw F}}if(!g)throw Error("Legacy review state kept changing during migration");return await ja(s,g,d),g}async function ja(s,i,a){await a();let d=await rs(s,!1),m=await Ci(s,!1),[u,c]=await Promise.all([A(d),A(m)]);try{let f=await As(m);for(let t of f.filter((y)=>y.endsWith(".staging")||y!==i.id)){await U(c);let y=Z(m,t),x;try{x=await A(y)}catch(X){if(typeof X==="object"&&X!==null&&"code"in X&&X.code==="ENOENT")continue;throw X}let b=Z(m,`.cleanup-${cs()}`);try{await U(x),await U(c),await a(),await ls(y,b);let X=await J(b,{bigint:!0});if(X.dev!==x.stats.dev||X.ino!==x.stats.ino){console.warn(`Retained rebound review bundle cleanup candidate at ${b}`);continue}let z=await x.handle.stat({bigint:!0});if(z.dev!==X.dev||z.ino!==X.ino){console.warn(`Retained changed review bundle cleanup candidate at ${b}`);continue}await a(),await T(b,{recursive:!0})}finally{await x.handle.close()}}let g=await As(d);for(let t of g.filter((y)=>y.startsWith("current.")&&(y.endsWith(".pointer")||y.endsWith(".invalid")||y.endsWith(".rollback"))||y.startsWith(`${Zd}.`)&&y.endsWith(".tmp"))){await U(u);let y=Z(d,t),x=await J(y,{bigint:!0}),b=Z(d,`.cleanup-${cs()}`);await a(),await ls(y,b);let X=await J(b,{bigint:!0});if(x.dev!==X.dev||x.ino!==X.ino){console.warn(`Retained rebound temporary review-store path at ${b}`);continue}await a(),await T(b)}}finally{await Promise.allSettled([u.handle.close(),c.handle.close()])}}async function Qd(s,i,a,d,m){await m();let u;try{u=await rs(s,!1)}catch(g){if(typeof g==="object"&&g!==null&&"code"in g&&g.code==="ENOENT")return;throw g}let c=Z(u,_),f=await n(c);if(f.kind==="missing"||!f.stats||!Fs(f.stats,d.pointer))return;try{await U(a)}catch(g){let t=await A(u);try{if(!await oi(t,c,d,m))throw Error("Committed review pointer changed before failed transaction recovery")}catch(y){throw AggregateError([g,y],"Prior review generation was unavailable and the failed transaction could not be conditionally quarantined")}finally{await t.handle.close().catch(()=>{return})}throw AggregateError([g],"Prior review generation was unavailable; the failed transaction was quarantined without approved authority")}await qa(s,i,a,d,m)}async function ai(s,i,a={}){s=await Xs(s);let d=await xa(s),m,u;try{await d.assertOwned();let c=await Kd(s);m=await Fd(s);let f=!1;if(c){let b=await ys(c.path,m,c.directory);await a.preflight?.(b,m),f=!0}else{let b=await Bd(s);if(!b.some((X)=>X.kind==="symlink")){let X=Pd(b);Ja(m.plan,X.comments),await a.preflight?.(X,m),f=!0}}await d.assertOwned();let g=await Ze(s,c,m,d.assertOwned,a.normalize);if(!f&&a.preflight){let b=await ys(g.path,m,g.directory);await a.preflight(b,m)}if(a.cleanup!==!1)await ja(s,g,d.assertOwned);if(a.mutating)u=await A(g.path);let t,y=(b)=>{if(t)throw Error("A review transaction cannot publish more than one current generation");t=b},x;try{x=await i(g,m,d.assertOwned,s,y)}catch(b){if(t&&u)try{await Qd(s,g,u,t,d.assertCanonicalOwned)}catch(X){throw AggregateError([b,X],"Review transaction failed after publication and recovery was incomplete")}throw b}if(a.mutating)try{await d.assertOwned()}catch(b){if(t&&u)try{await Qd(s,g,u,t,d.assertCanonicalOwned)}catch(X){throw AggregateError([b,X],"Review transaction lost ownership after publication and recovery was incomplete")}throw b}if(t)He(s,t.id);return x}finally{await u?.handle.close().catch(()=>{return}),await jd(m),await d.release()}}async function ii(s){return ai(s,async(i,a,d,m)=>{let u=await ys(i.path,a,i.directory);if(u.state.status==="approved"&&u.state.approvalDigest!==si(a,u.state,u.comments))throw Error("Approved review identity changed while it was being read");if(u.state.status==="approved")await d(),await Wa(m,a);return{...u,generation:i.id}})}async function Ka(s,i){s=await Xs(s);let a=await xa(s),d;try{await a.assertOwned();let m=await Kd(s);if(!m)throw new gs("not_found","No coherent approved handoff is published");d=await Fd(s);let u=await ys(m.path,d,m.directory);try{Ya(d,u)}catch{throw new gs("not_found","No coherent approved handoff is published")}return await a.assertOwned(),await Wa(s,d),i==="agent-handoff.json"?u.handoffJson:u.handoffMarkdown}finally{await jd(d),await a.release()}}function Oi(s,i,a){return{...s,...i,answers:{...s.answers,...i.answers??{}},checklist:{...s.checklist,...i.checklist??{}},unresolvedCommentIds:a.filter((d)=>d.status==="open").map((d)=>d.id)}}async function Cd(s,i){if(i&&typeof i==="object"&&!Array.isArray(i)){let m=i;if(m.status==="approved"||"approvedAt"in m||"reviewer"in m||"approvalDigest"in m)throw Error("Approval status and metadata can only be set through /api/approve")}let a=Vi(i);if(a.length)throw Error(a.join(`
`));let d=i;return ai(s,async(m,u,c,f,g)=>{let t=await ys(m.path,u,m.directory),y=Oi(t.state,d,t.comments),x=t.handoffJson,b=t.handoffMarkdown;if(t.state.status==="approved"&&(d.status!==void 0||d.answers!==void 0||d.checklist!==void 0)){let{approvedAt:z,reviewer:V,approvalDigest:F,...Y}=y;y={...Y,status:"needs_revision"},x=void 0,b=void 0}let X=Js(y);if(X.length)throw Error(X.join(`
`));return await xs(f,{...t,state:y,handoffJson:x,handoffMarkdown:b},c,g),y},{mutating:!0})}async function Od(s,i){if(typeof i.blockId!=="string"||i.blockId.trim().length===0)throw Error("Comment blockId must be nonblank");if(typeof i.body!=="string"||i.body.trim().length===0)throw Error("Comment body must be nonblank");if(i.anchor!==void 0&&(typeof i.anchor!=="string"||i.anchor.trim().length===0))throw Error("Comment anchor must be nonblank when present");let a=(d)=>{if(!Rd(d.plan,i.blockId))throw new gs("unprocessable",`Unknown comment blockId '${i.blockId}'`)};return ai(s,async(d,m,u,c,f)=>{a(m);let g=await ys(d.path,m,d.directory),t=i.id??`c-${cs()}`;if(t.trim().length===0)throw Error("Comment id must be nonblank");let y=g.comments.find((F)=>F.id===t);if(y){if(y.blockId===i.blockId&&y.anchor===i.anchor&&y.body===i.body)return y;throw new gs("conflict",`Comment id '${t}' is already bound to a different payload`)}let x={id:t,blockId:i.blockId,anchor:i.anchor,body:i.body,status:"open",createdAt:new Date().toISOString()},b=[...g.comments,x],X=Oi(g.state,{},b),z=g.handoffJson,V=g.handoffMarkdown;if(g.state.status==="approved"){let{approvedAt:F,reviewer:Y,approvalDigest:I,...B}=X;X={...B,status:"needs_revision"},z=void 0,V=void 0}return await xs(c,{...g,state:X,comments:b,handoffJson:z,handoffMarkdown:V},u,f),x},{mutating:!0,preflight:(d,m)=>a(m)})}async function nd(s,i){let a=(d)=>{if(d.comments.filter((u)=>u.id===i).length!==1)throw new gs("not_found",`Unknown or ambiguous comment id '${i}'`)};return ai(s,async(d,m,u,c,f)=>{let g=await ys(d.path,m,d.directory);if(a(g),g.comments.find((x)=>x.id===i).status==="resolved")return g.comments;let t=g.comments.map((x)=>x.id===i?{...x,status:"resolved",resolvedAt:new Date().toISOString()}:x),y=Oi(g.state,{},t);return await xs(c,{...g,state:y,comments:t},u,f),t},{mutating:!0,preflight:a})}function Vd(s,i){let a=[...s.plan.blocks,...s.canvas?.blocks??[]],d=[...i.comments.some((m)=>m.status==="open")?["AgentHandoff cannot be generated while unresolved blocking comments remain"]:[],...ma(a,i.state)];if(d.length)throw new gs("unprocessable",d.join(`
`))}async function Md(s,i="local-reviewer"){if(i.trim().length===0)throw Error("Approval reviewer must be nonblank");return ai(s,async(a,d,m,u,c)=>{let f=d.plan,g=await ys(a.path,d,a.directory);Vd(f,g);let t=new Date().toISOString(),y=Oi(g.state,{status:"approved",approvedAt:t,reviewer:i,approvalDigest:void 0},g.comments),x={...y,approvalDigest:si(d,y,g.comments)},b=Js(x);if(b.length)throw Error(b.join(`
`));let X=la(f,x),z=_s(X);if(z.length)throw Error(z.join(`
`));let V=`${JSON.stringify(X,null,2)}
`,F=ga(X);Ya(d,{state:x,comments:g.comments,handoffJson:V,handoffMarkdown:F});let Y=async()=>{if(await m(),await Wa(u,d),x.approvalDigest!==si(d,x,g.comments))throw Error("Plan source or review state changed during approval")},I=await A(a.path),B;try{B=await xs(u,{state:x,comments:g.comments,handoffJson:V,handoffMarkdown:F},m,c,Y,!0)}catch(j){if(j instanceof za&&j.restorable)try{await qa(u,a,I,j.published,m)}catch(us){throw AggregateError([j,us],"Approval publication verification failed and prior authority could not be restored")}else await I.handle.close().catch(()=>{return});throw j}try{await Y()}catch(j){try{await qa(u,a,I,B,m)}catch(us){throw AggregateError([j,us],"Approval identity failed and prior authority could not be restored")}throw j}await I.handle.close().catch(()=>{return});try{await ja(u,B,m)}catch(j){console.warn(`Approval committed; deferred review-store cleanup: ${j instanceof Error?j.message:String(j)}`)}return X},{mutating:!0,normalize:!1,cleanup:!1,preflight:(a,d)=>Vd(d.plan,a)})}var $d=new Map;function os(s){let i=$d.get(s);if(i)return i;let a={presence:"waiting",waiterCount:0,connections:new Set};return $d.set(s,a),a}function Je(s,i,a){for(let d of os(s).connections)d.send(i,a)}function oa(s,i){let a=os(s);if(a.presence===i)return;a.presence=i,Je(s,"presence",{presence:i})}function Ye(s){let i=os(s);i.waiterCount+=1,oa(s,"listening")}function Fe(s){let i=os(s);if(i.waiterCount=Math.max(0,i.waiterCount-1),i.waiterCount===0)oa(s,"working")}function je(s){let i=os(s);if(i.waiterCount=Math.max(0,i.waiterCount-1),i.waiterCount===0)oa(s,"waiting")}function Ke(s,i){return new TextEncoder().encode(`event: ${s}
data: ${JSON.stringify(i)}

`)}function Ue(s,i,a,d){let m,u=new ReadableStream({start(c){let f=!1,g,t=os(s),y={send:(b,X)=>{if(!f)c.enqueue(Ke(b,X))},close:()=>{if(f)return;f=!0,g?.(),i.removeEventListener("abort",x),a.removeEventListener("abort",x),t.connections.delete(y);try{c.close()}catch{}}},x=()=>y.close();m=y.close,d(y.close),t.connections.add(y),i.addEventListener("abort",x,{once:!0}),a.addEventListener("abort",x,{once:!0}),y.send("presence",{presence:t.presence});try{g=Jd(s,({generation:b})=>{y.send("review-update",{generation:b})})}catch{y.close()}},cancel(){m?.()}});return new Response(u,{headers:{"cache-control":"no-cache, no-store",connection:"keep-alive","content-type":"text/event-stream; charset=utf-8"}})}async function Ua(s){try{return await s.json()}catch{throw new Response("Invalid JSON",{status:400})}}function Ed(s){if(!s||typeof s!=="object"||Array.isArray(s))throw new Response("JSON body must be an object",{status:400});return s}function oe(s,i,a){let d=s.headers.get("origin");if(d!==null){let m;try{m=new URL(d)}catch{}let u=i.hostname==="localhost"||i.hostname==="127.0.0.1"||i.hostname==="[::1]";if(!m||d==="null"||m.origin!==i.origin||!u||Number(i.port)!==a)throw new Response("Foreign mutation origin",{status:403})}if(s.headers.get("content-type")?.split(";",1)[0].trim().toLowerCase()!=="application/json")throw new Response("Mutating API requests require application/json",{status:415})}function Re(s,i){let a=Object.keys(s);if("resolveId"in s){if(a.length!==1||typeof s.resolveId!=="string"||s.resolveId.trim().length===0)throw new Response("Comment resolution body must be exactly { resolveId: nonblank string }",{status:400});return{mode:"resolve",resolveId:s.resolveId}}let d=s.id??i??void 0;if(a.some((m)=>m!=="id"&&m!=="blockId"&&m!=="anchor"&&m!=="body")||d!==void 0&&(typeof d!=="string"||d.trim().length===0)||i!==null&&(i.trim().length===0||d!==i)||typeof s.blockId!=="string"||s.blockId.trim().length===0||typeof s.body!=="string"||s.body.trim().length===0||s.anchor!==void 0&&(typeof s.anchor!=="string"||s.anchor.trim().length===0))throw new Response("Comment body must contain matching optional id/idempotency-key plus nonblank blockId, body, and optional anchor",{status:400});return{mode:"add",id:d,blockId:s.blockId,anchor:s.anchor,body:s.body}}async function Id(s,i=7374,a){s=await We(s),await zi(s),a?.throwIfAborted();let d=new AbortController,m=new Set,u=Bun.serve({port:i,async fetch(y){let x=new URL(y.url);try{if(x.pathname.startsWith("/assets/")){let b=x.pathname.slice(8);if(!Sa(b))return new Response("Not found",{status:404});return new Response(await Nd(Sd(s,"dist","assets",b)),{headers:{"cache-control":"public, max-age=31536000, immutable","content-type":"font/woff2"}})}if(x.pathname==="/"||x.pathname==="/index.html"||x.pathname==="/static-export.html"){let b=x.pathname==="/static-export.html"?"static-export.html":"index.html";return new Response(await Nd(Sd(s,"dist",b),"utf8"),{headers:{"content-type":"text/html; charset=utf-8"}})}if(x.pathname==="/plan-state.json"){let b=await ii(s);return Response.json(b.state,{headers:{"x-muse-review-generation":b.generation}})}if(x.pathname==="/comments.json"){let b=await ii(s);return Response.json(b.comments,{headers:{"x-muse-review-generation":b.generation}})}if(x.pathname==="/agent-handoff.json")return new Response(await Ka(s,"agent-handoff.json"),{headers:{"content-type":"application/json; charset=utf-8"}});if(x.pathname==="/agent-handoff.md")return new Response(await Ka(s,"agent-handoff.md"),{headers:{"content-type":"text/markdown; charset=utf-8"}});if(x.pathname==="/api/events"&&y.method==="GET")return Ue(s,y.signal,d.signal,(b)=>m.add(b));if(x.pathname==="/api/wait"&&y.method==="GET"){let b=x.searchParams.get("since")??"";try{let X=await Yd(s,b,{signal:AbortSignal.any([y.signal,d.signal]),onParked:()=>Ye(s),onDelivered:()=>Fe(s),onCancelled:()=>je(s)});return Response.json({generation:X.generation,state:X.state,comments:X.comments},{headers:{"x-muse-review-generation":X.generation}})}catch(X){if(X instanceof Pi)return new Response(X.message,{status:503});if(y.signal.aborted||d.signal.aborted)return new Response(null,{status:204});throw X}}if(x.pathname.startsWith("/api/")&&y.method==="POST")oe(y,x,u.port??i);if(x.pathname==="/api/state"&&y.method==="POST"){let b=await Ua(y);if(b&&typeof b==="object"&&!Array.isArray(b)){let z=b;if(z.status==="approved"||"approvedAt"in z||"reviewer"in z||"approvalDigest"in z)throw new Response("Approval status and metadata can only be set through /api/approve",{status:409})}let X=Vi(b);if(X.length)throw new Response(X.join(`
`),{status:400});return Response.json(await Cd(s,b))}if(x.pathname==="/api/comments"&&y.method==="POST"){let b=Re(Ed(await Ua(y)),y.headers.get("idempotency-key"));if(b.mode==="resolve")return Response.json(await nd(s,b.resolveId));return Response.json(await Od(s,{id:b.id,blockId:b.blockId,anchor:b.anchor,body:b.body}))}if(x.pathname==="/api/approve"&&y.method==="POST"){let b=Ed(await Ua(y)),X=Object.keys(b),z=b.reviewer;if(X.some((V)=>V!=="reviewer")||X.length>1||z!==void 0&&(typeof z!=="string"||z.trim().length===0))return new Response("Approval body must be exactly {} or { reviewer: nonblank string }",{status:400});return Response.json(await Md(s,z))}return new Response("Not found",{status:404})}catch(b){if(b instanceof Response)return b;if(b instanceof gs){let X=b.failure==="not_found"?404:b.failure==="conflict"?409:422;return new Response(b.message,{status:X})}return new Response(b instanceof Error?b.message:String(b),{status:500})}}}),c=u.stop.bind(u),f=!1,g=(y=!0)=>{if(!f){f=!0,d.abort();for(let x of m)x();m.clear()}return c(y)};u.stop=g;let t=()=>g(!0);if(a?.addEventListener("abort",t,{once:!0}),a?.aborted)t(),a.throwIfAborted();return u}function Ra(){throw Error("Usage: bun runtime.mjs <render|serve> <plan-dir> [port]")}var[La,Ba,Le]=process.argv.slice(2);if(!La||!Ba)Ra();if(La==="render"){let s=await zi(Ba);console.log(`Rendered ${s.indexPath}`),console.log(`Static ${s.staticExportPath}`)}else if(La==="serve"){let s=Number(Le??7374);if(!Number.isInteger(s)||s<0||s>65535)Ra();let i=await Id(Ba,s);console.log(`muse plan review: http://localhost:${i.port}/`)}else Ra();
