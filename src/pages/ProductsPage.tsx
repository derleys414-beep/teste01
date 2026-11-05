import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateMessage';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchCatalog } from '@/lib/api';
import { listingBreakdown } from '@/lib/finance';
import { formatBRL, formatPct } from '@/lib/format';
import type { Catalog, Product } from '@/types';

export function ProductsPage() {
  const catalog = useAsyncData(fetchCatalog);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  if (catalog.loading) return <LoadingState />;
  if (catalog.error || !catalog.data) {
    return <ErrorState message={catalog.error ?? 'Produtos indisponíveis.'} onRetry={catalog.reload} />;
  }

  const data = catalog.data;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Produtos"
        subtitle="Cadastre cada SKU com custo e preço por canal. Veja o lucro real que sobra em cada marketplace."
        actions={
          <Button onClick={() => setEditing('new')} icon={<Plus className="h-4 w-4" />}>
            Novo produto
          </Button>
        }
      />

      {data.products.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhum produto cadastrado"
            text="Comece pelo produto que você mais vende. Leva menos de um minuto."
            action={<Button onClick={() => setEditing('new')}>Cadastrar produto</Button>}
          />
        </Card>
      ) : (
        <ProductTable catalog={data} onEdit={setEditing} />
      )}

      {editing && (
        <ProductFormModal
          catalog={data}
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={catalog.reload}
        />
      )}
    </div>
  );
}

function ProductTable({ catalog, onEdit }: { catalog: Catalog; onEdit: (product: Product) => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-6 py-4 font-medium">Produto</th>
              <th className="px-4 py-4 text-right font-medium">Custo</th>
              {catalog.channels.map((channel) => (
                <th key={channel.id} className="px-4 py-4 text-right font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: channel.color }} />
                    {channel.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catalog.products.map((product) => (
              <tr
                key={product.id}
                onClick={() => onEdit(product)}
                className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{product.sku}</p>
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-slate-700">{formatBRL(product.cost)}</td>
                {catalog.channels.map((channel) => {
                  const listing = catalog.prices.find((p) => p.product_id === product.id && p.channel_id === channel.id);
                  const result = listing ? listingBreakdown(channel, product.cost, listing) : null;
                  return (
                    <td key={channel.id} className="px-4 py-4 text-right">
                      {result ? (
                        <>
                          <p className={`font-medium tabular-nums ${result.profit < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {formatBRL(result.profit)}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">{formatPct(result.marginPct)} de margem</p>
                        </>
                      ) : (
                        <span className="text-slate-400">Sem preço</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
