import { Task } from '../models/Task.js';
import { HttpError } from '../middleware/index.js';
import {
  createTaskSchema,
  updateTaskSchema,
  listQuerySchema,
  weeksQuerySchema,
} from '../validators/task.schema.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function findOwnedTask(req) {
  const task = await Task.findOne({ _id: req.params.id, clientId: req.clientId });
  if (!task) throw new HttpError(404, 'Task not found');
  return task;
}

/** GET /api/tasks?q=&from=&to=&status= */
export async function listTasks(req, res) {
  const { q, from, to, status } = listQuerySchema.parse(req.query);
  const filter = { clientId: req.clientId };

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (from || to) {
    filter.dueDate = {};
    if (from) filter.dueDate.$gte = from;
    if (to) filter.dueDate.$lt = to;
  }
  if (status) filter.status = status;

  const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: 1 }).limit(500);
  res.json(tasks);
}

/**
 * GET /api/tasks/weeks?tz=Asia/Kolkata
 * Groups tasks into Monday–Sunday weeks (in the caller's time zone) and
 * returns open / completed counts for each week.
 */
export async function weeklySummary(req, res) {
  const { tz } = weeksQuerySchema.parse(req.query);

  const weeks = await Task.aggregate([
    { $match: { clientId: req.clientId } },
    {
      $group: {
        _id: {
          $dateTrunc: { date: '$dueDate', unit: 'week', startOfWeek: 'monday', timezone: tz },
        },
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        weekStart: '$_id',
        weekEnd: { $dateAdd: { startDate: '$_id', unit: 'week', amount: 1, timezone: tz } },
        total: 1,
        completed: 1,
        open: { $subtract: ['$total', '$completed'] },
      },
    },
    { $sort: { weekStart: 1 } },
  ]);

  res.json(weeks);
}

/** GET /api/tasks/:id */
export async function getTask(req, res) {
  res.json(await findOwnedTask(req));
}

/** POST /api/tasks */
export async function createTask(req, res) {
  const data = createTaskSchema.parse(req.body ?? {});
  const task = new Task({ ...data, clientId: req.clientId });
  await task.save();
  res.status(201).json(task);
}

/** PATCH /api/tasks/:id — partial update (any field, including status) */
export async function updateTask(req, res) {
  const data = updateTaskSchema.parse(req.body ?? {});
  const task = await findOwnedTask(req);

  task.set(data);
  if (task.endDate && task.endDate < task.dueDate) {
    throw new HttpError(400, 'Validation failed', [
      { field: 'endDate', message: 'End time must be after start time' },
    ]);
  }
  await task.save();
  res.json(task);
}

/** DELETE /api/tasks/:id */
export async function deleteTask(req, res) {
  const result = await Task.deleteOne({ _id: req.params.id, clientId: req.clientId });
  if (result.deletedCount === 0) throw new HttpError(404, 'Task not found');
  res.status(204).end();
}
