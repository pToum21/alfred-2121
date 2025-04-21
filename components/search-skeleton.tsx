'use client'

import React from 'react'
import { Skeleton } from './ui/skeleton'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export const SearchSkeleton = () => {
  const container = {
    show: {
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
    <motion.div 
      className="flex gap-2 pb-2 items-stretch w-max"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <motion.div 
          key={index} 
          className="w-[200px] shrink-0"
          variants={item}
        >
          <div className="h-full rounded-lg bg-background/50 p-3 border border-border/5">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 flex-1 rounded-md" />
            </div>
            <Skeleton className="h-[36px] w-full rounded-md mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
              <Skeleton className="h-2.5 w-16 rounded-md" />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

interface AnalysisSkeletonProps {
  title?: string
}

export const AnalysisSkeleton: React.FC<AnalysisSkeletonProps> = ({ title = "content" }) => {
  return (
    <motion.div 
      className="flex items-center gap-3 text-muted-foreground"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <span>Analyzing {title}...</span>
    </motion.div>
  )
}