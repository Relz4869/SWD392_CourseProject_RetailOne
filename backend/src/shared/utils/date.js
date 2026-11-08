// Date/time helpers. All values are in store local time (DB uses useUTC: false).

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' (local). Accepts Date or an ISO-like string. */
function toDateString(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'HH:mm:ss' (local) from a Date. */
function toTimeString(value) {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Normalise 'H:mm', 'HH:mm' or 'HH:mm:ss.fffffff' to 'HH:mm:ss' so string comparison is safe. */
function normalizeTime(value) {
  if (value == null) return null;
  if (value instanceof Date) return toTimeString(value);
  const [h = '0', m = '0', s = '0'] = String(value).trim().split(':');
  return `${pad(Number(h))}:${pad(Number(m))}:${pad(Math.floor(Number(s)))}`;
}

/** Seconds since midnight for a 'HH:mm:ss' string. */
function timeToSeconds(value) {
  const [h, m, s] = normalizeTime(value).split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

/** Hours between two 'HH:mm:ss' strings on the same day, rounded to 2 decimals. */
function hoursBetweenTimes(from, to) {
  return Math.round(((timeToSeconds(to) - timeToSeconds(from)) / 3600) * 100) / 100;
}

/** Hours between two Dates, rounded to 2 decimals (never negative). */
function hoursBetween(from, to) {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(0, Math.round((ms / 3600000) * 100) / 100);
}

module.exports = { toDateString, toTimeString, normalizeTime, timeToSeconds, hoursBetweenTimes, hoursBetween };

