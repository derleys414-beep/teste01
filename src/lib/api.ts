import { request } from '@/lib/http';
import type { Catalog, Sale } from '@/types';

export function fetchCatalog(): Promise<Catalog> {
  return request<Catalog>('GET', 'catalog');
}

export function fetchSales(): Promise<Sale[]> {
  return request<Sale[]>('GET', 'sales');
}

export async function updateChannelRates(
  channelId: string,
  rates: { commission_pct: number; fixed_fee: number; tax_pct: number },
): Promise<void> {
  await request('PATCH', `channels/${channelId}`, rates);
}

export type ChannelInput = {
  name: string;
  color: string;
  commission_pct: number;
  fixed_fee: number;
  tax_pct: number;
};

export async function createChannel(input: ChannelInput): Promise<void> {
  await request('POST', 'channels', input);
}

export async function deleteChannel(channelId: string): Promise<void> {
  await request('DELETE', `channels/${channelId}`);
}

export type ProductInput = {
  id?: string;
  sku: string;
  name: string;
  cost: number;
  prices: { channelId: string; price: number; shipping: number }[];
};

export async function saveProduct(input: ProductInput): Promise<void> {
  await request('PUT', 'products', input);
}

export async function deleteSale(saleId: string): Promise<void> {
  await request('DELETE', `sales/${saleId}`);
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
  await request('POST', 'sales', {
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
  });
}
