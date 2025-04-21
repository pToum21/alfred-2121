import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { WebSearchResult, PineconeSearchResult } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ExternalLink, Calendar, Database, Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

type SearchResultDialogProps = {
  result: WebSearchResult | PineconeSearchResult;
  children: React.ReactNode;
};

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

export function SearchResultDialog({ result, children }: SearchResultDialogProps) {
  // Extract the hostname from the URL for display
  const hostname = React.useMemo(() => {
    try {
      return new URL(result.url).hostname.replace('www.', '');
    } catch {
      return 'unknown source';
    }
  }, [result.url]);
  
  // Get the title based on result type
  const title = result.source === 'google' 
    ? result.title || result.name 
    : result.title;
  
  // Get the content based on result type
  const content = result.source === 'google' 
    ? result.fullContent || result.snippet || 'No content available'
    : result.fullContent || result.context || 'No content available';
    
  // Get the date based on result type
  const date = result.source === 'google'
    ? formatDate(result.datePublished || '')
    : formatDate(result.date || '');
    
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-10 flex items-start gap-2 text-lg">
            {result.source === 'google' ? (
              <Search className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Database className="h-5 w-5 text-violet-500 mt-0.5 flex-shrink-0" />
            )}
            <span className="flex-1">{title}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between text-sm mt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/90">{hostname}</span>
              <div className="flex items-center text-muted-foreground/70 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {date}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground/80">
                {result.source === 'google' ? 'Search Engine' : 'Knowledgebase'}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden mt-2 border rounded-md">
          <ScrollArea className="h-[50vh] p-4 text-sm">
            <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
              {content}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter className="flex items-center justify-between mt-4 gap-4">
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
            <span>
              ALFReD {result.source === 'google' ? 'searched' : 'retrieved'} this content to help answer your question
            </span>
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Close</Button>
            </DialogClose>
            <Button 
              size="sm"
              onClick={() => window.open(result.url, '_blank')}
              className="gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit Source
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 