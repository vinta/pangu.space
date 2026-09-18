A switch for a setting that applies at once. It is a real checkbox, visually hidden with the `sr-only` class, followed by a `toggle-switch` span and a `toggle-label`, all inside a `label.toggle`.

- The consumer supplies the label text and the checkbox's `checked` and `disabled` state.
- The label sits `spacing-2` from the switch.
- The track is 44 by 24. Under 640px the whole label grows to a 44px touch target.
- On: `color-primary-light` track, `color-primary` knob. Off and disabled: `color-surface-tertiary` track, white knob.
- Disabled keeps full opacity and gets a `not-allowed` cursor. Its label turns `color-text-secondary`.
- The focus ring draws on the switch, keyed off the hidden checkbox.
- The knob and track slide over 200ms.
