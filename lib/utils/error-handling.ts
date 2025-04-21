export class AuthError extends Error {
  constructor(
    message: string, 
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function handleAuthError(error: unknown) {
  console.error('Auth Error:', error);

  if (error instanceof AuthError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.statusCode
    };
  }

  // Handle unexpected errors
  return {
    success: false,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    status: 500
  };
}

export const AuthErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOTP_REQUIRED: 'TOTP_REQUIRED',
  TOTP_INVALID: 'TOTP_INVALID',
  TOTP_EXPIRED: 'TOTP_EXPIRED',
  TOTP_SETUP_REQUIRED: 'TOTP_SETUP_REQUIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_TOKEN: 'INVALID_TOKEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const; 