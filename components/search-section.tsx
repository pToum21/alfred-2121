'use client';

import React from 'react';
import SearchResults from './search-results';
import { SearchSkeleton } from './search-skeleton';
import { Section } from './section';
import type { SearchResults as TypeSearchResults } from '@/lib/types';
import { StreamableValue, useStreamableValue } from 'ai/rsc';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export type SearchSectionProps = {
  result?: StreamableValue<string>;
};

export function SearchSection({ result }: SearchSectionProps) {
  const [data, error, pending] = useStreamableValue(result);
  const searchResults: TypeSearchResults | undefined = data ? JSON.parse(data) : undefined;
  
  // Extract query from the first data we receive
  const [initialQuery, setInitialQuery] = React.useState<string>('');
  React.useEffect(() => {
    if (data && !initialQuery) {
      try {
        const parsed = JSON.parse(data);
        setInitialQuery(parsed.query || '');
      } catch (e) {
        // Handle parse error silently
      }
    }
  }, [data, initialQuery]);

  const query = searchResults?.query || initialQuery;

  if (error) {
    return (
      <Section className="pt-2 pb-0">
        <Card className="p-4 mt-2 text-sm">
          An error occurred while searching. Please try again.
        </Card>
      </Section>
    );
  }

  return (
    <div className="space-y-2">
      <motion.div 
        className="flex items-center gap-2 mb-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={cn(
          "p-1.5 rounded-full transition-all duration-700",
          pending ? "bg-blue-500/20 animate-glow" : "bg-muted"
        )}>
          <Search 
            className={cn(
              "h-3.5 w-3.5 transition-colors duration-200",
              pending ? "text-blue-500" : "text-muted-foreground"
            )} 
          />
        </div>
        <motion.span 
          className="text-xs font-medium text-muted-foreground"
          layout
        >
          {pending 
            ? `ALFReD is searching...`
            : query 
              ? `Search results for "${query}"`
              : 'Search results'}
        </motion.span>
      </motion.div>

      <ScrollArea className="w-full relative" scrollHideDelay={0}>
        <div className="flex-1 w-full overflow-x-auto">
          <div className="pl-7 pr-4">
            <AnimatePresence mode="wait">
              {!pending && searchResults ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-[calc(100vw-4rem)]"
                >
                  <SearchResults
                    webResults={searchResults.webResults}
                    pineconeResults={searchResults.pineconeResults}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SearchSkeleton />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>

      <style jsx global>{`
        @keyframes glow {
          0% {
            background-color: rgba(59, 130, 246, 0.1);
          }
          50% {
            background-color: rgba(59, 130, 246, 0.3);
          }
          100% {
            background-color: rgba(59, 130, 246, 0.1);
          }
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}