// POST /api/portal {key} -> {url} of the Stripe customer portal (change plan, cancel, invoices).
'use strict';
const { stripe, parseKey, origin, readBody, handler } = require('./_lib');

module.exports = handler(async (req, res) => {
  const cid = parseKey(readBody(req).key);
  const s = await stripe('POST', '/v1/billing_portal/sessions', { customer: cid, return_url: origin(req) + '/' });
  res.status(200).json({ url: s.url });
});
