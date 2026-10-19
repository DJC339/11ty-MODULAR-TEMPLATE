# Reusable CFD website standards

## Scope and provenance

Modernized from `DJC339/11ty-MODULAR-TEMPLATE` commit `3bcc152ebf86d859403acfa332e5e048032c984c` on 19 October 2026. Reference reads:

- `DJC339/NorthernStrikeFishing` main: validation handler, security headers, responsive navigation and shared metadata. Tree snapshot `230bbce5501888756b37dcb38291287ae518cde0`.
- `DJC339/codeforgeddigital` main: contact validation, contact/business schema and navigation. Tree snapshot `c7a22312a3358e78ed1adea7e1304d2833a376e9`.
- `DJC339/Comic-store` dev: security audit, shared form rules, scoped CSP, hashed-image caching and accessibility test design. Tree snapshot `6ce8c93c7aee2abfca50c6f332567dad9bc90eac`.
- The Tripeak review supplied in this project informed hidden storage registration, server validation, deployment-dependent checks and uncertain-timeout handling. Its latest local code was not available for independent inspection.

These are reference patterns, not wholesale client-code copies. No client assets, claims, private details, checkout/CMS secrets, Stripe logic or client-specific CSP exceptions are transferred. No production reference repository is changed. The base preserves an optional blog; simple sites can remove it. There is no default CMS, commerce, customer authentication, analytics or database.

## Implementation decisions

- Eleventy 3 / Node 24 / Tailwind 4 via PostCSS; exact dependency versions and lockfile. Basic prose CSS replaces the optional typography dependency with its unresolved selector-parser advisory.
- Nunjucks autoescape through Eleventy's own API. Trusted layout content alone is marked safe. JSON-LD gets context-appropriate serialization.
- Modular page templates and site data. No invented business schema. Canonical/sitemap are environment-aware; noindex previews permit crawling.
- Native HTML, skip link, landmarks/headings, progressive navigation, visible focus, 44px controls, fluid layout and reduced-motion/forced-colors CSS. Automated checks plus explicit manual launch checks.
- Local compiled CSS/JS and optimized images use hashed names with immutable caches. Source originals stay outside public output. No broad third-party CSP permissions.
- Optional contact processing uses authoritative server validation and fixed trusted forwarding origin. Secret registration mitigates direct-form bypass only while secret and inaccessible. It is not a replacement for an authenticated storage API. A future adapter may replace Forms if requirements demand stronger isolation.
- Health is independent of page assets. Static and function responses both receive security headers. No unsafe-inline/unsafe-eval exceptions are inherited from the Comic-store CMS.

## Security review boundaries

OWASP Top 10:2025 is a risk-awareness framework, not a certification or complete verification standard. Local tests cover selected abuse cases. Hosting/account protections and monitoring remain client configuration.

| Risk | Template treatment | Remaining verification |
|---|---|---|
| A01 access control / SSRF | Public contact only; trusted deployment forwarding, no user-controlled destination | Registered-form bypass/name confidentiality; hosting access |
| A02 misconfiguration | Strict local CSP, generated static headers, separate function headers | Hosted precedence, redirects and domain behaviour |
| A03 supply chain | Exact dependencies/lockfile, audit, Dependabot, pinned read-only CI actions | Review updates and repository/secret access |
| A04 cryptography | HTTPS forwarding, HSTS, no committed secrets | Hosting TLS, secret scopes, access and rotation |
| A05 injection | Autoescaped metadata, JSON-LD escaping, parameterized forwarding, no input reflection | Third-party storage/notification rendering and exports |
| A06 insecure design | Size/field validation, honeypot, browser origin checks and rate config | Distributed abuse, cost controls and real enforcement |
| A07 authentication | No site accounts | MFA and least privilege for hosting/GitHub |
| A08 integrity | Reproducible lockfile builds, trusted CI action revisions | Branch protection and required checks |
| A09 logging | Outcome-only function logs without personal data | Alerts, retention and incident response owner |
| A10 exceptions | Fail-closed config/validation and clear uncertain delivery outcome | Hosted upstream failures; no exactly-once guarantee |

## Verification record

This revision passed a clean `npm ci`, `npm audit` with zero reported vulnerabilities, 29 Node/build checks, 12 browser checks and a clean production build. The browser checks cover nine routes across 320, 375, 768, 1024 and 1440px, plus keyboard/no-JavaScript operation, direct invalid POSTs, links, health headers, text enlargement and light/dark theme axe scans. Generated-output checks also exercise hostile metadata, image dimensions/priority, exclusion of source originals, asset size budgets and secret leakage. An isolated Eleventy watch smoke test confirmed that a new template utility class rebuilds the compiled Tailwind stylesheet. Desktop/mobile screenshots were visually inspected.

Verification environment: Node 24.19.0. The Playwright 1.64.1 bundled browser download returned a truncated archive in this environment, so local browser verification used a separate Chromium 153.0.8010.0 binary through `TEST_CHROMIUM_PATH`. That browser runtime is not added to this repository. CI requests Playwright's matching Chromium; its result is separate from these local checks.

Repeat tests after client content/configuration changes. A clean npm audit covers published dependency advisories only. Local header emulation and mocked forwarding cannot prove Netlify form storage, mail delivery, spam handling, platform rate limiting or hidden-artifact access. Browser automation is Chromium by default; real-device, screen-reader, 400% browser zoom and other-engine checks remain explicit launch work.

## Primary references

- https://www.11ty.dev/docs/languages/nunjucks/
- https://www.11ty.dev/docs/plugins/image/
- https://tailwindcss.com/docs/installation/using-postcss
- https://tailwindcss.com/docs/upgrade-guide
- https://www.w3.org/TR/WCAG22/
- https://developers.google.com/search/docs/crawling-indexing/block-indexing
- https://docs.netlify.com/manage/forms/setup/
- https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/
- https://docs.netlify.com/build/functions/api/
- https://owasp.org/Top10/2025/
