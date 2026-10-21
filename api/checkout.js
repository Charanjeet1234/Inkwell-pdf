// POST /api/checkout {plan: 'monthly'|'yearly'|'lifetime'} -> {url} of a Stripe Checkout page.
'use strict';
const { stripe, prices, origin, readBody, handler, httpError } = require('./_lib');

module.exports = handler(async (req, res) => {
  const { plan } = readBody(req);
  const price = prices()[plan];
  if (!price) throw httpError(400, 'bad_plan', 'Choose a plan.');
  const base = origin(req);
  const params = {
    mode: plan === 'lifetime' ? 'payment' : 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: `${base}/?checkout_session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/?checkout=cancelled`,
    allow_promotion_codes: 'true',
    billing_address_collection: 'auto',
    metadata: { product: 'inkwell', plan }
  };
  if (plan === 'lifetime') { params.customer_creation = 'always'; params.invoice_creation = { enabled: 'true' }; }
  else params.subscription_data = { metadata: { product: 'inkwell', plan } };
  if (process.env.STRIPE_AUTOMATIC_TAX === 'true') params.automatic_tax = { enabled: 'true' };
  const session = await stripe('POST', '/v1/checkout/sessions', params);
  res.status(200).json({ url: session.url });
});
