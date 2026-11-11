import { addWeeks, format, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { weekDays, weekStartOf } from '../lib/dates';

/** Monday–Sunday day picker with previous / next week navigation. */
export default function WeekStrip({ selected, onSelect, taskDays }) {
  const days = weekDays(selected);
  const isCurrentWeek = isSameDay(weekStartOf(selected), weekStartOf(new Date()));

  return (
    <section aria-label="Choose a day">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => onSelect(addWeeks(selected, -1))}
          aria-label="Previous week"
          className="rounded-full p-1 text-ink/60 hover:bg-line"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2 text-xs font-medium text-ink/70">
          {format(days[0], 'MMMM yyyy')}
          {!isCurrentWeek && (
            <button
              onClick={() => onSelect(new Date())}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/20"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => onSelect(addWeeks(selected, 1))}
          aria-label="Next week"
          className="rounded-full p-1 text-ink/60 hover:bg-line"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const active = isSameDay(day, selected);
          const hasTasks = taskDays?.has(format(day, 'yyyy-MM-dd'));
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              aria-pressed={active}
              aria-label={format(day, 'EEEE, d MMMM')}
              className={`flex flex-col items-center rounded-[2px] py-2 transition ${
                active ? 'bg-primary text-white shadow-md shadow-primary/30' : 'hover:bg-line/60'
              }`}
            >
              <span className={`text-[10px] ${active ? 'text-white/90' : 'text-muted'}`}>{format(day, 'EEE')}</span>
              <span
                className={`mt-1 text-sm ${active ? 'font-medium' : isToday(day) ? 'font-semibold text-primary' : 'text-muted'}`}
              >
                {format(day, 'dd')}
              </span>
              <span
                className={`mt-1 size-1 rounded-full ${
                  active ? 'bg-white' : hasTasks ? 'bg-primary/60' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
