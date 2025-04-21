'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { History as HistoryIcon } from 'lucide-react'
import { Suspense } from 'react'
import { HistorySkeleton } from './history-skelton'
import { useAppState } from '@/lib/utils/app-state'

type HistoryProps = {
  children?: React.ReactNode
}

export function History({ children }: HistoryProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { isHeaderOpen } = useAppState()

  useEffect(() => {
    if (isHeaderOpen) {
      startTransition(() => {
        router.refresh()
      })
    }
  }, [isHeaderOpen, router])

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex items-center gap-2 text-lg font-normal mb-4 px-3 py-2">
        <HistoryIcon size={20} />
        History
      </div>
      <div className="h-[calc(100vh-300px)] overflow-y-auto pr-8">
        <Suspense fallback={<HistorySkeleton />}>{children}</Suspense>
      </div>
    </div>
  )
}