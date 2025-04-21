'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/utils/auth-provider';
import { toast } from 'sonner';

export function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <Button 
      onClick={handleLogout}
      variant="ghost"
    >
      Logout
    </Button>
  );
} 