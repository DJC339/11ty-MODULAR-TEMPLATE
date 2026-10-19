# CFD Eleventy modular template

A static business website foundation using Eleventy 3, Nunjucks, Tailwind 4 and Node 24 LTS. Shared layouts, navigation, metadata, responsive image processing, an independent health page and repeatable checks are included. Contact processing and blog content are optional.

## Install and run

```sh
npm ci
npm run dev
npm run build
npm run test:install
npm test
```

The development site runs on port 8080; browser checks use 8181 and fail if another process occupies that port. `npm run test:node` runs validation and generated-output tests. `npm run test:browser` builds a controlled contact-enabled fixture and runs Chromium/axe. Browser tests use an injected upstream that stores nothing and sends no mail. `npm run build` afterwards restores your normal configured output. CI runs checks for pull requests and pushes to main; it does not deploy.

Use a supported Node 24 release consistently with `.nvmrc`, package engines, CI and Netlify. Updates are deliberate, reviewed changes. Dependencies and the npm lockfile are committed. Do not use forced audit fixes or suppress advisories to manufacture a clean result. Native image/CSS dependencies need their installation support; do not blindly disable every install script without testing the build.

## Configure a new client project

1. Edit `src/_data/site.js`: real business name, description, locale, contact details and theme. Never copy another client's details or claims.
2. Replace page content and descriptions. Remove `placeholder: true` only when that page is approved. Delete the optional blog directory, blog page, post layout and navigation entry for sites without a blog.
3. Add approved images under `src/assets/images/`. This source directory is **not** copied wholesale to the public output. Put only deliberately public assets such as favicons or self-hosted licensed fonts under `src/assets/public/`.
4. Set `SITE_URL` to the final HTTPS origin. `.env.example` is a variable reference, not an auto-loaded file. Set variables in your shell or Netlify UI; never commit secrets.
5. Indexing remains off unless `CONTEXT=production` AND `ALLOW_INDEXING=true`. Indexable builds require a real `SITE_URL`. Previews remain noindex even if the production opt-in is inherited. Placeholder/draft/noindex pages stay out of the sitemap.
6. Complete [CLIENT_CHECKLIST.md](CLIENT_CHECKLIST.md) and choose whether to enable contact processing.

## Edit locations

| Content or behaviour | Location |
|---|---|
| Branding, contact, SEO defaults, optional schema | `src/_data/site.js` |
| Menu and footer destinations | `src/_data/navigation.js` |
| Pages and optional blog posts | `src/pages/`, `src/blog/` |
| Shared page and article layouts | `src/_includes/layouts/` |
| Header, footer and metadata | `src/_includes/components/` |
| Design styles and local navigation script | `src/assets/css/tailwind.css`, `src/assets/js/main.js` |
| Contact rules and handler | `lib/contact-rules.mjs`, `netlify/functions/contact.mjs` |
| Security headers | `lib/security.mjs`; generated `_site/_headers` |

Tailwind uses its official PostCSS integration in the Eleventy build hook. Template/CSS changes rebuild CSS on the same watch cycle; no separate CLI/watch process is needed. The typography plugin was removed because its selector-parser dependency had an advisory; basic prose styles are local. Tailwind 4's browser baseline is Safari 16.4+, Chrome 111+ and Firefox 128+. For clients requiring older browsers, choose and test an explicit compatibility strategy.

## Images and performance

```njk
{% img '/assets/images/hero.jpg', 'Describe the meaningful scene', '100vw', [640,960,1440,1920], ['avif','webp','jpeg'], 'hero-image', true %}
{% img '/assets/images/team.jpg', 'Approved team description', '(min-width: 768px) 50vw, 100vw' %}
```

The final argument marks an above-the-fold priority image: eager loading and high fetch priority. Other images lazy-load. Explicit alt is required; `''` marks decoration. Width/height and responsive candidates are generated. Image transforms strip source metadata by default; originals remain outside the deployed output. Do not use this shortcode for remote URLs or Cloudinary IDs. Previous Cloudinary code and environment settings are removed.

CSS, JS and optimized image filenames are hashed; only their output directories get immutable caching. Stable public files and HTML revalidate. No third-party scripts/fonts are included. Self-host licensed fonts with `font-display: swap`, limited weights and documented licences when required; system fonts are the base default. Measure real page LCP/CLS/INP and transfer sizes after content is supplied; passing the template suite is not a Lighthouse score or performance guarantee.

## SEO and structured data

Titles, descriptions, canonical URLs, Open Graph and social image fields live in the shared head. Set an approved raster social image and useful alt text; never assume the sample SVG is an appropriate sharing card. Canonicals use the production origin; previews still carry noindex. Sitemap entries use canonical routes and optional explicit `lastUpdated` dates rather than inventing modification dates on every build. `robots.txt` allows crawling so search engines can read noindex; noindex is not access control.

`site.business` defaults to null. Set it to a verified JSON-LD object (including `@context`, appropriate `@type`, `name`, canonical `url` and stable `@id`) only once details are confirmed. Add real contact/service-area information where appropriate; do not invent street addresses, review ratings or credentials. The JSON serializer escapes script-closing characters. Optional articles can add verified author/date/article schema through a dedicated component when needed. Keep visible content and schema consistent. Launch includes Search Console/Bing verification, sitemap submission and redirect checks; those account tasks are not automated here.

## Optional Netlify contact form

Contact is disabled by default. When enabled it requires Netlify Functions and Netlify Forms. Moving to another host requires a replacement delivery adapter and hosted verification; this is not portable static HTML alone.

Set these through Netlify UI for each trusted deploy context:

- `ENABLE_CONTACT=true` in Builds **and** Functions.
- `CONTACT_FORM_NAME`: generate a distinct random value using `openssl rand -hex 16`; make it available to Builds **and** Functions. It acts as a bearer secret for the storage form. Never reuse it across projects; use separate preview/production values and notifications.
- `SITE_URL` in Builds and Functions; Netlify's injected `DEPLOY_URL`, `URL` and `DEPLOY_PRIME_URL` supply trusted deployment origins.

Enable form detection. The generated `__forms.html` registers the storage form; a forced redirect makes that document return 404 on every public deployment URL. Only the server function knows the form name. Do not expose registration artifacts, build output or their logs in public CI artifacts. Restrict preview secrets for untrusted fork builds; use non-sensitive test fixtures in CI.

This design depends on keeping the name confidential. It does not make Netlify's direct submission endpoint enforce the validation rules. If the name leaks, direct submissions can bypass the function: rotate it, remove obsolete registered forms and re-verify. The blocked registration path, detection, submission processing and name confidentiality are **hosted verification requirements**, not guarantees from local tests.

Netlify secret scanning may flag the intentional registration artifact. Do not disable scanning globally. If required, document a narrowly scoped exception for this registration key after verifying its blocked location; keep output leakage tests and scanning for other secrets active.

The handler uses POST, a streamed 16 KiB body limit, exact fields, duplicate rejection, normalized Unicode text, length limits, email shape checks, control/newline checks, a honeypot, same-site browser checks and Netlify's per-IP/domain rate limit (5 requests/60 seconds). Origin checks are not bot authentication. Rate enforcement may lag and does not prevent distributed abuse. No user input is echoed in responses or logged. Only validated fields are forwarded to a trusted Netlify-injected HTTPS deployment URL. No request-header fallback, automatic retries, file upload, database, login or CAPTCHA is included.

Success means the forwarding response was accepted, not that an email reached an inbox. A timeout can occur after storage; the error page describes uncertain receipt. Do not claim failed requests always store nothing. Logs report outcomes without personal data; alerting and submission-retention policy must be arranged for each client.

## Monitoring and hosting checks

`/health/` returns 200 and visible `Site OK` without layouts, assets or external dependencies. It is noindex, excluded from navigation/sitemap and has `Cache-Control: no-store`. It verifies static reachability only.

```sh
TEST_BASE_URL=https://your-deployed-site.netlify.app npm run test:hosted
```

The hosted checker is read-only. It checks status, basic headers, blocked registration, health and hashed CSS caching. It does not send messages, test notifications, prove spam filtering or enforce rate rules. Follow the separate launch checklist for those checks. Netlify static headers do not cover function responses; the function sets its own. HSTS covers the configured host without automatically asserting that all subdomains are HTTPS-ready. Strict CSP allows local assets and inert JSON-LD; integrations need narrow, documented exceptions. No CSP collector is included because receiving untrusted reports introduces another endpoint and logging obligation.

See [docs/STANDARDS.md](docs/STANDARDS.md) for reference provenance, scope and verification limitations.
