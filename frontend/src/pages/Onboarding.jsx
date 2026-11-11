import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/clientId';

export const ONBOARDED_KEY = 'todo.onboarded';

function Zigzag({ className }) {
  return (
    <svg viewBox="0 0 100 64" className={className} fill="none" stroke="currentColor" strokeWidth="5" aria-hidden="true">
      {[8, 26, 44].map((y) => (
        <path key={y} d={`M0 ${y + 12} L12 ${y} L24 ${y + 12} L36 ${y} L48 ${y + 12} L60 ${y} L72 ${y + 12} L84 ${y} L96 ${y + 12}`} />
      ))}
    </svg>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();

  const start = () => {
    storage.set(ONBOARDED_KEY, '1');
    navigate('/', { replace: true });
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white md:max-w-4xl md:flex-row md:py-10">
      <div className="relative min-h-[55dvh] flex-1 overflow-hidden bg-primary md:min-h-0">
        <div className="absolute -right-10 -top-10 size-28 rounded-full border-[18px] border-white/20" />
        <Zigzag className="absolute left-0 top-[18%] w-24 text-white/20" />
        <Zigzag className="absolute bottom-[6%] right-0 w-24 text-white/20" />
      </div>

      <div className="flex flex-col px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-8 md:w-[420px] md:justify-center md:px-12">
        <h1 className="text-[22px] font-medium">Manage What To Do</h1>
        <p className="mt-4 max-w-64 text-xs leading-relaxed text-ink/60">
          The best way to manage what you have to do, don&apos;t forget your plans
        </p>
        <button
          onClick={start}
          className="mt-auto w-full bg-primary py-3 text-[15px] text-white transition hover:bg-primary-dark md:mt-16"
        >
          Get Started
        </button>
      </div>
    </main>
  );
}
