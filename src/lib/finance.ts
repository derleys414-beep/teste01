import type { Channel, Sale } from '@/types';

export type UnitInput = {
  price: number;
  cost: number;
  shipping: number;
  commissionPct: number;
  fixedFee: number;
  taxPct: number;
};

export type UnitBreakdown = {
  price: number;
  cost: number;
  shipping: number;
  commission: number;
  fixedFee: number;
  tax: number;
  profit: number;
  marginPct: number;
};

export type Totals = {
  units: number;
  revenue: number;
  fees: number;
  shipping: number;
  cost: number;
  profit: number;
  marginPct: number;
};

// Lucro real = preço - comissão - taxa fixa - imposto - frete - custo do produto
export function unitBreakdown(input: UnitInput): UnitBreakdown {
  const commission = (input.price * input.commissionPct) / 100;
  const tax = (input.price * input.taxPct) / 100;
  const profit =
    input.price - commission - input.fixedFee - tax - input.shipping - input.cost;

  return {
    price: input.price,
    cost: input.cost,
    shipping: input.shipping,
    commission,
    fixedFee: input.fixedFee,
    tax,
    profit,
    marginPct: input.price > 0 ? (profit / input.price) * 100 : 0,
  };
}

// Preço mínimo para cobrir todos os custos (lucro zero). Null quando as taxas percentuais consomem todo o preço.
export function breakEvenPrice(input: Omit<UnitInput, 'price'>): number | null {
  const variableRate = (input.commissionPct + input.taxPct) / 100;
  if (variableRate >= 1) return null;
  return (input.cost + input.shipping + input.fixedFee) / (1 - variableRate);
}

export function listingBreakdown(
  channel: Channel,
  cost: number,
  listing: { price: number; shipping: number },
): UnitBreakdown | null {
  if (listing.price <= 0) return null;
  return unitBreakdown({
    price: listing.price,
    cost,
    shipping: listing.shipping,
    commissionPct: channel.commission_pct,
    fixedFee: channel.fixed_fee,
    taxPct: channel.tax_pct,
  });
}

export function sumSales(sales: Sale[]): Totals {
  const totals = sales.reduce<Totals>(
    (acc, sale) => {
      const unit = unitBreakdown({
        price: sale.unit_price,
        cost: sale.unit_cost,
        shipping: sale.unit_shipping,
        commissionPct: sale.commission_pct,
        fixedFee: sale.fixed_fee,
        taxPct: sale.tax_pct,
      });
      const qty = sale.quantity;
      acc.units += qty;
      acc.revenue += unit.price * qty;
      acc.fees += (unit.commission + unit.fixedFee + unit.tax) * qty;
      acc.shipping += unit.shipping * qty;
      acc.cost += unit.cost * qty;
      acc.profit += unit.profit * qty;
      return acc;
    },
    { units: 0, revenue: 0, fees: 0, shipping: 0, cost: 0, profit: 0, marginPct: 0 },
  );

  return {
    ...totals,
    marginPct: totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0,
  };
}
