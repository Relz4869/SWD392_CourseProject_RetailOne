/** Round to 2 decimals (DECIMAL(15,2)) to avoid floating point noise, e.g. 0.1 + 0.2. */
function roundMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const rounded = Math.round((n + Math.sign(n) * Number.EPSILON) * 100) / 100;
  return rounded === 0 ? 0 : rounded; // avoid -0
}

module.exports = { roundMoney };

