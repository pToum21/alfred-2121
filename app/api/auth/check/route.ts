// app/api/auth/check/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCurrentUserFromToken } from '@/lib/auth/auth';
import Logger from '@/lib/utils/logging';

// Force dynamic route handling
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    const userId = await getCurrentUserFromToken(token);

    if (!userId) {
      Logger.auth('Auth check: No valid user ID found');
      return NextResponse.json({ 
        authenticated: false 
      });
    }

    Logger.auth('Auth check: Valid user ID found:', userId);
    return NextResponse.json({ 
      authenticated: true,
      userId 
    });

  } catch (error) {
    Logger.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: 'Authentication check failed' 
    }, { 
      status: 500 
    });
  }
}