import { request } from '@/lib/http';
import type { AccountRow, AccountStatus } from '@/types';

type Me = { status: AccountStatus; is_admin: boolean };

export async function fetchOwnAccountStatus(): Promise<AccountStatus> {
  return (await request<Me>('GET', 'me')).status;
}

export async function checkPlatformAdmin(): Promise<boolean> {
  return (await request<Me>('GET', 'me')).is_admin;
}

export function fetchAccounts(): Promise<AccountRow[]> {
  return request<AccountRow[]>('GET', 'admin/accounts');
}

export async function setAccountStatus(userId: string, status: AccountStatus): Promise<void> {
  await request('PATCH', `admin/accounts/${encodeURIComponent(userId)}`, { status });
}

export function hasCompletedUsageMonth(account: AccountRow): boolean {
  return (account.months_active ?? 0) >= 1;
}

export function formatUsageMonths(months: number): string {
  return `+${months} ${months === 1 ? 'mês' : 'meses'} de uso`;
}
