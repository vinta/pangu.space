pangu is a small family of tools that put a space between Chinese, Japanese, Korean text and Latin letters, digits and symbols: the pangu.space site, the pangu.js browser extensions, and whatever comes next. This system is the look they share. Token names follow the pangu.js extension, so both read the same variables.

## Where things live

This page holds the rules: what to use, when, and what never to do. It states no measurements, so go to the source for a value.

- Token values are in `tokens.json`. Every token has a usage note, and the notes give contrast ratios where they matter.

- A component's sizes, states and markup are in `components/<Name>/README.md`, and its CSS is in `components/bundle.css`.

- In the repository, `web/public/tokens.css` and `web/public/styles.css` are the source of truth. `design/system/build.mjs` generates `tokens.json` and `components/bundle.css` from them, so never edit those two by hand.

## Content

- Plain, short, direct. Talk to the reader as "you". No marketing voice, and features get deflated, never hyped: "Nothing leaves your machine."

- Sentence case everywhere. Write casing in the markup, never with `text-transform`.

- English and Traditional Chinese ship together. The Chinese voice is playful and takes its terms from the extension: AI Spacing is 空格之神 AI.

- Put a space between Chinese and Latin text in all copy. It is the whole point.

- No emoji.

## Color

- Light theme only. A dark set is not designed yet, so do not invent one.

- Ink is neutral, never blue-grey: `color-text-primary` for headlines, body and controls, `color-text-secondary` for descriptions, labels, notes and footers.

- `color-text-tertiary` is for separators and placeholders only. It sits below the reading floor, so never set real text in it.

- The page ground is `color-surface-secondary`. Cards, the navbar and controls sit on `color-surface`, edged with `color-border`.

- `color-primary` is the accent: the toggle knob, focus rings, hover on nav links and buttons, and link text inside page content. As small text it misses the contrast floor. That miss is known and accepted: a darker blue was tried and rejected as too heavy, so keep this value and do not add a second link blue.

- Green and red carry meaning, never decoration. Green is add, save and active status. Red is destructive: remove, restore defaults. Their text colors, `color-success` and `color-danger`, are chosen to pass as text on white and on their own soft fills.

- `color-info` is for neutral notices: `color-info` text on a `color-info-light` fill with a `color-info-border` edge. A notice comes in three kinds, info, success and danger, and all three read tokens.

- A green or red button is soft: a `color-success-light` or `color-danger-light` fill, the matching text color, and a `color-success-border` or `color-danger-border` edge. Hover swaps in the `-hover` pair. Always give it a word, never color alone.

- Diff colors mean one thing each. `color-diff-add` sits behind an added space. A row is tinted `color-diff-row-add`, `color-diff-row-del` or `color-diff-row-mix` by what changed in it. A removed space is not drawn at all: the row tint is its only sign, and the row reads exactly as the output.

## Links

- Nav and brand links are ink and turn `color-primary` on hover. No underline.

- Links inside page content are `color-primary` at rest and gain an underline on hover.

- Footer links are ink with a light underline, mixed from `color-text-tertiary` and `color-border`. On hover the text and the underline turn the same `color-primary`.

## Type

- System fonts only, no web fonts. `font-sans` names Chinese faces so Chinese renders in a matching face, and it lists the Latin faces first, or Latin text would render in a Chinese font's Latin glyphs.

- `font-mono` is for URLs, code and patterns the reader must read character by character. Nothing else is monospaced.

- Reading text comes in two sizes: `text-sm` for the diff legend, `text-base` for everything else you read or use. A control, meaning a toggle label, a button or a select, is never smaller than `text-base`.

- One headline size, `text-3xl`, dropping to `text-2xl` on phones. Use the `headline` style once per page.

- Two levels sit under the headline: `text-xl` for section titles, `text-lg` for the description under the headline. A title is never set at `text-base`.

- Titles take no letter-spacing. Negative tracking squeezes Chinese glyphs.

- Pane and diff text uses the `pane` style. Its tall line height keeps mixed Chinese and Latin lines even, and the two panes must stay line for line.

- A Chinese headline never breaks between characters. Set `word-break: keep-all` and mark the one allowed break with a zero-width space in the string.

## Layout and spacing

- Every gap, padding and margin is a spacing token. Control heights are sizes, not spacing, and they live with each component.

- One shell sets the page width and is fluid below its maximum. Nothing inside it sets its own max width.

- A card shows the same space above its first line and below its last. When a card ends in text, trim the leading under that last line with `text-box: trim-end text`. Apply it to the specific last text element, never to every last child: a strip or a control row already has even padding. Browsers without `text-box` just show a little more space.

- Under 640px the panes stack, the gutter narrows, and touch targets grow to at least 44px.

- Radii step with size: `radius-sm` buttons, `radius` selects, `radius-lg` cards, `radius-full` toggles.

- Depth is a hairline `color-border` plus `shadow-sm` for cards. Overlays that float above the page, such as a notification, use `shadow-lg`. Nothing sits between the two.

## Buttons

- A page's main action is the filled ink button: `color-text-primary` fill, `color-text-on-primary` text. Use one per view.

- Tool actions inside a card, like Copy, use the small outlined button.

- Inline row actions that add, save or remove use the soft green and red buttons. A filled dark green reads too heavy.

## States and motion

- Keyboard focus is a `color-primary` outline with an offset, shown on `:focus-visible` only. Use an outline, never a box shadow, so it survives forced colors. Inside a card the ring is inset, because the card clips overflow.

- The toggle slides at `--transition`. Hover color and the Copied label fade at `--transition-fast`. Both switch off under `prefers-reduced-motion`. That rule must name `::before` and `::after` too, since `*` does not match pseudo-elements and the toggle knob is one.

- A disabled toggle keeps full opacity: grey track, white knob, `color-text-secondary` label, `not-allowed` cursor.

## Iconography

- No icon set. The only mark is the pangu logo in the Logos group. Use it as is and never redraw it.

## Not synced

- The two transition values have no token family in this format. They are declared at the top of `components/bundle.css` as `--transition-fast` and `--transition`.

- The soft green and red buttons have tokens but no component here, since the site has no such button yet. In the pangu.js extension they are page-specific rules.

- Components are static renditions of the site's CSS classes. There is no script bundle, so mount them as markup with those classes.

- Page sections were left out on purpose, since they are layout and not reusable parts: the navbar, the hero, the note under the card, the footer.
