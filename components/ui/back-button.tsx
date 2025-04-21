'use client'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAppState } from '@/lib/utils/app-state'


export function BackButton() {
  const pathname = usePathname()
  const router = useRouter()
  const { isHeaderOpen } = useAppState()


  // Only show on specific pages
  const shouldShow = (
    pathname.startsWith('/search/') || // Show on individual chat pages
    pathname === '/llm-providers' ||   // Show on settings page
    pathname.includes('/settings/')     // Show on other settings pages
  )


  // Hide on auth pages and pages where we don't want the back button
  if (!shouldShow || pathname === '/login' || pathname === '/register' || pathname === '/search') {
    return null
  }


  const handleBack = () => {
    router.back()
  }


  return (
    <div className={`fixed top-20 md:top-6 z-40 transition-all duration-300 ${isHeaderOpen ? 'left-[260px]' : 'left-[72px]'} md:block hidden`}>
      <button
        onClick={handleBack}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>
    </div>
  )
}


// Server Component Wrapper
export function BackButtonWrapper() {
  return <BackButton />
}