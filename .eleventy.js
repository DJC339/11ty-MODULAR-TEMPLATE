import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { globSync } from 'node:fs';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import Image from '@11ty/eleventy-img';
import { load } from 'cheerio';
import { siteConfig, jsonForHtml } from './lib/site-config.mjs';
import { SECURITY_HEADERS } from './lib/security.mjs';

export default function (config) {
  config.setNunjucksEnvironmentOptions({ autoescape: true });
  // Only developer-authored templates/Markdown use | safe. Never apply it to submitted data.
  config.addPassthroughCopy({ 'src/assets/public': 'assets/public' });
  config.addWatchTarget('src/assets/css/');
  config.addWatchTarget('src/assets/js/');
  config.addWatchTarget('lib/');
  let assets = {};
  config.addFilter('asset', name => {
    if (!assets[name]) throw new Error(`Unknown compiled asset: ${name}`);
    return assets[name];
  });
  config.addFilter('jsonForHtml', jsonForHtml);
  config.addFilter('absoluteUrl', (value, base) => base ? new URL(value, base).href : '');
  config.addFilter('date', (value, locale = 'en-CA', style = 'medium') => {
    const date = value === 'now' ? new Date() : new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error('Invalid content date');
    if (locale === 'yyyy-LL-dd') return date.toISOString().slice(0,10);
    if (['short','medium','long','full'].includes(locale)) { style = locale; locale = 'en-CA'; }
    return new Intl.DateTimeFormat(locale, { dateStyle: style, timeZone: 'UTC' }).format(date);
  });
  config.addFilter('w3cDate', value => new Date(value).toISOString());
  config.addFilter('publicPages', pages => pages.filter(p => p.url && p.url.endsWith('/') && !p.data.noindex && !p.data.placeholder && !p.data.draft && !p.data.eleventyExcludeFromCollections));
  config.addTransform('secure-new-tabs', (content, outputPath) => {
    if (!outputPath?.endsWith('.html')) return content;
    const $ = load(content);
    $('a[target="_blank"]').each((_, link) => {
      const rel = new Set(($(link).attr('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener'); rel.add('noreferrer');
      $(link).attr('rel', [...rel].join(' '));
    });
    return $.html();
  });
  config.on('eleventy.before', async () => {
    const settings = siteConfig();
    await mkdir('_site/assets/compiled', { recursive: true });
    const css = await postcss([tailwind()]).process(await readFile('src/assets/css/tailwind.css', 'utf8'), { from: 'src/assets/css/tailwind.css' });
    assets = {};
    for (const [name, content, ext] of [ ['css', css.css, 'css'], ['js', await readFile('src/assets/js/main.js','utf8'), 'js'] ]) {
      const hash = createHash('sha256').update(content).digest('hex').slice(0,16);
      assets[name] = `/assets/compiled/main-${hash}.${ext}`;
      await writeFile(`_site${assets[name]}`, content);
    }
    const lines = ['/*', ...Object.entries(SECURITY_HEADERS).map(([k,v]) => `  ${k}: ${v}`), '  Cache-Control: public, max-age=0, must-revalidate'];
    if (!settings.indexable) lines.push('  X-Robots-Tag: noindex');
    lines.push('/assets/compiled/*', '  Cache-Control: public, max-age=31536000, immutable', '/assets/images/optimized/*', '  Cache-Control: public, max-age=31536000, immutable');
    for (const route of ['/health/', '/health/index.html', '/thanks/', '/form-error/', '/__forms.html']) lines.push(route, '  Cache-Control: no-store', '  X-Robots-Tag: noindex');
    await writeFile('_site/_headers', lines.join('\n')+'\n');
    // Netlify scans this before serving; a forced 404 blocks public access on every deploy URL.
    if (settings.contactEnabled) {
      await writeFile('_site/__forms.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Form registration</title></head><body><form name="${process.env.CONTACT_FORM_NAME}" method="POST" data-netlify="true"><input name="name"><input name="email"><textarea name="message"></textarea></form></body></html>`);
    }
  });
  config.addNunjucksAsyncShortcode('img', async (src, alt, sizes = '100vw', widths = [320,640,960,1280,1920], formats = ['avif','webp','jpeg'], className = '', priority = false) => {
    if (typeof alt !== 'string') throw new Error('Images require explicit alt text; use an empty string for decoration.');
    const full = path.resolve('src', String(src).replace(/^\//,''));
    if (!full.startsWith(path.resolve('src/assets/images')+path.sep)) throw new Error('img shortcode accepts local source images only.');
    const metadata = await Image(full, { widths, formats, urlPath:'/assets/images/optimized/', outputDir:'_site/assets/images/optimized' });
    return Image.generateHTML(metadata, { alt, sizes, class: className, loading: priority ? 'eager' : 'lazy', decoding:'async', ...(priority ? { fetchpriority:'high' } : {}) });
  });
  // Catch accidental secret exposure outside the blocked registration document.
  config.on('eleventy.after', async () => {
    const secret = process.env.CONTACT_FORM_NAME;
    if (!secret) return;
    for (const file of globSync('_site/**/*.{html,xml,txt,js,css,json}')) {
      if (file.replaceAll('\\','/') === '_site/__forms.html') continue;
      if ((await readFile(file,'utf8')).includes(secret)) throw new Error('Contact registration name exposed in public output.');
    }
  });
  return { templateFormats:['md','html','njk'], markdownTemplateEngine:'njk', htmlTemplateEngine:'njk', dir:{input:'src',includes:'_includes',data:'_data',output:'_site'} };
}
