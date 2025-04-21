'use client';

import { StreamableValue, useStreamableValue } from 'ai/rsc';
import { ChevronDown, InfoIcon, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ThinkingMessageProps {
  isThinking: StreamableValue<boolean>;
  scratchpad?: StreamableValue<string>;
}

export function ThinkingMessage({ isThinking, scratchpad }: ThinkingMessageProps) {
  const [thinking] = useStreamableValue(isThinking);
  const [scratchpadContent] = useStreamableValue(scratchpad);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Auto-collapse when thinking completes
  useEffect(() => {
    if (!thinking && scratchpadContent) {
      setIsExpanded(false);
    }
  }, [thinking, scratchpadContent]);
  
  // Show if thinking or has scratchpad content
  if (!thinking && !scratchpadContent) return null;

  return (
    <div className="relative space-y-2 mb-6">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 mb-1 hover:bg-muted/50 rounded-md p-1 -ml-1 transition-colors group"
      >
        <div className="flex items-center justify-center w-7 h-7 relative">
          {thinking ? (
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                color: ['#2c7359', '#f7df1e', '#2c7359'] 
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="flex items-center justify-center"
            >
              <Lightbulb className="h-5 w-5" />
            </motion.div>
          ) : (
            <Lightbulb className="h-5 w-5 text-[#2c7359]" />
          )}
        </div>
        <span className="text-xs font-medium text-muted-foreground/90 dark:text-muted-foreground flex-1 text-left">
          {thinking ? "ALFReD is thinking..." : "ALFReD's thought process"}
        </span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center p-0.5 rounded-full hover:bg-muted/50 opacity-70 hover:opacity-100 transition-opacity">
                <InfoIcon className="w-3.5 h-3.5 text-muted-foreground/70" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              <p>ALFReD uses this space to track research progress, organize findings, and maintain focus on your objectives. It helps ensure accurate and relevant responses.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {scratchpadContent && (
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-muted-foreground/50 transition-transform duration-200 opacity-0 group-hover:opacity-100",
              isExpanded ? "transform rotate-180" : ""
            )} 
          />
        )}
      </button>
      
      {scratchpadContent && isExpanded && (
        <div className="pl-7 pr-4 text-sm text-muted-foreground/90 dark:text-muted-foreground/80 font-mono">
          <div className="relative">
            <div className="absolute left-0 w-px h-full bg-gradient-to-b from-[#2c7359]/50 dark:from-[#2c7359]/50 to-transparent" />
            <div className="pl-3 space-y-1">
              {scratchpadContent.split('\n').map((line, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "transition-opacity duration-300",
                    thinking ? "animate-in fade-in slide-in-from-left-1" : ""
                  )}
                  style={{ 
                    animationDelay: `${i * 100}ms`,
                    opacity: thinking ? 0.9 : 0.7 
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}