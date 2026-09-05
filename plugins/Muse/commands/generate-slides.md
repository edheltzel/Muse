---
description: Generate a stunning magazine-quality slide deck as a self-contained HTML page
---
Load the Muse skill, then generate a slide deck for: $@

Follow the Muse skill workflow. Read the resolved DESIGN.md, then the reference template at `./templates/slide-deck.html` and slide patterns at `./references/slide-patterns.md` before generating. Also read `./references/css-patterns.md` for shared patterns (Mermaid zoom controls, depth tiers, overflow protection) and `./references/libraries.md` for Mermaid theming and Chart.js.

**Slide output is always opt-in.** Only generate slides when this command is invoked or the user explicitly asks for a slide deck.

**Aesthetic:** Consume the resolved DESIGN.md tokens. Do not pick baked slide presets.

**Narrative structure:** Slides have a temporal dimension — compose a story arc, not a list of sections. Start with impact (title), build context (overview), deep dive (content, diagrams, data), resolve (summary/next steps). Plan the slide sequence and assign a composition (centered, left-heavy, split, full-bleed) to each slide before writing HTML.

**Visual richness:** Proactively reach for visuals. If impeccable is available, generate images for title slide backgrounds and full-bleed slides. If image gen is missing, skip. Add SVG decorative accents, inline sparklines, mini-charts, and small Mermaid diagrams where they make the story more compelling. Visual-first, text-second.

**Compositional variety:** Consecutive slides must vary their spatial approach. Alternate between centered, left-heavy, right-heavy, split, edge-aligned, and full-bleed. Three centered slides in a row means push one off-axis.

Write to `.agents/diagrams/` and open the result in the browser.
