import { join } from "node:path";
import { type AgentHandoff, type ReviewState, assertApprovedHandoffReady, validateAgentHandoff } from "./schema";
import { type LoadedPlanFolder } from "./mdx-loader";
import { splitLines } from "./shared";

const MARKDOWN_STRUCTURAL_CHARACTER = /[\\\u0000-\u001f\u007f-\u00a0<>&#*_`\[\]()!|]/g;

export function encodeMarkdownText(value: unknown): string {
  return String(value ?? "").replace(
    MARKDOWN_STRUCTURAL_CHARACTER,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

export function decodeMarkdownText(value: string): string {
  return value.replace(/\\u([0-9a-f]{4})/g, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)));
}

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

export function parseAgentHandoffMarkdown(source: string): AgentHandoff {
  const matches = [...source.matchAll(/^Canonical-Handoff: ([A-Za-z0-9_-]+)$/gm)];
  if (matches.length !== 1) throw new Error("Agent handoff Markdown must contain exactly one canonical payload");
  const handoff = JSON.parse(Buffer.from(matches[0][1], "base64url").toString("utf8")) as unknown;
  const errors = validateAgentHandoff(handoff);
  if (errors.length) throw new Error(errors.join("\n"));
  return handoff as AgentHandoff;
}

export function formatAgentHandoffMarkdown(handoff: AgentHandoff): string {
  const list = (items: string[]) => items.length
    ? items.map((item) => `- ${encodeMarkdownText(item)}`).join("\n")
    : "- None recorded";
  const answers = Object.entries(handoff.answers).length
    ? Object.entries(handoff.answers)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `- ${encodeMarkdownText(key)} = ${encodeMarkdownText(JSON.stringify(value))}`)
      .join("\n")
    : "- None recorded";
  const canonical = Buffer.from(JSON.stringify(handoff), "utf8").toString("base64url");
  return `# Agent Handoff: ${encodeMarkdownText(handoff.planSlug)}\n\nStatus: ${encodeMarkdownText(handoff.status)}\nApproved: ${encodeMarkdownText(handoff.approvedAt)}\nPlan: ${encodeMarkdownText(handoff.planPath)}\nImplementation-Entry: ${encodeMarkdownText(handoff.implementationEntry)}\nApproval-Digest: ${encodeMarkdownText(handoff.approvalDigest)}\nCanonical-Handoff: ${canonical}\n\n## Approved Scope\n\n${list(handoff.approvedScope)}\n\n## Decisions\n\n${list(handoff.decisions)}\n\n## Answers\n\n${answers}\n\n## Verification\n\n${list(handoff.verification)}\n\n## Open Risks\n\n${list(handoff.openRisks)}\n`;
}
