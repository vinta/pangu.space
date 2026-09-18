The output as one row per line, tinted by what changed. This is the heart of the site.

- The consumer supplies one `row` per output line, in order, with each added run of spaces wrapped in a span with class `a`.
- Tint the row with `add` when it only gained spaces, `del` when it only lost spaces, `mix` when both. An unchanged row has no tint.
- Never draw a removed space. The row must read exactly as the output, and the tint is the only sign of a removal.
- Rows are `white-space: pre` and as wide as their text, so a long line scrolls sideways and its tint runs the full width.
- An empty line keeps its height, so the rows stay line for line with the original.
- Build rows with text nodes, never `innerHTML`. The text is whatever the user pasted.
