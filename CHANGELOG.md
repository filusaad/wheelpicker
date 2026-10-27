# Changelog

## 3.1.0 — 2026-10-27

### Fixed

- Repaired a malformed apostrophe literal in `escapeHtml` that prevented the
  entire inline application from starting; restored proper HTML entity escaping.
- Cancelled pending race timers when stopping or pausing, and locked edits during
  spins so selection stays consistent with the visible wheel.
- Restored migration of original saved choices and points.
- Corrected quoted CSV imports, validated imported backups, and preserved existing
  wheels when importing new ones.
- Isolated bulk-edit drafts by wheel and preserved literal names, duplicate
  choices, and equal-chance settings.
- Reconnected the existing wheel favicon with a project-relative PNG link and
  added a touch icon link. Added `.nojekyll` for direct static GitHub Pages hosting.

### Improved

- Made the automatic target race visible on the main screen. Enter 7 to repeat
  spins until the first entry reaches 7 points.
- Moved live scores beside the wheel, with large totals, progress bars, and a
  highlight for the latest winner. Removed the separate leaderboard tab.
- Added an explicit equal-chance mode, with optional custom weights. Displayed
  slice sizes and percentages match selection odds.
- Used cryptographic integer draws with rejection sampling for unbiased selection;
  the animation lands on the selected entry.
- Added undo, starter wheels, accessible controls and dialogs, reduced-motion
  support, and responsive light/dark layouts.

### Validation

- All 19 regression checks pass.
- Browser-checked a complete race to 7, visible score increments, winner
  highlighting, equal three-way odds, bulk editing, and phone layouts.

The application remains a single HTML file with no runtime libraries or build step.
