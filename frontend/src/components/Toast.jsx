export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div
        key={toast.key}
        className={`animate-fade-in rounded-full px-4 py-2 text-sm text-white shadow-lg ${
          toast.tone === 'error' ? 'bg-danger' : 'bg-ink/90'
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}
