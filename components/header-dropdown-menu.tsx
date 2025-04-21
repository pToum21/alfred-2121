'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { Menu, History, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { useAppState } from "../lib/utils/app-state";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface HeaderDropdownMenuProps {
  onLogout: () => Promise<void>;
}

export const HeaderDropdownMenu: React.FC<HeaderDropdownMenuProps> = ({ onLogout }) => {
  const [mounted, setMounted] = useState(false);
  const { toggleHeader } = useAppState();
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleHistoryClick = useCallback(() => {
    console.log('History clicked');
    toggleHeader();
  }, [toggleHeader]);

  const handleSettingsClick = useCallback(() => {
    console.log('Settings clicked');
    router.push('/llm-providers');
  }, [router]);

  const handleLogoutClick = useCallback(async () => {
    console.log('Logout clicked');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        toast.success('Logged out successfully');
        router.push('/login');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  }, [router]);

  // Return null on server-side and initial render
  if (!mounted) {
    return <div className="w-10 h-10" />; // Placeholder to prevent layout shift
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                role="button"
                tabIndex={0}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 p-0 cursor-pointer"
              >
                <Menu className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Open menu</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleHistoryClick}>
                <History className="mr-2 h-4 w-4" />
                History
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              {/* Theme toggle disabled - light theme enforced app-wide */}
              <DropdownMenuItem disabled>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode (Default)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogoutClick}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          Open menu
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

