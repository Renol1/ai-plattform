import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware always runs on the Edge Runtime – use Web APIs (no Node Buffer)
export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = process.env.AUTH_USER;
  const pass = process.env.AUTH_PASS;

  // If credentials are not configured, skip protection (avoids local lockouts)
  if (!user || !pass) return NextResponse.next();

  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      // atob is available in the Edge runtime
      const decoded = atob(encoded);
      const [u, p] = decoded.split(':');
      if (u === user && p === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Protected"' },
  });
}

// Apply to entire site
export const config = {
  matcher: ['/:path*'],
};
