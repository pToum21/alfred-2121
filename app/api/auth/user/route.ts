import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { cookies } from 'next/headers';
import { getCurrentUserFromToken } from '@/lib/auth/auth';
import Logger from '@/lib/utils/logging';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get token from cookie
    const token = cookies().get('token')?.value;
    
    // Get userId from token
    const userId = await getCurrentUserFromToken(token);
    
    if (!userId) {
      Logger.auth('[GET /api/auth/user] No valid user ID found');
      return NextResponse.json({ 
        authenticated: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }
    
    // Get user details from database
    const users = await executeQuery(
      'SELECT id, email, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (!users.length) {
      Logger.auth(`[GET /api/auth/user] User not found for ID: ${userId}`);
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    const user = users[0];
    
    // Return only necessary user info (no password or sensitive data)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
    
  } catch (error) {
    Logger.error('[GET /api/auth/user] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve user information' 
    }, { status: 500 });
  }
} 