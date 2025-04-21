'use client'

import { useState, useEffect } from 'react'
import { Header } from './header'
import { cn } from '@/lib/utils'
import { useAppState } from '@/lib/utils/app-state'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  // Since we're using a sidebar now, this wrapper is no longer needed
  // We'll return just the children directly
  return <>{children}</>;
}