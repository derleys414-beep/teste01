import { AlertTriangle } from 'lucide-react';
import { AccountsTable } from '@/components/admin/AccountsTable';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateMessage';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchAccounts, formatUsageMonths, hasCompletedUsageMonth } from '@/lib/accounts';
import type { AccountRow } from '@/types';

export function AdminPage({ currentUserId }: { currentUserId: string }) {
  const accounts = useAsyncData(fetchAccounts);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Administração"
        subtitle="Veja todas as contas cadastradas e defina o acesso de cada uma: pendente, ativo ou bloqueado."
      />
      {accounts.loading ? (
        <LoadingState />
      ) : accounts.error || !accounts.data ? (
        <ErrorState message={accounts.error ?? 'Contas indisponíveis.'} onRetry={accounts.reload} />
      ) : accounts.data.length === 0 ? (
        <EmptyState title="Nenhuma conta cadastrada" text="As contas aparecem aqui assim que alguém criar um cadastro." />
      ) : (
        <>
          <UsageMilestones accounts={accounts.data} />
          <AccountsTable accounts={accounts.data} currentUserId={currentUserId} onChanged={accounts.reload} />
        </>
      )}
    </div>
  );
}

function UsageMilestones({ accounts }: { accounts: AccountRow[] }) {
  const milestones = accounts.filter(hasCompletedUsageMonth);
  if (milestones.length === 0) return null;

  return (
    <Card className="flex flex-col gap-4 border-amber-200 bg-amber-50/60 p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Ciclos de uso completados</h2>
          <p className="text-xs text-slate-500">Contas ativas que chegaram a pelo menos um mês de uso.</p>
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-amber-100">
        {milestones.map((account) => (
          <li key={account.user_id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <span className="truncate text-slate-700">{account.email}</span>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
              {formatUsageMonths(account.months_active ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
