import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler, config } from '../../netlify/functions/contact.mjs';
const secret='abcdef0123456789'.repeat(2);
const settings={ENABLE_CONTACT:'true',CONTACT_FORM_NAME:secret,DEPLOY_URL:'https://deploy-id--test.netlify.app',URL:'https://test.netlify.app'};
const valid={name:'José 李',email:'person+test@mail.ca',message:'A useful question about a project.'};
function request(fields=valid,options={}) { return new Request('https://test.netlify.app/api/contact',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',origin:settings.URL,...options.headers},body:new URLSearchParams(fields),...options}); }
function harness(overrides={}) {
 const sent=[],logs=[];
 const {env:envOverrides,...ioOverrides}=overrides;
 const handler=createContactHandler({env:k=>({...settings,...envOverrides})[k],send:async(url,options)=>{sent.push({url,options});return new Response('',{status:200});},log:e=>logs.push(e),...ioOverrides});
 return {handler,sent,logs};
}
test('valid Unicode content forwards only allowlisted fields to trusted deploy origin',async()=>{
 const {handler,sent,logs}=harness();const r=await handler(request({...valid,name:'  José 李  '}));
 assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/thanks/');assert.equal(sent.length,1);
 assert.equal(sent[0].url,settings.DEPLOY_URL+'/');const body=new URLSearchParams(sent[0].options.body);
 assert.equal(body.get('name'),'José 李');assert.equal(body.get('form-name'),secret);assert.deepEqual([...body.keys()],['form-name','name','email','message']);
 assert.ok(!logs.join().includes(valid.email));assert.equal(r.headers.get('cache-control'),'no-store');
});
for(const fields of [ {},{...valid,name:''},{...valid,name:'   '},{...valid,message:'\u200B\u200C\u200D\uFEFF\u2060'},{...valid,name:'---'},{...valid,email:'x@y'},{...valid,email:'x@y.ca\r\nBcc:bad@x.ca'},{...valid,name:'One\nTwo'},{...valid,message:'x'.repeat(2001)},{...valid,message:'Hi\0there'},{...valid,name:'x'.repeat(101)},{...valid,'form-name':'contact'} ]) {
 test(`invalid input rejected ${JSON.stringify(fields).slice(0,80)}`,async()=>{const {handler,sent}=harness();const r=await handler(request(fields));assert.notEqual(r.headers.get('location'),'/thanks/');assert.equal(sent.length,0);});
}
test('repeated keys are rejected',async()=>{const {handler,sent}=harness();const r=await handler(request(valid,{body:'name=good&name=bad&email=a%40b.ca&message=hello'}));assert.equal(r.status,400);assert.equal(sent.length,0);});
test('honeypot returns benign success without forwarding',async()=>{const {handler,sent}=harness();const r=await handler(request({...valid,website:'spam'}));assert.equal(r.headers.get('location'),'/thanks/');assert.equal(sent.length,0);});
for(const [label,options,status] of [['cross-origin',{headers:{'content-type':'application/x-www-form-urlencoded',origin:'https://evil.invalid'}},403],['wrong type',{headers:{'content-type':'application/json'}},415],['oversize',{body:'x'.repeat(16385)},413]]) {
 test(label,async()=>{const {handler,sent}=harness();assert.equal((await handler(request(valid,options))).status,status);assert.equal(sent.length,0);});
}
test('GET rejected',async()=>{const {handler,sent}=harness();assert.equal((await handler(new Request('https://test.netlify.app/api/contact'))).status,405);assert.equal(sent.length,0);});
test('missing config never falls back to attacker host',async()=>{const {handler,sent}=harness({env:{...settings,DEPLOY_URL:''}});await handler(request(valid,{headers:{'content-type':'application/x-www-form-urlencoded','x-forwarded-host':'evil.invalid'}}));assert.equal(sent.length,0);});
test('disabled contact fails closed',async()=>{const {handler,sent}=harness({env:{...settings,ENABLE_CONTACT:'false'}});assert.equal((await handler(request())).status,503);assert.equal(sent.length,0);});
test('timeout reports uncertain delivery without retrying',async()=>{let calls=0;const {handler}=harness({send:async()=>{calls++;throw new Error(valid.email);}});const r=await handler(request());assert.equal(r.headers.get('location'),'/form-error/');assert.equal(calls,1);assert.ok(!(await r.text()).includes(valid.email));});
test('upstream error does not claim success',async()=>{const {handler}=harness({send:async()=>new Response('',{status:500})});assert.equal((await handler(request())).headers.get('location'),'/form-error/');});
test('rate limit configured on the only public function path',()=>{assert.equal(config.path,'/api/contact');assert.deepEqual(config.rateLimit.aggregateBy,['ip','domain']);assert.equal(config.rateLimit.windowLimit,5);});
