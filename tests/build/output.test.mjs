import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,unlinkSync,existsSync,rmSync,cpSync,mkdtempSync,symlinkSync} from 'node:fs';
import {globSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {load} from 'cheerio';
const secret='1234567890abcdef'.repeat(2);
function build(extra={}) { rmSync('_site',{recursive:true,force:true});execFileSync(process.execPath,['node_modules/@11ty/eleventy/cmd.cjs'],{env:{...process.env,CONTEXT:'deploy-preview',ALLOW_INDEXING:'false',SITE_URL:'',ENABLE_CONTACT:'false',CONTACT_FORM_NAME:'',...extra},stdio:'pipe'}); }
const read=p=>readFileSync('_site/'+p,'utf8');
test('generated output respects preview, production, placeholders, escaping and asset settings',()=>{
 const original=process.cwd();
 const temporary=mkdtempSync(path.join(os.tmpdir(),'cfd-template-build-'));
 for(const file of ['src','lib','.eleventy.js','package.json'])cpSync(path.join(original,file),path.join(temporary,file),{recursive:true});
 symlinkSync(path.join(original,'node_modules'),path.join(temporary,'node_modules'),'dir');
 process.chdir(temporary);
 // Controlled hostile fixture proves output escaping, not just the filter implementation.
 const fixture='src/pages/test-fixture.html';
 const image='src/assets/images/test-fixture.svg';
 writeFileSync(image,'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="navy"/></svg>');
 writeFileSync(fixture,'---\nlayout: layouts/base.html\ntitle: \'"><script>alert(1)</script> & test\'\ndescription: \'"><img src=x onerror=alert(1)>\'\npermalink: /test-fixture/\n---\n<h1>Fixture</h1>\n<a href="https://www.w3.org/" target="_blank" rel="external">Reference</a>\n{% img "/assets/images/test-fixture.svg", "Fixture image", "100vw", [320,640], ["webp","jpeg"], "fixture", true %}\n');
 try {
  build();let $=load(read('test-fixture/index.html'));
  assert.equal($('script:not([src]):not([type="application/ld+json"])').length,0);assert.equal($('img').length,1);
  assert.equal($('img').attr('loading'),'eager');assert.equal($('img').attr('fetchpriority'),'high');assert.ok($('img').attr('width'));assert.ok($('img').attr('height'));assert.ok($('img').attr('srcset').includes('640w'));assert.match($('img').attr('src'),/^\/assets\/images\/optimized\//);
  assert.ok(!existsSync('_site/assets/images/test-fixture.svg'));
  assert.equal($('a[target=_blank]').attr('rel'),'external noopener noreferrer');
  assert.ok($('title').text().includes('<script>'));assert.equal($('meta[name=robots]').attr('content'),'noindex');
  assert.ok(!read('sitemap.xml').includes('<loc>'));assert.ok(!read('robots.txt').includes('Disallow: /'));
  build({CONTEXT:'production',ALLOW_INDEXING:'true',SITE_URL:'https://business.invalid'});
  $=load(read('test-fixture/index.html'));assert.equal($('link[rel=canonical]').attr('href'),'https://business.invalid/test-fixture/');
  assert.ok(read('sitemap.xml').includes('https://business.invalid/test-fixture/'));assert.ok(!read('sitemap.xml').includes('/about/'));assert.ok(!read('sitemap.xml').includes('/health/'));
  assert.equal(load(read('about/index.html'))('meta[name=robots]').attr('content'),'noindex');
  for(const file of globSync('_site/**/*.html')) {
   const html=readFileSync(file,'utf8');const doc=load(html);assert.ok(Buffer.byteLength(html)<100000,'Starter HTML budget exceeded');
   assert.equal(doc('[style],[onclick],[onload]').length,0,file);
   assert.equal(doc('script:not([src]):not([type="application/ld+json"])').length,0,file);
   for(const el of doc('link[rel=stylesheet],script[src]').toArray()) {const href=doc(el).attr('href')||doc(el).attr('src');assert.match(href,/\/assets\/compiled\/main-[a-f0-9]{16}\.(css|js)$/);assert.ok(existsSync('_site'+href));assert.ok(readFileSync('_site'+href).length<(href.endsWith('.js')?8000:100000),'Starter asset budget exceeded');}
  }
  const health=load(read('health/index.html'));assert.equal(health('link,script,img').length,0);assert.equal(health('h1').text(),'Site OK');
  assert.match(read('_headers'),/\/health\/\n  Cache-Control: no-store\n  X-Robots-Tag: noindex/);
  assert.match(read('_headers'),/\/assets\/compiled\/\*\n  Cache-Control: public, max-age=31536000, immutable/);
  assert.ok(!read('_headers').includes('unsafe-inline'));assert.ok(!read('_headers').includes('unsafe-eval'));
  build({ENABLE_CONTACT:'true',CONTACT_FORM_NAME:secret});
  assert.ok(read('__forms.html').includes(secret));assert.ok(!read('contact/index.html').includes('data-netlify'));assert.ok(!read('contact/index.html').includes('form-name'));
  for(const f of globSync('_site/**/*.{html,css,js,xml,txt}')) if(f!=='_site/__forms.html') assert.ok(!readFileSync(f,'utf8').includes(secret),f);
  const form=load(read('contact/index.html'));assert.equal(form('form').attr('action'),'/api/contact');assert.equal(form('[name=message]').attr('maxlength'),'2000');
 } finally {process.chdir(original);rmSync(temporary,{recursive:true,force:true});}
});
