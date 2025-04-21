// /app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { cookies } from 'next/headers';
import Logger from '@/lib/utils/logging';

async function logoutUser(token: string) {
  try {
    await executeQuery(
      'DELETE FROM sessions WHERE token = $1',
      [token]
    );
  } catch (error) {
    Logger.auth('[logoutUser] Error:', error);
  }
}

export async function POST() {
  try {
    const token = cookies().get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token found' });
    }

    await logoutUser(token);
    
    // Create response and delete the cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';