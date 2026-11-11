import { useState } from 'react';
import { addHours, startOfHour } from 'date-fns';
import BottomSheet from './BottomSheet';
import ClockTimeField from './ClockPicker';
import DateField from './DatePicker';
import { Spinner } from './Loaders';
import { combineDateTime, toDateInput, toTimeInput } from '../lib/dates';
import { PRIORITY_STYLES } from './PriorityBadge';

const PRIORITIES = ['low', 'medium', 'high'];
// "yyyy-MM-dd" strings compare correctly as plain strings.
const MIN_DATE = '2000-01-01';
const MAX_DATE = '2099-12-31';

function initialValues(task, defaultDate) {
  if (task) {
    const start = new Date(task.dueDate);
    return {
      title: task.title,
      description: task.description || '',
      date: toDateInput(start),
      start: toTimeInput(start),
      end: task.endDate ? toTimeInput(new Date(task.endDate)) : '',
      priority: task.priority || null,
    };
  }
  // New task: the selected day; times are left empty ("Start" / "Ends") as in the design.
  return {
    title: '',
    description: '',
    date: toDateInput(defaultDate ? new Date(defaultDate) : new Date()),
    start: '',
    end: '',
    priority: null,
  };
}

function validate(v) {
  const errors = {};
  if (!v.title.trim()) errors.title = 'Task title is required';
  if (!v.date) errors.date = 'Date is required';
  else if (v.date < MIN_DATE || v.date > MAX_DATE) errors.date = 'Enter a valid date (year 2000–2099)';
  if (!v.start) errors.start = 'Start time is required';
  if (v.end && v.start && v.end <= v.start) errors.end = 'Must be after start';
  return errors;
}

export default function TaskFormSheet({ open, task, defaultDate, onClose, onSave }) {
  const [values, setValues] = useState(() => initialValues(task, defaultDate));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const setValue = (field) => (value) => set(field)({ target: { value } });

  // Where the clock hand starts when a time field is still empty.
  const nextHour = toTimeInput(startOfHour(addHours(new Date(), 1)));
  const endFallback = values.start
    ? toTimeInput(addHours(combineDateTime(values.date || toDateInput(new Date()), values.start), 1))
    : nextHour;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    setSubmitError('');
    try {
      await onSave({
        title: values.title.trim(),
        description: values.description.trim(),
        dueDate: combineDateTime(values.date, values.start).toISOString(),
        endDate: values.end ? combineDateTime(values.date, values.end).toISOString() : null,
        priority: values.priority,
      });
    } catch (err) {
      setSubmitError(err.details?.map((d) => d.message).join(', ') || err.message);
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={task ? 'Edit Task' : 'Add New Task'}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Task title" error={errors.title} htmlFor="title">
          <input
            id="title"
            className="input-base"
            placeholder="Doing Homework"
            value={values.title}
            onChange={set('title')}
            maxLength={200}
            autoFocus={!task}
          />
        </Field>

        <div>
          <span className="mb-2 block text-xs text-ink/80">Set Time</span>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <ClockTimeField
              label="Start"
              value={values.start}
              fallback={nextHour}
              onChange={setValue('start')}
              error={errors.start}
            />
            <ClockTimeField
              label="Ends"
              value={values.end}
              fallback={endFallback}
              onChange={setValue('end')}
              error={errors.end}
              clearable
            />
          </div>
        </div>

        <Field label="Set Date" htmlFor="date">
          <DateField
            id="date"
            value={values.date}
            min={MIN_DATE}
            max={MAX_DATE}
            onChange={setValue('date')}
            error={errors.date}
          />
        </Field>

        <div>
          <span className="mb-2 block text-xs text-ink/80">Priority</span>
          <div className="flex gap-2" role="radiogroup" aria-label="Priority">
            {PRIORITIES.map((p) => {
              const active = values.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setValues((v) => ({ ...v, priority: active ? null : p }))}
                  className={`flex-1 rounded-sm border py-2 text-sm capitalize transition ${
                    active ? PRIORITY_STYLES[p].active : 'border-line text-ink/70 hover:border-ink/30'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={3}
            className="input-base resize-none"
            placeholder="Add Description"
            value={values.description}
            onChange={set('description')}
            maxLength={2000}
          />
        </Field>

        {submitError && <p className="text-sm text-danger">{submitError}</p>}

        <button
          type="submit"
          disabled={saving}
          aria-busy={saving}
          className="flex w-full items-center justify-center gap-2 bg-primary py-3 text-[15px] font-medium text-white transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-80"
        >
          {saving && <Spinner size={18} />}
          {saving ? (task ? 'Saving changes…' : 'Creating task…') : task ? 'Save changes' : 'Create task'}
        </button>
      </form>
    </BottomSheet>
  );
}

function Field({ label, error, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-xs text-ink/80">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
