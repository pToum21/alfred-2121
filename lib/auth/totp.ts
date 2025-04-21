/**
 * Server-Side TOTP Operations
 * 
 * SECURITY CRITICAL:
 * This file must only be used server-side as it contains TOTP verification logic.
 */

import 'server-only';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { executeQuery } from '@/lib/db';
import Logger from '@/lib/utils/logging';
import { TOTP_CONFIG, TOTPStatusImpl } from '@/lib/utils/totp';
import { getPool } from '@/lib/db/db';

export const runtime = 'nodejs';

export async function generateTOTPSecret(userId: string) {
  Logger.auth('[TOTPService] Generating new TOTP secret');
  
  // Get user email for the QR code
  const users = await executeQuery<{ email: string }>(
    'SELECT email FROM users WHERE id = $1',
    [userId]
  );
  
  if (!users.length) {
    throw new Error('User not found');
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(users[0].email, 'Alfred', secret);
  
  try {
    // Store the secret in setup table
    await executeQuery(
      `INSERT INTO totp_setup_tokens (user_id, setup_token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         setup_token = $2,
         expires_at = NOW() + INTERVAL '10 minutes'`,
      [userId, secret]
    );

    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
    Logger.auth('[TOTPService] Generated QR code data URL');
    return { secret, qrCodeDataUrl };
  } catch (error) {
    Logger.auth('[TOTPService] Error generating QR code:', error);
    throw error;
  }
}

export async function verifyTOTPCode(userId: string, code: string): Promise<boolean> {
  Logger.auth(`[TOTP] Verifying code for user: ${userId}`);
  
  // Check setup table first
  const setup = await executeQuery<{ totp_secret: string }>(
    `SELECT setup_token as totp_secret
     FROM totp_setup_tokens 
     WHERE user_id = $1
       AND expires_at > NOW()`,
    [userId]
  );
 
  // Lots of totp setup codes will make login slower and slower.
  if (setup.length) {
    const isValid = authenticator.verify({ 
      token: code, 
      secret: setup[0].totp_secret 
    });
    
    if (isValid) {
      const client = getPool();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO user_totp (user_id, totp_secret, version)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) 
           DO UPDATE SET 
             totp_secret = $2,
             version = $3`,
          [userId, setup[0].totp_secret, TOTP_CONFIG.currentVersion]
        );
        
        await client.query(
          'DELETE FROM totp_setup_tokens WHERE user_id = $1',
          [userId]
        );
        await client.query('COMMIT');
        Logger.auth('[TOTP] Setup completed and moved to permanent storage');
      } catch (error) {
        await client.query('ROLLBACK');
        Logger.auth('[TOTP] Error in setup transaction:', error);
        throw error;
      }
    }
    
    return isValid;
  }
  
  // Normal verification against permanent storage
  const result = await executeQuery<{ totp_secret: string }>(
    'SELECT totp_secret FROM user_totp WHERE user_id = $1',
    [userId]
  );

  if (!result.length) return false;

  return authenticator.verify({ 
    token: code, 
    secret: result[0].totp_secret 
  });
}

export async function getTOTPStatus(userId: string) {
  Logger.auth(`[TOTP] Checking status for user: ${userId}`);
  
  // Check for active setup first
  const setup = await executeQuery<{ exists: boolean }>(
    `SELECT 1 
     FROM totp_setup_tokens 
     WHERE user_id = $1
       AND expires_at > NOW()`,
    [userId]
  );
  
  if (setup.length) {
    const status = new TOTPStatusImpl(-2);  // In setup mode
    Logger.auth(`[TOTP] Found active setup`);
    return status;
  }
  
  // Then check permanent storage
  const result = await executeQuery<{ version: number }>(
    'SELECT version FROM user_totp WHERE user_id = $1',
    [userId]
  );
  
  if (result.length) {
    const status = new TOTPStatusImpl(result[0].version);
    Logger.auth(`[TOTP] Found configured TOTP: version=${status.version}`);
    return status;
  }
  
  // No setup or permanent config found
  const status = new TOTPStatusImpl(-1);
  Logger.auth(`[TOTP] Status for unconfigured: hasActiveSetup=${!!setup}`);
  return status;
} 