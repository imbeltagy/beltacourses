# @repo/frontend-emails

Generates the HTML for every transactional email. It only **produces** HTML — sending stays in the
API (`EmailService` in `@repo/backend/email`).

```sh
pnpm --filter @repo/frontend-emails build   # writes dist/ (git-ignored)
pnpm --filter @repo/frontend-emails test
```

`build` needs `NEXT_PUBLIC_STATIC_IMAGES_URL` as an **absolute** URL (see `.env.example`): images go
through `imgUrl()` and an email opens far from any app, so a relative path cannot load.

## Output

```
dist/
├── en/
│   ├── account-created.html
│   ├── reset-password.html
│   └── subjects.json          { "<template>": "<subject>" }
└── ar/ …
```

One directory per locale rather than `name.<locale>.html`: a locale is a single lookup path, a missing
locale is a missing directory, and the fallback is one `path.join`.

## Authoring

Templates are [React Email](https://react.email) components; only they are committed, the HTML in
`dist/` is generated.

- `src/templates/<name>.tsx` is one email; register it in `src/templates/index.ts`.
  `src/components/layout.tsx` is the shared frame (logo, card, sign-off, footer) and
  `components/parts.tsx` the building blocks (`Title`, `Paragraph`, `Action`, `Note`).
- Texts live in `src/locales/<locale>.json`: `common` plus one section per template name, each with a
  `subject`. A template reads them with `t("title")` / `common("greeting")`; a key missing from any
  locale fails the build.
- Run-time values are written `v("name")`, which leaves `{{name}}` in the HTML for the API to replace
  (HTML-escaped) when it sends.
- Right-to-left is automatic: `Layout` sets `dir="rtl"` and right alignment for `ar`.

To add a locale: add it to `LOCALES` in `src/locales.ts`, add `src/locales/<locale>.json`, and add it
to the API's `EMAIL_LOCALES`. To add an email: one `.tsx`, one line in the index, one section in each
JSON file.
