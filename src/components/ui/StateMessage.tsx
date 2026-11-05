import type { ReactNode } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      Carregando seus dados...
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-rose-500" />
      <div>
        <p className="font-medium text-slate-900">Não foi possível carregar os dados</p>
        <p className="mt-1 text-sm text-slate-600">{message}</p>
      </div>
      <Button variant="secondary" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
        Tentar novamente
      </Button>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="max-w-sm text-sm text-slate-500">{text}</p>
      {action}
    </div>
  );
}
