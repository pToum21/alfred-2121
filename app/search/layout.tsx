'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/utils/app-state';
import Logger from '@/lib/utils/logging';

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  Logger.debug('[SearchLayout] Component mounting');

  const router = useRouter();
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useAppState();
  Logger.debug('[SearchLayout] Initial state:', { hasCompletedOnboarding });

  const hasChecked = useRef(false);
  Logger.debug('[SearchLayout] hasChecked ref:', { current: hasChecked.current });

  useEffect(() => {
    const checkOnboarding = async () => {
      Logger.debug('[SearchLayout] Starting onboarding check', { 
        hasChecked: hasChecked.current,
        hasCompletedOnboarding,
        isInitialCheck: !hasChecked.current && hasCompletedOnboarding !== true
      });

      if (hasChecked.current || hasCompletedOnboarding === true) {
        Logger.debug('[SearchLayout] Skipping check', { 
          reason: hasChecked.current ? 'already checked' : 'already completed' 
        });
        return;
      }
      hasChecked.current = true;

      try {
        Logger.debug('[SearchLayout] Fetching preferences');
        const response = await fetch('/api/user/preferences');
        if (!response.ok) {
          Logger.debug('[SearchLayout] Preferences check failed', { 
            status: response.status,
            statusText: response.statusText 
          });
          return;
        }
        const data = await response.json();
        Logger.debug('[SearchLayout] Raw preferences data:', data);
        
        const hasCompleted = data.preferences?.some(
          (pref: any) => pref.preference_key === 'hasCompletedOnboarding' && pref.preference_value === 'true'
        );
        
        Logger.debug('[SearchLayout] Processed onboarding status', { hasCompleted });
        setHasCompletedOnboarding(hasCompleted);
        if (!hasCompleted) {
          Logger.debug('[SearchLayout] Initiating redirect to onboarding');
          router.push('/onboarding');
        }
      } catch (error) {
        Logger.debug('[SearchLayout] Error checking onboarding:', error);
      }
    };

    checkOnboarding();
  }, [router, setHasCompletedOnboarding, hasCompletedOnboarding]);

  return <>{children}</>;
} 