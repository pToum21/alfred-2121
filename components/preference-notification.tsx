// /components/preference-notification.tsx
'use client';

// /components/preference-notification.tsx

import React from 'react'
import { Card } from './ui/card'
import { CheckCircle } from 'lucide-react'
import { useTheme } from 'next-themes'

interface PreferenceNotificationProps {
  description: string
}

export function PreferenceNotification({ description }: PreferenceNotificationProps) {
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  return (
    <Card className={`p-4 mt-2 flex items-center space-x-2 ${
      isDarkMode 
        ? 'bg-background border-green-700' 
        : 'bg-green-50 border-green-200'
    }`}>
      <CheckCircle className={`h-5 w-5 ${
        isDarkMode ? 'text-green-500' : 'text-green-500'
      }`} />
      <p className={`text-sm ${
        isDarkMode ? 'text-green-500' : 'text-green-700'
      }`}>
        {description}
      </p>
    </Card>
  )
}