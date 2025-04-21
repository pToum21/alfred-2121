export enum AuthState {
  NEEDS_CREDENTIALS,
  NEEDS_TOTP_SETUP,
  NEEDS_TOTP_CODE,
  AUTHENTICATED
}

export interface BaseResponse {
  success: boolean;
  message: string;
}

export type LoginResponse = 
  | (BaseResponse & { state: AuthState.NEEDS_CREDENTIALS })
  | (BaseResponse & { state: AuthState.NEEDS_TOTP_SETUP, setupToken: string })
  | (BaseResponse & { state: AuthState.NEEDS_TOTP_CODE })
  | (BaseResponse & { state: AuthState.AUTHENTICATED, token: string });

export interface TOTPStatus {
  version: number;
  isConfigured(): boolean;
  hasActiveSetup(): boolean;
  needsUpgrade(currentVersion: number): boolean;
}

export interface TOTPSetupResponse {
  success: boolean;
  qrCode?: string;
  error?: string;
}

export interface TOTPVerifyResponse {
  success: boolean;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

export interface LoginUser {
  id: string;
  password_hash: string;
} 
