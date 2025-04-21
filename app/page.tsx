'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/loading-spinner'

// The metadata should be in a separate file or handled by Next.js layout
// export const metadata = {
//   title: 'Chat ALFReD by Impact Capitol'
// }

export default function AuthWrapper() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page instead of search page
    router.push('/home')
  }, [router])

  return <LoadingSpinner />
}