import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useCreateTask, useDeleteTask, useUpdateTask } from '../hooks/useTasks';
import TaskFormSheet from './TaskFormSheet';
import TaskDetailSheet from './TaskDetailSheet';
import Toast from './Toast';

const TaskUIContext = createContext(null);

/**
 * Owns the app-wide task sheets (create / edit / view) and toasts, and exposes
 * task actions so any screen (Home, Search, week cards) can use them.
 */
export function TaskUIProvider({ children }) {
  const [sheet, setSheet] = useState(null); // { type: 'form' | 'view', task?, defaultDate? }
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const showToast = useCallback((message, tone = 'default') => {
    clearTimeout(toastTimer.current);
    setToast({ message, tone, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const actions = useMemo(
    () => ({
      openCreate: (defaultDate) => setSheet({ type: 'form', defaultDate }),
      openEdit: (task) => setSheet({ type: 'form', task }),
      openView: (task) => setSheet({ type: 'view', task }),
      close: () => setSheet(null),

      toggleStatus: (task) =>
        updateTask.mutate(
          { id: task.id, status: task.status === 'completed' ? 'in_progress' : 'completed' },
          { onError: (e) => showToast(e.message, 'error') },
        ),

      remove: (task) =>
        deleteTask.mutate(task.id, {
          onSuccess: () => showToast('Task deleted'),
          onError: (e) => showToast(e.message, 'error'),
        }),

      showToast,
    }),
    [updateTask, deleteTask, showToast],
  );

  const handleSave = async (payload) => {
    if (sheet?.task) {
      await updateTask.mutateAsync({ id: sheet.task.id, ...payload });
      showToast('Task updated');
    } else {
      await createTask.mutateAsync(payload);
      showToast('Task created');
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
      <Toast toast={toast} />
    </TaskUIContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTaskUI() {
  const ctx = useContext(TaskUIContext);
  if (!ctx) throw new Error('useTaskUI must be used inside <TaskUIProvider>');
  return ctx;
}
