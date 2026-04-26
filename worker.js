/**
 * Coffee Cart — Cloudflare Worker
 *
 * Routes:
 *   POST /api/order    → insert order into D1
 *   GET  /api/orders   → list all orders (staff view)
 *
 * Setup:
 *   1. wrangler d1 create coffee-cart-db
 *   2. Paste the database_id into wrangler.toml
 *   3. wrangler d1 execute coffee-cart-db --file=schema.sql
 *   4. wrangler deploy
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    if (method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    if (method === 'POST' && pathname === '/api/order') return handleOrder(request, env);
    if (method === 'GET'  && pathname === '/api/orders') return handleGetOrders(env);

    return new Response('Not found', { status: 404 });
  }
};

async function handleOrder(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return err('Invalid JSON', 400); }

  const { name, item, category, size, milk, syrups = [], extras = [], total } = body;

  if (!name?.trim())                                        return err('Name required', 400);
  if (!item || !['Coffee','Juice','Tea'].includes(category?.charAt(0).toUpperCase() + category?.slice(1)))
    { /* category check is loose — just verify item is a non-empty string */ }
  if (!item?.trim())                                        return err('Item required', 400);
  if (!['small','medium','large'].includes(size))           return err('Invalid size', 400);
  if (typeof total !== 'number' || total < 0)               return err('Invalid total', 400);

  try {
    const result = await env.DB.prepare(
      `INSERT INTO orders (name, item, category, size, milk, syrups, extras, total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
       RETURNING id`
    )
    .bind(
      name.trim(),
      item.trim(),
      category || '',
      size,
      milk || '',
      JSON.stringify(syrups),
      JSON.stringify(extras),
      Math.round(total * 100) / 100
    )
    .first();

    const queueResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM orders WHERE status = 'pending' AND id <= ?`
    ).bind(result.id).first();

    return cors(json({ success: true, id: result.id, queuePosition: queueResult.count }, 201));
  } catch (e) {
    console.error(e);
    return err('Failed to save order', 500);
  }
}

async function handleGetOrders(env) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, name, item, category, size, milk, syrups, extras, total, status, created_at
       FROM orders ORDER BY created_at DESC LIMIT 200`
    ).all();

    const parsed = results.map(r => ({
      ...r,
      syrups: JSON.parse(r.syrups || '[]'),
      extras: JSON.parse(r.extras || '[]'),
    }));

    return cors(json({ orders: parsed }));
  } catch (e) {
    console.error(e);
    return err('Failed to fetch orders', 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function err(message, status = 400) {
  return cors(json({ success: false, error: message }, status));
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}
