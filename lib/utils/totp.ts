/**
 * TOTP Types and Configuration
 * 
 * Contains client-safe TOTP-related code including:
 * - Configuration constants
 * - Status checking implementation
 * - Type definitions
 * 
 * This module is safe to import in both client and server code.
 */

import { TOTPStatus } from '@/lib/types/auth';

export const TOTP_CONFIG = {
  currentVersion: 11,
  window: 1,
  digits: 6
} as const;

export class TOTPStatusImpl implements TOTPStatus {
  constructor(public version: number) {}

  isConfigured(): boolean {
    return this.version !== -1;
  }

  hasActiveSetup(): boolean {
    return this.version === -2;
  }

  needsUpgrade(currentVersion: number): boolean {
    return this.version < currentVersion;
  }
}
