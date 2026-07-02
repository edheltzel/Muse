export const interactivePlanClientScript = `
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
