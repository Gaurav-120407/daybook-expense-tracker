const TIME_ZONE = 'Asia/Kolkata';

export function localDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function dateKey(date) {
  return typeof date === 'string' ? date.slice(0, 10) : localDateString(date);
}

export function monthBounds(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('Month must use YYYY-MM format');
  const [year, number] = month.split('-').map(Number);
  if (number < 1 || number > 12) throw new Error('Month is invalid');
  return { start: `${month}-01`, end: `${year}-${String(number).padStart(2, '0')}-${String(new Date(Date.UTC(year, number, 0)).getUTCDate()).padStart(2, '0')}` };
}

export function currentWeekBounds(today = localDateString()) {
  const date = new Date(`${today}T00:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  const start = date.toISOString().slice(0, 10);
  date.setUTCDate(date.getUTCDate() + 6);
  return { start, end: date.toISOString().slice(0, 10) };
}
