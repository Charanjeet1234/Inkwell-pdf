// POST /api/signout {key, deviceId} -> frees this device's slot.
'use strict';
const { stripe, parseKey, readBody, handler } = require('./_lib');

module.exports = handler(async (req, res) => {
  const { key, deviceId } = readBody(req);
  const cid = parseKey(key);
  const c = await stripe('GET', `/v1/customers/${cid}`);
  const devices = ((c.metadata || {}).inkwell_devices || '').split(',').filter(d => d && d !== String(deviceId || ''));
  await stripe('POST', `/v1/customers/${cid}`, { metadata: { inkwell_devices: devices.join(',') } });
  res.status(200).json({ ok: true });
});
