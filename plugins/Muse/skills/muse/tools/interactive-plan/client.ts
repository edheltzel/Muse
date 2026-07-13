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
      if (results) results.textContent = visibleCount + (visibleCount === 1 ? " example" : " examples") + " · " + visibleTypes.size + " unique of canonical " + canonicalCount;
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
})();`;

export const staticPlanClientScript = baseClientScript;

export const interactivePlanInteractionScript = `
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
      body.textContent = comment.body + " — " + (comment.status === "open" ? "Blocking" : "Resolved");
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
    return formatStatus(state.status) + " · " + blockers + " unresolved blocking comment" + (blockers === 1 ? "" : "s");
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
    updateSyncNotice("loading", "Loading saved review…", "Review controls unlock after server state and comments load.", false);
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
    setFeedback(operation.key, "pending", "Saving…", undefined);
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
})();`;

export const interactivePlanReviewScript = interactivePlanInteractionScript;
export const interactivePlanClientScript = baseClientScript + interactivePlanInteractionScript;
