# 11ty Modular Template

An opinionated Eleventy (11ty) starter with a simple, modular structure: layouts, components, global data, and sensible defaults for Netlify.

## Features
- Eleventy 2.x with HTML + Markdown templates using Nunjucks tags
- Modular includes: base layout, header, footer, partials
- Global data (`src/_data`) for site metadata and navigation
- Blog collection via Markdown files under `src/blog/`
- Internationalized date filter using `Intl.DateTimeFormat`
- Pages under `src/pages/` with clean permalinks
- 404 page (`/404.html`) and Netlify config (`netlify.toml`)
- Static assets passthrough: `src/assets` → `/assets`
- Production-friendly cache headers (long cache for assets, fresh HTML)

## Project Structure
```
/
├── .eleventy.js               # Eleventy configuration (engines, filters, dirs)
├── netlify.toml               # Netlify build + headers
├── package.json               # Scripts + dev dependencies
├── src/
│   ├── _data/                 # Global data (available to all templates)
│   │   ├── global.json        # Site title/description/author
│   │   └── navigation.js      # Header nav links
│   ├── _includes/             # Layouts, components, partials
│   │   ├── layouts/
│   │   │   ├── base.html      # Base layout shell
│   │   │   └── post.html      # Blog post layout
│   │   ├── components/
│   │   │   ├── basehead.html  # <head> content for base layout
│   │   │   ├── header.html    # Site header + nav
│   │   │   └── footer.html    # Site footer
│   │   └── partials/
│   │       └── social-links.html
│   ├── assets/                # Static assets (copied as-is)
│   │   ├── css/style.css
│   │   ├── js/
│   │   └── images/
│   ├── blog/                  # Blog posts (Markdown)
│   │   ├── post-1.md
│   │   └── post-2.md
│   └── pages/                 # Site pages with permalinks
│       ├── index.html         # /
│       ├── about.html         # /about/
│       ├── contact.html       # /contact/
│       ├── services.html      # /services/
│       └── blog.html          # /blog/ (list of posts)
└── .gitignore
```

## Getting Started
- Install: `npm install`
- Develop: `npm start` (or `npm run dev`) — serves and watches files
- Build: `npm run build` — outputs to `_site/`

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

## Pages and Collections
- Pages live in `src/pages/` and specify a `permalink` in front matter to control URLs.
- Blog posts live in `src/blog/` with front matter like:
  ```yaml
  ---
  layout: layouts/post.html
  title: First Post
  date: 2024-01-15
  tags: [blog]
  ---
  ```
  Any file tagged `blog` is available in `collections.blog`.

## 404 Page
- `src/pages/404.html` builds to `/404.html`.
- Netlify and the Eleventy Dev Server use this automatically for missing routes.

## Netlify
- `netlify.toml` sets:
  - Build command: `npm run build`
  - Publish dir: `_site`
  - Node version: `18`
  - Cache headers:
    - `/assets/*`: long cache (`public, max-age=31536000, immutable`)
    - `/*`: short cache for HTML (`public, max-age=0, must-revalidate`)
- Deploy steps:
  1) Connect GitHub repo in Netlify
  2) Netlify will pick up `netlify.toml` and build on push
  3) Preview deploys for PRs are automatic

## Using This as a Template
- On GitHub, enable “Template repository” and click “Use this template”
- Or use degit:
  - `npx degit <your-username>/11ty-modular-template my-new-site`
  - `cd my-new-site && npm install && npm start`

## Things To Do After Cloning
1) Update site metadata
   - `src/_data/global.json` — title, description, author
2) Tweak navigation
   - `src/_data/navigation.js` — add/remove links (e.g., Contact)
3) Branding and SEO
   - Update `src/assets/css/style.css`
   - Add favicons and social image to `src/assets/images`
   - Consider Open Graph/Twitter meta in `components/basehead.html`
4) Social links
   - Edit `src/_includes/partials/social-links.html`
5) Content
   - Replace example pages under `src/pages/`
   - Replace or remove sample posts in `src/blog/`
6) Netlify
   - Connect repo, configure custom domain, HTTPS
   - Adjust cache headers in `netlify.toml` if needed
7) Asset hashing (recommended for production)
   - Why: With long cache headers on `/assets/*`, hashing prevents clients from using stale files
   - Options:
     - Simple Eleventy transform-based approach:
       - Generate a content hash for each asset filename (e.g., `style.abc123.css`)
       - Replace references in HTML to point to hashed names
     - Use a bundler (Vite/Rollup) for CSS/JS:
       - Let the bundler emit hashed assets and inject links
     - Use an Eleventy plugin (e.g., `eleventy-plugin-rev`) to automate revving
   - Minimal custom approach outline:
     1. Add a build step to hash files in `src/assets` and write to `assets/`
     2. Provide a data map of original → hashed names (e.g., `_data/assets.json`)
     3. Update `basehead.html` to use `{{ assets['/assets/css/style.css'] }}` when present
8) Analytics/consent (optional)
   - Add your snippet in `components/basehead.html` or at the end of `base.html`
9) Linting/format (optional)
   - Add Prettier/ESLint config if you want consistent formatting

## Scripts
- `npm start` — run Eleventy dev server with live reload
- `npm run dev` — same as start
- `npm run build` — output site to `_site/`

## Notes
- `package.json` has `"private": true` to avoid accidental npm publishing; repo visibility is independent (GitHub can be public)
- This is a static template; no server-side code
