import { join } from "node:path";
import { type AgentHandoff, type ReviewState, assertApprovedHandoffReady } from "./schema";
import { type LoadedPlanFolder } from "./mdx-loader";
import { splitLines } from "./shared";

function collectBlockLines(plan: LoadedPlanFolder): Record<string, string[]> {
  const linesByType: Record<string, string[]> = {};
  for (const block of plan.plan.blocks) {
    const lines = splitLines(block.body);
    if (lines.length) (linesByType[block.type] ??= []).push(...lines);
  }
  return linesByType;
}

export function generateAgentHandoff(plan: LoadedPlanFolder, state: ReviewState): AgentHandoff {
  const errors = assertApprovedHandoffReady(state);
  if (errors.length) throw new Error(errors.join("\n"));
  const blockLines = collectBlockLines(plan);
  return {
    status: "approved",
    planSlug: plan.manifest.slug,
    planPath: join(plan.rootDir, plan.manifest.entry),
    approvedAt: state.approvedAt ?? new Date().toISOString(),
    approvedScope: blockLines.ImplementationTimeline ?? [],
    decisions: blockLines.DecisionMatrix ?? [],
    answers: state.answers,
    implementationEntry: join(plan.rootDir, plan.manifest.entry),
    approvalDigest: state.approvalDigest!,
    verification: blockLines.Checklist ?? [],
    openRisks: blockLines.RiskRegister ?? [],
  };
}

export function formatAgentHandoffMarkdown(handoff: AgentHandoff): string {
  const list = (items: string[]) => items.length ? items.map((item) => `- ${item}`).join("\n") : "- None recorded";
  return `# Agent Handoff: ${handoff.planSlug}\n\nStatus: ${handoff.status}\nApproved: ${handoff.approvedAt}\nPlan: ${handoff.planPath}\n\n## Approved Scope\n\n${list(handoff.approvedScope)}\n\n## Decisions\n\n${list(handoff.decisions)}\n\n## Answers\n\n\`\`\`json\n${JSON.stringify(handoff.answers, null, 2)}\n\`\`\`\n\n## Verification\n\n${list(handoff.verification)}\n\n## Open Risks\n\n${list(handoff.openRisks)}\n`;
}
