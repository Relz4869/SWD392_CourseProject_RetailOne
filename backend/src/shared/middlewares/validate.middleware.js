const AppError = require('../utils/AppError');
const { ERRORS } = require('../constants/errors');

/*
 * validate(schema, source = 'body' | 'query' | 'params')
 * Shape checks only; business rules stay in services/models.
 *
 * schema = {
 *   field: { required, type, min, max, minLength, maxLength, pattern, oneOf, trim }
 * }
 * type: string | number | integer | array | date | time | boolean
 *
 * For 'query' and 'params' (always strings) numeric/boolean values are coerced
 * and written back, so services receive real numbers.
 */

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

function coerce(value, type, fromString) {
  if (!fromString || typeof value !== 'string') return value;
  const s = value.trim();
  if ((type === 'number' || type === 'integer') && s !== '' && !Number.isNaN(Number(s))) return Number(s);
  if (type === 'boolean' && (s === 'true' || s === 'false')) return s === 'true';
  if (type === 'array') return s.split(',').map((x) => x.trim()).filter(Boolean);
  return value;
}

function checkType(value, type) {
  switch (type) {
    case undefined: return true;
    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'integer': return Number.isInteger(value);
    case 'boolean': return typeof value === 'boolean';
    case 'array': return Array.isArray(value);
    case 'date': return (typeof value === 'string' || value instanceof Date) && !Number.isNaN(new Date(value).getTime());
    case 'time': return typeof value === 'string' && TIME_RE.test(value);
    default: return true;
  }
}

function validateField(rule, raw, fromString) {
  if (isEmpty(raw)) {
    return { error: rule.required ? 'is required' : null, value: undefined };
  }
  let value = coerce(raw, rule.type, fromString);
  if (typeof value === 'string' && rule.trim !== false && rule.type === 'string') value = value.trim();

  if (!checkType(value, rule.type)) return { error: `must be of type ${rule.type}` };

  const isNum = typeof value === 'number';
  if (isNum && rule.min !== undefined && value < rule.min) return { error: `must be >= ${rule.min}` };
  if (isNum && rule.max !== undefined && value > rule.max) return { error: `must be <= ${rule.max}` };

  const len = typeof value === 'string' || Array.isArray(value) ? value.length : null;
  if (len !== null && rule.minLength !== undefined && len < rule.minLength) {
    return { error: `must have at least ${rule.minLength} characters` };
  }
  if (len !== null && rule.maxLength !== undefined && len > rule.maxLength) {
    return { error: `must have at most ${rule.maxLength} characters` };
  }
  if (rule.pattern && !rule.pattern.test(String(value))) return { error: 'has an invalid format' };
  if (rule.oneOf && !rule.oneOf.includes(value)) return { error: `must be one of: ${rule.oneOf.join(', ')}` };

  return { error: null, value };
}

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const input = req[source] || {};
    const fromString = source === 'query' || source === 'params';
    const details = {};
    const cleaned = {};

    for (const [field, rule] of Object.entries(schema)) {
      const { error, value } = validateField(rule, input[field], fromString);
      if (error) details[field] = error;
      else if (value !== undefined) cleaned[field] = value;
    }

    if (Object.keys(details).length > 0) {
      return next(new AppError(ERRORS.VALIDATION_FAILED, details));
    }
    // Write back cleaned (trimmed / coerced) values; keep unknown keys untouched.
    for (const [field, value] of Object.entries(cleaned)) input[field] = value;
    return next();
  };
}

module.exports = { validate };

