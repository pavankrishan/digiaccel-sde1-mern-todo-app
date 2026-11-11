import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useCreateTask, useDeleteTask, useUpdateTask } from '../hooks/useTasks';
import TaskFormSheet from './TaskFormSheet';
import TaskDetailSheet from './TaskDetailSheet';
import Toast, { TOAST_DURATION } from './Toast';

const TaskUIContext = createContext(null);

/**
 * Owns the app-wide task sheets (create / edit / view) and toasts, and exposes
 * task actions so any screen (Home, Search, week cards) can use them.
 */
export function TaskUIProvider({ children }) {
  const [sheet, setSheet] = useState(null); // { type: 'form' | 'view', task?, defaultDate? }
  const [toast, setToast] = useState(null); // { title, description?, tone, key }
  const [toastLeaving, setToastLeaving] = useState(false);
  const toastTimer = useRef();
  const toastClock = useRef({ start: 0, remaining: 0 });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // ---- Toasts ---------------------------------------------------------------
  const dismissToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToastLeaving(true);
    toastTimer.current = setTimeout(() => setToast(null), 250); // let the exit animation play
  }, []);

  const scheduleDismiss = useCallback(
    (ms) => {
      clearTimeout(toastTimer.current);
      toastClock.current = { start: Date.now(), remaining: ms };
      toastTimer.current = setTimeout(dismissToast, ms);
    },
    [dismissToast],
  );

  /** showToast({ title, description?, tone: 'created' | 'updated' | 'deleted' | 'error' }) */
  const showToast = useCallback(
    (t) => {
      setToastLeaving(false);
      setToast({ ...t, key: Date.now() });
      scheduleDismiss(TOAST_DURATION);
    },
    [scheduleDismiss],
  );

  // Hovering a toast pauses its countdown.
  const pauseToast = () => {
    clearTimeout(toastTimer.current);
    const c = toastClock.current;
    c.remaining = Math.max(800, c.remaining - (Date.now() - c.start));
  };
  const resumeToast = () => scheduleDismiss(toastClock.current.remaining);

  const errorToast = useCallback(
    (e) => showToast({ tone: 'error', title: 'Something went wrong', description: e.message }),
    [showToast],
  );

  // ---- Actions --------------------------------------------------------------
  const actions = useMemo(
    () => ({
      openCreate: (defaultDate) => setSheet({ type: 'form', defaultDate }),
      openEdit: (task) => setSheet({ type: 'form', task }),
      openView: (task) => setSheet({ type: 'view', task }),
      close: () => setSheet(null),

      toggleStatus: (task) =>
        updateTask.mutate(
          { id: task.id, status: task.status === 'completed' ? 'in_progress' : 'completed' },
          {
            onSuccess: (updated) =>
              showToast(
                updated.status === 'completed'
                  ? { tone: 'created', title: 'Task completed 🎉', description: updated.title }
                  : { tone: 'updated', title: 'Moved back to In Progress', description: updated.title },
              ),
            onError: errorToast,
          },
        ),

      remove: (task) =>
        deleteTask.mutate(task.id, {
          onSuccess: () => showToast({ tone: 'deleted', title: 'Task deleted', description: task.title }),
          onError: errorToast,
        }),

      showToast,
    }),
    [updateTask, deleteTask, showToast, errorToast],
  );

  const handleSave = async (payload) => {
    if (sheet?.task) {
      const saved = await updateTask.mutateAsync({ id: sheet.task.id, ...payload });
      showToast({ tone: 'updated', title: 'Changes saved', description: saved.title });
    } else {
      const saved = await createTask.mutateAsync(payload);
      showToast({
        tone: 'created',
        title: 'Task created',
        description: `${saved.title} · ${format(new Date(saved.dueDate), 'EEE d MMM, h:mm a')}`,
      });
    }
    setSheet(null);
  };

  return (
    <TaskUIContext.Provider value={actions}>
      {children}

      {/* Mounted only while open, so every open starts with fresh form state. */}
      {sheet?.type === 'form' && (
        <TaskFormSheet
          open
          task={sheet.task}
          defaultDate={sheet.defaultDate}
          onClose={actions.close}
          onSave={handleSave}
        />
      )}
      <TaskDetailSheet
        open={sheet?.type === 'view'}
        task={sheet?.task}
        onClose={actions.close}
        onEdit={(t) => actions.openEdit(t)}
        onDelete={(t) => {
          actions.remove(t);
          actions.close();
        }}
        onToggle={(t) => {
          actions.toggleStatus(t);
          setSheet({ type: 'view', task: { ...t, status: t.status === 'completed' ? 'in_progress' : 'completed' } });
        }}
      />
      <Toast
        toast={toast}
        leaving={toastLeaving}
        onClose={dismissToast}
        onPause={pauseToast}
        onResume={resumeToast}
      />
    </TaskUIContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTaskUI() {
  const ctx = useContext(TaskUIContext);
  if (!ctx) throw new Error('useTaskUI must be used inside <TaskUIProvider>');
  return ctx;
}
