import { useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, Layers, Percent, TrendingUp } from 'lucide-react';
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
    return <ErrorState message={error ?? 'Dados indisponiveis.'} onRetry={reloadAll} />;
  }

  const { channels } = catalog.data;
  const { current, previous } = splitByWindow(sales.data, days, Date.now());
  const now = sumSales(current);
  const before = sumSales(previous);
  const caption = `vs. ${days} dias anteriores`;
  const hasSales = now.units > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Quanto voce realmente lucra"
        subtitle={`Resumo dos ultimos ${days} dias, ja descontando comissoes, taxas, impostos, frete e custo.`}
        actions={<SegmentedControl ariaLabel="Periodo do resumo" options={WINDOW_OPTIONS} value={String(days)} onChange={(value) => setDays(Number(value) as WindowDays)} />}
      />

      {/* Hero KPI - Lucro real com maior destaque */}
      <Card className="animate-fade-in relative overflow-hidden p-6 md:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-50/60 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
                <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <p className="text-sm font-medium text-slate-500">Lucro real</p>
            </div>
            <p className={`animate-count-up text-4xl font-bold tracking-tight md:text-5xl ${now.profit < 0 ? 'text-rose-600' : 'text-brand-600'}`}>
              {formatBRL(now.profit)}
            </p>
            <DeltaBadge
              value={percentChange(now.profit, before.profit)}
              text={formatSignedBRL(now.profit - before.profit)}
              caption={caption}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <MiniStat
              icon={Percent}
              label="Margem"
              value={formatPct(now.marginPct)}
              tone="teal"
            />
            <MiniStat
              icon={DollarSign}
              label="Faturamento"
              value={formatBRL(now.revenue)}
            />
            <MiniStat
              icon={Layers}
              label="Unidades"
              value={formatInt(now.units)}
            />
          </div>
        </div>
      </Card>

      {/* Secondary KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Margem media" icon={Percent}>
          <p className="animate-count-up text-2xl font-semibold tracking-tight text-teal-600 md:text-3xl">{formatPct(now.marginPct)}</p>
          <DeltaBadge
            value={now.marginPct - before.marginPct}
            text={formatSignedPoints(now.marginPct - before.marginPct)}
            caption={caption}
          />
        </KpiCard>
        <KpiCard label="Faturamento" icon={DollarSign}>
          <p className="animate-count-up text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{formatBRL(now.revenue)}</p>
          <DeltaBadge
            value={percentChange(now.revenue, before.revenue)}
            text={formatSignedPct(percentChange(now.revenue, before.revenue) ?? 0)}
            caption={caption}
          />
        </KpiCard>
        <KpiCard label="Unidades vendidas" icon={Layers}>
          <p className="animate-count-up text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{formatInt(now.units)}</p>
          <DeltaBadge
            value={percentChange(now.units, before.units)}
            text={formatSignedPct(percentChange(now.units, before.units) ?? 0)}
            caption={caption}
          />
        </KpiCard>
      </section>

      {!hasSales ? (
        <Card className="p-6">
          <EmptyState
            title="Sem vendas no periodo"
            text="Registre uma venda em Relatorios para ver a distribuicao do lucro e a evolucao dos seus resultados."
            icon={
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-400">
                <TrendingUp className="h-7 w-7" />
              </span>
            }
          />
        </Card>
      ) : (
        <ChannelBreakdown channels={channels} sales={current} total={now} />
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tone }: { icon: typeof TrendingUp; label: string; value: string; tone?: 'teal' }) {
  const iconColor = tone === 'teal' ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500';
  return (
    <div className="flex flex-col gap-1.5">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconColor}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">{value}</p>
    </div>
  );
}

function KpiCard({ label, icon: Icon, children }: { label: string; icon: typeof TrendingUp; children: ReactNode }) {
  return (
    <Card className="group flex flex-col gap-3 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      {children}
    </Card>
  );
}

function ChannelBreakdown({ channels, sales, total }: { channels: Channel[]; sales: Sale[]; total: Totals }) {
  const rows = channels.map((channel) => ({
    channel,
    totals: sumSales(sales.filter((sale) => sale.channel_id === channel.id)),
  }));
  const chartValues = rows.map((row) => Math.max(row.totals.profit, 0));
  const chartTotal = chartValues.reduce((sum, value) => sum + value, 0);

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <Card className="flex flex-col gap-6 p-6 lg:col-span-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Distribuicao de lucro por canal</h2>
          <p className="mt-1 text-sm text-slate-500">Quanto de cada canal sobra no seu bolso</p>
        </div>
        {chartTotal > 0 ? (
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
          <EmptyState title="Sem lucro no periodo" text="Nenhum canal teve lucro positivo neste periodo." />
        )}
      </Card>

      <Card className="flex flex-col gap-6 p-6 lg:col-span-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Canais de venda</h2>
          <p className="mt-1 text-sm text-slate-500">Faturamento, taxas e margem liquida de cada marketplace</p>
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
                  <td className={`px-2 py-4 text-right font-medium tabular-nums ${totals.profit < 0 ? 'text-rose-600' : 'text-brand-700'}`}>
                    {formatBRL(totals.profit)}
                  </td>
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
