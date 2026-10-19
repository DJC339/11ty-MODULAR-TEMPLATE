# Client setup and launch checklist

## Before content approval

- Confirm scope, routes, domain, hosting owner, maintenance responsibilities and content rights.
- Replace branding, descriptions, navigation and all sample content. Remove unused blog/features.
- Obtain approved copy, logo outlines where needed, image/font licences and social-sharing image.
- Set real contact details; verify public business/schema information and stable canonical identity.
- Remove placeholder status only for approved pages. Keep utility pages out of the sitemap.

## Local checks

- Use Node 24; run `npm ci`, `npm audit`, `npm test`, then `npm run build`.
- Check responsive design at 320, 375, 768, 1024 and 1440 CSS pixels with real content/images.
- Check keyboard/focus, no-JS navigation, 200% text, text spacing, 400% browser zoom/reflow, reduced motion, contrast and image alt text.
- Manually test screen readers, real phones and Windows forced-colors. Automated axe checks do not establish WCAG 2.2 AA compliance.
- Inspect source/output for secrets, private client data, broken assets, unnecessary requests and unlicensed files.
- Measure LCP/CLS/INP and asset transfer sizes on representative deployed pages; record device/network conditions.

## Hosting and form verification

- Confirm security headers, HTTPS, redirects, primary domain, canonical URLs, caching and `/health/` on the actual deployment.
- Keep previews noindex and crawlable; configure production indexing explicitly after approval.
- If contact is enabled, configure the form secret separately per project/context and enable Netlify form detection.
- Confirm `__forms.html` and encoded/normalized variants cannot reveal registration HTML on production, branch, preview and deploy-permalink URLs.
- Verify no old/publicly named registered form still accepts submissions. Remove obsolete registrations deliberately after protecting any needed records.
- On a controlled deploy, test direct POSTs to `/api/contact`, `/`, arbitrary routes and obsolete form names. Include blanks, whitespace, invisible-only fields, invalid email, duplicates and oversize payloads. Inspect stored submissions; a response alone does not prove rejection.
- Submit one approved valid test message, confirm storage and notification delivery, inspect spam handling, and verify actual rate-limit enforcement.
- Set notification recipients, submission access, retention, alerts, usage/billing monitoring and support owner. Document accepted residual abuse/delivery risks.
- Configure repository protections, MFA and least-privilege hosting access; the template cannot enforce account settings.
- Submit sitemap/verify search engines only after production content and indexing are approved.

## Handover

- Record release/commit, hosting configuration, test evidence, known limitations and pending checks.
- If source is handed over, complete the Code Handover Addendum and applicable Hosting Addendum.
