---
version: alpha
name: Muse default
description: Eldritch palettes (Dusk light, Cthulhu dark, Abyss darker) plus captain light-alt. Muse-shipped default when no project or global DESIGN.md exists.
colors:
  primary: "#8a69f7"
  secondary: "#0ad6ff"
  tertiary: "#fb5bb6"
  accent: "#fb5bb6"
  neutral: "#f0f3f4"
  bg: "#f0f3f4"
  surface: "#d5d9db"
  surface-elevated: "#e2e6e8"
  currentline: "#e2e6e8"
  overlay: "#c9cbcd"
  text: "#1e2029"
  text-dim: "#5b73dc"
  border: "#e2e6e8"
  ok: "#38ff9f"
  warn: "#ffaf4d"
  danger: "#fb5b66"
  cyan: "#0ad6ff"
  green: "#38ff9f"
  orange: "#ffaf4d"
  pink: "#fb5bb6"
  purple: "#8a69f7"
  red: "#fb5b66"
  yellow: "#fff952"
  mermaid-bg: "#f0f3f4"
  mermaid-fg: "#1e2029"
  mermaid-accent: "#8a69f7"
  mermaid-cyan: "#0ad6ff"
  mermaid-pink: "#fb5bb6"
  alt-bg: "#FFFFFF"
  alt-surface: "#FFFFFF"
  alt-text: "#111827"
  alt-primary: "#FDE8E2"
  alt-accent: "#FDE8E2"
  alt-border: "#DBDEE5"
  alt-mermaid-bg: "#FFFFFF"
  alt-mermaid-fg: "#111827"
  alt-mermaid-accent: "#111827"
  alt-mermaid-fill: "#FDE8E2"
  dark-bg: "#212337"
  dark-surface: "#454759"
  dark-surface-elevated: "#323449"
  dark-currentline: "#323449"
  dark-overlay: "#5b5c66"
  dark-text: "#ebfafa"
  dark-text-dim: "#7081d0"
  dark-border: "#323449"
  dark-primary: "#a48cf2"
  dark-accent: "#f265b5"
  dark-cyan: "#04d1f9"
  dark-green: "#37f499"
  dark-orange: "#f7c67f"
  dark-pink: "#f265b5"
  dark-purple: "#a48cf2"
  dark-red: "#f16c75"
  dark-yellow: "#f1fc79"
  dark-ok: "#37f499"
  dark-warn: "#f1fc79"
  dark-danger: "#f16c75"
  dark-mermaid-bg: "#212337"
  dark-mermaid-fg: "#ebfafa"
  dark-mermaid-accent: "#37f499"
  dark-mermaid-cyan: "#04d1f9"
  dark-mermaid-purple: "#a48cf2"
  darker-bg: "#171928"
  darker-surface: "#353746"
  darker-surface-elevated: "#252738"
  darker-currentline: "#252738"
  darker-overlay: "#474852"
  darker-text: "#d8e6e6"
  darker-text-dim: "#506299"
  darker-border: "#252738"
  darker-primary: "#8b75d9"
  darker-accent: "#d154a1"
  darker-cyan: "#0396b3"
  darker-green: "#2dcc82"
  darker-orange: "#d4a666"
  darker-pink: "#d154a1"
  darker-purple: "#8b75d9"
  darker-red: "#cc5860"
  darker-yellow: "#ccd663"
  darker-ok: "#2dcc82"
  darker-warn: "#d4a666"
  darker-danger: "#cc5860"
  darker-mermaid-bg: "#171928"
  darker-mermaid-fg: "#d8e6e6"
  darker-mermaid-accent: "#2dcc82"
  darker-mermaid-cyan: "#0396b3"
  darker-mermaid-purple: "#8b75d9"
typography:
  headline:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, 'Segoe UI', sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline-md:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, 'Segoe UI', sans-serif"
    fontSize: "2rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  body-lg:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, 'Segoe UI', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 48px
  card: 24px
components:
  page:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 24px
  button-primary:
    backgroundColor: "{colors.text}"
    textColor: "{colors.bg}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.label}"
  kicker:
    textColor: "{colors.text-dim}"
    typography: "{typography.label}"
---

## Overview

Muse default visual world: Eldritch (Lovecraftian green/blue abyss) for light, dark, and darker, plus a fourth **light-alt** sheet. One committed aesthetic. Templates, review chrome, diagrams, tables, and slides consume these tokens. Kill the SKILL.md aesthetic lottery and baked slide presets once this file exists.

Resolution: project `DESIGN.md` (cwd) wins, then global `~/.agents/DESIGN.md`, then this Muse-shipped default. Muse owns that lookup. Do not auto-install this file into the user's project or home. Do not auto-create `~/.agents/DESIGN.md`.

Theme: follow the user's explicit choice, else OS `prefers-color-scheme`. Always a light/dark toggle. **dark / Cthulhu is the dark default.** Dark OS maps to Cthulhu, not Abyss. Modes: `light` (Dusk), `light-alt` (sheet), `dark` (Cthulhu), `darker` (Abyss). light-alt is an extra light, never the OS default.

## Colors

Four palettes. YAML default is Dusk (`light`). Hex is normative. Cite [eldritch README](https://github.com/eldritch-theme/eldritch/blob/master/README.md) and [SPEC.md](https://github.com/eldritch-theme/eldritch/blob/master/SPEC.md), plus the captain light-alt sheet.

Eldritch roles: `background` = page, `currentline` = selection, `surface` = cards, `overlay` = menus, `foreground` = body, `comment` = secondary, `cyan` = links. Text on an accent fill uses that mode's `background`.

- **light / Dusk:** bg Pale Shore `#f0f3f4`, currentline Coastal Mist `#e2e6e8`, surface Tidal Flat `#d5d9db`, overlay Dusk Haze `#c9cbcd`, fg Abyssal Ink `#1e2029`, comment Faded Rune `#5b73dc`. Headings Vesper Violet `#8a69f7`. Links Twilight Teal `#0ad6ff`. Search accents Fading Rose `#fb5bb6` and Ember Glow `#ffaf4d`. Dusk Moss `#38ff9f` and Last Light Yellow `#fff952` are decorative only (icons, washes). Prefer pink, purple, or orange for text. Danger Dusk Crimson `#fb5b66`.
- **light-alt:** White bg/surface `#FFFFFF`, text/icons `#111827`, primary and accent peach `#FDE8E2`, border `#DBDEE5`. Peach is a wash and card tint, not body text. Navy line icons. Soft rounded white cards, generous space.
- **dark / Cthulhu:** bg Sunken Depths `#212337`, surface Tidal Surface `#454759`, text Lighthouse White `#ebfafa`, comment The Old One Purple `#7081d0`. Headings Lovecraft Purple `#a48cf2`. Links Watery Tomb `#04d1f9`. Accent Pustule Pink `#f265b5`. Success Great Old One Green `#37f499`. Warn Gold of Yuggoth `#f1fc79`. Danger R'lyeh Red `#f16c75`.
- **darker / Abyss:** bg Void Black `#171928`, surface Benthic `#353746`, text Pale Specter `#d8e6e6`, comment Forgotten Rune `#506299`. Headings Shadow Violet `#8b75d9`. Links Abyssal Teal `#0396b3`. Accent Dreamrot Pink `#d154a1`. Success Phosphor Green `#2dcc82`. Warn Amber Ichor `#d4a666`. Danger Crimson Omen `#cc5860`.

Mermaid `themeVariables` must use the `mermaid-*` hex twins. Mermaid rejects `oklch()`. Map node fill/line/text from the active mode's mermaid tokens.

## Typography

Space Grotesk for headlines (`headline` 600, `headline-md` 500). Barlow Condensed for body, labels, nav, and UI chrome. Same pairing in every mode. Tanker is out (ITF-FFL — we would be shipping it with the plugin and skill).

Both faces are SIL OFL on Google Fonts: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed). Load from Google Fonts or self-host the OFL files; redistributing those files is allowed. Do not make the Google Fonts CDN a hard render dependency — local/self-hosted woff2 still counts. YAML sizes are the desktop max; templates may fluid-scale headlines with `clamp()` down to 2rem / 1.4rem.

If files are missing: Space Grotesk falls back to `ui-sans-serif, system-ui, 'Segoe UI', sans-serif`. Barlow Condensed falls back to `ui-sans-serif, system-ui, 'Segoe UI', sans-serif`. Page must still read as geometric-sans display + condensed sans body.

## Layout

Generous space. 8px rhythm, 24px card padding, 32–48px section gaps. Hero/summary owns the first viewport. Review chrome: sticky aside, main column, theme toggle. Artifacts: one committed world, not a grid of identical tiles. Reference blocks compact or in `<details>`.

## Elevation & Depth

Three tiers: elevated (hero, overlay), flat (body cards), recessed (code, secondary). Light and light-alt: white/pale cards on a slightly cooler page; borders not heavy shadows. Dark and darker: surface/overlay greys from the Eldritch ladder, low-opacity borders.

## Shapes

Soft rounded cards (`16px`), controls `12px`, chips `8px`. Precise, not pill-everything. light-alt matches the sheet: rounded white cards on a quiet dotted field. Line icons, navy in light-alt, foreground/comment in Eldritch modes. No filled-glyph icon soup.

## Components

HTML templates (`architecture.html`, `data-table.html`, `mermaid-flowchart.html`, `slide-deck.html`, interactive-plan shell) are layout skeletons. They consume these tokens. They are not a second design system. Kill baked template palettes and SKILL.md per-page lottery on ship.

- **Images:** match the active mode. Hero 16:9, inline 1:1. Generate through impeccable. If image gen is missing, skip; the page stands on type and CSS.
- **Charts:** Chart.js (or equivalent) themed from CSS variables, not library defaults, not indigo samples.
- **Mermaid:** `theme: 'base'` plus hex `themeVariables` from the active `mermaid-*` tokens. Every diagram keeps zoom/pan/expand. Never bare `<pre class="mermaid">`.
- **Theme toggle:** always present on Muse HTML. Modes as in Overview. Do not write `~/.plannotator/config.json`.

## Do's and Don'ts

Do: Eldritch hex from the three official palettes; SPEC roles (page/selection/cards/menus/body/secondary/links); light-alt peach as wash only; Space Grotesk headlines; Barlow Condensed body; mermaid hex twins; user then OS theme with a toggle; dark OS → Cthulhu; one world across review chrome and templates.

Don't: terracotta / Bricolage Grotesque / Fragment Mono (rejected seed); Tanker anywhere (license); SKILL.md aesthetic lottery or slide presets once this file exists; Google Fonts CDN as a hard render dependency (self-host OFL woff2 is fine); Fontshare; surf-cli image gen; auto-create `~/.agents/DESIGN.md`; Dusk green/yellow as body text; extra `##` headings beyond this spec; indigo/violet Tailwind defaults that are not Eldritch purple.
