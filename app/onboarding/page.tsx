// app/onboarding/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/utils/auth-provider';
import { useAppState } from '@/lib/utils/app-state';
import { OnboardingModule } from '@/components/onboarding-module';
import { getNewChatUrl } from '@/lib/services/chat-navigation';
import Logger from '@/lib/utils/logging';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { hasCompletedOnboarding } = useAppState();

  useEffect(() => {
    if (!isAuthenticated) {
      Logger.debug('[OnboardingPage] Not authenticated, redirecting to login');
      router.push('/login');
    } else if (hasCompletedOnboarding) {
      Logger.debug('[OnboardingPage] Already completed onboarding, redirecting to home');
      router.push(getNewChatUrl());
    }
  }, [isAuthenticated, hasCompletedOnboarding, router]);

  if (!isAuthenticated || hasCompletedOnboarding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingModule />
    </div>
  );
}

