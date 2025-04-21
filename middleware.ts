/**
 * Authentication Middleware
 * 
 * Handles request authentication including:
 * - Public path allowance
 * - Token verification
 * - Route protection
 * - Basic redirects
 * 
 * Runs on Edge runtime with Node.js compatibility.
 * 
 * SECURITY CRITICAL:
 * This is a core security component - do not add additional functionality here.
 * Keep this focused only on request authentication and authorization.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentUserFromToken } from '@/lib/auth/auth'
import Logger from '@/lib/utils/logging'
import { economicApiMiddleware } from '@/middleware/economic-api'

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/v1/analyze/:path*'
  ],
  runtime: 'nodejs'
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  Logger.auth(`[Middleware] ${request.method} ${pathname} | Token: ${!!token}`);

  // Define paths
  const publicPaths = [
    '/login', 
    '/register', 
    '/forgot-password', 
    '/reset-password',
    '/terms.html',
    '/api/healthz',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
  ];
  const isPublicPath = publicPaths.includes(pathname);

  // Handle root path
  if (pathname === '/') {
    if (token) {
      Logger.auth(`[Middleware] Root path with token - redirecting to /search`);
      return NextResponse.redirect(new URL('/search', request.url));
    }
    Logger.auth(`[Middleware] Root path without token - redirecting to /login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if(isPublicPath) {
     return NextResponse.next();
  }

  // Handle unauthorized access
  if (!token) {
    Logger.auth(`[Middleware] No token - unauthorized`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify token
  try {
    Logger.auth(`[Middleware] Verifying token...`);
    const userId = await getCurrentUserFromToken(token);
    if (!userId) {
      throw new Error('Invalid token');
    }

    Logger.auth(`[Middleware] Request authorized - proceeding`);
    return NextResponse.next();
  } catch (error) {
    Logger.auth(`[Middleware] Token verification failed:`, error);
    const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    response.cookies.delete('token');
    return response;
  }

  // Add economic API route handling
  if (pathname.startsWith('/api/v1/analyze')) {
    Logger.auth(`[Middleware] Economic API request: ${pathname}`);
    return economicApiMiddleware(request);
  }
}
