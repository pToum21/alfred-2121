/**
 * Validates database configuration environment variables
 */
export const dynamic = 'force-dynamic';

const requiredEnvVars = [
  'POSTGRES_URL',
  'POSTGRES_USER',
  'POSTGRES_HOST',
  'POSTGRES_PASSWORD',
  'POSTGRES_DATABASE',
  'JWT_SECRET'
] as const;

let isValidated = false;

export function validateDatabaseConfig() {
  // Skip validation if already done
  if (isValidated) {
    return true;
  }

  // Validate in server context only
  if (typeof window !== 'undefined') {
    return true;
  }

  const missingVars = requiredEnvVars.filter(varName => {
    try {
      const value = process.env[varName];
      return !value || value.trim() === '';
    } catch {
      return true;
    }
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  isValidated = true;
  return true;
} 