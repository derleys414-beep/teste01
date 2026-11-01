export type Channel = {
  id: string;
  name: string;
  color: string;
  commission_pct: number;
  fixed_fee: number;
  tax_pct: number;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  cost: number;
};

export type ProductPrice = {
  product_id: string;
  channel_id: string;
  price: number;
  shipping: number;
};

export type Sale = {
  id: string;
  product_id: string;
  channel_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  unit_shipping: number;
  commission_pct: number;
  fixed_fee: number;
  tax_pct: number;
  sold_at: string;
};

export type AccountStatus = 'pendente' | 'ativo' | 'bloqueado';

export type AccountRow = {
  user_id: string;
  email: string;
  status: AccountStatus;
  created_at: string;
  activated_at: string | null;
  months_active: number | null;
};

export type Catalog = {
  channels: Channel[];
  products: Product[];
  prices: ProductPrice[];
};
