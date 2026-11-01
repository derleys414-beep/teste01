import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { inputClass } from '@/components/ui/Field';
import { formatUsageMonths, hasCompletedUsageMonth, setAccountStatus } from '@/lib/accounts';
import { errorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import type { AccountRow, AccountStatus } from '@/types';

const STATUS_OPTIONS: { value: AccountStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'bloqueado', label: 'Bloqueado' },
];

export function AccountsTable({
  accounts,
  currentUserId,
  onChanged,
}: {
  accounts: AccountRow[];
  currentUserId: string;
  onChanged: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-6 py-4 font-medium">E-mail</th>
              <th className="px-4 py-4 font-medium">Cadastro</th>
              <th className="px-4 py-4 font-medium">Ativo desde</th>
              <th className="px-6 py-4 font-medium">Acesso</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <AccountRowItem
                key={account.user_id}
                account={account}
                isCurrentUser={account.user_id === currentUserId}
                onChanged={onChanged}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AccountRowItem({ account, isCurrentUser, onChanged }: { account: AccountRow; isCurrentUser: boolean; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeStatus = async (status: AccountStatus) => {
    setSaving(true);
    setError(null);
    try {
      await setAccountStatus(account.user_id, status);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
      <td className="px-6 py-4">
        <p className="font-medium text-slate-900">{account.email}</p>
        {isCurrentUser && <p className="mt-0.5 text-xs text-slate-500">Esta é a sua conta</p>}
      </td>
      <td className="px-4 py-4 text-slate-600">{formatDate(account.created_at)}</td>
      <td className="px-4 py-4">
        {account.activated_at ? (
          <div className="flex flex-col items-start gap-1.5">
            <span className="text-slate-600">{formatDate(account.activated_at)}</span>
            {hasCompletedUsageMonth(account) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {formatUsageMonths(account.months_active ?? 0)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1.5">
          <select
            aria-label={`Acesso de ${account.email}`}
            className={`${inputClass} w-40 py-1.5`}
            value={account.status}
            disabled={saving || isCurrentUser}
            onChange={(e) => changeStatus(e.target.value as AccountStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      </td>
    </tr>
  );
}
