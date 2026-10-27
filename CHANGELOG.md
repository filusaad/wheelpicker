# Changelog

## 3.3.2 — 2026-10-27

- Restyled dark mode from the supplied dashboard references: near-black neutral
  panels, white typography, lime controls, an orange pointer, and vivid chart colors.
- Coordinated the wheel, center button, rim, score bars, and entry dots without
  adding content or changing the compact wheel-first layout.
- Preserved the bright light theme and saved preferences. Verified wheel-label
  contrast of at least 4.5:1 across all six palettes in both themes.
- All 23 regression checks pass.

## 3.3.1 — 2026-10-27

- Reworked dark mode with neutral charcoal surfaces, muted lavender controls,
  softer borders, and clear off-white text instead of blue-tinted backgrounds.
- Added a separate muted wheel palette for dark mode and coordinated the hub,
  pointer, rim, score dots, and entry colors. Light mode retains its bright palette.
- Verified default wheel-label contrast above 4.5:1 in both themes. All 23 checks pass.

## 3.3.0 — 2026-10-27

- Removed the intro slogan, large promotional heading, supporting copy, decorative
  labels, footer copy, and redundant instructions from the main workspace.
- Put the wheel immediately below a compact header. The wheel, Spin button, and
  race target controls fit without scrolling at the checked 709×619 in-app,
  390×844 phone, and 1440×900 desktop sizes.
- Moved the compact race controls below the wheel. Scores remain alongside the
  wheel on larger screens and become compact score cards below it on phones.
- Collapsed odds and presets into an optional editor menu, moved secondary sound
  and elimination controls into Studio, and retained accessible labels on the
  compact header buttons.
- Retained all 23 passing regression checks and saved data.

## 3.2.0 — 2026-10-27

- Replaced the dim charcoal/olive appearance with a bright white and blue studio,
  colorful wheel slices, lighter borders, and larger controls and text.
- Removed the dark wheel vignette and text shadows. Labels now use a contrasting
  ink color, stay upright on both halves, and wrap onto multiple lines rather than
  being squeezed horizontally.
- Increased the wheel's available size and made score names wrap without colliding
  with the point totals.
- Adopted the bright theme once for existing users while preserving saved choices,
  points, settings, and subsequent light/dark selections.
- Replaced new-wheel and rename browser prompts with an accessible in-page dialog
  that also works in the in-app browser.
- All 23 regression checks pass, including label contrast, wrapping, and appearance
  migration, in addition to the existing randomness and target race checks.
- Six-choice labels retain two lines at phone, in-app, and desktop wheel sizes.

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
