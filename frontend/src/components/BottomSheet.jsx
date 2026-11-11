import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

/** Bottom sheet on phones, centered dialog on larger screens. */
export default function BottomSheet({ open, onClose, title, children }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="animate-fade-in absolute inset-0 bg-[#7d7d80]/60" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-sheet-up relative max-h-[92dvh] w-full max-w-md overflow-y-auto bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-2xl sm:rounded-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id={titleId} className="text-[17px] font-medium">
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close" className="-mr-1 rounded-full p-1 hover:bg-line">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
