import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import bcrypt from 'bcryptjs';
import Logger from '@/lib/utils/logging';
import { AuthState } from '@/lib/types/auth';

interface UserResult {
  id: number;
}

async function createUser(email: string, password: string) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const users = await executeQuery<UserResult>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id`,
      [email, hashedPassword]
    );

    return {
      success: true,
      message: 'Registration successful. Please login to continue.',
      state: AuthState.NEEDS_CREDENTIALS
    };
  } catch (error) {
    Logger.auth('[createUser] Error:', error);
    return { 
      success: false, 
      message: 'Failed to create user',
      state: AuthState.NEEDS_CREDENTIALS 
    };
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  Logger.auth('[Register] Starting registration process');
  
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      Logger.auth('[Register] Missing required fields');
      return NextResponse.json({ 
        success: false, 
        message: 'Email and password are required',
        state: AuthState.NEEDS_CREDENTIALS
      }, { status: 400 });
    }

    const result = await createUser(email, password);
    Logger.auth(`[Register] Registration ${result.success ? 'successful' : 'failed'}`);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });

  } catch (error) {
    Logger.auth('[Register] Error during registration:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Registration failed',
      state: AuthState.NEEDS_CREDENTIALS
    }, { status: 500 });
  }
}