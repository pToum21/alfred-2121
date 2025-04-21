import React from 'react';
import { Section } from './section';
import { Globe, ExternalLink } from 'lucide-react';
import { Avatar } from './ui/avatar';

export interface Citation {
  url: string;
  title: string;
  index: number;
}

interface CitationsSectionProps {
  citations: Citation[];
}

const CitationBadge = ({ url, title, index }: Citation) => {
  const [faviconError, setFaviconError] = React.useState(false);
  let domain: string;
  
  try {
    domain = new URL(url).hostname;
  } catch (error) {
    console.error('Error parsing URL:', error);
    domain = '';
  }

  const domainInitial = domain.charAt(0).toUpperCase();

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="inline-flex items-center px-2 py-1 text-[11px] rounded 
        bg-zinc-100/50 hover:bg-zinc-100 
        dark:bg-zinc-800/50 dark:hover:bg-zinc-800
        text-zinc-600 hover:text-zinc-900
        dark:text-zinc-400 dark:hover:text-zinc-200
        transition-all duration-200 no-underline border border-zinc-200/50 dark:border-zinc-700/50
        hover:border-zinc-300 dark:hover:border-zinc-600
        group shadow-sm hover:shadow backdrop-blur-sm"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="bg-zinc-200/50 dark:bg-zinc-700/50 text-zinc-500 dark:text-zinc-400 
          px-1 py-0.5 rounded-sm text-[10px] tabular-nums">{index}</span>
        <Avatar className="w-3 h-3 text-[9px] flex items-center justify-center 
          bg-zinc-200/50 dark:bg-zinc-700/50">
          {faviconError ? (
            domainInitial
          ) : (
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
              alt={domain}
              width={12}
              height={12}
              className="w-full h-full"
              onError={() => setFaviconError(true)}
              loading="lazy"
            />
          )}
        </Avatar>
        <span className="truncate max-w-[200px] text-[11px] group-hover:text-primary transition-colors">
          {title}
        </span>
        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary flex-shrink-0" />
      </span>
    </a>
  );
};

export function CitationsSection({ citations }: CitationsSectionProps) {
  if (!citations || citations.length === 0) return null;

  const titleContent = (
    <div className="flex items-center gap-2 px-1">
      <Globe className="h-3.5 w-3.5 text-zinc-400" />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        Sources
      </span>
    </div>
  );

  return (
    <Section title={titleContent}>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((citation) => (
          <CitationBadge key={citation.url} {...citation} />
        ))}
      </div>
    </Section>
  );
} 