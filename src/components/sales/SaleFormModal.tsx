import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { insertSale } from '@/lib/api';
import { unitBreakdown } from '@/lib/finance';
import { errorMessage } from '@/lib/errors';
import { formatBRL, formatPct, parseDecimal } from '@/lib/format';
import type { Catalog } from '@/types';

export function SaleFormModal({
  catalog,
  onClose,
  onSaved,
}: {
  catalog: Catalog;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [productId, setProductId] = useState(catalog.products[0]?.id ?? '');
  const [channelId, setChannelId] = useState(catalog.channels[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState(() => priceFor(catalog, catalog.products[0]?.id, catalog.channels[0]?.id));
  const [soldOn, setSoldOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const product = catalog.products.find((p) => p.id === productId);
  const channel = catalog.channels.find((c) => c.id === channelId);
  const listing = catalog.prices.find((p) => p.product_id === productId && p.channel_id === channelId);

  const selectProduct = (nextProductId: string) => {
    setProductId(nextProductId);
    setUnitPrice(priceFor(catalog, nextProductId, channelId));
  };

  const selectChannel = (nextChannelId: string) => {
    setChannelId(nextChannelId);
    setUnitPrice(priceFor(catalog, productId, nextChannelId));
  };

  const qty = Math.floor(parseDecimal(quantity));
  const preview =
    product && channel
      ? unitBreakdown({
          price: parseDecimal(unitPrice),
          cost: product.cost,
          shipping: listing?.shipping ?? 0,
          commissionPct: channel.commission_pct,
          fixedFee: channel.fixed_fee,
          taxPct: channel.tax_pct,
        })
      : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!product || !channel) {
      setError('Selecione o produto e o canal da venda.');
      return;
    }
    if (qty < 1) {
      setError('A quantidade precisa ser de pelo menos 1 unidade.');
      return;
    }
    const price = parseDecimal(unitPrice);
    if (price <= 0) {
      setError('Informe o preço de venda da unidade.');
      return;
    }

    setSaving(true);
    try {
      await insertSale({
        productId: product.id,
        channelId: channel.id,
        quantity: qty,
        unitPrice: price,
        unitCost: product.cost,
        unitShipping: listing?.shipping ?? 0,
        commissionPct: channel.commission_pct,
        fixedFee: channel.fixed_fee,
        taxPct: channel.tax_pct,
        soldAt: new Date(`${soldOn}T12:00:00`).toISOString(),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Registrar venda"
      description="O lucro real é calculado com as taxas do canal no dia da venda."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="sale-form" disabled={saving}>
            {saving ? 'Salvando...' : 'Registrar venda'}
          </Button>
        </>
      }
    >
      <form id="sale-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Produto">
            <select className={inputClass} value={productId} onChange={(e) => selectProduct(e.target.value)}>
              {catalog.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Canal">
            <select className={inputClass} value={channelId} onChange={(e) => selectChannel(e.target.value)}>
              {catalog.channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantidade">
            <input type="number" min="1" step="1" inputMode="numeric" className={inputClass} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
          <Field label="Preço unitário (R$)">
            <input type="number" min="0" step="0.01" inputMode="decimal" className={inputClass} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </Field>
          <Field label="Data da venda">
            <input type="date" className={inputClass} value={soldOn} onChange={(e) => setSoldOn(e.target.value)} />
          </Field>
        </div>

        {preview && (
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lucro real da venda</p>
              <p className={`mt-1 text-xl font-semibold tabular-nums ${preview.profit < 0 ? 'text-rose-600' : 'text-indigo-700'}`}>
                {formatBRL(preview.profit * Math.max(qty, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Margem</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{formatPct(preview.marginPct)}</p>
            </div>
          </div>
        )}

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      </form>
    </Modal>
  );
}

function priceFor(catalog: Catalog, productId: string | undefined, channelId: string | undefined): string {
  const listing = catalog.prices.find((p) => p.product_id === productId && p.channel_id === channelId);
  return listing && listing.price > 0 ? String(listing.price) : '';
}
