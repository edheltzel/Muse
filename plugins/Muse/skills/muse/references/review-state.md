# Review State

Review state is local JSON, not embedded progress in the plan body.

## Status

- `draft` — authored but not opened for review.
- `in_review` — opened for human review.
- `needs_revision` — reviewer requested changes.
- `approved` — approved and eligible for agent handoff generation.

## Files

- `plan-state.json` stores status, answers, checklist values, and unresolved comment IDs.
- `comments.json` stores anchored comments by stable block ID.
- `agent-handoff.json` and `agent-handoff.md` are generated only when approved.

The handoff cannot be generated while blocking comments remain unresolved.
