import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export interface TOTPSetupProps {
  userId: number;
  qrCode: string;
  onComplete: () => void;
}

export function TOTPSetup({ userId, qrCode, onComplete }: TOTPSetupProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const getSetupToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      if (data.tempToken) {
        setTempToken(data.tempToken);
      }
    } catch (error) {
      console.error('Error getting setup token:', error);
    }
  }, [userId]);

  useEffect(() => {
    getSetupToken();
  }, [getSetupToken]);

  const verifyTOTP = async () => {
    if (!tempToken) {
      toast.error('Setup token not available. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          tempToken
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('2FA setup complete!');
        onComplete();
      } else {
        toast.error(data.error || 'Invalid code. Please try again.');
      }
    } catch (error) {
      console.error('TOTP verification error:', error);
      toast.error('Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px] mx-auto">
      <CardHeader>
        <CardTitle>Setup Two-Factor Authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Image
            src={qrCode}
            alt="TOTP QR Code"
            width={200}
            height={200}
            unoptimized
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Scan this QR code with your authenticator app (like Google Authenticator or Authy)
          </p>
          <Input
            type="text"
            placeholder="Enter 6-digit code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            maxLength={6}
            pattern="[0-9]*"
            inputMode="numeric"
          />
          <Button 
            onClick={verifyTOTP} 
            className="w-full"
            disabled={isLoading || token.length !== 6 || !tempToken}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 