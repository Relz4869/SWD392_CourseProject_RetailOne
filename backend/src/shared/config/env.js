// The only file that reads process.env. Everything else imports this object.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { ROLES } = require('../constants/roles');

const toBool = (value, fallback) =>
  value === undefined || value === '' ? fallback : String(value).trim().toLowerCase() === 'true';

const env = {
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  db: {
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME || 'RetailOnePOS',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: toBool(process.env.DB_ENCRYPT, false),
      trustServerCertificate: toBool(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
      // Required: store/read DATETIME2 in store local time (Asia/Bangkok), not UTC.
      useUTC: false,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    // NFR Security: cashier shift max 12h, Manager idle timeout 30 minutes.
    expiresInByRole: Object.freeze({
      [ROLES.MANAGER]: '30m',
      [ROLES.CASHIER]: '12h',
      [ROLES.WAREHOUSE]: '12h',
    }),
  },
};

module.exports = env;
