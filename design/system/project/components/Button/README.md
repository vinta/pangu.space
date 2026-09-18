Two buttons: a small outlined tool button, and a filled main action. The site has one tool button, Copy, in the header of the output pane.

- The consumer supplies the label and the click handler.
- 28px tall, `radius-sm`, `color-border`. Hover turns the border and text `color-primary` over 150ms. Under 640px it grows to 36px.
- For copy feedback use `btn-copy` with two stacked spans, `when-idle` and `when-copied`. Both share one grid cell, so the button keeps the width of the longer label in every language.
- Add the `copied` class for 2 seconds after a successful copy, and restart the timer on a repeat click. On failure the label stays as it is.
- The main action is `btn btn-primary`: `color-text-primary` fill, `color-text-on-primary` text, 46px tall, `radius`, 90% opacity on hover, 50% when disabled. One per view. Its measurements match the pangu.js extension's main buttons.
- Announce the result through a separate hidden `role="status"` line. A changed button label alone is often not read out.
