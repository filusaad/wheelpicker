# Picker Studio repair

Open `index.html` directly in a browser, or serve it with any static HTTP server.
The deployed application is still a single self-contained HTML file. It needs no
build step, account, backend, external JavaScript, or downloaded fonts.

## What broke

The Gemini file and GitHub's original `main` both had a JavaScript syntax error in
`escapeHtml`: its apostrophe replacement was written as three single quotes.
Because the browser could not parse the inline script, the entire application
failed to initialize. Its other replacements also returned literal HTML characters
instead of HTML entities, allowing names to break rendered input attributes.

## Repairs and improvements

- Correct HTML escaping, validated imported data, safe generated identifiers.
- New wheels default to equal chances. Custom weights are an explicit option;
  existing saved weighted wheels keep their settings. Slice sizes and displayed
  percentages use the same effective weights as selection.
- Outcomes use `crypto.getRandomValues` with rejection sampling to remove modulo
  bias. Animation lands inside the selected slice; decorative randomness does not
  choose the winner.
- A visible **Race to a target** control beside the wheel: enter 7, click
  **Start race**, and spins repeat until the first entry reaches 7 points.
  **Pause race** cancels the current spin and pending continuation; **Reset**
  clears scores. Starting a new race after a target is reached clears scores.
- Live scores remain beside the wheel and update after every spin, with large
  point totals, progress bars, and a highlight for the latest winner. On narrow
  screens the score cards sit above the wheel. A separate leaderboard tab is no
  longer needed.
- Editing, workspace switches, imports, and score resets are locked while a spin
  or race is in progress, keeping the result consistent with the visible wheel.
- Paused races cancel their pending timer, preventing stale delayed spins.
- Automatic migration of `pickerStudioUltraData`, including old names and scores.
- Validated JSON imports add wheels instead of replacing existing workspaces.
- CSV imports correctly handle quoted commas, doubled quotes, multiline names,
  UTF-8 BOMs, weights, scores, active flags, and mystery flags.
- Unicode sharing, clipboard fallback, download URL cleanup, and useful errors.
- Restored the existing `favicon.png` through a project-relative icon link and
  touch icon link, with a version query to refresh cached icons. Added `.nojekyll`
  so GitHub Pages serves this static site directly.
- Undo for entry edits, starter wheels, clear saved-state feedback, and empty states.
- Bulk drafts stay with their own wheel. Applying an unchanged list preserves
  equal-chance mode, duplicate entries, and literal names ending in `* 3` or `?`.
- Responsive light/dark layouts, labelled controls, keyboard tabs, dialog focus
  management, and support for reduced-motion preferences.
- Release 3.2 adds a bright white/blue default appearance, colorful flat slices,
  larger upright labels with measured wrapping and contrasting text, and in-page
  new-wheel/rename dialogs. Saved choices and points survive the appearance update.
- Release 3.3 removes promotional text and prioritizes the wheel above the fold,
  with compact race controls, visible scores, and optional editor settings.
- Graceful operation if audio or browser storage is unavailable. Unreadable saved
  data is preserved under a recovery key before the application saves new state.

## Verification

Run `node --test tests/wheel.test.cjs` (Node.js 18+). The suite executes the actual
inline script in a deterministic DOM/canvas host. The 23 checks cover startup, escaping,
migration, storage failure, weighted pointer geometry, import validation, CSV and
Unicode sharing, single-win scoring, race cancellation, a race to exactly seven,
mystery reveal, undo, equal/weighted tickets, rejection sampling, matching animation
landings, bulk draft isolation, literal names, and reduced motion. Browser checks cover actual interactions
and desktop/phone layouts.

The original supplied Gemini file remains untouched in the local workspace. The
old local `index.html` was preserved as `index.original.html`. Release 3.1.0 was
published through pull request #1; subsequent updates are published from `main` at
https://filusaad.github.io/wheelpicker/. See `CHANGELOG.md` for the update summary.
