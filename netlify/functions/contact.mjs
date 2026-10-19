import { validateContact } from '../../lib/contact-rules.mjs';
import { SECURITY_HEADERS } from '../../lib/security.mjs';
export const config = { path:'/api/contact', rateLimit:{ windowLimit:5, windowSize:60, aggregateBy:['ip','domain'] } };
const MAX_BYTES = 16 * 1024;
const envValue = key => globalThis.Netlify?.env?.get(key) ?? process.env[key];
function headers(extra = {}) { return { ...SECURITY_HEADERS, 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex', ...extra }; }
function result(status, text) { return new Response(text, { status, headers:headers({ 'Content-Type':'text/plain; charset=utf-8' }) }); }
function redirect(to) { return new Response(null, { status:303, headers:headers({ Location:to }) }); }
function trustedOrigin(value) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash ? url.origin : null; } catch { return null; }
}
async function boundedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  let size=0; const chunks=[];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) { await reader.cancel(); throw new RangeError('body-too-large'); }
    chunks.push(value);
  }
  return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));
}
// Injectable I/O allows tests to run the real handler without contacting Netlify.
export function createContactHandler({ env=envValue, send=fetch, log=event => console.info(JSON.stringify({event})) } = {}) {
  return async request => {
    if (request.method !== 'POST') return result(405,'Method not allowed.');
    if (env('ENABLE_CONTACT') !== 'true') return result(503,'Contact form is unavailable.');
    const formName = env('CONTACT_FORM_NAME');
    // Forward only to Netlify-injected deployment origins, never a request Host/forwarding header.
    const target = trustedOrigin(env('DEPLOY_URL'));
    if (!/^[a-f0-9]{32,128}$/i.test(formName || '') || !target || !new URL(target).hostname.endsWith('.netlify.app')) { log('contact-config-error'); return redirect('/form-error/'); }
    const allowedOrigins = [target, ...['SITE_URL','URL','DEPLOY_PRIME_URL'].map(key => trustedOrigin(env(key)))].filter(Boolean);
    const origin = request.headers.get('origin');
    if (origin && !allowedOrigins.includes(origin)) return result(403,'Origin not allowed.');
    if (request.headers.get('sec-fetch-site') === 'cross-site') return result(403,'Cross-site submission not allowed.');
    if (!/^application\/x-www-form-urlencoded(?:\s*;.*)?$/i.test(request.headers.get('content-type') || '')) return result(415,'Unsupported form encoding.');
    let fields;
    try { fields = new URLSearchParams(await boundedBody(request)); }
    catch (error) { log('contact-body-rejected'); return result(error instanceof RangeError ? 413 : 400,'Invalid submission.'); }
    // Reject duplicate/unknown keys before processing the trap.
    const known = new Set(['name','email','message','website']);
    for (const key of fields.keys()) if (!known.has(key) || fields.getAll(key).length !== 1) return result(400,'Invalid submission fields.');
    if ((fields.get('website') || '').trim()) { log('contact-bot-rejected'); return redirect('/thanks/'); }
    const validated = validateContact(fields);
    if (validated.error) { log('contact-validation-rejected'); return redirect('/form-error/'); }
    const body = new URLSearchParams({ 'form-name':formName, ...validated.values });
    try {
      const response = await send(`${target}/`, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:body.toString(), redirect:'manual', signal:AbortSignal.timeout(8000) });
      if (!response.ok && response.status !== 303) { log('contact-forward-unconfirmed'); return redirect('/form-error/'); }
    } catch { log('contact-forward-unconfirmed'); return redirect('/form-error/'); }
    log('contact-forward-accepted');
    return redirect('/thanks/');
  };
}
const handler = createContactHandler();
export default async request => {
  const response = await handler(request);
  if (response.status === 405) response.headers.set('Allow','POST');
  return response;
};
