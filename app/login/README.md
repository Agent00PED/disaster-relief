# HelpTrack — Login Page

A login page for HelpTrack, a disaster-relief donation and distribution tracking system.

## Structure

```
helptrack-login/
├── index.html        Markup only — links to css/js/assets below
├── css/
│   └── styles.css    All styles (design tokens, layout, components, responsive rules)
├── js/
│   └── main.js        Password toggle, form submit handler, volunteer login handler
└── assets/
    └── logo.svg        HelpTrack heart-handshake mark (used in both logo placements)
```

## Running it

Just open `index.html` in a browser — no build step required. All three files
must stay in the same relative layout (`css/`, `js/`, `assets/` next to
`index.html`) since the HTML references them with relative paths.

## Wiring up real functionality

Two spots in `js/main.js` are stubbed and ready for your backend:

- `#loginForm` submit handler — replace the `TODO` with your authentication call.
- `#volunteerBtn` click handler — replace the `TODO` with your volunteer sign-in flow.

## Notes

- Fonts: Noto Sans Thai + Prompt, loaded from Google Fonts in `index.html`.
- Color tokens (navy / clay / sand / ink) are defined once as CSS custom
  properties at the top of `styles.css` — change them there to retheme.
- The background scene is CSS/SVG only (no external image), so there are no
  extra image assets to manage beyond `logo.svg`.
