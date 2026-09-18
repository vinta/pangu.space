pangu is a small family of tools that put a space between Chinese, Japanese, Korean text and Latin letters, digits and symbols: the pangu.space site, the pangu.js browser extensions, and whatever comes next. This system is the look they share. It was built from the pangu.space site's stylesheets, and token names follow the pangu.js extension so both read the same variables.

## Content

- Plain, short, direct. Talk to the reader as "you". No marketing voice, and features get deflated, never hyped: "Nothing leaves your machine."

- Sentence case everywhere. Write casing in the markup, never with `text-transform`.

- English and Traditional Chinese ship together. The Chinese voice is playful and takes its terms from the extension: AI Spacing is 空格之神 AI.

- Put a space between Chinese and Latin text in all copy. It is the whole point.

- No emoji.

## Color

- Light theme only. A dark set is not designed yet, so do not invent one.

- Ink is neutral, never blue-grey: `color-text-primary` for headlines, body and controls, `color-text-secondary` for descriptions, labels, notes and footers.

- `color-text-tertiary` is for separators and placeholders only. It is 2.57:1 on `color-surface`, below the reading floor, so never set real text in it.

- The page ground is `color-surface-secondary`. Cards, the navbar and controls sit on `color-surface`, edged with `color-border`.

- `color-primary` is the accent: the toggle knob, focus rings, hover on nav links and buttons, and link text inside page content. As text it is 3.68:1 on `color-surface`, below the 4.5:1 floor. That miss is known and accepted: a darker blue was tried and rejected as too heavy, so keep this value and do not add a second link blue.

- Green and red carry meaning, never decoration. Green is add, save and active status. Red is destructive: remove, restore defaults. Their text colors, `color-success` and `color-danger`, pass 4.5:1 on white and on their own soft fills.

- Blue-grey `color-info` is for neutral notices: `color-info` text on a `color-info-light` fill with a `color-info-border` edge. A notice comes in three kinds, info, success and danger, and all three read tokens.

- A green or red button is soft: a `color-success-light` or `color-danger-light` fill, the matching text color, and a `color-success-border` or `color-danger-border` edge. Hover swaps in the `-hover` pair. Always give it a word, never color alone.

- Diff colors mean one thing each. `color-diff-add` sits behind an added space. A row is tinted `color-diff-row-add`, `color-diff-row-del` or `color-diff-row-mix` by what changed in it. A removed space is not drawn at all: the row tint is its only sign, and the row reads exactly as the output.

## Type

- System fonts only, no web fonts. `font-sans` lists PingFang TC and Noto Sans TC so Chinese renders in a matching face.

- Three text sizes do all the work: `text-xs`, `text-sm`, `text-base`. Every control, meaning toggle labels, buttons and selects, is `text-base`. 14px reads too small on a control. One headline size, `text-3xl`, dropping to `text-2xl` under 640px.

- Use the `headline` style once per page, weight 600. Titles take no letter-spacing: negative tracking squeezes Chinese glyphs.

- Pane and diff text uses the `pane` style. Its 1.8 line height keeps mixed Chinese and Latin lines even, and the two panes must stay line for line.

- A Chinese headline never breaks between characters. Set `word-break: keep-all` and mark the one allowed break with a zero-width space in the string.

## Layout and spacing

- Every gap, padding and margin is a spacing token. Control heights are sizes, not spacing: 32px select, 32px tool button, 40px pane header, 56px navbar.

- One shell sets the width: 1280px at most, fluid below, with a `spacing-8` gutter. Nothing inside it sets its own max width.

- Under 640px the panes stack, the gutter drops to `spacing-4`, and touch targets grow to at least 44px.

- Radii step with size: `radius-sm` buttons, `radius` selects, `radius-lg` cards, `radius-full` toggles.

- Depth is a hairline `color-border` plus `shadow-sm`. No heavier shadow exists.

## Buttons

- A page's main action is a filled `color-text-primary` button with `color-text-on-primary` text, 46px tall, `radius`. Use one per view. Hover drops it to 90% opacity.

- Tool actions inside a card, like Copy, use the small outlined button: 32px, `radius-sm`, `color-border`.

- Inline row actions that add, save or remove use the soft green and red buttons above. A filled dark green reads too heavy.

## States and motion

- Keyboard focus is a 2px `color-primary` outline with a 2px offset, shown on `:focus-visible` only. Use an outline, never a box shadow, so it survives forced colors. Inside a card the ring is inset, because the card clips overflow.

- The toggle slides over 200ms. Hover color and the Copied label fade over 150ms. Both switch off under `prefers-reduced-motion`.

- A disabled toggle keeps full opacity: grey track, white knob, `color-text-secondary` label, `not-allowed` cursor.

## Iconography

- No icon set. The only mark is the pangu logo in the Logos group. Use it as is and never redraw it.

## Not synced

- The two transition values have no token family in this format. They are declared at the top of `components/bundle.css` as `--transition-fast` and `--transition`.

- The soft green and red buttons have tokens but no component here, since the site has no such button yet. In the pangu.js extension they are page-specific rules. Its active status dot stays a raw value there, because it is a single mark on one page.

- Components are static renditions of the site's CSS classes. There is no script bundle, so mount them as markup with those classes.

- Page sections were left out on purpose, since they are layout and not reusable parts: the navbar, the hero, the note under the card, the footer.
