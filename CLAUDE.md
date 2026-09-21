# CLAUDE.md

## Design

- `web/public/tokens.css` is the source of truth for design tokens. The Tokens board on the canvas documents it; change the file first, then the board
- `design/canvas/project/` mirrors the published canvas artifact. Publish boards with root `design/canvas` so paths stay `project/<Name>.dc.html`
- The pangu Design System artifact's sources live in `design/system/`. `node build.mjs` there generates `project/tokens.json` and `project/components/bundle.css` from `web/public/`, so never edit those two by hand. Publish with root `design/system`, and send `project/design-system.json` last. Then copy `project/tokens.json` to `design/canvas/project/ds/pangu/tokens.json`
- After a token change, run `node design/system/check-drift.mjs`. It fails when the pangu.js extension's `styles.css` (sibling checkout `pangu.js`) lacks a shared token or holds a different value

## Gotchas

- Store downloaded artifact copies under `./tmp/` (gitignored), never in the system temp folder or the session scratchpad. Those are wiped on reboot, and a session must be resumable after one. One-off scratch (logs, screenshots, throwaway scripts) belongs in the scratchpad instead
