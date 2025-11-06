import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect Preview AND Production deployments with Basic Auth.
export function middleware(req: NextRequest) {
  // Enforce on both preview and production
  const env = process.env.VERCEL_ENV;
  if (env !== 'preview' && env !== 'production') {
    return NextResponse.next();
  }

  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // If auth is not configured, return a clear error to avoid silently exposing the site
  if (!user || !pass) {
    return new NextResponse('Auth not configured. Set BASIC_AUTH_USER and BASIC_AUTH_PASS in Vercel env (Preview/Production).', {
      status: 500,
    });
  }

  const authorization = req.headers.get('authorization');
  if (authorization) {
    const [scheme, encoded] = authorization.split(' ');
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = atob(encoded);
        const [u, p] = decoded.split(':');
        if (u === user && p === pass) {
          return NextResponse.next();
        }
      } catch {
        // fall through to 401
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// Apply to all routes except static assets and common public files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
