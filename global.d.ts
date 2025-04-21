import * as crypto from 'crypto';

declare global {
  interface Window {
    crypto: typeof crypto;
  }
}