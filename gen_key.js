const crypto = require('crypto');

console.log(crypto.randomBytes(512).toString('base64'));
