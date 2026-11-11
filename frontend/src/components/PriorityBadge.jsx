// eslint-disable-next-line react-refresh/only-export-components
export const PRIORITY_STYLES = {
  low: { badge: 'bg-emerald-50 text-emerald-700', active: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  medium: { badge: 'bg-amber-50 text-amber-700', active: 'border-amber-500 bg-amber-50 text-amber-700' },
  high: { badge: 'bg-red-50 text-red-600', active: 'border-red-500 bg-red-50 text-red-600' },
};

export default function PriorityBadge({ priority }) {
  if (!priority) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${PRIORITY_STYLES[priority].badge}`}>
      {priority}
    </span>
  );
}
