import { SignJWT } from 'jose';
import Logger from './logging';

/**
 * Generates a session token for authenticated users
 * Token is long-lived and used for general session management
 */
export async function generateSessionToken(userId: string): Promise<string> {
  try {
    Logger.auth('Generating session token for user:', userId);
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d') // 7 days
      .setIssuedAt()
      .setSubject(userId)
      .sign(secret);

    return token;
  } catch (error) {
    Logger.auth('Error generating session token:', error);
    throw error;
  }
}

/**
 * Generates an economic API token specific to a user
 * Token is shorter-lived than session token and specific to economic API access
 */
export async function generateEconomicApiToken(userId: string): Promise<string> {
  try {
    Logger.auth('Generating economic API token for user:', userId);
    
    if (!process.env.ECONOMIC_API_JWT_SECRET) {
      throw new Error('ECONOMIC_API_JWT_SECRET is not defined');
    }
    
    const secret = new TextEncoder().encode(process.env.ECONOMIC_API_JWT_SECRET);
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 hour from now
    
    const token = await new SignJWT({
      type: 'economic_api',
      exp: exp,
      iat: now,
      nbf: now
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .sign(secret);

    Logger.debug('generateEconomicApiToken', 'Generated token with payload', {
      type: 'economic_api',
      sub: userId,
      exp: new Date(exp * 1000).toISOString(),
      iat: new Date(now * 1000).toISOString()
    });

    return token;
  } catch (error) {
    Logger.auth('Error generating economic API token:', error);
    throw error;
  }
} 