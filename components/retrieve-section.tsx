'use client'

import React, { useEffect } from 'react'
import { SearchResults as SearchResultsType } from '@/lib/types'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import RetrieveResultCard from '@/components/RetrieveResultCard'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface RetrieveSectionProps {
  data: SearchResultsType;
  analysisTime?: number;
}

const RetrieveSection: React.FC<RetrieveSectionProps> = ({ data, analysisTime = 0 }) => {
  // Log the analysis time for debugging
  useEffect(() => {
    console.log(`RetrieveSection received analysisTime: ${analysisTime}s`);
  }, [analysisTime]);

  // Handle error state
  if (data.status === 'error' || data.error) {
    return (
      <div className="space-y-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-5 rounded-lg border border-border/10 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100/20 p-2 flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="flex-1 space-y-1.5">
                <h3 className="text-sm font-medium text-foreground/90">Unable to Retrieve Content</h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">
                  {data.error || "We couldn't access the content from this website. The assistant will continue with available information."}
                </p>
                <div className="pt-2 flex items-center text-xs text-muted-foreground/60">
                  <RefreshCw className="h-3 w-3 mr-1.5 text-muted-foreground/40" />
                  <span>Retrieval attempted in {analysisTime.toFixed(1)}s</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Handle empty results
  if (data.webResults.length === 0 && data.pineconeResults.length === 0) {
    return (
      <div className="space-y-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-5 rounded-lg border border-border/10 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100/20 p-2 flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1 space-y-1.5">
                <h3 className="text-sm font-medium text-foreground/90">No Content Found</h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">
                  No content was retrieved. The assistant will continue with available information.
                </p>
                <div className="pt-2 flex items-center text-xs text-muted-foreground/60">
                  <RefreshCw className="h-3 w-3 mr-1.5 text-muted-foreground/40" />
                  <span>Retrieval attempted in {analysisTime.toFixed(1)}s</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  let hostname = 'unknown';
  try {
    if (data.webResults[0]?.url) {
      const urlWithProtocol = data.webResults[0].url.startsWith('http') 
        ? data.webResults[0].url 
        : `https://${data.webResults[0].url}`;
      hostname = new URL(urlWithProtocol).hostname.replace('www.', '');
    }
  } catch (e) {
    console.error('Invalid URL:', data.webResults[0]?.url);
  }

  // Format the analysis time with more precision for small values
  const formattedTime = analysisTime < 0.1 
    ? analysisTime.toFixed(2) 
    : analysisTime.toFixed(1);

  return (
    <div className="space-y-3 mb-6">
      <motion.div 
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-muted/50 w-fit"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative flex-shrink-0">
          <img 
            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
            alt=""
            className="w-4 h-4 rounded-sm"
          />
        </div>
        <span className="text-xs font-medium">
          Retrieved content from {hostname} in {analysisTime < 0.1 ? analysisTime.toFixed(2) : analysisTime < 1 ? analysisTime.toFixed(1) : Math.round(analysisTime)}s
        </span>
      </motion.div>
      
      <div className="space-y-4">
        {data.webResults.map((result, index) => (
          <RetrieveResultCard key={`${result.url}-${index}`} result={result} />
        ))}
      </div>
    </div>
  )
}

export default RetrieveSection