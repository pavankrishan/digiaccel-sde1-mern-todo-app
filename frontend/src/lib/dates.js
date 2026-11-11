import { addDays, endOfWeek, format, isSameMonth, isSameYear, startOfWeek } from 'date-fns';

// Weeks start on Monday and end on Sunday.
export const WEEK_OPTS = { weekStartsOn: 1 };

export const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const weekStartOf = (date) => startOfWeek(date, WEEK_OPTS);

export const weekDays = (date) => {
  const start = weekStartOf(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

/** [from, to) range of the Monday–Sunday week containing `date`, as ISO strings. */
export const weekRange = (date) => {
  const from = weekStartOf(date);
  return { from: from.toISOString(), to: addDays(from, 7).toISOString() };
};

export const dayRange = (date) => {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return { from: from.toISOString(), to: addDays(from, 1).toISOString() };
};

export function formatWeekLabel(weekStart) {
  const start = new Date(weekStart);
  const end = endOfWeek(start, WEEK_OPTS);
  if (isSameMonth(start, end)) return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  if (isSameYear(start, end)) return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

export function formatTaskTime(task) {
  const start = format(new Date(task.dueDate), 'h:mm a');
  return task.endDate ? `${start} – ${format(new Date(task.endDate), 'h:mm a')}` : start;
}

/** Combine "yyyy-MM-dd" + "HH:mm" (local time) into a Date. */
export function combineDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

export const toDateInput = (date) => format(date, 'yyyy-MM-dd');
export const toTimeInput = (date) => format(date, 'HH:mm');
