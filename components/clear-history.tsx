'use client'

import { useState, useTransition } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { clearChats } from '@/lib/actions/chat'
import { toast } from 'sonner'
import { Spinner } from './ui/spinner'
import { Trash2 } from 'lucide-react'

type ClearHistoryProps = {
  empty: boolean
}

export function ClearHistory({ empty }: ClearHistoryProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="w-full text-xs text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-start gap-2 px-3 py-1.5" 
          disabled={empty}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="font-normal">Clear all conversations</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear conversation history?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all your conversations. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="text-sm">Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm"
            onClick={event => {
              event.preventDefault()
              startTransition(async () => {
                const result = await clearChats()
                if (result?.error) {
                  toast.error(result.error)
                } else {
                  toast.success('History cleared')
                }
                setOpen(false)
              })
            }}
          >
            {isPending ? <Spinner className="h-4 w-4" /> : 'Clear History'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
