/** Error thrown by services. def = { status, code, message } from a *.errors.js constant. */
class AppError extends Error {
  constructor(def, details) {
    super((def && def.message) || 'Error');
    this.name = 'AppError';
    this.status = (def && def.status) || 500;
    this.code = (def && def.code) || 'INTERNAL';
    if (details !== undefined) this.details = details;
  }
}

module.exports = AppError;

