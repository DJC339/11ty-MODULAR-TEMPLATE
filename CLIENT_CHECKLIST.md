# Client Setup Checklist

Use this list after copying the template into a new client folder.

## Required
- Update site metadata in `src/_data/global.json`
  - `title`, `description`, `author`, `url`, `language`, `twitter`, `image`
  - Set `theme` to `light` or `dark`
- Set Cloudinary config
  - Copy `.env.example` to `.env`
  - Set `CLOUDINARY_CLOUD_NAME`
  - Optional: set `USE_CLOUDINARY=false` to use local images
- Update navigation in `src/_data/navigation.js`
- Replace content
  - `src/pages/*`
  - `src/blog/*` (remove sample posts)
- Update social links in `src/_includes/partials/social-links.html`

## Recommended
- Add favicons and social image in `src/assets/images`
- Verify `site.image` in `src/_data/global.json` (full URL)
- Review CSP in `netlify.toml` if adding external scripts/fonts
- Run a production build and spot-check `_site/`

## Deploy
- Set Netlify environment variables (`CLOUDINARY_CLOUD_NAME`, `USE_CLOUDINARY`, `SITE_URL`)
- Confirm build command: `npm run build`
- Confirm publish directory: `_site`
