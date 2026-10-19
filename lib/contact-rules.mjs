export const LIMITS = Object.freeze({ name: { min:2, max:100 }, email: { max:254 }, message: { min:5, max:2000 } });
const EMAIL = /^[A-Za-z0-9.!#$%&'*+\-/=?^_`{|}~]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u;
export function validateContact(fields) {
  const allowed = new Set(['name','email','message','website']);
  for (const key of fields.keys()) if (!allowed.has(key) || fields.getAll(key).length !== 1) return { error:'invalid-fields' };
  const clean = {};
  for (const key of ['name','email','message']) {
    const value = (fields.get(key) || '').normalize('NFC').trim();
    const rule = LIMITS[key];
    if (CONTROL.test(value) || value.length < (rule.min || 1) || value.length > rule.max) return { error:'invalid-fields' };
    if (key !== 'message' && /[\r\n\t]/u.test(value)) return { error:'invalid-fields' };
    if (key === 'email' ? !EMAIL.test(value) : !/[\p{L}\p{N}]/u.test(value)) return { error:'invalid-fields' };
    clean[key] = value;
  }
  return { values:clean };
}
