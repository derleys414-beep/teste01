import type { Config } from '@netlify/functions';
import { getUser } from '@netlify/identity';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { channels, productPrices, products, profiles, sales } from '../../db/schema.js';

const ADMIN_EMAIL = 'derleys414@gmail.com';
const STATUSES = ['pendente', 'ativo', 'bloqueado'] as const;
type Status = (typeof STATUSES)[number];

const DEFAULT_CHANNELS = [
  { name: 'Mercado Livre', color: '#3730a3', commissionPct: 13, fixedFee: 6, taxPct: 6 },
  { name: 'Shopee', color: '#38bdf8', commissionPct: 14, fixedFee: 4, taxPct: 6 },
  { name: 'Amazon', color: '#14b8a6', commissionPct: 15, fixedFee: 0, taxPct: 6 },
  { name: 'Site próprio', color: '#94a3b8', commissionPct: 4.5, fixedFee: 0.8, taxPct: 6 },
];

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Me = { id: string; email: string; isAdmin: boolean; status: Status };

// Loads the caller's profile, creating it (with the default channels) on first access.
async function loadMe(): Promise<Me> {
  const user = await getUser();
  if (!user?.id || !user.email) throw new HttpError(401, 'Sua sessão expirou. Entre novamente.');
  const email = user.email.toLowerCase();
  const isAdmin = email === ADMIN_EMAIL;

  const [created] = await db
    .insert(profiles)
    .values({ userId: user.id, email, status: isAdmin ? 'ativo' : 'pendente', activatedAt: isAdmin ? new Date() : null })
    .onConflictDoNothing()
    .returning();
  if (created) {
    await db.insert(channels).values(DEFAULT_CHANNELS.map((c) => ({ ...c, userId: user.id })));
    return { id: user.id, email, isAdmin, status: created.status as Status };
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  return { id: user.id, email, isAdmin, status: profile.status as Status };
}

async function requireActive(): Promise<Me> {
  const me = await loadMe();
  if (me.status !== 'ativo') throw new HttpError(403, 'Sua conta ainda não está ativa.');
  return me;
}

const num = (value: unknown, field: string, min = 0, max = Number.POSITIVE_INFINITY): number => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new HttpError(400, `Valor inválido em ${field}.`);
  return n;
};
const str = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `Preencha ${field}.`);
  return value.trim();
};

const channelRow = (c: typeof channels.$inferSelect) => ({
  id: c.id,
  name: c.name,
  color: c.color,
  commission_pct: c.commissionPct,
  fixed_fee: c.fixedFee,
  tax_pct: c.taxPct,
});

async function ownsAll(userId: string, productId: string, channelIds: string[]): Promise<boolean> {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.userId, userId)));
  if (!product) return false;
  if (channelIds.length === 0) return true;
  const owned = await db
    .select({ id: channels.id })
    .from(channels)
    .where(and(eq(channels.userId, userId), inArray(channels.id, channelIds)));
  return owned.length === new Set(channelIds).size;
}

async function route(req: Request): Promise<Response> {
  const parts = new URL(req.url).pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const [resource, id] = parts;
  const method = req.method;
  const body = method === 'GET' || method === 'DELETE' ? {} : ((await req.json().catch(() => ({}))) as Record<string, unknown>);

  if (resource === 'me' && method === 'GET') {
    const me = await loadMe();
    return Response.json({ status: me.status, is_admin: me.isAdmin });
  }

  if (resource === 'admin') {
    const me = await loadMe();
    if (!me.isAdmin) throw new HttpError(403, 'Apenas o administrador pode acessar esta área.');

    if (parts[1] === 'accounts' && !parts[2] && method === 'GET') {
      const rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
      return Response.json(
        rows.map((p) => ({
          user_id: p.userId,
          email: p.email,
          status: p.status,
          created_at: p.createdAt,
          activated_at: p.activatedAt,
          months_active:
            p.status === 'ativo' && p.activatedAt ? Math.floor((Date.now() - p.activatedAt.getTime()) / 2_592_000_000) : null,
        })),
      );
    }

    if (parts[1] === 'accounts' && parts[2] && method === 'PATCH') {
      const target = parts[2];
      const status = body.status as Status;
      if (!STATUSES.includes(status)) throw new HttpError(400, 'Status inválido.');
      if (target === me.id) throw new HttpError(400, 'Não é possível alterar o próprio status.');
      const updated = await db
        .update(profiles)
        .set({
          status,
          activatedAt:
            status !== 'ativo' ? null : sql`CASE WHEN ${profiles.status} = 'ativo' THEN ${profiles.activatedAt} ELSE now() END`,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, target))
        .returning({ id: profiles.userId });
      if (updated.length === 0) throw new HttpError(404, 'Conta não encontrada. Atualize a página e tente novamente.');
      return new Response(null, { status: 204 });
    }
  }

  const me = await requireActive();

  if (resource === 'catalog' && method === 'GET') {
    const [chs, prods, prices] = await Promise.all([
      db.select().from(channels).where(eq(channels.userId, me.id)).orderBy(asc(channels.name)),
      db.select().from(products).where(eq(products.userId, me.id)).orderBy(asc(products.name)),
      db.select().from(productPrices).where(eq(productPrices.userId, me.id)),
    ]);
    return Response.json({
      channels: chs.map(channelRow),
      products: prods.map((p) => ({ id: p.id, sku: p.sku, name: p.name, cost: p.cost })),
      prices: prices.map((p) => ({ product_id: p.productId, channel_id: p.channelId, price: p.price, shipping: p.shipping })),
    });
  }

  if (resource === 'channels') {
    const rates = () => ({
      commissionPct: num(body.commission_pct, 'comissão', 0, 99.99),
      fixedFee: num(body.fixed_fee, 'taxa fixa'),
      taxPct: num(body.tax_pct, 'imposto', 0, 100),
    });

    if (!id && method === 'POST') {
      const [row] = await db
        .insert(channels)
        .values({ userId: me.id, name: str(body.name, 'o nome'), color: str(body.color, 'a cor'), ...rates() })
        .returning();
      return Response.json(channelRow(row), { status: 201 });
    }
    if (id && method === 'PATCH') {
      const updated = await db
        .update(channels)
        .set(rates())
        .where(and(eq(channels.id, id), eq(channels.userId, me.id)))
        .returning({ id: channels.id });
      if (updated.length === 0) throw new HttpError(404, 'Canal não encontrado. Atualize a página e tente novamente.');
      return new Response(null, { status: 204 });
    }
    if (id && method === 'DELETE') {
      const [used] = await db
        .select({ id: sales.id })
        .from(sales)
        .where(and(eq(sales.channelId, id), eq(sales.userId, me.id)))
        .limit(1);
      if (used) throw new HttpError(409, 'Este canal tem vendas registradas e não pode ser excluído.');
      const deleted = await db
        .delete(channels)
        .where(and(eq(channels.id, id), eq(channels.userId, me.id)))
        .returning({ id: channels.id });
      if (deleted.length === 0) throw new HttpError(404, 'Canal não encontrado. Atualize a página e tente novamente.');
      return new Response(null, { status: 204 });
    }
  }

  if (resource === 'products' && method === 'PUT') {
    const row = { sku: str(body.sku, 'o SKU'), name: str(body.name, 'o nome'), cost: num(body.cost, 'custo') };
    const prices = Array.isArray(body.prices) ? (body.prices as Record<string, unknown>[]) : [];

    const [duplicate] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.userId, me.id), eq(products.sku, row.sku)));
    if (duplicate && duplicate.id !== body.id) throw new HttpError(409, 'Já existe um produto com este SKU.');

    let productId = typeof body.id === 'string' ? body.id : undefined;
    if (productId) {
      const updated = await db
        .update(products)
        .set(row)
        .where(and(eq(products.id, productId), eq(products.userId, me.id)))
        .returning({ id: products.id });
      if (updated.length === 0) throw new HttpError(404, 'Produto não encontrado. Atualize a página e tente novamente.');
    } else {
      const [created] = await db.insert(products).values({ ...row, userId: me.id }).returning({ id: products.id });
      productId = created.id;
    }

    const values = prices.map((p) => ({
      productId: productId!,
      channelId: str(p.channelId, 'o canal'),
      userId: me.id,
      price: num(p.price, 'preço'),
      shipping: num(p.shipping, 'frete'),
    }));
    if (!(await ownsAll(me.id, productId, values.map((v) => v.channelId)))) throw new HttpError(400, 'Canal inválido.');
    if (values.length > 0) {
      await db
        .insert(productPrices)
        .values(values)
        .onConflictDoUpdate({
          target: [productPrices.productId, productPrices.channelId],
          set: { price: sql`excluded.price`, shipping: sql`excluded.shipping` },
        });
    }
    return new Response(null, { status: 204 });
  }

  if (resource === 'sales') {
    if (!id && method === 'GET') {
      const rows = await db.select().from(sales).where(eq(sales.userId, me.id)).orderBy(desc(sales.soldAt));
      return Response.json(
        rows.map((s) => ({
          id: s.id,
          product_id: s.productId,
          channel_id: s.channelId,
          quantity: s.quantity,
          unit_price: s.unitPrice,
          unit_cost: s.unitCost,
          unit_shipping: s.unitShipping,
          commission_pct: s.commissionPct,
          fixed_fee: s.fixedFee,
          tax_pct: s.taxPct,
          sold_at: s.soldAt,
        })),
      );
    }
    if (!id && method === 'POST') {
      const productId = str(body.product_id, 'o produto');
      const channelId = str(body.channel_id, 'o canal');
      if (!(await ownsAll(me.id, productId, [channelId]))) throw new HttpError(400, 'Produto ou canal inválido.');
      const quantity = num(body.quantity, 'quantidade', 1);
      if (!Number.isInteger(quantity)) throw new HttpError(400, 'Valor inválido em quantidade.');
      const soldAt = new Date(str(body.sold_at, 'a data'));
      if (Number.isNaN(soldAt.getTime())) throw new HttpError(400, 'Data inválida.');
      await db.insert(sales).values({
        userId: me.id,
        productId,
        channelId,
        quantity,
        unitPrice: num(body.unit_price, 'preço'),
        unitCost: num(body.unit_cost, 'custo'),
        unitShipping: num(body.unit_shipping, 'frete'),
        commissionPct: num(body.commission_pct, 'comissão'),
        fixedFee: num(body.fixed_fee, 'taxa fixa'),
        taxPct: num(body.tax_pct, 'imposto'),
        soldAt,
      });
      return new Response(null, { status: 201 });
    }
    if (id && method === 'DELETE') {
      const deleted = await db
        .delete(sales)
        .where(and(eq(sales.id, id), eq(sales.userId, me.id)))
        .returning({ id: sales.id });
      if (deleted.length === 0) throw new HttpError(404, 'Venda não encontrada. Atualize a página e tente novamente.');
      return new Response(null, { status: 204 });
    }
  }

  throw new HttpError(404, 'Rota não encontrada.');
}

export default async (req: Request) => {
  try {
    return await route(req);
  } catch (err) {
    if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
    console.error(err);
    return Response.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
  }
};

export const config: Config = {
  path: '/api/*',
};
