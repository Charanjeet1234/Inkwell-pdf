// Shared helpers for the Inkwell Pro licensing API (Vercel serverless functions).
// No database: Stripe is the source of truth. A customer's licence key is derived from
// their Stripe customer ID plus an HMAC checksum, and activated devices are kept in the
// customer's metadata. The browser receives a short-lived token signed with ECDSA P-256.
'use strict';
const crypto = require('crypto');

const STRIPE_API = process.env.STRIPE_API_BASE || 'https://api.stripe.com';
const STRIPE_VERSION = '2024-06-20';
const MAX_DEVICES = Number(process.env.INKWELL_MAX_DEVICES || 3);
const GRACE_DAYS = 3;
const TOKEN_DAYS = 14;

function env(name) {
  const v = process.env[name];
  if (!v) throw httpError(503, 'not_configured', `Server is missing ${name}`);
  return v;
}
function httpError(status, code, message) { const e = new Error(message || code); e.status = status; e.code = code; return e; }

// ---- Stripe REST (no SDK needed) ----
function formEncode(obj, prefix, out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === 'object' ? formEncode(item, `${key}[${i}]`, out) : out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(item)}`)));
    else if (typeof v === 'object') formEncode(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out;
}
async function stripe(method, path, params) {
  const key = env('STRIPE_SECRET_KEY');
  let url = STRIPE_API + path; let body;
  const enc = params ? formEncode(params).join('&') : '';
  if (method === 'GET' && enc) url += '?' + enc; else if (enc) body = enc;
  const r = await fetch(url, { method, body, headers: { Authorization: `Bearer ${key}`, 'Stripe-Version': STRIPE_VERSION, 'Content-Type': 'application/x-www-form-urlencoded' } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = httpError(r.status === 404 ? 404 : 502, 'stripe_error', (data.error && data.error.message) || 'Stripe request failed'); e.stripe = data.error; throw e; }
  return data;
}

// ---- licence keys ----
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function hmacKey() { return crypto.createHash('sha256').update('inkwell-key:' + env('LICENSE_PRIVATE_KEY')).digest(); }
function checksum(cid) {
  const h = crypto.createHmac('sha256', hmacKey()).update(cid).digest();
  let s = ''; for (let i = 0; i < 8; i++) s += ALPHA[h[i] % ALPHA.length];
  return s;
}
function makeKey(cid) { return `INK-${cid.replace(/^cus_/, '')}-${checksum(cid)}`; }
function parseKey(key) {
  const m = /^INK-([A-Za-z0-9_]+)-([A-Z0-9]{8})$/.exec(String(key || '').trim());
  if (!m) throw httpError(400, 'bad_key', 'That licence key is not valid. Check it and try again.');
  const cid = 'cus_' + m[1];
  const a = Buffer.from(checksum(cid)), b = Buffer.from(m[2]);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw httpError(400, 'bad_key', 'That licence key is not valid. Check it and try again.');
  return cid;
}

// ---- signed tokens ----
const b64u = buf => Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
function privateKey() { return crypto.createPrivateKey(env('LICENSE_PRIVATE_KEY').replace(/\\n/g, '\n')); }
function publicJwk() { const jwk = crypto.createPublicKey(privateKey()).export({ format: 'jwk' }); return { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }; }
function verifyToken(token) {
  try {
    const [body, sig] = String(token || '').split('.'); if (!body || !sig) return null;
    const dec = x => Buffer.from(x.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const ok = crypto.verify('sha256', Buffer.from(body), { key: crypto.createPublicKey(privateKey()), dsaEncoding: 'ieee-p1363' }, dec(sig));
    if (!ok) return null;
    const p = JSON.parse(dec(body).toString('utf8'));
    return p && p.exp * 1000 > Date.now() ? p : null;
  } catch { return null; }
}
function signToken(payload) {
  const body = b64u(JSON.stringify(payload));
  const sig = crypto.sign('sha256', Buffer.from(body), { key: privateKey(), dsaEncoding: 'ieee-p1363' });
  return body + '.' + b64u(sig);
}

// ---- entitlement from Stripe ----
function prices() {
  return { monthly: process.env.STRIPE_PRICE_MONTHLY, yearly: process.env.STRIPE_PRICE_YEARLY, lifetime: process.env.STRIPE_PRICE_LIFETIME };
}
async function entitlement(cid) {
  let customer;
  try { customer = await stripe('GET', `/v1/customers/${encodeURIComponent(cid)}`); }
  catch (e) { if (e.status === 404) throw httpError(404, 'no_license', 'No purchase was found for this licence key.'); throw e; }
  if (customer.deleted) throw httpError(404, 'no_license', 'No purchase was found for this licence key.');
  const md = customer.metadata || {};
  if (md.inkwell_lifetime === 'true') {
    // a refunded or disputed lifetime payment no longer counts
    if (md.inkwell_lifetime_pi) {
      const pi = await stripe('GET', `/v1/payment_intents/${encodeURIComponent(md.inkwell_lifetime_pi)}`, { 'expand[]': 'latest_charge' });
      const ch = pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
      if (pi.status !== 'succeeded' || (ch && (ch.refunded || ch.disputed))) throw httpError(402, 'inactive', 'This lifetime licence was refunded or disputed, so Pro is no longer active.');
    }
    return { customer, plan: 'lifetime', until: null };
  }
  const subs = await stripe('GET', '/v1/subscriptions', { customer: cid, status: 'all', limit: 20 });
  const p = prices(); const ours = new Set([p.monthly, p.yearly].filter(Boolean));
  let best = null;
  for (const s of subs.data || []) {
    if (!['active', 'trialing', 'past_due'].includes(s.status)) continue;
    const item = (s.items && s.items.data || []).find(i => i.price && ours.has(i.price.id));
    if (!item) continue;
    const end = s.current_period_end || item.current_period_end || 0;
    if (!best || end > best.until) best = { plan: item.price.id === p.yearly ? 'yearly' : 'monthly', until: end, cancelAt: s.cancel_at_period_end ? end : null, status: s.status };
  }
  if (!best) throw httpError(402, 'inactive', 'This licence has no active subscription. Renew it to keep using Pro.');
  return { customer, ...best };
}

// Register this device (rolling list: the oldest device drops off) and return a token.
async function issueToken(cid, deviceId, ent, { register = true } = {}) {
  const dev = String(deviceId || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 16);
  if (dev.length < 8) throw httpError(400, 'bad_device', 'Missing device ID.');
  const md = ent.customer.metadata || {};
  const limit = Math.max(1, Math.min(50, Number(md.inkwell_max_devices) || MAX_DEVICES));
  let devices = (md.inkwell_devices || '').split(',').filter(Boolean);
  if (!devices.includes(dev)) {
    if (!register) throw httpError(403, 'device_removed', 'Pro was moved to another device. Enter your licence key to use it here again.');
    devices.push(dev); while (devices.length > limit) devices.shift();
    await stripe('POST', `/v1/customers/${cid}`, { metadata: { inkwell_devices: devices.join(',') } });
  }
  const now = Math.floor(Date.now() / 1000);
  let exp = now + TOKEN_DAYS * 86400;
  if (ent.until) exp = Math.min(exp, ent.until + GRACE_DAYS * 86400);
  const token = signToken({ v: 1, cid, plan: ent.plan, dev, iat: now, exp, until: ent.until || null, cancelAt: ent.cancelAt || null });
  return { token, key: makeKey(cid), plan: ent.plan, until: ent.until || null, cancelAt: ent.cancelAt || null, exp, maxDevices: limit };
}

function origin(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}
function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}
function handler(fn, methods = ['POST']) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex');
    if (!methods.includes(req.method)) { res.status(405).json({ error: 'method_not_allowed' }); return; }
    try { await fn(req, res); }
    catch (e) {
      const status = e.status || 500;
      if (status >= 500) console.error(e);
      res.status(status).json({ error: e.code || 'server_error', message: status >= 500 && !e.code ? 'Something went wrong. Please try again.' : e.message });
    }
  };
}

module.exports = { stripe, env, httpError, makeKey, parseKey, publicJwk, verifyToken, entitlement, issueToken, prices, origin, readBody, handler, MAX_DEVICES };
