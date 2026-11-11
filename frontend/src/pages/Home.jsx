import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isSameDay, isToday } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import WeekStrip from '../components/WeekStrip';
import { StatCards, WeeklyProgress } from '../components/WeekStats';
import TaskList from '../components/TaskList';
import WeekCard from '../components/WeekCard';
import { useTaskUI } from '../components/TaskUIProvider';
import { useTasks, useWeeks } from '../hooks/useTasks';
import { weekRange, weekStartOf } from '../lib/dates';
import { SlowServerNotice, WeekCardSkeleton } from '../components/Loaders';

export default function Home() {
  const [selected, setSelected] = useState(() => new Date());
  const [showWholeWeek, setShowWholeWeek] = useState(false);
  const { openCreate } = useTaskUI();

  const range = useMemo(() => weekRange(selected), [selected]);
  const weekQuery = useTasks(range);
  const weekTasks = useMemo(() => weekQuery.data ?? [], [weekQuery.data]);

  const stats = useMemo(() => {
    const completed = weekTasks.filter((t) => t.status === 'completed').length;
    return { completed, pending: weekTasks.length - completed, total: weekTasks.length };
  }, [weekTasks]);

  const taskDays = useMemo(
    () => new Set(weekTasks.map((t) => format(new Date(t.dueDate), 'yyyy-MM-dd'))),
    [weekTasks],
  );

  const visibleTasks = showWholeWeek ? weekTasks : weekTasks.filter((t) => isSameDay(new Date(t.dueDate), selected));
  const heading = showWholeWeek
    ? 'Tasks This Week'
    : isToday(selected)
      ? 'Tasks Today'
      : `Tasks on ${format(selected, 'EEE, d MMM')}`;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-surface pb-32 lg:max-w-6xl lg:px-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        {/* Left column: day/week detail */}
        <div className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] lg:px-0">
          <Link
            to="/search"
            className="flex items-center justify-between rounded-sm border border-line bg-white px-4 py-3 text-xs text-muted transition hover:border-primary/40"
          >
            Search for a task
            <Search size={18} className="text-ink" />
          </Link>

          <div className="mt-5">
            <WeekStrip
              selected={selected}
              onSelect={(d) => setSelected(d)}
              taskDays={taskDays}
            />
          </div>

          <div className="mt-6">
            <SlowServerNotice loading={weekQuery.isPending} />
            <StatCards completed={stats.completed} pending={stats.pending} loading={weekQuery.isPending} />
          </div>

          <div className="mt-7">
            <WeeklyProgress completed={stats.completed} total={stats.total} />
          </div>

          <section className="mt-7" aria-labelledby="tasks-heading">
            <div className="mb-2 flex items-center justify-between">
              <h2 id="tasks-heading" className="text-base font-medium">
                {heading}
              </h2>
              <button onClick={() => setShowWholeWeek((v) => !v)} className="text-xs text-primary hover:underline">
                {showWholeWeek ? 'Show Day' : 'View All'}
              </button>
            </div>
            <TaskList
              query={weekQuery}
              tasks={visibleTasks}
              showDate={showWholeWeek}
              empty={showWholeWeek ? 'No tasks this week yet.' : 'Nothing planned. Tap + to add a task.'}
            />
            <p className="mt-3 text-center text-[10px] text-muted lg:hidden">Tip: swipe a task left to delete it</p>
          </section>
        </div>

        {/* Right column (below on mobile): weekly overview cards */}
        <WeeklyOverview selected={selected} />
      </div>

      <button
        onClick={() => openCreate(selected)}
        aria-label="Add task"
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex size-[60px] -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition hover:scale-105 hover:bg-primary-dark active:scale-95 lg:left-auto lg:right-10 lg:translate-x-0"
      >
        <Plus size={30} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function WeeklyOverview({ selected }) {
  const weeksQuery = useWeeks();
  const currentKey = weekStartOf(new Date()).getTime();
  // null = default (expand the current week); otherwise the user's choice.
  const [expandedKey, setExpandedKey] = useState(null);
  const activeKey = expandedKey ?? currentKey;

  const weeks = weeksQuery.data ?? [];

  return (
    <section className="mt-9 px-5 lg:mt-0 lg:px-0 lg:pt-[max(1.75rem,env(safe-area-inset-top))]" aria-labelledby="weeks-heading">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="weeks-heading" className="text-base font-medium">
          Weekly Overview
        </h2>
        <span className="text-xs text-muted">Mon – Sun</span>
      </div>

      {weeksQuery.isPending && (
        <ul className="space-y-3">
          <WeekCardSkeleton />
          <WeekCardSkeleton />
        </ul>
      )}
      {weeksQuery.isError && (
        <p className="text-sm text-danger">
          {weeksQuery.error.message}{' '}
          <button className="underline" onClick={() => weeksQuery.refetch()}>
            Retry
          </button>
        </p>
      )}
      {weeksQuery.isSuccess && weeks.length === 0 && (
        <p className="border border-dashed border-line py-8 text-center text-sm text-muted">
          Your weeks will show up here once you add tasks.
        </p>
      )}

      <ul className="space-y-3">
        {weeks.map((week) => {
          const key = new Date(week.weekStart).getTime();
          return (
            <WeekCard
              key={key}
              week={week}
              expanded={activeKey === key}
              highlighted={isSameDay(new Date(week.weekStart), weekStartOf(selected))}
              onToggle={() => setExpandedKey(activeKey === key ? -1 : key)}
            />
          );
        })}
      </ul>
    </section>
  );
}
