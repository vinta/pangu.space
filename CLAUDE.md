# CLAUDE.md

## Design

- `web/public/tokens.css` is the source of truth for design tokens. Names follow the pangu.js extension's `styles.css` so the extension migrates by editing values. The Tokens board on the canvas documents it; change the file first, then the board
- Design sources live in `./design/` and are committed: `design/canvas/` holds the board template, generators, and `project/`, a mirror of the published canvas artifact; `design/preview/` holds standalone HTML renders. Publish boards with root `design/canvas` so paths stay `project/<Name>.dc.html`
- `node gen.mjs` in `design/canvas/` rewrites every Style board from the current template. Only P, Q, PhoneQ match it; A to H are older generations. After running it, restore the others with `git checkout` before publishing

## Gotchas

- Store scratch files and downloaded artifact copies under `./tmp/` (gitignored), never in the system temp folder or the session scratchpad. Those are wiped on reboot, and a session must be resumable after one
