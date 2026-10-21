// GET /api/config: whether Pro sales are switched on, plan prices and the token verification key.
'use strict';
const { stripe, prices, publicJwk, handler } = require('./_lib');
let cache = null, cacheAt = 0;

module.exports = handler(async (req, res) => {
  const ready = ['STRIPE_SECRET_KEY', 'LICENSE_PRIVATE_KEY', 'STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_YEARLY', 'STRIPE_PRICE_LIFETIME'].every(k => process.env[k]);
  const supportEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.SUPPORT_EMAIL || '') ? process.env.SUPPORT_EMAIL : null;
  if (!ready) { res.status(200).json({ enabled: false, supportEmail }); return; }
  if (!cache || Date.now() - cacheAt > 10 * 60 * 1000) {
    const out = {};
    for (const [plan, id] of Object.entries(prices())) {
      const p = await stripe('GET', `/v1/prices/${encodeURIComponent(id)}`);
      out[plan] = { amount: p.unit_amount, currency: p.currency, interval: p.recurring ? p.recurring.interval : null };
    }
    cache = { enabled: true, prices: out, publicKey: publicJwk(), supportEmail }; cacheAt = Date.now();
  }
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json(cache);
}, ['GET']);
