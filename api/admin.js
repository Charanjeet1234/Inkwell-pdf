// POST /api/admin (Authorization: Bearer <ADMIN_TOKEN>) — owner tools.
//   {action:'grant', email, name?, devices?, note?} -> creates a free lifetime licence, returns its key
//   {action:'lookup', key}                          -> shows who a key belongs to
//   {action:'revoke', key}                          -> ends a free/lifetime licence
'use strict';
const crypto = require('crypto');
const { stripe, parseKey, makeKey, readBody, handler, httpError } = require('./_lib');

function authorize(req) {
  const want = process.env.ADMIN_TOKEN || '';
  if (want.length < 24) throw httpError(503, 'not_configured', 'Set ADMIN_TOKEN (at least 24 characters) in your Vercel environment variables, then redeploy.');
  const got = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = crypto.createHash('sha256').update(got).digest(), b = crypto.createHash('sha256').update(want).digest();
  if (!crypto.timingSafeEqual(a, b)) throw httpError(401, 'unauthorized', 'That admin token is not correct.');
}

module.exports = handler(async (req, res) => {
  authorize(req);
  const { action, email, name, devices, key, note } = readBody(req);
  if (action === 'grant') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))) throw httpError(400, 'bad_email', 'Enter a valid email address.');
    const n = Math.max(1, Math.min(50, Number(devices) || 5));
    const c = await stripe('POST', '/v1/customers', {
      email: String(email).trim(), name: name ? String(name).slice(0, 120) : undefined, description: 'Inkwell Pro complimentary lifetime licence',
      metadata: { product: 'inkwell', inkwell_lifetime: 'true', inkwell_comp: 'true', inkwell_max_devices: String(n), inkwell_note: String(note || '').slice(0, 200) }
    });
    res.status(200).json({ key: makeKey(c.id), customer: c.id, devices: n });
    return;
  }
  if (action === 'lookup') {
    const cid = parseKey(key); const c = await stripe('GET', `/v1/customers/${cid}`); const md = c.metadata || {};
    res.status(200).json({ customer: cid, email: c.email || '', name: c.name || '', lifetime: md.inkwell_lifetime === 'true', complimentary: md.inkwell_comp === 'true', devices: (md.inkwell_devices || '').split(',').filter(Boolean).length, maxDevices: Number(md.inkwell_max_devices) || null });
    return;
  }
  if (action === 'revoke') {
    const cid = parseKey(key);
    await stripe('POST', `/v1/customers/${cid}`, { metadata: { inkwell_lifetime: '', inkwell_comp: '', inkwell_devices: '' } });
    res.status(200).json({ ok: true });
    return;
  }
  throw httpError(400, 'bad_action', 'Unknown action.');
});
