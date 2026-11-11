import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { keepPreviousData } from '@tanstack/react-query';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import TaskList from '../components/TaskList';
import { useTasks } from '../hooks/useTasks';

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Search() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const q = useDebounced(text.trim());

  // Keep the query in the URL so back/refresh preserve the search.
  useEffect(() => {
    setParams(q ? { q } : {}, { replace: true });
  }, [q, setParams]);

  const query = useTasks({ q }, { enabled: q.length > 0, placeholderData: keepPreviousData });

  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-white px-5 pb-10 pt-[max(1.75rem,env(safe-area-inset-top))] lg:max-w-2xl">
      <button onClick={goBack} aria-label="Back" className="-ml-1 rounded-full p-1 hover:bg-line">
        <ArrowLeft size={24} strokeWidth={1.75} />
      </button>

      <form onSubmit={(e) => e.preventDefault()} role="search" className="relative mt-5">
        <label htmlFor="search" className="sr-only">
          Search tasks
        </label>
        <input
          id="search"
          type="search"
          autoFocus
          enterKeyHint="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by title or description"
          className="input-base py-3 pr-16 [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {text && (
            <button type="button" onClick={() => setText('')} aria-label="Clear search" className="p-1 text-muted">
              <X size={16} />
            </button>
          )}
          <SearchIcon size={18} />
        </div>
      </form>

      <div className="mt-5">
        {!q ? (
          <p className="py-10 text-center text-sm text-muted">Type a keyword to find your tasks.</p>
        ) : (
          <>
            {query.isSuccess && query.data.length > 0 && (
              <p className="mb-1 text-xs text-muted">
                {query.data.length} result{query.data.length === 1 ? '' : 's'}
              </p>
            )}
            <TaskList query={query} showDate bg="bg-white" empty={`No tasks match “${q}”.`} />
          </>
        )}
      </div>
    </div>
  );
}
