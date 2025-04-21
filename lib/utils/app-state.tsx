'use client'

import { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react'
import { WebSearchResult } from '@/lib/types'
import Logger from '@/lib/utils/logging'
import { usePathname } from 'next/navigation'

interface AppState {
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  isHeaderOpen: boolean;
  toggleHeader: () => void;
  userSearchResults: WebSearchResult[];
  setUserSearchResults: (results: WebSearchResult[]) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isAuthPage: boolean;
  resetChatState: () => void;
  userPreferences: string[];
  setUserPreferences: (preferences: string[]) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined)

export const models = [
  { provider: 'OpenAI', name: 'gpt-4o-mini-2024-07-18', label: 'GPT-4 Mini' },
  { provider: 'OpenAI', name: 'gpt-4o-2024-08-06', label: 'GPT-4' },
  { provider: 'Anthropic', name: 'claude-3-7-sonnet-20250219', label: 'Claude 3.5 Sonnet' },
  { provider: 'Anthropic', name: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { provider: 'Anthropic', name: 'claude-3-7-sonnet-20250219', label: 'Claude 3.5 Haiku' },
];

export function AppStateProvider({ children }: { children: ReactNode }) {
  Logger.debug('[AppStateProvider] Initializing provider');
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [selectedModel, setSelectedModel] = useState<string>('claude-3-7-sonnet-20250219')
  const [isHeaderOpen, setIsHeaderOpen] = useState<boolean>(true)
  const [userSearchResults, setUserSearchResults] = useState<WebSearchResult[]>([])
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [userPreferences, setUserPreferences] = useState<string[]>([])

  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'

  const resetChatState = useCallback(() => {
    Logger.debug('[AppStateProvider] Resetting chat state');
    setIsGenerating(false);
    setUserSearchResults([]);
    if (typeof window !== 'undefined') {
      // Clear any chat-related local storage
      localStorage.removeItem('lastChatId');
      localStorage.removeItem('chatHistory');
    }
  }, []);

  const toggleHeader = useCallback(() => {
    if (!isAuthPage) {
      setIsHeaderOpen(prevState => !prevState)
    }
  }, [isAuthPage])

  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel')
    if (savedModel && models.some(model => model.name === savedModel)) {
      setSelectedModel(savedModel)
    }
  }, [])

  useEffect(() => {
    console.log('AppStateProvider: Selected model changed:', selectedModel)
    localStorage.setItem('selectedModel', selectedModel)
  }, [selectedModel])

  useEffect(() => {
    console.log('AppStateProvider: hasCompletedOnboarding changed:', hasCompletedOnboarding)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasCompletedOnboarding', hasCompletedOnboarding.toString())
    }
  }, [hasCompletedOnboarding])

  useEffect(() => {
    if (!isAuthPage) {
      console.log('AppStateProvider: isHeaderOpen changed:', isHeaderOpen)
      if (typeof window !== 'undefined') {
        document.body.style.setProperty('--header-width', isHeaderOpen ? '240px' : '60px')
      }
    } else {
      // Ensure header is closed and --header-width is removed on auth pages
      setIsHeaderOpen(false)
      if (typeof window !== 'undefined') {
        document.body.style.removeProperty('--header-width')
      }
    }
  }, [isHeaderOpen, isAuthPage])

  useEffect(() => {
    if (isAuthPage) {
      setIsHeaderOpen(false)
      if (typeof window !== 'undefined') {
        document.body.style.removeProperty('--header-width')
      }
    }
  }, [isAuthPage])

  const safeSetHasCompletedOnboarding = useCallback((value: boolean) => {
    Logger.debug('[AppStateProvider] Setting hasCompletedOnboarding:', { value, current: hasCompletedOnboarding });
    setHasCompletedOnboarding(value)
  }, [hasCompletedOnboarding]);

  const value: AppState = {
    isGenerating,
    setIsGenerating,
    selectedModel,
    setSelectedModel,
    isHeaderOpen,
    toggleHeader,
    userSearchResults,
    setUserSearchResults,
    hasCompletedOnboarding,
    setHasCompletedOnboarding: safeSetHasCompletedOnboarding,
    isAuthenticated,
    setIsAuthenticated,
    isAuthPage,
    resetChatState,
    userPreferences,
    setUserPreferences
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}