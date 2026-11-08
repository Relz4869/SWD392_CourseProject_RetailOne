/** Wrap an async controller so rejected promises reach errorHandler (no try/catch in controllers). */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

