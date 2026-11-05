import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-2 border-slate-100" />
        <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-brand-600" />
      </div>
      <p className="text-sm text-slate-500">Carregando seus dados...</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-200/70 bg-rose-50/50 px-6 py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
        <AlertCircle className="h-6 w-6" />
      </span>
      <div>
        <p className="font-semibold text-slate-900">Nao foi possivel carregar os dados</p>
        <p className="mt-1 text-sm text-slate-600">{message}</p>
      </div>
      <Button variant="secondary" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
        Tentar novamente
      </Button>
    </div>
  );
}

export function EmptyState({ title, text, action, icon }: { title: string; text: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      {icon ?? (
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Inbox className="h-7 w-7" />
        </span>
      )}
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">{text}</p>
      </div>
      {action}
    </div>
  );
}
