// Based on: https://github.com/vercel/ai/blob/main/examples/next-ai-rsc/components/llm-stocks/spinner.tsx

import { Card } from './card'
import { IconLogo } from './icons'
import { cn } from '@/lib/utils';
import { Loader2, LucideProps } from "lucide-react";

export function Spinner({ className, label }: { className?: string, label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

export const ChatSpinner = () => (
  <div className="flex py-4 pl-4" data-spinner>
    <Spinner />
  </div>
)

export const LogoSpinner = () => (
  <div className="p-4 border border-background">
    <IconLogo className="w-4 h-4 animate-spin" />
  </div>
)
