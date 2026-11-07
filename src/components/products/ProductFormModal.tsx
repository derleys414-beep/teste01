import { useState, type FormEvent } from 'react';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { saveProduct } from '@/lib/api';
import { listingBreakdown } from '@/lib/finance';
import { errorMessage } from '@/lib/errors';
import { formatBRL, formatPct, parseDecimal } from '@/lib/format';
import type { Catalog, Product } from '@/types';

type ListingDraft = { price: string; shipping: string };

export function ProductFormModal({
  catalog,
  product,
  onClose,
  onSaved,
}: {
  catalog: Catalog;
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [sku, setSku] = useState(product?.sku ?? '');
  const [name, setName] = useState(product?.name ?? '');
  const [cost, setCost] = useState(product ? String(product.cost) : '');
  const [listings, setListings] = useState<Record<string, ListingDraft>>(() =>
    Object.fromEntries(
      catalog.channels.map((channel) => {
        const existing = catalog.prices.find((p) => p.product_id === product?.id && p.channel_id === channel.id);
        return [
          channel.id,
          { price: existing ? String(existing.price) : '', shipping: existing ? String(existing.shipping) : '' },
        ];
      }),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateListing = (channelId: string, field: keyof ListingDraft, value: string) => {
    setListings((current) => ({ ...current, [channelId]: { ...current[channelId], [field]: value } }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!sku.trim() || !name.trim()) {
      setError('Informe o SKU e o nome do produto.');
      return;
    }

    setSaving(true);
    try {
      await saveProduct({
        id: product?.id,
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        cost: parseDecimal(cost),
        prices: catalog.channels.map((channel) => ({
          channelId: channel.id,
          price: parseDecimal(listings[channel.id]?.price ?? ''),
          shipping: parseDecimal(listings[channel.id]?.shipping ?? ''),
        })),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const costValue = parseDecimal(cost);

  return (
    <Modal
      title={product ? 'Editar produto' : 'Novo produto'}
      description="Custo e preço de venda em cada canal. O lucro é calculado automaticamente."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar produto'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="SKU">
            <input className={inputClass} value={sku} maxLength={40} placeholder="CAB-USBC-1M" onChange={(e) => setSku(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Nome do produto">
              <input className={inputClass} value={name} maxLength={120} placeholder="Cabo USB-C trançado 1m" onChange={(e) => setName(e.target.value)} />
            </Field>
          </div>
          <Field label="Custo do produto (R$)" hint="Quanto você paga por unidade">
            <input type="number" min="0" step="0.01" inputMode="decimal" className={inputClass} value={cost} placeholder="0,00" onChange={(e) => setCost(e.target.value)} />
          </Field>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Preço e frete por canal</h3>
          {catalog.channels.map((channel) => {
            const draft = listings[channel.id] ?? { price: '', shipping: '' };
            const result = listingBreakdown(
              channel,
              costValue,
              { price: parseDecimal(draft.price), shipping: parseDecimal(draft.shipping) },
            );
            return (
              <div key={channel.id} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="grid grid-cols-2 gap-3">
                  <Field label={`Preço · ${channel.name}`}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className={inputClass}
                      value={draft.price}
                      placeholder="0,00"
                      onChange={(e) => updateListing(channel.id, 'price', e.target.value)}
                    />
                  </Field>
                  <Field label="Frete (R$)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className={inputClass}
                      value={draft.shipping}
                      placeholder="0,00"
                      onChange={(e) => updateListing(channel.id, 'shipping', e.target.value)}
                    />
                  </Field>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm sm:min-w-[11rem] sm:flex-col sm:items-end sm:gap-0.5">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: channel.color }} />
                    Lucro real
                  </span>
                  {result ? (
                    <span className={`font-semibold tabular-nums ${result.profit < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatBRL(result.profit)} · {formatPct(result.marginPct)}
                    </span>
                  ) : (
                    <span className="text-slate-400">Informe o preço</span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      </form>
    </Modal>
  );
}
