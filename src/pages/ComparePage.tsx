import { useState } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { Card } from '@/components/ui/Card';
import { Field, inputClass } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateMessage';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchCatalog } from '@/lib/api';
import { listingBreakdown, type UnitBreakdown } from '@/lib/finance';
import { formatBRL, formatPct } from '@/lib/format';
import type { Catalog, Channel } from '@/types';

export function ComparePage() {
  const catalog = useAsyncData(fetchCatalog);

  if (catalog.loading) return <LoadingState />;
  if (catalog.error || !catalog.data) {
    return <ErrorState message={catalog.error ?? 'Dados indisponíveis.'} onRetry={catalog.reload} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Comparativo de canais"
        subtitle="Veja o mesmo produto lado a lado em cada marketplace e descubra onde ele rende mais."
      />
      {catalog.data.products.length === 0 ? (
        <EmptyState title="Nenhum produto cadastrado" text="Cadastre um produto com preços por canal para comparar." />
      ) : (
        <ProductComparison catalog={catalog.data} />
      )}
    </div>
  );
}

function ProductComparison({ catalog }: { catalog: Catalog }) {
  const [productId, setProductId] = useState(catalog.products[0].id);
  const product = catalog.products.find((p) => p.id === productId) ?? catalog.products[0];

  const comparisons = catalog.channels.map((channel) => {
    const listing = catalog.prices.find((p) => p.product_id === product.id && p.channel_id === channel.id);
    const result = listing ? listingBreakdown(channel, product.cost, listing) : null;
    return { channel, result };
  });

  const priced = comparisons.filter(
    (c): c is { channel: Channel; result: UnitBreakdown } => c.result !== null,
  );
  const best = priced.reduce<(typeof priced)[number] | null>(
    (top, current) => (!top || current.result.profit > top.result.profit ? current : top),
    null,
  );

  return (
    <>
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Field label="Produto">
            <select className={inputClass} value={product.id} onChange={(e) => setProductId(e.target.value)}>
              {catalog.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="text-sm text-slate-500">
          Custo do produto: <span className="font-medium text-slate-900">{formatBRL(product.cost)}</span>
        </p>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {comparisons.map(({ channel, result }) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            result={result}
            isBest={!!best && best.channel.id === channel.id && priced.length > 1}
          />
        ))}
      </section>

      {priced.length > 0 && (
        <Card className="flex flex-col gap-6 p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Lucro real por unidade em cada canal</h2>
            <p className="mt-1 text-sm text-slate-500">Depois de comissão, taxas, imposto, frete e custo</p>
          </div>
          <div className="h-64">
            <BarChart
              labels={priced.map((c) => c.channel.name)}
              values={priced.map((c) => c.result.profit)}
              colors={priced.map((c) => c.channel.color)}
              format={formatBRL}
            />
          </div>
        </Card>
      )}
    </>
  );
}

function ChannelCard({ channel, result, isBest }: { channel: Channel; result: UnitBreakdown | null; isBest: boolean }) {
  return (
    <Card className={`flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${isBest ? 'ring-2 ring-brand-500/70' : ''}`}>
      <div className="h-1.5" style={{ backgroundColor: channel.color }} />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">{channel.name}</h3>
          {isBest && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">Maior lucro</span>}
        </div>

        {result ? (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lucro real</p>
              <p className={`mt-1 text-2xl font-semibold tracking-tight ${result.profit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatBRL(result.profit)}
              </p>
              <p className="mt-1 text-sm text-slate-500">Margem {formatPct(result.marginPct)}</p>
            </div>
            <dl className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 text-sm">
              <Line label="Preço de venda" value={formatBRL(result.price)} />
              <Line label="Comissão" value={`- ${formatBRL(result.commission)}`} />
              <Line label="Taxa fixa" value={`- ${formatBRL(result.fixedFee)}`} />
              <Line label="Imposto" value={`- ${formatBRL(result.tax)}`} />
              <Line label="Frete" value={`- ${formatBRL(result.shipping)}`} />
            </dl>
          </>
        ) : (
          <div className="flex flex-1 items-center rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Sem preço cadastrado para este canal.
          </div>
        )}
      </div>
    </Card>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="tabular-nums text-slate-800">{value}</dd>
    </div>
  );
}
