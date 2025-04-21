import { Sparkles } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

// Replace with Foundation CREF logo
function IconLogo({ className, ...props }: React.ComponentProps<'img'>) {
  return (
    <img
      src="/foundationcref-logo.jpg"
      alt="Foundation CREF Logo"
      className={cn('h-12 w-12', className)}
      {...props}
    />
  );
}


function IconSparkles({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Sparkles
      className={cn('h-4 w-4', className)}
      {...props}
    />
  );
}

export { IconLogo, IconSparkles };