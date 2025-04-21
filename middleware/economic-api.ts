import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Logger from '@/lib/utils/logging';

export async function economicApiMiddleware(request: NextRequest) {
  const requestId = request.headers.get('X-Request-ID') || 'unknown';
  
  try {
    Logger.debug('economicApiMiddleware', `Request ${requestId} started`, {
      path: request.nextUrl.pathname,
      method: request.method
    });

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      Logger.error('economicApiMiddleware', `Request ${requestId} - No Bearer token`);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.ECONOMIC_API_JWT_SECRET);

    try {
      const verified = await jwtVerify(token, secret);
      
      // Add detailed token verification logging
      Logger.debug('economicApiMiddleware', `Token verified for request ${requestId}`, {
        type: verified.payload.type,
        userId: verified.payload.sub,
        exp: new Date((verified.payload.exp || 0) * 1000).toISOString()
      });
      
      // Verify token type and user ID
      if (verified.payload.type !== 'economic_api') {
        Logger.error('economicApiMiddleware', `Request ${requestId} - Invalid token type`, {
          expectedType: 'economic_api',
          receivedType: verified.payload.type
        });
        return new NextResponse('Invalid token type', { status: 401 });
      }

      // Add user ID to request context for logging/tracking
      const userId = verified.payload.sub as string;
      request.headers.set('X-User-ID', userId);
      
      Logger.debug('economicApiMiddleware', `Request ${requestId} authorized`, {
        userId,
        tokenType: 'economic_api'
      });
      
      return NextResponse.next();
    } catch (error) {
      Logger.error('economicApiMiddleware', `Token verification failed for request ${requestId}:`, error);
      return new NextResponse('Invalid token', { status: 401 });
    }
  } catch (error) {
    Logger.error('economicApiMiddleware', `Middleware error for request ${requestId}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 