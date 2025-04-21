'use client'

import React, { useState } from 'react'
import { WebSearchResult } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, ExternalLink, Calendar, Clock, Globe, Link2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface RetrieveResultCardProps {
  result: WebSearchResult;
}

const RetrieveResultCard: React.FC<RetrieveResultCardProps> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHoveringTitle, setIsHoveringTitle] = useState(false)
  
  // Format the date nicely
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Get the domain name for display
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  };
  
  // Calculate estimated reading time based on words
  const getReadingTime = (content: string | undefined) => {
    if (!content) return '< 1 min';
    
    // Average reading speed (words per minute)
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    
    if (minutes < 1) return '< 1 min';
    return `${minutes} min${minutes > 1 ? 's' : ''}`;
  };
  
  // Format the content with basic markdown-like rendering
  const formatContent = (content: string) => {
    // Split by double newlines for paragraphs
    const paragraphs = content.split(/\n\n+/);
    
    return (
      <>
        {paragraphs.map((paragraph, i) => {
          // Check if it's a header
          if (paragraph.startsWith('# ')) {
            return (
              <h1 key={i} className="text-xl font-semibold text-foreground/90 mt-6 mb-3 tracking-tight">
                {paragraph.replace('# ', '')}
              </h1>
            );
          } else if (paragraph.startsWith('## ')) {
            return (
              <h2 key={i} className="text-lg font-semibold text-foreground/85 mt-5 mb-2 tracking-tight">
                {paragraph.replace('## ', '')}
              </h2>
            );
          } else if (paragraph.startsWith('### ')) {
            return (
              <h3 key={i} className="text-base font-medium text-foreground/80 mt-4 mb-2">
                {paragraph.replace('### ', '')}
              </h3>
            );
          } else if (paragraph.startsWith('- ')) {
            // Handle list items
            const items = paragraph.split('\n');
            return (
              <ul key={i} className="list-disc pl-6 my-3 space-y-1.5 text-foreground/75">
                {items.map((item, j) => (
                  <li key={j} className="text-sm leading-relaxed">
                    {item.replace('- ', '')}
                  </li>
                ))}
              </ul>
            );
          } else if (paragraph.trim() === '') {
            return null;
          } else {
            // Regular paragraph
            return (
              <p key={i} className="text-sm text-foreground/75 my-3 leading-relaxed">
                {paragraph}
              </p>
            );
          }
        })}
      </>
    );
  };

  return (
    <Card className="w-full overflow-hidden border border-border/5 bg-card/30 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/20">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
            <div className="relative flex-shrink-0 p-1 rounded-md bg-background/80 border border-border/10">
              <img 
                src={`https://www.google.com/s2/favicons?domain=${getDomain(result.url)}&sz=64`}
                alt=""
                className="w-4 h-4 rounded-sm"
              />
            </div>
            
            <div className="flex-1 min-w-0 relative group">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block max-w-full"
                onMouseEnter={() => setIsHoveringTitle(true)}
                onMouseLeave={() => setIsHoveringTitle(false)}
              >
                <CardTitle className="text-base font-medium text-foreground tracking-tight truncate group-hover:text-primary transition-colors relative">
                  {result.name}
                  <div className={`absolute -bottom-0.5 left-0 w-full h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                </CardTitle>
                
                <div className="absolute top-1/2 -translate-y-1/2 -right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link2 className="w-3 h-3 text-primary" />
                </div>
              </a>
            </div>
          </div>
          
          <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-normal bg-background/60 hover:bg-background/80 text-foreground/70 flex-shrink-0 ml-2">
            <Clock className="w-2.5 h-2.5 mr-1 text-primary/70" />
            {getReadingTime(result.fullContent)}
          </Badge>
        </div>
        
        <div className="flex items-center text-[11px] text-muted-foreground/60">
          <Calendar className="w-3 h-3 mr-1 text-muted-foreground/50" />
          <span>{formatDate(result.datePublished)}</span>
          <span className="mx-1.5 text-muted-foreground/30">•</span>
          <Globe className="w-3 h-3 mr-1 text-muted-foreground/50" />
          <span>{getDomain(result.url)}</span>
        </div>
      </CardHeader>
      
      <CardContent className="px-5 pt-0 pb-4">
        {/* Preview snippet */}
        {!isExpanded && (
          <div className="relative">
            <p className="text-sm text-muted-foreground/70 line-clamp-3 leading-relaxed">
              {result.snippet}
            </p>
            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card/90 to-transparent"></div>
          </div>
        )}
        
        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mt-1"
            >
              <ScrollArea className="max-h-[500px] pr-4 overflow-y-auto pb-2 relative">
                <div className="prose prose-sm max-w-none text-foreground/80">
                  {result.fullContent && formatContent(result.fullContent)}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex justify-between items-center mt-4 pt-2 border-t border-border/5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-normal text-muted-foreground hover:text-foreground/80 hover:bg-background/50 h-7 px-2 rounded-md transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 mr-1.5 text-muted-foreground/70" />
                <span>Collapse content</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground/70" />
                <span>Expand content</span>
              </>
            )}
          </Button>
          
          <a 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-normal text-primary/80 hover:text-primary flex items-center gap-1 hover:underline transition-colors"
          >
            <span>View original</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

export default RetrieveResultCard 