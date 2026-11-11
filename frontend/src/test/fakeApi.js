import { addDays } from 'date-fns';
import { weekStartOf } from '../lib/dates';

/** Minimal in-memory implementation of the REST API, installed as global fetch. */
export function installFakeApi(seed = []) {
  let nextId = 1;
  const tasks = seed.map((t) => ({
    id: String(nextId++),
    description: '',
    priority: null,
    status: 'in_progress',
    endDate: null,
    ...t,
  }));

  const json = (status, body) =>
    Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status }));

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input.toString());
    const method = init.method || 'GET';
    const body = init.body ? JSON.parse(init.body) : null;
    const path = url.pathname.replace(/^\/api/, '');
    const idMatch = path.match(/^\/tasks\/([^/]+)$/);

    if (method === 'GET' && path === '/tasks/weeks') {
      const groups = new Map();
      for (const t of tasks) {
        const start = weekStartOf(new Date(t.dueDate)).getTime();
        const g = groups.get(start) ?? { total: 0, completed: 0 };
        g.total += 1;
        if (t.status === 'completed') g.completed += 1;
        groups.set(start, g);
      }
      return json(
        200,
        [...groups.entries()]
          .sort(([a], [b]) => a - b)
          .map(([start, g]) => ({
            weekStart: new Date(start).toISOString(),
            weekEnd: addDays(new Date(start), 7).toISOString(),
            ...g,
            open: g.total - g.completed,
          })),
      );
    }

    if (method === 'GET' && path === '/tasks') {
      const q = url.searchParams.get('q')?.toLowerCase();
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      const result = tasks
        .filter((t) => !q || `${t.title} ${t.description}`.toLowerCase().includes(q))
        .filter((t) => !from || new Date(t.dueDate) >= new Date(from))
        .filter((t) => !to || new Date(t.dueDate) < new Date(to))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      return json(200, result);
    }

    if (method === 'POST' && path === '/tasks') {
      const task = { id: String(nextId++), status: 'in_progress', ...body };
      tasks.push(task);
      return json(201, task);
    }

    if (idMatch) {
      const idx = tasks.findIndex((t) => t.id === idMatch[1]);
      if (idx === -1) return json(404, { error: 'Task not found' });
      if (method === 'PATCH') {
        tasks[idx] = { ...tasks[idx], ...body };
        return json(200, tasks[idx]);
      }
      if (method === 'DELETE') {
        tasks.splice(idx, 1);
        return json(204, null);
      }
    }
    return json(404, { error: 'not found' });
  };

  return tasks;
}
