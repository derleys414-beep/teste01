import { useState } from 'react';
import { Calculator, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Field, inputClass } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, LoadingState } from '@/components/ui/StateMessage';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchCatalog } from '@/lib/api';
import { breakEvenPrice, unitBreakdown } from '@/lib/finance';
import { formatBRL, formatPct, parseDecimal } from '@/lib/format';
import type { Catalog } from '@/types';

export function CalculatorPage() {
  const catalog = useAsyncData(fetchCatalog);

  if (catalog.loading) return <LoadingState />;
  if (catalog.error || !catalog.data) {
    return <ErrorState message={catalog.error ?? 'Canais indisponiveis.'} onRetry={catalog.reload} />;
  }
  if (catalog.data.channels.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Calculadora de lucro" subtitle="Descubra o lucro real de um produto antes de anunciar." />
        <ErrorState message="Cadastre ao menos um canal de venda para usar a calculadora." onRetry={catalog.reload} />
      </div>
    );
  }

  return <ProfitCalculator catalog={catalog.data} />;
}

function ProfitCalculator({ catalog }: { catalog: Catalog }) {
  const [channelId, setChannelId] = useState(catalog.channels[0].id);
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [shipping, setShipping] = useState('');

  const channel = catalog.channels.find((c) => c.id === channelId) ?? catalog.channels[0];
  const input = {
    price: parseDecimal(price),
    cost: parseDecimal(cost),
    shipping: parseDecimal(shipping),
    commissionPct: channel.commission_pct,
    fixedFee: channel.fixed_fee,
    taxPct: channel.tax_pct,
  };
  const result = unitBreakdown(input);
  const breakEven = breakEvenPrice(input);
  const isLoss = result.profit < 0;
  const hasInput = price !== '' || cost !== '';

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Calculadora de lucro"
        subtitle="Informe custo, preco e frete para ver quanto sobra depois de cada taxa."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Inputs */}
        <Card className="flex flex-col gap-5 p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Calculator className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Dados da venda</h2>
          </div>
          <Field label="Canal de venda">
            <select className={inputClass} value={channel.id} onChange={(e) => setChannelId(e.target.value)}>
              {catalog.channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preco de venda (R$)">
            <input type="number" min="0" step="0.01" inputMode="decimal" className={inputClass} value={price} placeholder="0,00" onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Custo do produto (R$)">
            <input type="number" min="0" step="0.01" inputMode="decimal" className={inputClass} value={cost} placeholder="0,00" onChange={(e) => setCost(e.target.value)} />
          </Field>
          <Field label="Frete pago pelo vendedor (R$)">
            <input type="number" min="0" step="0.01" inputMode="decimal" className={inputClass} value={shipping} placeholder="0,00" onChange={(e) => setShipping(e.target.value)} />
          </Field>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
            Comissao de <span className="font-medium text-slate-700">{formatPct(channel.commission_pct)}</span>, taxa fixa de{' '}
            <span className="font-medium text-slate-700">{formatBRL(channel.fixed_fee)}</span> e imposto de{' '}
            <span className="font-medium text-slate-700">{formatPct(channel.tax_pct)}</span> aplicados automaticamente.
          </div>
        </Card>

        {/* Results */}
        <Card className="flex flex-col gap-6 p-6 lg:col-span-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Lucro real por venda</p>
              <p className={`animate-count-up mt-1 text-4xl font-bold tracking-tight md:text-5xl ${isLoss ? 'text-rose-600' : 'text-brand-600'}`}>
                {formatBRL(result.profit)}
              </p>
            </div>
            {hasInput && (
              <span
                className={`inline-flex self-start items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                  result.marginPct >= 15 ? 'bg-emerald-50 text-emerald-700' : result.marginPct > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {result.marginPct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                Margem {formatPct(result.marginPct)}
              </span>
            )}
          </div>

          {hasInput && (
            <ul className="animate-fade-in divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
              <BreakdownRow label="Preco de venda" value={result.price} tone="total" />
              <BreakdownRow label={`Comissao do ${channel.name}`} value={-result.commission} hint={formatPct(channel.commission_pct)} />
              <BreakdownRow label="Taxa fixa por venda" value={-result.fixedFee} />
              <BreakdownRow label="Imposto sobre vendas" value={-result.tax} hint={formatPct(channel.tax_pct)} />
              <BreakdownRow label="Frete" value={-result.shipping} />
              <BreakdownRow label="Custo do produto" value={-result.cost} />
              <BreakdownRow label="Lucro real" value={result.profit} tone="result" />
            </ul>
          )}

          {hasInput && (
            <div className="animate-fade-in rounded-xl border border-brand-100 bg-brand-50/40 p-5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-700">Preco minimo para nao ter prejuizo</p>
              </div>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                {breakEven === null ? 'Impossivel neste canal' : formatBRL(breakEven)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Abaixo desse valor, cada venda reduz o seu caixa. Comissao, imposto e custos sao considerados.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: 'default' | 'total' | 'result';
}) {
  const valueClass =
    tone === 'result'
      ? value < 0
        ? 'text-rose-600'
        : 'text-brand-700'
      : tone === 'total'
        ? 'text-slate-900'
        : 'text-slate-600';
  return (
    <li className={`flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-slate-50/50 ${tone === 'result' ? 'bg-brand-50/40 font-semibold' : ''}`}>
      <span className="flex items-center gap-2 text-slate-500">
        {label}
        {hint && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{hint}</span>}
      </span>
      <span className={`tabular-nums ${valueClass} ${tone === 'default' ? 'font-medium' : tone === 'result' ? 'font-bold' : 'font-semibold'}`}>
        {value < 0 ? `- ${formatBRL(Math.abs(value))}` : formatBRL(value)}
      </span>
    </li>
  );
}
