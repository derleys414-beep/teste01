import { supabase } from '@/lib/supabase';
import type { Catalog, Channel, Product, ProductPrice, Sale } from '@/types';

export async function fetchCatalog(): Promise<Catalog> {
  const [channels, products, prices] = await Promise.all([
    supabase.from('channels').select('*').order('name').returns<Channel[]>(),
    supabase.from('products').select('*').order('name').returns<Product[]>(),
    supabase.from('product_prices').select('*').returns<ProductPrice[]>(),
  ]);

  if (channels.error) throw channels.error;
  if (products.error) throw products.error;
  if (prices.error) throw prices.error;

  return {
    channels: channels.data ?? [],
    products: products.data ?? [],
    prices: prices.data ?? [],
  };
}

export async function fetchSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('sold_at', { ascending: false })
    .returns<Sale[]>();
  if (error) throw error;
  return data ?? [];
}

export async function updateChannelRates(
  channelId: string,
  rates: { commission_pct: number; fixed_fee: number; tax_pct: number },
): Promise<void> {
  const { error } = await supabase.from('channels').update(rates).eq('id', channelId);
  if (error) throw error;
}

export type ChannelInput = {
  name: string;
  color: string;
  commission_pct: number;
  fixed_fee: number;
  tax_pct: number;
};

export async function createChannel(input: ChannelInput): Promise<void> {
  const { error } = await supabase.from('channels').insert(input);
  if (error) throw error;
}

export async function deleteChannel(channelId: string): Promise<void> {
  const { data, error } = await supabase.from('channels').delete().eq('id', channelId).select('id');
  if (error) {
    if (error.code === '23503') throw new Error('Este canal tem vendas registradas e não pode ser excluído.');
    throw error;
  }
  if (!data || data.length === 0) throw new Error('Canal não encontrado. Atualize a página e tente novamente.');
}

export type ProductInput = {
  id?: string;
  sku: string;
  name: string;
  cost: number;
  prices: { channelId: string; price: number; shipping: number }[];
};

export async function saveProduct(input: ProductInput): Promise<void> {
  const row = { sku: input.sku, name: input.name, cost: input.cost };

  let productId = input.id;
  if (productId) {
    const { error } = await supabase.from('products').update(row).eq('id', productId);
    if (error) throw toProductError(error);
  } else {
    const { data, error } = await supabase.from('products').insert(row).select('id').single<{ id: string }>();
    if (error) throw toProductError(error);
    productId = data.id;
  }

  const { error } = await supabase.from('product_prices').upsert(
    input.prices.map((p) => ({
      product_id: productId,
      channel_id: p.channelId,
      price: p.price,
      shipping: p.shipping,
    })),
    { onConflict: 'product_id,channel_id' },
  );
  if (error) throw error;
}

function toProductError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new Error('Já existe um produto com este SKU.');
  return new Error(error.message);
}

export async function deleteSale(saleId: string): Promise<void> {
  const { data, error } = await supabase.from('sales').delete().eq('id', saleId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Venda não encontrada. Atualize a página e tente novamente.');
}

export type SaleInput = {
  productId: string;
  channelId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  unitShipping: number;
  commissionPct: number;
  fixedFee: number;
  taxPct: number;
  soldAt: string;
};

export async function insertSale(input: SaleInput): Promise<void> {
  const { data, error } = await supabase
    .from('sales')
    .insert({
      product_id: input.productId,
      channel_id: input.channelId,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      unit_cost: input.unitCost,
      unit_shipping: input.unitShipping,
      commission_pct: input.commissionPct,
      fixed_fee: input.fixedFee,
      tax_pct: input.taxPct,
      sold_at: input.soldAt,
    })
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Não foi possível registrar a venda. Verifique se sua conta está ativa e se o produto e o canal pertencem a você.');
}
