// GET /api/config: public settings for the free edition (sign-up service and support address).
// Supabase's URL and anon key are designed to be public; never put a service-role key here.
'use strict';

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const email = process.env.SUPPORT_EMAIL || '';
  const url = process.env.SUPABASE_URL || '', anonKey = process.env.SUPABASE_ANON_KEY || '';
  res.status(200).json({
    enabled: false,
    supportEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
    auth: /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(url) && anonKey ? { url, anonKey, google: process.env.SUPABASE_GOOGLE === 'true' } : null
  });
};
