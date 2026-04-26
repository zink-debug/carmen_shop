 import htmlContent from './index.html';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    if (method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    if (method === 'POST' && pathname === '/api/order') return handleOrder(request, env);
    if (method === 'GET'  && pathname === '/api/orders') return handleGetOrders(env);

    return new Response(htmlContent, {
      status: 200,
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
};

async function handleOrder(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return err('Invalid JSON', 400); }

  const { category, name, email, room, notes = '', size, payment, delivery, total } = body;
  const amount = Math.max(1, parseInt(body.amount) || 1);

  if (!name || !email || !room) return err('Missing required fields', 400);
  if (!['12 oz','16 oz','20 oz'].includes(size)) return err('Invalid size', 400);

  let item = 'Coffee';
  let temp = body.temp || '';
  let milk = (body.milk || []).join(', ');
  let syrups = body.syrups || [];
  let extras = body.sweeteners || body.additions || [];

  if (category === 'tea') {
    item = (body.teas || []).join(', ');
  } else if (category === 'juice') {
    item = body.drink || 'Juice';
  }

  try {
    const result = await env.DB.prepare(
      `INSERT INTO orders (name, email, room, notes, item, category, size, temp, milk, syrups, extras, payment, delivery, amount, total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
       RETURNING id`
    )
    .bind(
      name, email, room, notes, item, category, size, temp, milk,
      JSON.stringify(syrups), JSON.stringify(extras),
      payment, delivery, amount, Math.round(total * 100) / 100
    )
    .first();

    const insertedId = result.id;

    const queueResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM orders WHERE status = 'pending' AND id <= ?`
    ).bind(insertedId).first();

    return cors(json({ success: true, id: insertedId, queuePosition: queueResult.count }, 201));
  } catch (e) {
    console.error(e);
    return err('Failed to save order', 500);
  }
}

async function handleGetOrders(env) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, name, email, room, notes, item, category, size, temp, milk, syrups, extras, payment, delivery, amount, total, status, created_at
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
