export const MDX_COMPONENT_NAMES = [
  "PlanSummary",
  "StatusDashboard",
  "DecisionMatrix",
  "ArchitectureDiagram",
  "ImplementationTimeline",
  "RiskRegister",
  "FileMap",
  "FileTree",
  "AnnotatedCode",
  "DiffTabs",
  "ApiSurface",
  "DataModel",
  "Wireframe",
  "BeforeAfter",
  "StateGallery",
  "ApprovalGate",
  "QuestionForm",
  "Checklist",
  "CommentAnchor",
  "Callout",
  "Tabs",
  "Table",
] as const;

export type MdxComponentName = (typeof MDX_COMPONENT_NAMES)[number];

export interface MdxComponentMeta {
  category: "Overview" | "Planning" | "Diagram" | "Evidence" | "Contracts" | "Product UI" | "Review";
  summary: string;
}

export const MDX_COMPONENT_META: Readonly<Record<MdxComponentName, MdxComponentMeta>> = Object.freeze({
  PlanSummary: { category: "Overview", summary: "Lead with scope, status, and the outcome narrative." },
  StatusDashboard: { category: "Overview", summary: "Show compact status indicators and review metrics." },
  DecisionMatrix: { category: "Planning", summary: "Compare decisions, rationale, and acceptance state." },
  ArchitectureDiagram: { category: "Diagram", summary: "Render Mermaid architecture with zoom and pan controls." },
  ImplementationTimeline: { category: "Planning", summary: "Present an ordered implementation or rollout sequence." },
  RiskRegister: { category: "Planning", summary: "Pair delivery risks with mitigations and severity." },
  FileMap: { category: "Evidence", summary: "List source files involved in the proposed change." },
  FileTree: { category: "Evidence", summary: "Show a compact project or generated-artifact hierarchy." },
  AnnotatedCode: { category: "Evidence", summary: "Display a focused code excerpt with file context." },
  DiffTabs: { category: "Evidence", summary: "Review file-specific changes in tabbed diff panels." },
  ApiSurface: { category: "Contracts", summary: "Document endpoints, methods, and responsibilities." },
  DataModel: { category: "Contracts", summary: "Describe fields, types, and persistence semantics." },
  Wireframe: { category: "Product UI", summary: "Embed a constrained HTML fragment for a proposed interface." },
  BeforeAfter: { category: "Product UI", summary: "Contrast the current state with the proposed outcome." },
  StateGallery: { category: "Product UI", summary: "Compare meaningful interface or workflow states." },
  ApprovalGate: { category: "Review", summary: "Capture approval or revision decisions at handoff." },
  QuestionForm: { category: "Review", summary: "Collect unresolved reviewer decisions through the local bridge." },
  Checklist: { category: "Review", summary: "Track explicit completion and verification criteria." },
  CommentAnchor: { category: "Review", summary: "Provide a stable target for contextual review comments." },
  Callout: { category: "Review", summary: "Highlight guidance, decisions, warnings, or risks." },
  Tabs: { category: "Evidence", summary: "Organize related reference content into compact panels." },
  Table: { category: "Contracts", summary: "Render general structured data with semantic table markup." },
});

export const KNOWN_MDX_COMPONENTS: Readonly<Record<string, true | undefined>> = Object.freeze(
  Object.fromEntries(MDX_COMPONENT_NAMES.map((name) => [name, true])) as Record<string, true>,
);

export function splitLines(body: string): string[] {
  return body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function splitPipeFields(line: string): string[] {
  return line.split("|").map((part) => part.trim());
}
