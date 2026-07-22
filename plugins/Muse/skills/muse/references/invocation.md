# Invoking muse

The capability name is lowercase `muse` on every host.

## Canonical request

Use ordinary language everywhere:

```text
Use muse to <visualize, review, explain, or plan this work>.
```

This is the shared mental model and the only cross-host invocation `muse` advertises as uniform.

## Native explicit fallbacks

| Host | Explicit fallback | Why it differs |
| --- | --- | --- |
| Claude Code | `/muse:muse <request>` or `/muse:<workflow>` | Claude namespaces plugin skills and command templates with the plugin name. |
| Pi | `/skill:muse <request>` or `/<workflow>` | Pi owns the `/skill:<name>` grammar and loads package prompt templates as top-level slash commands. |
| Codex | `$muse <request>` or `/skills` | Codex owns skill mentions and the skill picker; plugin command Markdown is reference material rather than installed prompts. |

These syntax differences are forced by host grammar. Do not translate them into a fake shared token or capitalize the skill mention.

## Lifecycle boundaries

- Start a fresh session after installation so each host can discover the new package.
- Browser opening remains subject to each host's permissions, sandbox, and UI lifecycle. Always report the generated file or review URL even when automatic opening is unavailable.
- Plugin trust, command discovery, hooks, and reload behavior remain host-owned. A shared `SKILL.md` does not make those semantics identical.
