import React from 'react';
import { IconLogo } from '@/components/ui/icons';
import Link from 'next/link';

interface AuthPageLayoutProps {
  children: React.ReactNode;
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background pt-[20vh]">
      <Link href="/" className="mb-8">
        <IconLogo className="w-16 h-16" />
      </Link>
      {children}
    </div>
  );
}