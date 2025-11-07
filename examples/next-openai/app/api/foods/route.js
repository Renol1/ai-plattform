export const runtime = 'edge';

export async function POST(req) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid `query` in body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const params = {
      query,
      sprak: 1,
      maxResults: 10,
      pageSize: 200,
      maxPages: 1,
    };

    const res = await fetch('https://www7.slv.se/api/food/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const text = await res.text();

    // If upstream failed, forward status + body
    if (!res.ok) {
      return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }

    // The SLV API usually returns JSON — forward as-is
    return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    const message = err?.message ?? String(err);
    return new Response(JSON.stringify({ error: 'Server error', message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
