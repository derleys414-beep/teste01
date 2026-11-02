import { index, integer, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: 'number' });
const pct = (name: string) => numeric(name, { precision: 6, scale: 2, mode: 'number' });

// One row per Netlify Identity user. Status gates access to all business data.
export const profiles = pgTable('profiles', {
  userId: text('user_id').primaryKey(),
  email: text().notNull(),
  status: text().notNull().default('pendente'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const channels = pgTable(
  'channels',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
    name: text().notNull(),
    color: text().notNull().default('#4f46e5'),
    commissionPct: pct('commission_pct').notNull().default(0),
    fixedFee: money('fixed_fee').notNull().default(0),
    taxPct: pct('tax_pct').notNull().default(6),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('channels_user_idx').on(t.userId)],
);

export const products = pgTable(
  'products',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
    sku: text().notNull(),
    name: text().notNull(),
    cost: money('cost').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('products_user_sku_key').on(t.userId, t.sku)],
);

export const productPrices = pgTable(
  'product_prices',
  {
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
    price: money('price').notNull().default(0),
    shipping: money('shipping').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.productId, t.channelId] }), index('product_prices_user_idx').on(t.userId)],
);

export const sales = pgTable(
  'sales',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'restrict' }),
    quantity: integer().notNull(),
    unitPrice: money('unit_price').notNull(),
    unitCost: money('unit_cost').notNull(),
    unitShipping: money('unit_shipping').notNull().default(0),
    commissionPct: pct('commission_pct').notNull(),
    fixedFee: money('fixed_fee').notNull().default(0),
    taxPct: pct('tax_pct').notNull(),
    soldAt: timestamp('sold_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sales_user_sold_at_idx').on(t.userId, t.soldAt)],
);
