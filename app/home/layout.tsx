'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/utils/app-state';
import Logger from '@/lib/utils/logging';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  Logger.debug('[HomeLayout] Component mounting');

  const router = useRouter();
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useAppState();
  Logger.debug('[HomeLayout] Initial state:', { hasCompletedOnboarding });

  const hasChecked = useRef(false);
  Logger.debug('[HomeLayout] hasChecked ref:', { current: hasChecked.current });

  useEffect(() => {
    const checkOnboarding = async () => {
      Logger.debug('[HomeLayout] Starting onboarding check', { 
        hasChecked: hasChecked.current,
        hasCompletedOnboarding,
        isInitialCheck: !hasChecked.current && hasCompletedOnboarding !== true
      });

      if (hasChecked.current || hasCompletedOnboarding === true) {
        Logger.debug('[HomeLayout] Skipping check', { 
          reason: hasChecked.current ? 'already checked' : 'already completed' 
        });
        return;
      }
      hasChecked.current = true;

      try {
        Logger.debug('[HomeLayout] Fetching preferences');
        const response = await fetch('/api/user/preferences');
        if (!response.ok) {
          Logger.debug('[HomeLayout] Preferences check failed', { 
            status: response.status,
            statusText: response.statusText 
          });
          return;
        }
        const data = await response.json();
        Logger.debug('[HomeLayout] Raw preferences data:', data);
        
        const hasCompleted = data.preferences?.some(
          (pref: any) => pref.preference_key === 'hasCompletedOnboarding' && pref.preference_value === 'true'
        );
        
        Logger.debug('[HomeLayout] Processed onboarding status', { hasCompleted });
        setHasCompletedOnboarding(hasCompleted);
        if (!hasCompleted) {
          Logger.debug('[HomeLayout] Initiating redirect to onboarding');
          router.push('/onboarding');
        }
      } catch (error) {
        Logger.debug('[HomeLayout] Error checking onboarding:', error);
      }
    };

    checkOnboarding();
  }, [router, setHasCompletedOnboarding, hasCompletedOnboarding]);

  return <>{children}</>;
} 