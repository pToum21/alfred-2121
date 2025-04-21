/**
 * Server-Side Authentication Operations
 * 
 * This module handles core authentication functionality including:
 * - Token verification
 * 
 * All functions in this file are server-side only and handle sensitive operations.
 */

import 'server-only';
import { jwtVerify } from 'jose';
import Logger from '@/lib/utils/logging';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');

// Private core verification function
async function verifyTokenCore(token: string): Promise<string | null> {
  try {
    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.sub;
    
    if (!userId) {
      Logger.auth('[verifyTokenCore] No userId in token payload');
      return null;
    }

    Logger.auth(`[verifyTokenCore] Successfully verified token for user ${userId}`);
    return userId as string;
  } catch (error) {
    Logger.auth('[verifyTokenCore] Error:', error);
    return null;
  }
}

// Original function for string token
export async function getCurrentUserFromToken(token: string | undefined): Promise<string | null> {
  if (!token) {
    Logger.auth('[getCurrentUserFromToken] No token provided');
    return null;
  }
  return verifyTokenCore(token);
}

// New function for NextRequest
export async function getCurrentUserFromRequestToken(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    Logger.auth('[getCurrentUserFromRequestToken] No token found in cookies');
    return null;
  }
  const userId = await verifyTokenCore(token);
  return userId ? { id: userId } : null;
}
