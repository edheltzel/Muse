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

export interface RendererOwnedIdContext {
  id: string;
  type: string;
  body: string;
  props?: Readonly<Record<string, string | boolean | number>>;
}

type RendererOwnedIdFactory = (block: RendererOwnedIdContext) => readonly string[];
type RendererOwnedIdRoles = Readonly<Record<string, RendererOwnedIdFactory>>;

const tabPanelIds: RendererOwnedIdFactory = (block) =>
  splitTabbedSections(block.body).map((_, index) => `${block.id}-${index}`);

export const RENDERER_OWNED_ID_INVENTORY = {
  ArchitectureDiagram: {
    instructions: (block) => [`${block.id}-instructions`],
    renderRoot: (block) => [`ve-mermaid-${block.id}`],
  },
  DiffTabs: {
    panels: tabPanelIds,
  },
  Tabs: {
    panels: tabPanelIds,
  },
} as const satisfies Partial<Record<MdxComponentName, RendererOwnedIdRoles>>;


export function getRendererOwnedIdsByRole(block: RendererOwnedIdContext, role: string): readonly string[] {
  const roles = RENDERER_OWNED_ID_INVENTORY[
    block.type as keyof typeof RENDERER_OWNED_ID_INVENTORY
  ] as RendererOwnedIdRoles | undefined;
  return roles?.[role]?.(block) ?? [];
}

export function getRendererOwnedIds(block: RendererOwnedIdContext): string[] {
  const roles = RENDERER_OWNED_ID_INVENTORY[
    block.type as keyof typeof RENDERER_OWNED_ID_INVENTORY
  ] as RendererOwnedIdRoles | undefined;
  return roles ? Object.values(roles).flatMap((createIds) => createIds(block)) : [];
}

export function splitTabbedSections(body: string): string[] {
  return body.split(/^---\s*$/m).map((chunk) => chunk.trim()).filter(Boolean);
}

export function splitLines(body: string): string[] {
  return body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function splitPipeFields(line: string): string[] {
  return line.split("|").map((part) => part.trim());
}
