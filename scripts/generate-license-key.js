#!/usr/bin/env node
// Creates the private key that signs Inkwell Pro licences.
// Run once:  node scripts/generate-license-key.js
// Paste the output into Vercel -> Project -> Settings -> Environment Variables as LICENSE_PRIVATE_KEY.
// Keep it secret and never commit it. If you lose or change it, existing licence keys stop working.
'use strict';
const crypto = require('crypto');
const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
console.log('\nLICENSE_PRIVATE_KEY (copy everything between the lines, including BEGIN/END):\n');
console.log('-'.repeat(64));
console.log(pem.trim());
console.log('-'.repeat(64));
console.log('\nSingle-line form, if your host needs one value per line:\n');
console.log(pem.trim().replace(/\n/g, '\\n'));
console.log('');
