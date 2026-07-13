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

export const RAW_BODY_MDX_COMPONENTS: Readonly<Record<string, true | undefined>> = Object.freeze({
  ArchitectureDiagram: true,
  FileMap: true,
  FileTree: true,
  AnnotatedCode: true,
  DiffTabs: true,
  ApiSurface: true,
  DataModel: true,
  Wireframe: true,
  StateGallery: true,
  Tabs: true,
  Table: true,
});

export function findUnquotedTagEnd(source: string, start: number): number {
  let quote = "";
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote && source[index - 1] !== "\\") quote = "";
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index;
    }
  }
  return -1;
}

export interface RendererOwnedIdContext {
  id: string;
  type: string;
  body: string;
  props?: Readonly<Record<string, string | boolean | number>>;
}

type RendererOwnedIdFactory = (block: RendererOwnedIdContext) => readonly string[];
type RendererOwnedIdRoles = Readonly<Record<string, RendererOwnedIdFactory>>;

const tabIds = (role: "tab" | "panel"): RendererOwnedIdFactory => (block) =>
  splitTabPanels(block.body).map((_, index) => `${block.id}-${role}-${index}`);

export const RENDERER_OWNED_ID_INVENTORY = {
  ArchitectureDiagram: {
    instructions: (block) => [`${block.id}-instructions`],
    renderRoot: (block) => [`ve-mermaid-${block.id}`],
  },
  DiffTabs: {
    tabs: tabIds("tab"),
    panels: tabIds("panel"),
  },
  Tabs: {
    tabs: tabIds("tab"),
    panels: tabIds("panel"),
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
export function splitLines(body: string): string[] {
  return body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function splitPipeFields(line: string): string[] {
  return line.split("|").map((part) => part.trim());
}

export function splitTabPanels(body: string): string[] {
  return body.split(/^---\s*$/m).map((panel) => panel.trim());
}
