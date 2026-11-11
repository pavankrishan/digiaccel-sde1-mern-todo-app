import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

const ACTION_WIDTH = 84;

/**
 * Swipe left (touch or mouse drag) to reveal a "Delete" action, as in the
 * spec's user flow. Vertical scrolling keeps working thanks to axis locking
 * and `touch-action: pan-y`.
 */
export default function SwipeableRow({ onDelete, children, className = '' }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const rootRef = useRef(null);

  const update = (value) => {
    offsetRef.current = value;
    setOffset(value);
  };

  // Close when the user interacts anywhere else.
  useEffect(() => {
    if (offset === 0 || dragging) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) update(0);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [offset, dragging]);

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    gesture.current = { x: e.clientX, y: e.clientY, start: offsetRef.current, axis: null, id: e.pointerId };
    suppressClick.current = false;
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (!g.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (g.axis === 'x') {
        setDragging(true);
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }
    }
    if (g.axis !== 'x') return;

    suppressClick.current = true;
    update(Math.min(0, Math.max(-ACTION_WIDTH * 1.4, g.start + dx)));
  };

  const endGesture = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.axis !== 'x') return;
    setDragging(false);
    update(offsetRef.current < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0);
  };

  return (
    <div ref={rootRef} className={`relative overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => {
          update(0);
          onDelete();
        }}
        tabIndex={offset === 0 ? -1 : 0}
        aria-hidden={offset === 0}
        className="absolute inset-y-0 right-0 flex items-center justify-center gap-1 bg-danger text-sm font-medium text-white"
        style={{ width: ACTION_WIDTH }}
      >
        <Trash2 size={16} /> Delete
      </button>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.stopPropagation();
            e.preventDefault();
            suppressClick.current = false;
          }
        }}
        className={`relative touch-pan-y select-none ${dragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
