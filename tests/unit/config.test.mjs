import {test} from 'node:test';
import assert from 'node:assert/strict';
import {siteConfig,jsonForHtml} from '../../lib/site-config.mjs';
test('indexing defaults off and requires production plus explicit opt-in',()=>{
 assert.equal(siteConfig({}).indexable,false);
 assert.equal(siteConfig({CONTEXT:'deploy-preview',ALLOW_INDEXING:'true',SITE_URL:'https://business.invalid'}).indexable,false);
 assert.throws(()=>siteConfig({CONTEXT:'production',ALLOW_INDEXING:'true'}));
 assert.equal(siteConfig({CONTEXT:'production',ALLOW_INDEXING:'true',SITE_URL:'https://business.invalid'}).indexable,true);
});
test('invalid site origins and placeholder domains rejected',()=>{for(const url of ['http://real.ca','https://example.com','https://user:pass@real.ca','https://real.ca/path','https://real.ca/?x=1']) assert.throws(()=>siteConfig({SITE_URL:url}));});
test('enabled contact requires an unpredictable registration name',()=>{assert.throws(()=>siteConfig({ENABLE_CONTACT:'true',CONTACT_FORM_NAME:'contact'}));});
test('JSON-LD escaping prevents tag closure and preserves parsed values',()=>{const value={name:'</script><img onerror="x"> & \u2028 \u2029'};const json=jsonForHtml(value);assert.ok(!json.includes('<'));assert.deepEqual(JSON.parse(json),value);});
