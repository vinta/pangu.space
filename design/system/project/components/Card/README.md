The one raised surface. It holds a toolbar on top, the content, and an optional strip at the bottom.

- The consumer supplies the three parts: `toolbar`, the content, `strip`.
- `color-surface`, a `color-border` hairline, `radius-lg`, `shadow-sm`. It clips its overflow, so focus rings inside it must be inset.
- The toolbar lays controls in a row with `spacing-6` gaps. Add `end` to a toggle to push it to the right edge.
- The strip sits on `color-surface-secondary` and carries quiet things like the legend.
