import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export function DeltaBadge({ value, text, caption }: { value: number | null; text: string; caption: string }) {
  if (value === null) {
    return <span className="text-xs text-slate-400">Sem base de comparacao</span>;
  }

  const tone =
    value > 0
      ? 'bg-emerald-50 text-emerald-700'
      : value < 0
        ? 'bg-rose-50 text-rose-700'
        : 'bg-slate-100 text-slate-600';
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span>{caption}</span>
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium transition-all duration-300 ${tone}`}>
        <Icon className="h-3.5 w-3.5" />
        {text}
      </span>
    </div>
  );
}
