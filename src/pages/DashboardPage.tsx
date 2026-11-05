import { useState, type ReactNode } from 'react';
import { DoughnutChart } from '@/components/charts/DoughnutChart';
import { Card } from '@/components/ui/Card';
import { DeltaBadge } from '@/components/ui/DeltaBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateMessage';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { fetchCatalog, fetchSales } from '@/lib/api';
import { sumSales, type Totals } from '@/lib/finance';
import { formatBRL, formatInt, formatPct, formatSignedBRL, formatSignedPct, formatSignedPoints } from '@/lib/format';
import { splitByWindow } from '@/lib/periods';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { Channel, Sale } from '@/types';

type WindowDays = 7 | 30 | 90;

const WINDOW_OPTIONS: { value: string; label: string }[] = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
];

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function DashboardPage() {
  const catalog = useAsyncData(fetchCatalog);
  const sales = useAsyncData(fetchSales);
  const [days, setDays] = useState<WindowDays>(7);

  const reloadAll = () => {
    catalog.reload();
    sales.reload();
  };

  if (catalog.loading || sales.loading) return <LoadingState />;
  const error = catalog.error ?? sales.error;
  if (error || !catalog.data || !sales.data) {
    return <ErrorState message={error ?? 'Dados indisponíveis.'} onRetry={reloadAll} />;
  }

  const { channels } = catalog.data;
  const { current, previous } = splitByWindow(sales.data, days, Date.now());
  const now = sumSales(current);
  const before = sumSales(previous);
  const caption = `vs. ${days} dias anteriores`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Quanto você realmente lucra"
        subtitle={`Resumo dos últimos ${days} dias, já descontando comissões, taxas, impostos, frete e custo.`}
        actions={<SegmentedControl ariaLabel="Período do resumo" options={WINDOW_OPTIONS} value={String(days)} onChange={(value) => setDays(Number(value) as WindowDays)} />}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Margem média">
          <p className="text-3xl font-semibold tracking-tight text-teal-600 md:text-4xl">{formatPct(now.marginPct)}</p>
          <DeltaBadge
            value={now.marginPct - before.marginPct}
            text={formatSignedPoints(now.marginPct - before.marginPct)}
            caption={caption}
          />
        </KpiCard>
        <KpiCard label="Lucro real">
          <p className="text-3xl font-semibold tracking-tight text-indigo-600 md:text-4xl">{formatBRL(now.profit)}</p>
          <DeltaBadge
            value={percentChange(now.profit, before.profit)}
            text={formatSignedBRL(now.profit - before.profit)}
            caption={caption}
          />
        </KpiCard>
        <KpiCard label="Faturamento">
          <p className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{formatBRL(now.revenue)}</p>
          <DeltaBadge
            value={percentChange(now.revenue, before.revenue)}
            text={formatSignedPct(percentChange(now.revenue, before.revenue) ?? 0)}
            caption={caption}
          />
        </KpiCard>
        <KpiCard label="Unidades vendidas">
          <p className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{formatInt(now.units)}</p>
          <DeltaBadge
            value={percentChange(now.units, before.units)}
            text={formatSignedPct(percentChange(now.units, before.units) ?? 0)}
            caption={caption}
          />
        </KpiCard>
      </section>

      <ChannelBreakdown channels={channels} sales={current} total={now} />
    </div>
  );
}

function KpiCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3 p-6 transition-transform duration-300 hover:-translate-y-0.5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {children}
    </Card>
  );
}

function ChannelBreakdown({ channels, sales, total }: { channels: Channel[]; sales: Sale[]; total: Totals }) {
  const rows = channels.map((channel) => ({
    channel,
    totals: sumSales(sales.filter((sale) => sale.channel_id === channel.id)),
  }));
  const hasSales = total.units > 0;
  const chartValues = rows.map((row) => Math.max(row.totals.profit, 0));
  const chartTotal = chartValues.reduce((sum, value) => sum + value, 0);

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <Card className="flex flex-col gap-6 p-6 lg:col-span-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Distribuição de lucro por canal</h2>
          <p className="mt-1 text-sm text-slate-500">Quanto de cada canal sobra no seu bolso</p>
        </div>
        {hasSales && chartTotal > 0 ? (
          <>
            <div className="relative mx-auto h-56 w-full max-w-[14rem]">
              <DoughnutChart
                labels={rows.map((row) => row.channel.name)}
                values={chartValues}
                colors={rows.map((row) => row.channel.color)}
                format={formatBRL}
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-500">Lucro total</span>
                <span className="text-lg font-semibold text-slate-900">{formatBRL(total.profit)}</span>
              </div>
            </div>
            <ul className="flex flex-col gap-3">
              {rows.map(({ channel, totals }, index) => {
                const share = chartTotal > 0 ? (chartValues[index] / chartTotal) * 100 : 0;
                return (
                  <li key={channel.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2.5 text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                      {channel.name}
                    </span>
                    <span className="font-medium text-slate-900">
                      {formatPct(share)}
                      <span className="ml-2 text-xs font-normal text-slate-400">{formatBRL(totals.profit)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <EmptyState title="Sem vendas no período" text="Registre uma venda em Relatórios para ver a distribuição do lucro." />
        )}
      </Card>

      <Card className="flex flex-col gap-6 p-6 lg:col-span-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Canais de venda</h2>
          <p className="mt-1 text-sm text-slate-500">Faturamento, taxas e margem líquida de cada marketplace</p>
        </div>
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-2 pb-3 font-medium">Canal</th>
                <th className="px-2 pb-3 text-right font-medium">Faturamento</th>
                <th className="px-2 pb-3 text-right font-medium">Taxas e impostos</th>
                <th className="px-2 pb-3 text-right font-medium">Lucro real</th>
                <th className="px-2 pb-3 text-right font-medium">Margem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ channel, totals }) => (
                <tr key={channel.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
                  <td className="px-2 py-4 font-medium text-slate-900">
                    <span className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                      {channel.name}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-right tabular-nums text-slate-700">{formatBRL(totals.revenue)}</td>
                  <td className="px-2 py-4 text-right tabular-nums text-slate-700">{formatBRL(totals.fees)}</td>
                  <td className="px-2 py-4 text-right font-medium tabular-nums text-indigo-700">{formatBRL(totals.profit)}</td>
                  <td className="px-2 py-4 text-right tabular-nums">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${totals.marginPct >= 15 ? 'bg-emerald-50 text-emerald-700' : totals.marginPct > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                      {formatPct(totals.marginPct)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
