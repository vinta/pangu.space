# CLAUDE.md

## Design

- `web/public/tokens.css` is the source of truth for design tokens. Names follow the pangu.js extension's `styles.css` so the extension migrates by editing values. The Tokens board on the canvas documents it; change the file first, then the board
- Design sources live in `./design/` and are committed: `design/canvas/` holds the board template, generators, and `project/`, a mirror of the published canvas artifact; `design/preview/` holds standalone HTML renders. Publish boards with root `design/canvas` so paths stay `project/<Name>.dc.html`
- The pangu Design System artifact is https://claude.ai/artifact/758ABWKCNd8AQ5qxYRmqBm and its sources live in `design/system/`. `node build.mjs` there generates `project/tokens.json` and `project/components/bundle.css` from `web/public/`, so never edit those two by hand. Publish with root `design/system`, and send `project/design-system.json` last. The design canvas holds a copy under `project/ds/pangu/`; re-copy it after the system changes

## Gotchas

- Store scratch files and downloaded artifact copies under `./tmp/` (gitignored), never in the system temp folder or the session scratchpad. Those are wiped on reboot, and a session must be resumable after one
