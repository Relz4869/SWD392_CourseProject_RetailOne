// bcryptjs (pure JS) instead of native bcrypt to avoid build issues on Windows.
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

function hashPassword(plain) {
  return bcrypt.hash(String(plain), SALT_ROUNDS);
}

/** Returns false (never throws) when hash is missing or malformed. */
async function comparePassword(plain, hash) {
  if (!hash || plain == null) return false;
  try {
    return await bcrypt.compare(String(plain), hash);
  } catch {
    return false;
  }
}

module.exports = { hashPassword, comparePassword, SALT_ROUNDS };

