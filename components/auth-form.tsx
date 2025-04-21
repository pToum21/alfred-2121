// components/auth-form.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TOTPSetupResponse, TOTPVerifyResponse, AuthResponse, AuthState, LoginResponse } from '@/lib/types/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/utils/auth-provider';
import Logger from '@/lib/utils/logging';
import FoundationLoading from '@/components/ui/foundation-loading';
import { Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Lock, Loader2 } from "lucide-react";
import { getNewChatUrl } from '@/lib/services/chat-navigation'

interface AuthFormProps {
  mode: 'login' | 'register';
}

// Simple logo component that only shows the icon
const IconOnly = () => (
  <div className="relative flex items-center justify-center w-9 h-8">
    <div style={{ transform: 'scale(0.3)' }}>
      <FoundationLoading size="tiny" autoPlay={false} />
    </div>
  </div>
);

export default function AuthForm({ mode }: AuthFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpQrCode, setTotpQrCode] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<'initial' | 'setup-totp' | 'verify-totp'>('initial');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    Logger.auth(`[AuthForm] Setup step changed to: ${setupStep}`);
  }, [setupStep]);

  const handleTOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
    setTotpCode(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    Logger.auth(`[AuthForm] Starting ${mode} submission`);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          totpCode: totpCode || undefined
        }),
        credentials: 'include'
      });

      const data: LoginResponse = await response.json();
      Logger.auth(`[AuthForm] ${mode} response:`, data);

      switch (data.state) {
        case AuthState.NEEDS_TOTP_SETUP:
          Logger.auth('[AuthForm] TOTP setup required');
          Logger.auth('[AuthForm] Cookies:', document.cookie);
          const setupResponse = await fetch('/api/auth/setup-totp', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });
          
          const setupData: TOTPSetupResponse = await setupResponse.json();
          Logger.auth('[AuthForm] TOTP setup response:', setupData);
          
          if (setupResponse.ok && setupData.success && setupData.qrCode) {
            setTotpQrCode(setupData.qrCode);
            setSetupStep('setup-totp');
            toast.info('Please complete two-factor authentication setup');
          } else {
            throw new Error(setupData.error || 'Failed to initiate TOTP setup');
          }
          break;

        case AuthState.NEEDS_TOTP_CODE:
          Logger.auth('[AuthForm] TOTP verification required');
          setSetupStep('verify-totp');
          setTotpCode('');
          toast.info('Please enter your authentication code');
          break;
          
        case AuthState.AUTHENTICATED:
          if (!response.ok) {
            throw new Error(data.message || `${mode} failed`);
          }
          Logger.auth('[AuthForm] Login successful');
          login(data.token);
          toast.success(`${mode === 'login' ? 'Login' : 'Registration'} successful`);
          router.push(getNewChatUrl());
          break;
          
        case AuthState.NEEDS_CREDENTIALS:
          if (mode === 'register' && data.success) {
            toast.success(data.message);
            router.push('/login');
            break;
          }
          throw new Error(data.message || `${mode} failed`);
      }

    } catch (error) {
      Logger.auth('[AuthForm] Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTOTPSetup = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-[350px] mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">{mode === 'login' ? 'Login' : 'Create Account'}</CardTitle>
            <div className="scale-75 origin-right">
              <IconOnly />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="tex it-center space-y-2">
            <p className="text-sm text-muted-foreground">
              1. Install an authenticator app like Google Authenticator
            </p>
            <p className="text-sm text-muted-foreground">
              2. Scan this QR code with your app
            </p>
            <p className="text-sm text-muted-foreground">
              3. Enter the 6-digit code shown in your app
            </p>
          </div>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : totpQrCode ? (
            <div className="flex justify-center">
              <img src={totpQrCode} alt="TOTP QR Code" className="w-48 h-48" />
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={totpCode}
              onChange={handleTOTPChange}
              placeholder="Enter 6-digit code"
              disabled={isLoading}
              maxLength={6}
              pattern="\d{6}"
              className="text-center text-2xl tracking-wider"
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || totpCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderTOTPVerify = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-[350px] mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
            <div className="scale-75 origin-right">
              <IconOnly />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Enter the 6-digit code from your authenticator app
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={totpCode}
              onChange={handleTOTPChange}
              placeholder="Enter 6-digit code"
              disabled={isLoading}
              maxLength={6}
              pattern="\d{6}"
              className="text-center text-2xl tracking-wider"
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || totpCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderInitialForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-[350px] mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">{mode === 'login' ? 'Login' : 'Create Account'}</CardTitle>
            <div className="scale-75 origin-right">
              <IconOnly />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            {mode === 'login' && (
              <p className="text-xs text-center text-muted-foreground">
                By logging in, you agree to our{' '}
                <Link 
                  href="/terms.html" 
                  className="underline hover:text-primary" 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </Link>
              </p>
            )}
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          {mode === 'login' ? (
            <Link href="/register" className="text-sm text-muted-foreground hover:text-primary">
              Don't have an account? Register
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
              Already have an account? Login
            </Link>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      {setupStep === 'setup-totp' && renderTOTPSetup()}
      {setupStep === 'verify-totp' && renderTOTPVerify()}
      {setupStep === 'initial' && renderInitialForm()}
    </AnimatePresence>
  );
}