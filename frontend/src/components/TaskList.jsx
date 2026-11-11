import TaskItem from './TaskItem';
import { TaskListSkeleton } from './Loaders';

/** Renders a task list with loading / error / empty states. */
export default function TaskList({ query, tasks = query?.data, empty, showDate, bg }) {
  if (query?.isPending) {
    return <TaskListSkeleton />;
  }
  if (query?.isError) {
    return (
      <div className="rounded border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger">
        {query.error.message}{' '}
        <button className="font-medium underline" onClick={() => query.refetch()}>
          Retry
        </button>
      </div>
    );
  }
  if (!tasks?.length) {
    return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  }
  return (
    <ul>
      {tasks.map((t) => (
        <TaskItem key={t.id} task={t} showDate={showDate} bg={bg} />
      ))}
    </ul>
  );
}
