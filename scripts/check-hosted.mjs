// Read-only checks: does not submit forms or send messages.
import assert from 'node:assert/strict';
const raw=process.env.TEST_BASE_URL;
if(!raw)throw new Error('Set TEST_BASE_URL to the exact deployed HTTPS origin.');
const base=new URL(raw);assert.equal(base.protocol,'https:');assert.equal(base.pathname,'/');
for(const route of ['/','/health/','/__forms.html']) {
 const response=await fetch(new URL(route,base),{redirect:'manual'});
 assert.equal(response.status,route==='/__forms.html'?404:200,route);
 assert.ok(response.headers.get('content-security-policy'),`${route}: missing CSP`);
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 if(route==='/health/') {assert.match(response.headers.get('cache-control')||'',/no-store/);assert.match(response.headers.get('x-robots-tag')||'',/noindex/);assert.match(await response.text(),/Site OK/);}
 if(route==='/') {
  const html=await response.text();const href=html.match(/href="(\/assets\/compiled\/main-[a-f0-9]+\.css)"/)?.[1];assert.ok(href);
  const asset=await fetch(new URL(href,base));assert.equal(asset.status,200);assert.match(asset.headers.get('cache-control')||'',/immutable/);
 }
 console.log(`PASS ${route}`);
}
console.log('Read-only hosted checks passed. Form storage, notification delivery and rate enforcement still require explicit hosted tests.');
