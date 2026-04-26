import htmlIndex from './index.html';
import htmlAdmin from './admin.html';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    // CORS preflight
    if (method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    // Serve HTML Pages
    if (method === 'GET' && pathname === '/') {
      return new Response(htmlIndex, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }
    if (method === 'GET' && pathname === '/admin') {
      return new Response(htmlAdmin, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // API Routes
    if (method === 'GET' && pathname === '/api/menu') return handleGetMenu(env);
    if (method === 'POST' && pathname === '/api/menu') return handleSaveMenu(request, env);
    if (method === 'POST' && pathname === '/api/order') return handleOrder(request, env);

    return new Response('Not found', { status: 404 });
  }
};

async function handleGetMenu(env) {
  const res = await env.DB.prepare("SELECT data FROM store_config WHERE id = 'menu'").first();
  return cors(new Response(res ? res.data : '{"categories":[]}', {
    headers: { 'Content-Type': 'application/json' }
  }));
}

async function handleSaveMenu(request, env) {
  const auth = request.headers.get('Authorization');
  const pass = await env.DB.prepare("SELECT data FROM store_config WHERE id = 'admin_pass'").first();
  
  if (auth !== pass.data) {
    return cors(json({ success: false, error: 'Invalid password' }, 401));
  }

  const body = await request.text();
  await env.DB.prepare("UPDATE store_config SET data = ? WHERE id = 'menu'").bind(body).run();
  return cors(json({ success: true }));
}

async function handleOrder(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON', 400); }

  const { name, email, room, notes = '', category, drink, options, quantity, total } = body;

  try {
    const result = await env.DB.prepare(
      `INSERT INTO orders (name, email, room, notes, category, drink, options, quantity, total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
       RETURNING id`
    )
    .bind(
      name, email, room, notes, category, drink, JSON.stringify(options), 
      quantity, Math.round(total * 100) / 100
    ).first();

    return cors(json({ success: true, id: result.id }, 201));
  } catch (e) {
    console.error(e);
    return err('Failed to save order', 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function err(message, status = 400) {
  return cors(json({ success: false, error: message }, status));
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}
