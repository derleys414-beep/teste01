import { supabase } from '@/lib/supabase';
import type { AccountRow, AccountStatus } from '@/types';

export async function fetchOwnAccountStatus(): Promise<AccountStatus> {
  const { data, error } = await supabase.from('profiles').select('status').maybeSingle<{ status: AccountStatus }>();
  if (error) throw error;
  if (!data) throw new Error('Não foi possível carregar o status da sua conta.');
  return data.status;
}

export async function checkPlatformAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_platform_admin');
  if (error) throw error;
  return data === true;
}

export async function fetchAccounts(): Promise<AccountRow[]> {
  const { data, error } = await supabase.rpc('admin_list_accounts');
  if (error) throw error;
  return (data ?? []) as AccountRow[];
}

export async function setAccountStatus(userId: string, status: AccountStatus): Promise<void> {
  const { error } = await supabase.rpc('admin_set_account_status', { target: userId, new_status: status });
  if (error) throw toAccountStatusError(error);
}

export function hasCompletedUsageMonth(account: AccountRow): boolean {
  return (account.months_active ?? 0) >= 1;
}

export function formatUsageMonths(months: number): string {
  return `+${months} ${months === 1 ? 'mês' : 'meses'} de uso`;
}

function toAccountStatusError(error: { code?: string; message: string }): Error {
  if (error.code === '42501') return new Error('Apenas o administrador pode alterar o status das contas.');
  if (error.code === '22023') return new Error('Não é possível alterar o próprio status.');
  if (error.code === 'P0002') return new Error('Conta não encontrada. Atualize a página e tente novamente.');
  return new Error(error.message);
}
