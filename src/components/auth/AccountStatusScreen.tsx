import { Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const STATUS_CONTENT = {
  pendente: {
    icon: Clock,
    iconClass: 'bg-amber-50 text-amber-600',
    title: 'Conta em análise',
    message: 'Sua conta está em análise pelo administrador',
  },
  bloqueado: {
    icon: Lock,
    iconClass: 'bg-rose-50 text-rose-600',
    title: 'Acesso bloqueado',
    message: 'Sua conta do MargemOS está bloqueada no momento. Entre em contato com o administrador para liberar o acesso.',
  },
} as const;

export function AccountStatusScreen({
  status,
  onSignOut,
  signOutError,
}: {
  status: keyof typeof STATUS_CONTENT;
  onSignOut: () => void;
  signOutError: string | null;
}) {
  const content = STATUS_CONTENT[status];
  const Icon = content.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="flex w-full max-w-md flex-col items-center gap-5 p-8 text-center">
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${content.iconClass}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-slate-900">{content.title}</h1>
          <p className="text-sm leading-relaxed text-slate-500">{content.message}</p>
        </div>
        <Button variant="secondary" onClick={onSignOut}>
          Sair
        </Button>
        {signOutError && <p className="text-sm text-rose-600">{signOutError}</p>}
      </Card>
    </div>
  );
}
