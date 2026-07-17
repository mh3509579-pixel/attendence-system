import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export function formatDate(date: Date | string, fmt: string = 'PPP') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function getDateRange(range: 'today' | 'week' | 'month') {
  const now = new Date();
  switch (range) {
    case 'today':
      return { start: now, end: now };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export function calculateAttendancePercentage(present: number, total: number) {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

export function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
