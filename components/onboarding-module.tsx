'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/utils/auth-provider'
import { useAppState } from '@/lib/utils/app-state'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
import Logger from '@/lib/utils/logging'
import { getNewChatUrl } from '@/lib/services/chat-navigation'

const OCCUPATIONS = [
  { id: 'realtor', label: 'Realtor', color: 'bg-blue-500' },
  { id: 'broker', label: 'Broker', color: 'bg-purple-500' },
  { id: 'investor', label: 'Investor', color: 'bg-green-500' },
  { id: 'lender', label: 'Mortgage Lender', color: 'bg-red-500' },
  { id: 'appraiser', label: 'Appraiser', color: 'bg-yellow-500' },
  { id: 'developer', label: 'Developer', color: 'bg-indigo-500' },
  { id: 'property-manager', label: 'Property Manager', color: 'bg-pink-500' },
  { id: 'title-agent', label: 'Title Agent', color: 'bg-orange-500' },
  { id: 'home-inspector', label: 'Home Inspector', color: 'bg-teal-500' },
  { id: 'other', label: 'Other', color: 'bg-gray-500' }
]

export function OnboardingModule() {
  const [step, setStep] = useState(1)
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useAppState()
  const [name, setName] = useState('')
  const [selectedOccupation, setSelectedOccupation] = useState('')
  const [customOccupation, setCustomOccupation] = useState('')
  const [interests, setInterests] = useState('')

  useEffect(() => {
    console.log('OnboardingModule mounted', {
      isAuthenticated,
      hasCompletedOnboarding
    })
  }, [isAuthenticated, hasCompletedOnboarding])

  const handleNext = async () => {
    if (!isValidStep()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (step < 3) {
      setStep(step + 1)
    } else {
      await completeOnboarding()
    }
  }

  const isValidStep = () => {
    switch (step) {
      case 1:
        return name.trim().length > 0
      case 2:
        return selectedOccupation !== '' && (selectedOccupation !== 'other' || customOccupation.trim().length > 0)
      case 3:
        return interests.trim().length > 0
      default:
        return false
    }
  }

  const completeOnboarding = async () => {
    Logger.debug('[OnboardingModule] Starting to save preferences');
    try {
      // Save each preference with a unique key
      const preferences = [
        {
          key: 'hasCompletedOnboarding',
          value: 'true'
        },
        {
          key: 'name',
          value: `The user's name is ${name}.`
        },
        {
          key: 'occupation',
          value: `The user's occupation is ${selectedOccupation === 'other' ? customOccupation : 
            OCCUPATIONS.find(o => o.id === selectedOccupation)?.label}.`
        },
        {
          key: 'interests',
          value: `The user's interests include: ${interests}`
        }
      ];

      Logger.debug('[OnboardingModule] Saving preferences', { preferences });

      // Save each preference individually
      for (const pref of preferences) {
        Logger.debug('[OnboardingModule] Saving preference', { key: pref.key });
        await fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            preference_key: pref.key,
            preference_value: pref.value 
          })
        });
      }

      Logger.debug('[OnboardingModule] All preferences saved successfully');
      setHasCompletedOnboarding(true);
      toast.success('Onboarding completed successfully!');
      router.push(getNewChatUrl());
    } catch (error) {
      Logger.debug('[OnboardingModule] Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  if (!isAuthenticated) {
    console.log('Not authenticated, returning null')
    return null
  }

  console.log('Rendering onboarding form', { step })

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>Welcome to Chat ALFReD</CardTitle>
          <CardDescription>Let's get to know you better (Step {step} of 3)</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <Label htmlFor="name">What's your name?</Label>
              <Input 
                id="name" 
                placeholder="Enter your name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label>What's your occupation?</Label>
              <div className="grid grid-cols-2 gap-2">
                {OCCUPATIONS.map((occupation) => (
                  <Badge
                    key={occupation.id}
                    variant="secondary"
                    className={`cursor-pointer p-2 text-center ${
                      selectedOccupation === occupation.id 
                        ? `${occupation.color} text-white` 
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedOccupation(occupation.id)}
                  >
                    {occupation.label}
                  </Badge>
                ))}
              </div>
              {selectedOccupation === 'other' && (
                <Input
                  placeholder="Enter your occupation"
                  value={customOccupation}
                  onChange={(e) => setCustomOccupation(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label htmlFor="interests">What are your main interests in real estate?</Label>
              <Input 
                id="interests" 
                placeholder="e.g., Residential Sales, Commercial Development, Market Analysis" 
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This helps us tailor content and responses to your specific interests
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex w-full gap-4">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              className="flex-1"
              disabled={!isValidStep()}
            >
              {step < 3 ? 'Next' : 'Complete'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}