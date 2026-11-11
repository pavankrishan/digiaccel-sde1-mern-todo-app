import { format } from 'date-fns';
import { CalendarDays, Clock, Flag, SquarePen, Trash2 } from 'lucide-react';
import BottomSheet from './BottomSheet';
import PriorityBadge from './PriorityBadge';
import { formatTaskTime } from '../lib/dates';

export default function TaskDetailSheet({ open, task, onClose, onEdit, onDelete, onToggle }) {
  if (!task) return null;
  const done = task.status === 'completed';

  return (
    <BottomSheet open={open} onClose={onClose} title="Task Details">
      <div className="space-y-5">
        <div>
          <span
            className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              done ? 'bg-done-bg text-primary' : 'bg-pending-bg text-danger'
            }`}
          >
            {done ? 'Completed' : 'In Progress'}
          </span>
          <h3 className={`break-words text-lg font-medium ${done ? 'text-muted line-through' : ''}`}>{task.title}</h3>
        </div>

        <dl className="space-y-3 text-sm">
          <Row icon={CalendarDays} label="Date">{format(new Date(task.dueDate), 'EEEE, d MMMM yyyy')}</Row>
          <Row icon={Clock} label="Time">{formatTaskTime(task)}</Row>
          <Row icon={Flag} label="Priority">
            {task.priority ? <PriorityBadge priority={task.priority} /> : <span className="text-muted">None</span>}
          </Row>
        </dl>

        <div>
          <p className="mb-1 text-xs text-ink/60">Description</p>
          <p className="whitespace-pre-wrap break-words text-sm text-ink/80">
            {task.description || <span className="text-muted">No description</span>}
          </p>
        </div>

        <button
          onClick={() => onToggle(task)}
          className="w-full bg-primary py-3 text-[15px] font-medium text-white transition hover:bg-primary-dark"
        >
          {done ? 'Mark as In Progress' : 'Mark as Completed'}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onEdit(task)}
            className="flex items-center justify-center gap-2 border border-line py-2.5 text-sm hover:bg-surface"
          >
            <SquarePen size={16} /> Edit
          </button>
          <button
            onClick={() => onDelete(task)}
            className="flex items-center justify-center gap-2 border border-red-200 py-2.5 text-sm text-danger hover:bg-red-50"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="shrink-0 text-ink/50" />
      <dt className="w-16 shrink-0 text-ink/60">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
