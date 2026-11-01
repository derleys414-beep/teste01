import type { Sale } from '@/types';

const DAY_MS = 86_400_000;

export type ReportPeriod = 'month' | '30d' | '90d' | 'all';

export const REPORT_PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'month', label: 'Mês atual' },
  { value: 'all', label: 'Tudo' },
];

export function splitByWindow(sales: Sale[], days: number, now: number) {
  const start = now - days * DAY_MS;
  const previousStart = now - 2 * days * DAY_MS;
  const current: Sale[] = [];
  const previous: Sale[] = [];

  for (const sale of sales) {
    const time = Date.parse(sale.sold_at);
    if (time >= start && time <= now) current.push(sale);
    else if (time >= previousStart && time < start) previous.push(sale);
  }

  return { current, previous };
}

export function filterByPeriod(sales: Sale[], period: ReportPeriod, now: number): Sale[] {
  if (period === 'all') return sales;

  const start =
    period === 'month'
      ? new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime()
      : now - Number.parseInt(period, 10) * DAY_MS;

  return sales.filter((sale) => {
    const time = Date.parse(sale.sold_at);
    return time >= start && time <= now;
  });
}
