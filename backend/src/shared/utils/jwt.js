const jsonwebtoken = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

function getSecret() {
  if (!jwtConfig.secret) throw new Error('JWT_SECRET is not configured');
  return jwtConfig.secret;
}

/** Sign a token. expiresIn defaults to the role-based value in env.jwt.expiresInByRole. */
function signToken(payload, expiresIn) {
  const ttl = expiresIn || jwtConfig.expiresInByRole[payload.role] || '30m';
  return jsonwebtoken.sign(payload, getSecret(), { expiresIn: ttl });
}

/** Throws when the token is invalid or expired. */
function verifyToken(token) {
  return jsonwebtoken.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };

