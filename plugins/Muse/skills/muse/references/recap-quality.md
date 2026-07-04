# Visual Recap Quality

A visual recap explains a diff at a higher altitude than raw line review.

## Required shape for non-trivial changes

- Outcome summary.
- `FileTree` with changed files and status.
- `DiffTabs` containing key changed files.
- `ApiSurface` / `DataModel` when contracts changed.
- `Wireframe`, `BeforeAfter`, or `StateGallery` when rendered UI changed.
- Review notes grouped by Good / Bad / Ugly / Questions.
- Approval or acknowledgement gate.

Skip visual recaps for tiny changes that review faster as raw diff unless the user explicitly asks for one.
