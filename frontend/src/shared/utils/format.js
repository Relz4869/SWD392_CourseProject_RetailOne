const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** 10000 -> "10.000 ₫" */
export function formatCurrency(n) {
  if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '—';
  return currencyFormatter.format(Number(n));
}

export function formatNumber(n) {
  if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '—';
  return numberFormatter.format(Number(n));
}

export function formatDateTime(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

