# Picker Studio

A single-file decision wheel with fair random selection, automatic races, and a
bright, readable interface.

**[Open the live wheel](https://filusaad.github.io/wheelpicker/)**

## Use the wheel

1. Add choices individually, paste them with **Bulk Edit**, or choose a starter.
2. Choose **Equal chances** or explicitly enable **Custom weights**.
3. Click **Spin wheel** for one pick, or set a target such as **7** and click
   **Start race**. Spins repeat until the first choice reaches the target.
4. Follow **Live scores** beside the wheel. On phones, scores appear above it.
5. Use **Pause race** to stop the loop and **Reset** to clear points.

Mystery mode hides wheel labels until they win. With progressive unmasking on,
winning entries stay revealed. Mystery mode does not change selection odds.

Wheels save automatically in your browser. Studio includes JSON backup/restore
and CSV import/export. Shared links contain the wheel's choices; they are not a
private or encrypted way to share an entry list.

## Run locally

Open `index.html` in a browser. No installation or build step is needed.
Keep `favicon.png` beside it to display the wheel icon. Clipboard sharing works
best from HTTPS or a local HTTP server.

## GitHub Pages

The site is published from the root of `main`. The `.nojekyll` marker allows the
HTML and image to be served directly. The favicon uses the relative path
`./favicon.png?v=3.1`, so it resolves within `/wheelpicker/`.

After updating `main`, check the repository's **pages build and deployment** run.
The live page and favicon should both return HTTP 200.

## Verification

With Node.js 18 or later:

```sh
node --test tests/wheel.test.cjs
```

The 22 regression checks cover random selection, matching wheel landings, races,
saved-data migration, imports, undo, bulk editing, text contrast, label wrapping,
and appearance preferences. Browser checks cover live scores and desktop/phone layouts.

See [CHANGELOG.md](CHANGELOG.md) for release changes and
[REPAIR-NOTES.md](REPAIR-NOTES.md) for the original failure and its fixes.
