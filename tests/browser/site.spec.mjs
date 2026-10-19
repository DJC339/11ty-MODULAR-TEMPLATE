import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const routes=['/','/about/','/services/','/contact/','/blog/','/blog/post-1/','/404.html','/thanks/','/form-error/'];
for(const width of [320,375,768,1024,1440]) {
 test(`layout, assets, console and accessibility at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
  for(const route of routes) {
   await page.goto(route);await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('main')).toHaveCount(1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
   expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
   await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex');
  }
  expect(errors).toEqual([]);
 });
}
test('keyboard menu, Escape, skip link and active navigation',async({page})=>{
 await page.setViewportSize({width:375,height:800});await page.goto('/about/');await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();
 const menu=page.getByRole('button',{name:'Menu'});await menu.focus();await page.keyboard.press('Enter');await expect(menu).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Tab');await expect(page.locator('#primary-links a').first()).toBeFocused();await page.keyboard.press('Escape');await expect(menu).toBeFocused();await expect(page.locator('#primary-links')).toBeHidden();
 await menu.click();await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Services'}).click();await expect(page).toHaveURL(/\/services\/$/);await expect(page.locator('[aria-current=page]')).toHaveText('Services');
});
test('navigation and form remain usable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:800}});const page=await context.newPage();await page.goto('http://127.0.0.1:8181/contact/');await expect(page.locator('#primary-links')).toBeVisible();await page.getByLabel('Name',{exact:true}).fill('A Person');await page.getByLabel('Email',{exact:true}).fill('test@mail.ca');await page.getByLabel('Message',{exact:true}).fill('A useful inquiry.');await page.getByRole('button',{name:'Send message'}).click();await expect(page).toHaveURL(/\/thanks\/$/);await context.close();
});
test('blank and invalid forms are blocked; real function rejects bypass',async({page,request})=>{
 await page.goto('/contact/');await page.getByRole('button',{name:'Send message'}).click();await expect(page).toHaveURL(/\/contact\/$/);expect(await page.locator('input:invalid').count()).toBeGreaterThan(0);
 const response=await request.post('/api/contact',{form:{name:' ',email:'bad',message:' '},maxRedirects:0});expect(response.status()).toBe(303);expect(response.headers().location).toBe('/form-error/');
});
test('health and blocked registration route use expected status and headers',async({request})=>{
 const r=await request.get('/health/');expect(r.status()).toBe(200);expect(await r.text()).toContain('Site OK');expect(r.headers()['cache-control']).toBe('no-store');expect(r.headers()['x-robots-tag']).toBe('noindex');expect((await request.get('/__forms.html')).status()).toBe(404);
});
test('internal links and anchors resolve',async({page,request})=>{
 const seen=new Set();for(const route of routes){await page.goto(route);for(const href of await page.locator('a[href]').evaluateAll(links=>links.map(a=>a.getAttribute('href')))){
  if(!href.startsWith('/')&&!href.startsWith('#'))continue;const url=new URL(href,'http://127.0.0.1:8181'+route);if(!seen.has(url.pathname)){expect((await request.get(url.pathname)).status()).toBeLessThan(400);seen.add(url.pathname);}if(url.hash){await page.goto(url.pathname);expect(await page.locator('[id]').evaluateAll((els,id)=>els.some(e=>e.id===id),decodeURIComponent(url.hash.slice(1)))).toBeTruthy();}
 }}
});
test('200 percent text, text spacing, reduced motion and forced colors',async({page})=>{
 await page.setViewportSize({width:320,height:900});await page.goto('/contact/');await page.evaluate(()=>{const sheet=document.styleSheets[0];for(const rule of ['html{font-size:200% !important}','*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important}','p{margin-bottom:2em !important}'])sheet.insertRule(rule,sheet.cssRules.length);});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});await page.getByLabel('Name',{exact:true}).focus();await expect(page.getByLabel('Name',{exact:true})).toBeFocused();
});
test('dark theme contrast and visible focus',async({page})=>{
 for(const width of [375,1440]) {
  await page.setViewportSize({width,height:900});
  for(const route of ['/','/contact/']) {
   await page.goto(route);await page.evaluate(()=>document.documentElement.dataset.theme='dark');
   expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
   await page.keyboard.press('Tab');expect(await page.locator('.skip-link').evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  }
 }
});
