import { NextResponse } from 'next/server';
import { generateTOTPSecret } from '@/lib/auth/totp';
import Logger from '@/lib/utils/logging';
import { NextRequest } from 'next/server';
import { getCurrentUserFromToken } from '@/lib/auth/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    Logger.auth('[SetupTOTP] Got token:', token);
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Get user ID from token - already handles verification
    const userId = await getCurrentUserFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid login token' }, { status: 401 });
    }
    
    const { qrCodeDataUrl } = await generateTOTPSecret(userId);
    Logger.auth('[SetupTOTP] Generated QR code');

    return NextResponse.json({ 
      success: true,
      qrCode: qrCodeDataUrl 
    });

  } catch (error) {
    Logger.auth('Setup TOTP error:', error);
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
} 