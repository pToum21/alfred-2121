import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface TOTPInputProps {
  onVerify: (token: string) => Promise<void>;
  tempToken?: string;
}

export function TOTPInput({ onVerify, tempToken }: TOTPInputProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isSetup, setIsSetup] = useState(false);

  const fetchQRCode = useCallback(async () => {
    try {
      console.log('Fetching QR code with tempToken:', tempToken);
      const response = await fetch('/api/auth/totp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken }),
      });
      
      const data = await response.json();
      console.log('QR code response:', data);
      
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setIsSetup(true);
      } else {
        console.error('No QR code in response:', data);
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      toast.error('Failed to load 2FA setup');
    }
  }, [tempToken]);

  useEffect(() => {
    if (tempToken && !isSetup) {
      fetchQRCode();
    }
  }, [tempToken, isSetup, fetchQRCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onVerify(token);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px] mx-auto">
      <CardHeader>
        <CardTitle>
          {isSetup ? 'Setup Two-Factor Authentication' : 'Two-Factor Authentication'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCode ? (
          <>
            <div className="flex justify-center">
              <Image
                src={qrCode}
                alt="TOTP QR Code"
                width={200}
                height={200}
                unoptimized
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code with your authenticator app (like Google Authenticator or Authy)
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Enter the 6-digit code from your authenticator app
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter 6-digit code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            maxLength={6}
            pattern="[0-9]*"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || token.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 