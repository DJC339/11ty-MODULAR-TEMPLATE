export function siteConfig(env = process.env) {
  let url = '';
  if (env.SITE_URL) {
    const parsed = new URL(env.SITE_URL);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('SITE_URL must be an HTTPS origin without a path, query or credentials.');
    if (/(^|\.)(example\.(com|org|net)|localhost)$/i.test(parsed.hostname)) throw new Error('Configure a real SITE_URL.');
    url = parsed.origin;
  }
  const indexable = env.CONTEXT === 'production' && env.ALLOW_INDEXING === 'true';
  if (indexable && !url) throw new Error('Indexable production builds require SITE_URL.');
  const contactEnabled = env.ENABLE_CONTACT === 'true';
  if (contactEnabled && !/^[a-f0-9]{32,128}$/i.test(env.CONTACT_FORM_NAME || '')) throw new Error('Enabled contact requires a random CONTACT_FORM_NAME of 32 to 128 hex characters.');
  return { url, indexable, contactEnabled };
}
export function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
