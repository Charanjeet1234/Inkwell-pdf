// POST /api/activate {sessionId, deviceId} -> licence token after a completed Stripe Checkout.
'use strict';
const { stripe, entitlement, issueToken, makeKey, readBody, handler, httpError } = require('./_lib');

module.exports = handler(async (req, res) => {
  const { sessionId, deviceId } = readBody(req);
  if (!/^cs_[A-Za-z0-9_]+$/.test(String(sessionId || ''))) throw httpError(400, 'bad_session', 'Missing checkout session.');
  const s = await stripe('GET', `/v1/checkout/sessions/${sessionId}`);
  if (s.status !== 'complete' || !['paid', 'no_payment_required'].includes(s.payment_status)) throw httpError(402, 'unpaid', 'This payment has not completed yet.');
  if (!s.metadata || s.metadata.product !== 'inkwell') throw httpError(400, 'bad_session', 'This checkout is not for Inkwell.');
  const cid = s.customer;
  if (!cid) throw httpError(500, 'no_customer', 'The payment has no customer record. Contact support.');
  const update = { invoice_settings: { custom_fields: [{ name: 'Licence key', value: makeKey(cid) }] } };
  if (s.metadata.plan === 'lifetime') update.metadata = { inkwell_lifetime: 'true', inkwell_lifetime_pi: s.payment_intent || '' };
  await stripe('POST', `/v1/customers/${cid}`, update);
  const ent = await entitlement(cid);
  res.status(200).json(await issueToken(cid, deviceId, ent));
});
