'use client'

import { useRef, useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Image from 'next/image'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ExternalLink, Clock, Archive, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { SearchResultDialog } from './search-result-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { WebSearchResult, PineconeSearchResult } from '@/lib/types'

export interface SearchResultsProps {
  webResults: WebSearchResult[];
  pineconeResults?: PineconeSearchResult[];
}

const formatDate = (dateString: string | number): string => {
  if (!dateString) return 'Unknown';
  try {
    let dateStr = dateString.toString();
    
    if (dateStr.match(/^\d{8}$/)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      dateStr = `${year}-${month}-${day}`;
    }
    
    const parsedDate = parseISO(dateStr);
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch (error) {
    return 'Unknown';
  }
};

export default function SearchResults({ webResults, pineconeResults = [] }: SearchResultsProps) {
  // Deduplicate but ensure we don't lose all Pinecone results
  const combinedResults = () => {
    // Create maps to track results by URL for each source
    const googleResultsByUrl = new Map<string, WebSearchResult>();
    const pineconeResultsByUrl = new Map<string, PineconeSearchResult>();
    
    // Populate the maps
    webResults.forEach(result => {
      if (result?.url) {
        googleResultsByUrl.set(result.url.toLowerCase(), result);
      }
    });
    
    pineconeResults.forEach(result => {
      if (result?.url) {
        pineconeResultsByUrl.set(result.url.toLowerCase(), result);
      }
    });
    
    // Track URLs we've already added to the final results
    const includedUrls = new Set<string>();
    const finalResults = [];
    
    // First, add all Pinecone results
    for (const [url, result] of pineconeResultsByUrl.entries()) {
      finalResults.push(result);
      includedUrls.add(url);
    }
    
    // Next, add unique Google results (not in Pinecone)
    for (const [url, result] of googleResultsByUrl.entries()) {
      if (!includedUrls.has(url)) {
        finalResults.push(result);
        includedUrls.add(url);
      }
    }
    
    return finalResults;
  };
  
  const uniqueResults = combinedResults();
  
  // Debug counts for development
  const googleCount = uniqueResults.filter(r => r.source === 'google').length;
  const pineconeCount = uniqueResults.filter(r => r.source === 'pinecone').length;
  
  console.log(`Displaying ${uniqueResults.length} total results (${googleCount} Google, ${pineconeCount} Pinecone)`);

  if (uniqueResults.length === 0) {
    return (
      <div className="text-xs text-muted-foreground/70 py-2">
        No results found.
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <TooltipProvider>
      <motion.div 
        className="flex gap-2 pb-4 items-stretch overflow-visible flex-nowrap"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {uniqueResults.map((result, index) => (
          <SearchResultDialog key={`dialog-${result.url}-${index}-${result.source}`} result={result}>
            <motion.div
              key={`${result.url}-${index}-${result.source}`}
              className="block w-[200px] shrink-0 group cursor-pointer relative"
              variants={item}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <div className={`relative h-full rounded-lg ${result.source === 'pinecone' ? 'bg-primary/5' : 'bg-background/50'} hover:bg-background/80 transition-all duration-200 p-3 border border-border/5 hover:border-border/20 hover:shadow-lg`}>
                {/* Content icon button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <div className="p-1 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background border border-border/10 hover:border-border/30 text-muted-foreground hover:text-foreground transition-all">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">View Source Content</p>
                  </TooltipContent>
                </Tooltip>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <Image
                      src={`https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=32`}
                      alt=""
                      width={12}
                      height={12}
                      className="w-3 h-3 transition-opacity group-hover:opacity-0 duration-200"
                    />
                    <ExternalLink className="w-3 h-3 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-primary" />
                  </div>
                  <motion.h3 
                    className="text-xs font-medium text-primary/90 group-hover:text-primary transition-colors duration-200 truncate flex-1"
                    layout
                  >
                    {result.source === 'google' ? result.name : result.title}
                  </motion.h3>
                </div>
                
                <motion.p 
                  className="text-[10px] leading-relaxed text-muted-foreground/70 group-hover:text-muted-foreground/90 transition-colors duration-200 line-clamp-3 mb-2 min-h-[36px]"
                  layout
                >
                  {result.source === 'pinecone'
                    ? result.fullContent?.substring(0, 120)
                    : result.snippet || ''}
                </motion.p>
                
                <div className="flex items-center justify-between">
                  <motion.div 
                    className="flex items-center text-[9px] text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors duration-200"
                    layout
                  >
                    <Clock className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {result.source === 'google'
                        ? formatDate(result.datePublished || '')
                        : formatDate(result.date || '')}
                    </span>
                  </motion.div>
                </div>
              </div>
              
              {/* Add a click interceptor for external links */}
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute inset-0 opacity-0"
                onClick={(e) => {
                  // Stop propagation to prevent dialog from opening on direct link click
                  e.stopPropagation();
                }}
                aria-hidden="true"
              />
            </motion.div>
          </SearchResultDialog>
        ))}
      </motion.div>
    </TooltipProvider>
  );
}