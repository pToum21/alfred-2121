// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { AuthState, LoginUser } from '@/lib/types/auth';
import { TOTPStatusImpl } from '@/lib/utils/totp';
import { TOTP_CONFIG } from '@/lib/utils/totp';
import { getTOTPStatus, verifyTOTPCode } from '@/lib/auth/totp';
import Logger from '@/lib/utils/logging';
import { randomBytes } from 'crypto';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');

// Generate login tokens (both temporary and permanent)
async function generateLoginToken(userId: number | string, expiresIn: string = '7d') {
  Logger.auth(`[generateLoginToken] Generating token for user ${userId} with expiration: ${expiresIn}`);
  return await new SignJWT({ 
    sub: userId.toString()
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(secret);
}

// Add this new function to check if 2FA is required for a domain
async function is2FARequiredForDomain(email: string): Promise<boolean> {
  const domain = email.split('@')[1].toLowerCase();
  const result = await executeQuery<{ exists: boolean }>(
    'SELECT EXISTS (SELECT 1 FROM two_factor_domains WHERE domain = $1) as exists',
    [domain]
  );
  return result[0].exists;
}

// Modify the loginUser function
async function loginUser(email: string, password: string, totpCode?: string) {
  Logger.auth(`[loginUser] Attempt for: ${email}`);
  
  try {
    const users = await executeQuery<LoginUser>(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (!users.length) {
      Logger.auth(`[loginUser] User not found: ${email}`);
      return {
        success: false,
        message: 'User not found - please register',
        state: AuthState.NEEDS_CREDENTIALS
      };
    }

    const user = users[0];
    Logger.auth(`[loginUser] Verifying password for user: ${user.id}`);
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      Logger.auth(`[loginUser] Invalid password for user: ${user.id}`);
      return {
        success: false,
        message: 'Invalid password',
        state: AuthState.NEEDS_CREDENTIALS
      };
    }

    // Check if 2FA is required for this domain
    const requires2FA = await is2FARequiredForDomain(email);
    
    if (requires2FA) {
      const totpStatus = await getTOTPStatus(user.id);

      if (!totpStatus.hasActiveSetup() && (!totpStatus.isConfigured() || totpStatus.needsUpgrade(TOTP_CONFIG.currentVersion))) {
        Logger.auth(`[loginUser] TOTP setup needed: configured=${totpStatus.isConfigured()}, version=${totpStatus.version}`);
        return {
          success: false,
          message: 'TOTP setup required',
          state: AuthState.NEEDS_TOTP_SETUP,
          token: await generateLoginToken(user.id, '5m')
        };
      }

      if (!totpCode) {
        Logger.auth('[loginUser] TOTP code required but not provided');
        return {
          success: false,
          message: 'TOTP code required',
          state: AuthState.NEEDS_TOTP_CODE
        };
      }

      const isValidTOTP = await verifyTOTPCode(user.id, totpCode);
      if (!isValidTOTP) {
        Logger.auth('[loginUser] Invalid TOTP code provided');
        return {
          success: false,
          message: 'Invalid TOTP code',
          state: AuthState.NEEDS_TOTP_CODE
        };
      }
    }

    // If we get here, either 2FA is not required or it was validated successfully
    Logger.auth('[loginUser] Authentication successful');
    const token = await generateLoginToken(user.id);

    return {
      success: true,
      message: 'Login successful',
      state: AuthState.AUTHENTICATED,
      token,
      userId: user.id
    };

  } catch (error) {
    Logger.auth('[loginUser] Error:', error);
    return {
      success: false,
      message: 'Login failed',
      state: AuthState.NEEDS_CREDENTIALS
    };
  }
}

// Generate a random string of specified length
function generateRandomToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

function setAuthCookie(responseData: any, token: string, maxAge: number = 60 * 60 * 24 * 7) {
  Logger.auth('[setAuthCookie] Setting token cookie:', { token: !!token, maxAge });
  const response = NextResponse.json({ 
    ...responseData,
    token: undefined  // Don't send token in response body
  }, { status: responseData.success ? 200 : 401 });
  
  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge
  });
  
  return response;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  Logger.auth('\n=== Login Route Start ===');
  
  try {
    // 1. Get credentials from request
    const { email, password, totpCode } = await request.json();
    Logger.auth('Login attempt:', {
      email,
      hasPassword: !!password,
      hasTotpCode: !!totpCode
    });
    
    // 2. Attempt login
    const result = await loginUser(email, password, totpCode);
    
    // 3. Handle successful login
    if (result.success && result.state === AuthState.AUTHENTICATED) {
      Logger.auth('[Login Route] Setting successful login cookie');
      return setAuthCookie(result, result.token!, 60 * 60 * 24 * 7); // 7 days
    }
    
    // 4. Handle TOTP setup requirement
    if (result.state === AuthState.NEEDS_TOTP_SETUP) {
      return setAuthCookie(result, result.token!, 300); // 5 minutes
    }
    
    // 5. Handle all other failed login attempts
    Logger.auth('Login failed:', result.message);
    return NextResponse.json({ 
      success: false, 
      message: result.message,
      state: result.state
    }, { status: 401 });

  } catch (error) {
    // 6. Handle unexpected errors
    Logger.auth('Login route error:', error);
    return NextResponse.json({ 
      success: false, 
      state: AuthState.NEEDS_CREDENTIALS,
      message: error instanceof Error ? error.message : 'Authentication failed'
    }, { status: 500 });
  }
}