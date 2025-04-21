'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface RetrieveSkeletonProps {
  url?: string;
}

const RetrieveSkeleton: React.FC<RetrieveSkeletonProps> = ({ url }) => {
  let hostname = 'unknown';
  try {
    const urlWithProtocol = url?.startsWith('http') ? url : `https://${url}`;
    hostname = new URL(urlWithProtocol).hostname.replace('www.', '');
  } catch (e) {
    console.error('Invalid URL:', url);
  }

  return (
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
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      </div>
      <span className="text-xs font-medium">
        Reading {hostname}...
      </span>
      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
    </motion.div>
  )
}

export { RetrieveSkeleton }
export default RetrieveSkeleton 