#!/usr/bin/env node
// Creates the "Inkwell PDF Studio Pro" product and its three prices in your Stripe account.
// Usage (prices in the smallest currency unit, e.g. cents):
//   STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.js --currency usd --monthly 600 --yearly 4800 --lifetime 9900
// Then copy the printed STRIPE_PRICE_* lines into Vercel's environment variables.
// Run it with a test key (sk_test_...) first, then again with your live key.
'use strict';
const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map(s => s.trim().split(/\s+/)));
const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error('Set STRIPE_SECRET_KEY first.'); process.exit(1); }
const currency = (args.currency || 'usd').toLowerCase();
const amt = { monthly: +(args.monthly || 600), yearly: +(args.yearly || 4800), lifetime: +(args.lifetime || 9900) };
const call = async (path, params) => {
  const body = new URLSearchParams(params).toString();
  const r = await fetch('https://api.stripe.com' + path, { method: 'POST', body, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Stripe-Version': '2024-06-20' } });
  const d = await r.json(); if (!r.ok) throw new Error(d.error ? d.error.message : 'Stripe error'); return d;
};
(async () => {
  const product = await call('/v1/products', { name: 'Inkwell PDF Studio Pro', description: 'Pro features for Inkwell PDF Studio', 'metadata[product]': 'inkwell' });
  const mk = (amount, extra) => call('/v1/prices', { product: product.id, currency, unit_amount: String(amount), ...extra });
  const monthly = await mk(amt.monthly, { 'recurring[interval]': 'month', nickname: 'Pro monthly' });
  const yearly = await mk(amt.yearly, { 'recurring[interval]': 'year', nickname: 'Pro yearly' });
  const lifetime = await mk(amt.lifetime, { nickname: 'Pro lifetime' });
  console.log(`\nCreated ${product.name} (${key.startsWith('sk_live') ? 'LIVE' : 'test'} mode). Add these to Vercel:\n`);
  console.log(`STRIPE_PRICE_MONTHLY=${monthly.id}`);
  console.log(`STRIPE_PRICE_YEARLY=${yearly.id}`);
  console.log(`STRIPE_PRICE_LIFETIME=${lifetime.id}\n`);
})().catch(e => { console.error('Failed:', e.message); process.exit(1); });
