const AppError = require('../utils/AppError');
const { ERRORS } = require('../constants/errors');

function send(res, def, details) {
  const body = { success: false, code: def.code, message: def.message };
  if (details !== undefined) body.details = details;
  return res.status(def.status).json(body);
}

function notFound(req, res) {
  return send(res, ERRORS.NOT_FOUND, { path: req.originalUrl });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return send(res, { status: err.status, code: err.code, message: err.message }, err.details);
  }
  // Malformed JSON body from express.json()
  if (err && err.type === 'entity.parse.failed') {
    return send(res, ERRORS.VALIDATION_FAILED, { body: 'invalid JSON' });
  }
  // SQL Server errors (mssql RequestError exposes `number`)
  const sqlNumber = err && (err.number || (err.originalError && err.originalError.info && err.originalError.info.number));
  if (sqlNumber === 2627 || sqlNumber === 2601) return send(res, ERRORS.DUPLICATE);
  if (sqlNumber === 547) return send(res, ERRORS.CONSTRAINT_VIOLATION);

  console.error('[ERROR]', err);
  return send(res, ERRORS.INTERNAL); // never leak stack traces to the client
}

module.exports = { notFound, errorHandler };

