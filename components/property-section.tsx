'use client';

import React from 'react';
import PropertyResults from './property-results';
import { PropertySkeleton } from '@/components/property-skeleton';
import { Section } from './section';
import type { PropertySearchResults } from '@/lib/types';
import { StreamableValue, useStreamableValue } from 'ai/rsc';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { Building, Home, MapPin } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export type PropertySectionProps = {
  result?: StreamableValue<string>;
};

export function PropertySection({ result }: PropertySectionProps) {
  const [data, error, pending] = useStreamableValue(result);
  const propertyResults: PropertySearchResults | undefined = data ? JSON.parse(data) : undefined;
  
  // Extract location from the first data we receive
  const [initialLocation, setInitialLocation] = React.useState<string>('');
  React.useEffect(() => {
    if (data && !initialLocation) {
      try {
        const parsed = JSON.parse(data);
        setInitialLocation(parsed.query?.location || '');
      } catch (e) {
        // Handle parse error silently
      }
    }
  }, [data, initialLocation]);

  const location = propertyResults?.query?.location || initialLocation;
  const propertyType = propertyResults?.query?.propertyType;

  if (error) {
    return (
      <Section className="pt-2 pb-0">
        <Card className="p-4 mt-2 text-sm">
          An error occurred while searching for properties. Please try again.
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
          {propertyType ? (
            propertyType === 'residential' || propertyType === 'multifamily' ? (
              <Home
                className={cn(
                  "h-3.5 w-3.5 transition-colors duration-200",
                  pending ? "text-blue-500" : "text-muted-foreground"
                )} 
              />
            ) : (
              <Building
                className={cn(
                  "h-3.5 w-3.5 transition-colors duration-200",
                  pending ? "text-blue-500" : "text-muted-foreground"
                )} 
              />
            )
          ) : (
            <MapPin
              className={cn(
                "h-3.5 w-3.5 transition-colors duration-200",
                pending ? "text-blue-500" : "text-muted-foreground"
              )} 
            />
          )}
        </div>
        <motion.span 
          className="text-xs font-medium text-muted-foreground"
          layout
        >
          {pending 
            ? `Searching for properties...`
            : propertyResults?.summary 
              ? propertyResults.summary
              : location 
                ? `Properties in ${location}${propertyType ? ` (${propertyType})` : ''}`
                : propertyType
                  ? `${propertyType} properties`
                  : 'All properties'}
        </motion.span>
      </motion.div>

      <ScrollArea className="w-full relative" scrollHideDelay={0}>
        <div className="flex-1 w-full overflow-x-auto">
          <div className="pl-7 pr-4">
            <AnimatePresence mode="wait">
              {!pending && propertyResults ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-[calc(100vw-4rem)]"
                >
                  <PropertyResults
                    properties={propertyResults.properties}
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
                  <PropertySkeleton />
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