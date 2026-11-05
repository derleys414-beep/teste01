import { useState } from 'react';
import { Package, Plus, Pencil } from 'lucide-react';
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
    return <ErrorState message={catalog.error ?? 'Produtos indisponiveis.'} onRetry={catalog.reload} />;
  }

  const data = catalog.data;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Produtos"
        subtitle="Cadastre cada SKU com custo e preco por canal. Veja o lucro real que sobra em cada marketplace."
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
            text="Comece pelo produto que voce mais vende. Leva menos de um minuto."
            icon={
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-400">
                <Package className="h-7 w-7" />
              </span>
            }
            action={<Button onClick={() => setEditing('new')}>Cadastrar produto</Button>}
          />
        </Card>
      ) : (
        <ProductGrid catalog={data} onEdit={setEditing} />
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

function ProductGrid({ catalog, onEdit }: { catalog: Catalog; onEdit: (product: Product) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {catalog.products.map((product) => {
        const channelResults = catalog.channels.map((channel) => {
          const listing = catalog.prices.find((p) => p.product_id === product.id && p.channel_id === channel.id);
          const result = listing ? listingBreakdown(channel, product.cost, listing) : null;
          return { channel, result };
        });
        const priced = channelResults.filter((c) => c.result !== null);
        const bestProfit = priced.length > 0 ? Math.max(...priced.map((c) => c.result!.profit)) : null;

        return (
          <Card
            key={product.id}
            className="group flex cursor-pointer flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div onClick={() => onEdit(product)} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                    <Package className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-400">{product.sku}</p>
                  </div>
                </div>
                <span className="rounded-lg p-1.5 text-slate-300 transition-colors group-hover:text-brand-500">
                  <Pencil className="h-4 w-4" />
                </span>
              </div>

              <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs text-slate-400">Custo</p>
                  <p className="text-sm font-semibold text-slate-900">{formatBRL(product.cost)}</p>
                </div>
                {bestProfit !== null && (
                  <div className="border-l border-slate-200 pl-4">
                    <p className="text-xs text-slate-400">Melhor lucro</p>
                    <p className={`text-sm font-semibold ${bestProfit < 0 ? 'text-rose-600' : 'text-brand-600'}`}>{formatBRL(bestProfit)}</p>
                  </div>
                )}
              </div>
            </div>

            {priced.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                {channelResults.map(({ channel, result }) => (
                  <div key={channel.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 text-slate-500">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: channel.color }} />
                      {channel.name}
                    </span>
                    {result ? (
                      <span className={`font-medium tabular-nums ${result.profit < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {formatBRL(result.profit)} <span className="text-slate-400">({formatPct(result.marginPct)})</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">Sem preco</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
