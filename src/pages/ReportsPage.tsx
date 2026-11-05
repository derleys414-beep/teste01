import { useMemo, useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { inputClass } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateMessage';
import { DeleteSaleModal } from '@/components/sales/DeleteSaleModal';
import { SaleFormModal } from '@/components/sales/SaleFormModal';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchCatalog, fetchSales } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { sumSales } from '@/lib/finance';
import { formatBRL, formatDate, formatDecimal, formatInt, formatPct } from '@/lib/format';
import { filterByPeriod, REPORT_PERIOD_OPTIONS, type ReportPeriod } from '@/lib/periods';
import type { Catalog, Sale } from '@/types';

export function ReportsPage() {
  const catalog = useAsyncData(fetchCatalog);
  const sales = useAsyncData(fetchSales);
  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const [channelId, setChannelId] = useState('all');
  const [registering, setRegistering] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const reloadAll = () => {
    catalog.reload();
    sales.reload();
  };

  const filtered = useMemo(() => {
    if (!sales.data) return [];
    const byPeriod = filterByPeriod(sales.data, period, Date.now());
    return channelId === 'all' ? byPeriod : byPeriod.filter((sale) => sale.channel_id === channelId);
  }, [sales.data, period, channelId]);

  if (catalog.loading || sales.loading) return <LoadingState />;
  const error = catalog.error ?? sales.error;
  if (error || !catalog.data || !sales.data) {
    return <ErrorState message={error ?? 'Relatorio indisponivel.'} onRetry={reloadAll} />;
  }

  const data = catalog.data;
  const totals = sumSales(filtered);
  const canRegister = data.products.length > 0 && data.channels.length > 0;

  const exportCsv = () => {
    downloadCsv(`margemos-relatorio-${new Date().toISOString().slice(0, 10)}.csv`, buildCsvRows(filtered, data));
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Relatorios"
        subtitle="Lucro real de cada venda por periodo e canal, pronto para exportar."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0} icon={<Download className="h-4 w-4" />}>
              Exportar CSV
            </Button>
            <Button onClick={() => setRegistering(true)} disabled={!canRegister} icon={<Plus className="h-4 w-4" />}>
              Registrar venda
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl ariaLabel="Periodo do relatorio" options={REPORT_PERIOD_OPTIONS} value={period} onChange={setPeriod} />
        <select
          aria-label="Filtrar por canal"
          className={`${inputClass} lg:w-56`}
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
        >
          <option value="all">Todos os canais</option>
          {data.channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </select>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Faturamento" value={formatBRL(totals.revenue)} />
        <SummaryCard label="Lucro real" value={formatBRL(totals.profit)} accent="brand" />
        <SummaryCard label="Margem media" value={formatPct(totals.marginPct)} accent="teal" />
      </section>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhuma venda neste periodo"
            text="Ajuste o periodo ou o canal, ou registre uma nova venda."
          />
        ) : (
          <SalesTable sales={filtered} catalog={data} onDelete={setSaleToDelete} />
        )}
      </Card>

      {registering && (
        <SaleFormModal catalog={data} onClose={() => setRegistering(false)} onSaved={sales.reload} />
      )}

      {saleToDelete && (
        <DeleteSaleModal
          saleId={saleToDelete.id}
          productName={catalog.data.products.find((p) => p.id === saleToDelete.product_id)?.name ?? 'Produto removido'}
          channelName={catalog.data.channels.find((c) => c.id === saleToDelete.channel_id)?.name ?? 'Canal removido'}
          soldAt={saleToDelete.sold_at}
          onClose={() => setSaleToDelete(null)}
          onDeleted={sales.reload}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: 'brand' | 'teal' }) {
  const tone = accent === 'brand' ? 'text-brand-600' : accent === 'teal' ? 'text-teal-600' : 'text-slate-900';
  return (
    <Card className="p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${tone}`}>{value}</p>
    </Card>
  );
}

function SalesTable({
  sales,
  catalog,
  onDelete,
}: {
  sales: Sale[];
  catalog: Catalog;
  onDelete: (sale: Sale) => void;
}) {
  const productName = (id: string) => catalog.products.find((p) => p.id === id)?.name ?? 'Produto removido';
  const channelName = (id: string) => catalog.channels.find((c) => c.id === id)?.name ?? 'Canal removido';

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-6 py-4 font-medium">Data</th>
            <th className="px-4 py-4 font-medium">Produto</th>
            <th className="px-4 py-4 font-medium">Canal</th>
            <th className="px-4 py-4 text-right font-medium">Qtd</th>
            <th className="px-4 py-4 text-right font-medium">Faturamento</th>
            <th className="px-4 py-4 text-right font-medium">Lucro real</th>
            <th className="px-4 py-4 text-right font-medium">Margem</th>
            <th className="px-6 py-4 text-right font-medium">
              <span className="sr-only">Acoes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => {
            const totals = sumSales([sale]);
            return (
              <tr key={sale.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-6 py-4 text-slate-600">{formatDate(sale.sold_at)}</td>
                <td className="px-4 py-4 font-medium text-slate-900">{productName(sale.product_id)}</td>
                <td className="px-4 py-4 text-slate-600">{channelName(sale.channel_id)}</td>
                <td className="px-4 py-4 text-right tabular-nums text-slate-600">{formatInt(sale.quantity)}</td>
                <td className="px-4 py-4 text-right tabular-nums text-slate-700">{formatBRL(totals.revenue)}</td>
                <td className={`px-4 py-4 text-right font-semibold tabular-nums ${totals.profit < 0 ? 'text-rose-600' : 'text-brand-700'}`}>
                  {formatBRL(totals.profit)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${totals.marginPct >= 15 ? 'bg-emerald-50 text-emerald-700' : totals.marginPct > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                    {formatPct(totals.marginPct)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(sale)}
                    aria-label="Excluir venda"
                    title="Excluir venda"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function buildCsvRows(sales: Sale[], catalog: Catalog): string[][] {
  const header = [
    'Data',
    'Produto',
    'SKU',
    'Canal',
    'Quantidade',
    'Preco unitario',
    'Faturamento',
    'Comissao',
    'Taxa fixa',
    'Imposto',
    'Frete',
    'Custo',
    'Lucro real',
    'Margem (%)',
  ];

  const body = sales.map((sale) => {
    const product = catalog.products.find((p) => p.id === sale.product_id);
    const channel = catalog.channels.find((c) => c.id === sale.channel_id);
    const unit = {
      price: sale.unit_price,
      cost: sale.unit_cost,
      shipping: sale.unit_shipping,
      commissionPct: sale.commission_pct,
      fixedFee: sale.fixed_fee,
      taxPct: sale.tax_pct,
    };
    const commission = (unit.price * unit.commissionPct) / 100;
    const tax = (unit.price * unit.taxPct) / 100;
    const profit = unit.price - commission - unit.fixedFee - tax - unit.shipping - unit.cost;
    const marginPct = unit.price > 0 ? (profit / unit.price) * 100 : 0;
    const qty = sale.quantity;
    return [
      formatDate(sale.sold_at),
      product?.name ?? 'Produto removido',
      product?.sku ?? '',
      channel?.name ?? 'Canal removido',
      String(qty),
      formatDecimal(unit.price),
      formatDecimal(unit.price * qty),
      formatDecimal(commission * qty),
      formatDecimal(unit.fixedFee * qty),
      formatDecimal(tax * qty),
      formatDecimal(unit.shipping * qty),
      formatDecimal(unit.cost * qty),
      formatDecimal(profit * qty),
      formatDecimal(marginPct),
    ];
  });

  return [header, ...body];
}
