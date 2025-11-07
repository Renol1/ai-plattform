export const runtime = 'edge';

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const nummer = url.searchParams.get('nummer');
    const sprak = url.searchParams.get('sprak') || '1';
    const version = url.searchParams.get('version') || '1';

    if (!nummer) {
      return json({ error: 'Missing required query parameter `nummer`' }, 400);
    }

    const base = `https://dataportal.livsmedelsverket.se/livsmedel/api/v${version}`;

    const [livsmedelRes, naringsRes] = await Promise.all([
      fetch(`${base}/livsmedel/${encodeURIComponent(nummer)}?sprak=${encodeURIComponent(sprak)}`, {
        headers: { Accept: 'application/json' },
      }),
      fetch(`${base}/livsmedel/${encodeURIComponent(nummer)}/naringsvarden?sprak=${encodeURIComponent(sprak)}`, {
        headers: { Accept: 'application/json' },
      }),
    ]);

    const text1 = await livsmedelRes.text();
    const text2 = await naringsRes.text();

    if (!livsmedelRes.ok) {
      return new Response(text1 || 'Upstream error (livsmedel)', {
        status: livsmedelRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!naringsRes.ok) {
      return new Response(text2 || 'Upstream error (naringsvarden)', {
        status: naringsRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let livsmedel: any = null;
    let naringsvarden: any = null;
    try {
      livsmedel = text1 ? JSON.parse(text1) : null;
    } catch {
      livsmedel = text1;
    }
    try {
      naringsvarden = text2 ? JSON.parse(text2) : null;
    } catch {
      naringsvarden = text2;
    }

    return json({ livsmedel, naringsvarden, meta: { nummer, sprak: Number(sprak), version } }, 200);
  } catch (err: any) {
    return json({ error: 'Server error', message: err?.message ?? String(err) }, 500);
  }
}
