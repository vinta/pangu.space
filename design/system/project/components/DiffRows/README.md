The output as one row per line, tinted by what changed. This is the heart of the site.

- The consumer supplies one `row` per output line, in order, with each added run of spaces wrapped in a span with class `a`, and an empty span with class `d` where a removed run was.
- Tint the row with `add` when it only gained spaces, `del` when it only lost spaces, `mix` when both. An unchanged row has no tint.
- A removed space is an empty `d` mark: a 2px bar that takes no width, so the row reads exactly as the output.
- Rows are `white-space: pre` and as wide as their text, so a long line scrolls sideways and its tint runs the full width.
- An empty line keeps its height, so the rows stay line for line with the original.
- Build rows with text nodes, never `innerHTML`. The text is whatever the user pasted.
