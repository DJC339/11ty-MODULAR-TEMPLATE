# 11ty Modular Template

An opinionated Eleventy (11ty) starter with a simple, modular structure: layouts, components, global data, security defaults, and Netlify-friendly configuration.

## Features
- Eleventy 2.x with HTML + Markdown templates using Nunjucks tags
- Modular includes: base layout, header, footer, partials
- Global data (`src/_data`) for site metadata and navigation
- Blog collection via Markdown files under `src/blog/`
- Internationalized date filter using `Intl.DateTimeFormat`
- Pages under `src/pages/` with clean permalinks
- 404 page (`/404.html`)
- SEO: canonical URLs, Open Graph + Twitter Card tags, sitemap.xml, robots.txt
- Images: responsive `<picture>` via `{% img %}` shortcode, Markdown images lazy/async
- Cloudinary-first image pipeline with local fallback via `USE_CLOUDINARY=false`
- Tailwind CSS 3 + Autoprefixer with dedicated dev/build scripts (typography plugin included)
- Netlify config (`netlify.toml`) with cache and strong security headers
- External link hardening (`rel="noopener noreferrer"` for `target="_blank"`)

## Project Structure
```text
/
|-- .eleventy.js               # Eleventy configuration (engines, filters, shortcodes, transforms)
|-- netlify.toml               # Netlify build, headers (cache + security)
|-- package.json               # Scripts + dev dependencies
|-- package-lock.json
|-- .npmrc                     # Pin exact versions
|-- .github/dependabot.yml     # Weekly dependency PRs (GitHub)
|-- tailwind.config.js         # Tailwind theme + content paths
|-- postcss.config.js          # Tailwind + Autoprefixer
|-- src/
|   |-- _data/
|   |   |-- site.json          # Site title/description/author/url/language/twitter/image
|   |   |-- navigation.js      # Header nav links
|   |-- _includes/
|   |   |-- layouts/
|   |   |   |-- base.html      # Base layout shell
|   |   |   |-- post.html      # Blog post layout
|   |   |-- components/
|   |   |   |-- basehead.html  # <head> content + SEO
|   |   |   |-- header.html    # Site header + nav
|   |   |   |-- footer.html    # Site footer
|   |   |-- partials/
|   |       |-- social-links.html
|   |-- assets/
|   |   |-- css/
|   |   |   |-- tailwind.css   # Source (includes @tailwind directives + custom layers)
|   |   |   |-- main.css       # Generated output (copied to /assets/css/main.css)
|   |   |-- js/
|   |   |-- images/
|   |-- blog/
|   |   |-- post-1.md
|   |   |-- post-2.md
|   |-- pages/
|       |-- index.html         # /
|       |-- about.html         # /about/
|       |-- contact.html       # /contact/
|       |-- services.html      # /services/
|       |-- blog.html          # /blog/ (list of posts)
|       |-- 404.html           # /404.html
|       |-- robots.txt         # /robots.txt
|       |-- sitemap.xml.html   # /sitemap.xml
|-- .gitignore
```
## Getting Started
- Install: `npm install`
- Configure environment: copy `.env.example` to `.env` and set `CLOUDINARY_CLOUD_NAME`
- Develop: `npm start` (or `npm run dev`) - runs Eleventy serve alongside the Tailwind watcher
- Build: `npm run build` - runs `build:css` before Eleventy and outputs to `_site/`
- CSS only: `npm run dev:css` (watch) or `npm run build:css` (single build)
## Eleventy Configuration Highlights (`.eleventy.js`)
- Template engines: `htmlTemplateEngine: 'njk'`, `markdownTemplateEngine: 'njk'`
- Directories: `input: 'src'`, `includes: '_includes'`, `data: '_data'`, `output: '_site'`
- Passthrough: copies `src/assets` to `/assets`
- Date filter: `date(value, localeOrFormat = 'auto', styleOrOptions)`
  - Uses `Intl.DateTimeFormat` by default
  - Back-compat tokens: `yyyy-LL-dd`, `yyyy-LL`, `LL/dd/yyyy`
  - Examples:
    - `{{ date | date() }}` → system locale, medium date
    - `{{ date | date('en-GB','long') }}` → en-GB, long date
    - `{{ date | date('en-US', { dateStyle: 'medium', timeStyle: 'short' }) }}`
- Responsive images: `{% img src, alt, sizes %}`
  - Default: Cloudinary URLs with AVIF/WebP/JPEG sources at multiple widths
  - Local fallback: set `USE_CLOUDINARY=false` to use `@11ty/eleventy-img`
  - Example (Cloudinary public ID): `{% img 'site/hero', 'Alt text', '(min-width: 768px) 720px, 100vw' %}`
  - Example (local file): `{% img '/assets/images/example.jpg', 'Alt text', '(min-width: 768px) 720px, 100vw' %}`
- Markdown images: automatically get `loading="lazy" decoding="async"`
- Security transform: adds `rel="noopener noreferrer"` to links with `target="_blank"`
- Filters: `absoluteUrl(path, base)`, `w3cDate(value)` used by SEO and sitemap

## SEO
- Base head (`components/basehead.html`) includes:
  - Title and description (page front matter overrides global)
  - Canonical URL
  - Open Graph: site_name, title, description, url, type (article for blog), image
  - Twitter Card: `summary_large_image`, site handle, title, description, image
- Global settings in `src/_data/site.json`:
  - `title`, `description`, `author`, `url`, `language`, `twitter`, `image` (full URL, optional), `theme` (`dark` or `light`)
- Extras:
  - `src/pages/sitemap.xml.html` → `/sitemap.xml`
  - `src/pages/robots.txt` → `/robots.txt` with sitemap pointer

## Accessibility & Responsive Defaults
- Skip link to `#main-content` and focus-visible styles
- Fluid typography and responsive spacing
- Nav wraps on small screens
- Reduced-motion preferences enforced in `src/assets/css/tailwind.css`

## Netlify
- `netlify.toml` sets:
  - Build command: `npm run build`
  - Publish dir: `_site`
  - Node version: `18`
  - Cache headers:
    - `/assets/*`: `public, max-age=31536000, immutable`
    - `/*`: `public, max-age=0, must-revalidate`
  - Security headers:
    - CSP (default-src 'self'; images allow https and data; no plugins; frame-ancestors self; upgrade-insecure-requests)
    - Referrer-Policy, X-Content-Type-Options, X-Frame-Options, Permissions-Policy, COOP/CORP, HSTS

## Using This as a Template
- On GitHub, enable “Template repository” and click “Use this template”
- Or use degit:
  - `npx degit <your-username>/11ty-modular-template my-new-site`
  - `cd my-new-site && npm install && npm start`

## Things To Do After Cloning
1) Update site metadata
   - `src/_data/site.json` — title, description, author, url, language, twitter, image
2) Tweak navigation
   - `src/_data/navigation.js` — add/remove links (e.g., Contact)
3) Branding and SEO
  - Update tokens/utilities inside `src/assets/css/tailwind.css` (or extend `tailwind.config.js`)
   - Add favicons and social image to `src/assets/images`
   - Adjust OG/Twitter tags in `components/basehead.html` as needed
4) Social links
   - Edit `src/_includes/partials/social-links.html`
5) Content
   - Replace pages in `src/pages/`
   - Replace or remove sample posts in `src/blog/`
6) Netlify
   - Connect repo, configure custom domain, HTTPS
   - Adjust cache headers or CSP in `netlify.toml` if you add external assets/scripts
7) Asset hashing (recommended for production)
   - With long cache headers on `/assets/*`, add hashing to avoid stale files
   - Options:
     - Eleventy plugin (e.g., `eleventy-plugin-rev`)
     - Bundler (Vite/Rollup) to emit hashed filenames
     - Custom: generate hash map and reference via data (see outline below)
   - Minimal custom outline:
     1. Hash files in `src/assets` to `/assets/`
     2. Emit map original → hashed (e.g., `_data/assets.json`)
     3. Use map in `basehead.html` for CSS/JS references
8) Dependency hygiene
   - `.npmrc` pins exact versions; commit `package-lock.json`
   - `.github/dependabot.yml` opens weekly update PRs (on GitHub)
9) Analytics/consent (optional)
   - Add scripts in `components/basehead.html` or end of `base.html`

## Scripts
- `npm start` / `npm run dev` - run Eleventy serve + Tailwind watch in parallel
- `npm run dev:eleventy` - Eleventy dev server only
- `npm run dev:css` - Tailwind watcher only
- `npm run build` - build CSS then run Eleventy (outputs `_site/`)
- `npm run build:css` - single Tailwind build (minified)
## Notes
- `package.json` has `"private": true` to avoid accidental npm publishing; repo visibility is independent (GitHub can be public)
- This is a static template; no server-side code



