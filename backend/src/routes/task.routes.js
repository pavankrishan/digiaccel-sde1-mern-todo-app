import { Router } from 'express';
import { requireClientId } from '../middleware/index.js';
import {
  listTasks,
  weeklySummary,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller.js';

const router = Router();

router.use(requireClientId);

router.get('/', listTasks);
router.get('/weeks', weeklySummary); // must be declared before '/:id'
router.post('/', createTask);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
