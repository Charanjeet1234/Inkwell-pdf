// POST /api/license {key, deviceId, refresh?} -> fresh licence token.
// refresh=true (automatic background check) does not add a new device; a typed key does.
'use strict';
const { parseKey, entitlement, issueToken, readBody, handler } = require('./_lib');

module.exports = handler(async (req, res) => {
  const { key, deviceId, refresh } = readBody(req);
  const cid = parseKey(key);
  const ent = await entitlement(cid);
  res.status(200).json(await issueToken(cid, deviceId, ent, { register: !refresh }));
});
