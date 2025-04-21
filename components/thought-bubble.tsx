import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb, StickyNote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { StreamableValue, useStreamableValue } from 'ai/rsc';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface ThoughtBubbleProps {
  thoughts: StreamableValue<string>;
  isStreaming: StreamableValue<boolean>;
}

export function ThoughtBubble({ thoughts, isStreaming }: ThoughtBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayedThoughts] = useStreamableValue(thoughts);
  const [isStreamingValue] = useStreamableValue(isStreaming);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formattedThoughts = displayedThoughts ? displayedThoughts : 'No thoughts yet';

  return (
    <div ref={bubbleRef} className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-8 rounded-full"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isStreamingValue ? (
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
                  <Lightbulb className="h-4 w-4" />
                </motion.div>
              ) : (
                <Lightbulb className="h-4 w-4 text-[#2c7359]" />
              )}
              <span className="sr-only">View ALFReD&apos;s thoughts</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>View ALFReD&apos;s thoughts</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {isExpanded && (
        <Card className="absolute top-10 right-0 w-64 shadow-lg z-50 bg-opacity-80 backdrop-blur-sm bg-background/80 border border-border/50">
          <CardHeader className="p-3 bg-muted/30 flex flex-row items-center space-x-2 border-b border-border/30">
            <StickyNote className="h-4 w-4 text-foreground" />
            <CardTitle className="text-sm font-normal text-foreground">ALFReD&apos;s Thoughts</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ScrollArea className="h-[200px] w-full pr-4">
              <div className="prose prose-sm max-w-none text-foreground" style={{ fontStyle: 'italic' }}>
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p {...props} style={{ marginBottom: '0.5em' }} />,
                    a: ({ node, ...props }) => <a {...props} className="text-foreground no-underline hover:underline" />
                  }}
                >
                  {formattedThoughts}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}