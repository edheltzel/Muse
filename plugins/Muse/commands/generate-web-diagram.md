---
description: Generate a beautiful standalone HTML diagram and open it in the browser
---
Load the `do-muse` skill, then generate an HTML diagram for: $@

Follow the `do-muse` skill workflow. Read the reference template and CSS patterns before generating. Pick a distinctive aesthetic that fits the content — vary fonts, palette, and layout style from previous diagrams.

If impeccable is available, consider generating an AI illustration when an image would genuinely enhance the page — a hero banner, conceptual illustration, or educational diagram that Mermaid can't express. Match the image style to the resolved DESIGN.md palette. Embed as base64 data URI. See css-patterns.md "Generated Images" for container styles. Skip images when the topic is purely structural or data-driven, or when image gen is missing.

Write to `.agents/diagrams/` and open the result in the browser.
