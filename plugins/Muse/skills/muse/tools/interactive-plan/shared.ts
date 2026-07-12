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

export const KNOWN_MDX_COMPONENTS: Readonly<Record<string, true | undefined>> = Object.freeze(
  Object.fromEntries(MDX_COMPONENT_NAMES.map((name) => [name, true])) as Record<string, true>,
);

export function splitLines(body: string): string[] {
  return body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function splitPipeFields(line: string): string[] {
  return line.split("|").map((part) => part.trim());
}

export function splitTabPanels(body: string): string[] {
  return body.split(/^---\s*$/m).map((panel) => panel.trim());
}
