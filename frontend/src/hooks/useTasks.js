import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../lib/api';
import { TIME_ZONE } from '../lib/dates';

export const taskKeys = {
  all: ['tasks'],
  list: (params) => ['tasks', 'list', params],
  weeks: () => ['tasks', 'weeks', TIME_ZONE],
};

export function useTasks(params, options = {}) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.list(params),
    ...options,
  });
}

export function useWeeks() {
  return useQuery({
    queryKey: taskKeys.weeks(),
    queryFn: () => tasksApi.weeks(TIME_ZONE),
  });
}

/** Invalidate everything task-related so lists and week counts stay in sync. */
function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: taskKeys.all });
}

export function useCreateTask() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: tasksApi.create, onSuccess: invalidate });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ id, ...patch }) => tasksApi.update(id, patch),
    // Optimistically patch every cached task list (snappy checkbox toggles).
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ['tasks', 'list'] });
      const snapshot = qc.getQueriesData({ queryKey: ['tasks', 'list'] });
      qc.setQueriesData({ queryKey: ['tasks', 'list'] }, (old) =>
        Array.isArray(old) ? old.map((t) => (t.id === id ? { ...t, ...patch } : t)) : old,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: invalidate,
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: tasksApi.remove,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks', 'list'] });
      const snapshot = qc.getQueriesData({ queryKey: ['tasks', 'list'] });
      qc.setQueriesData({ queryKey: ['tasks', 'list'] }, (old) =>
        Array.isArray(old) ? old.filter((t) => t.id !== id) : old,
      );
      return { snapshot };
    },
    onError: (_err, _id, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: invalidate,
  });
}
