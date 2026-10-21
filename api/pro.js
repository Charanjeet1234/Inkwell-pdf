// POST /api/pro {token, deviceId} -> the Pro tools code, only for a valid signed licence.
// The code lives in _prokit.js and is never published as a static file.
'use strict';
const { verifyToken, readBody, handler, httpError } = require('./_lib');
const kit = require('./_prokit.js');
const code = 'window.__inkwellKitFactory = ' + kit.toString() + ';\n';

module.exports = handler(async (req, res) => {
  const { token, deviceId } = readBody(req);
  const p = verifyToken(token);
  if (!p || p.dev !== String(deviceId || '')) throw httpError(401, 'bad_token', 'Your Pro licence needs to be checked again. Reload the page and try once more.');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(code);
});
