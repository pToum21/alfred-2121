'use client'

import React from 'react';
import { MemoizedReactMarkdown } from './ui/markdown';
import rehypeExternalLinks from 'rehype-external-links';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Avatar } from './ui/avatar';
import { Globe, ExternalLink } from 'lucide-react';
import { Components } from 'react-markdown';
import { CitationsSection, Citation } from './citations-section';

const FaviconLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  const [faviconError, setFaviconError] = React.useState(false);

  let domain: string;
  try {
    domain = new URL(href).hostname;
  } catch (error) {
    console.error('Error parsing URL:', error);
    domain = '';
  }

  const domainInitial = domain.charAt(0).toUpperCase();

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="inline-flex items-center px-2.5 py-0.5 text-xs rounded-full 
        bg-zinc-100 hover:bg-zinc-200 
        dark:bg-zinc-800 dark:hover:bg-zinc-700
        text-zinc-700 hover:text-zinc-900
        dark:text-zinc-300 dark:hover:text-zinc-100
        transition-colors no-underline border border-zinc-200 dark:border-zinc-700"
    >
      <span className="inline-flex items-center">
        <Avatar className="w-3.5 h-3.5 mr-1.5 text-[10px] flex items-center justify-center 
          bg-zinc-200 dark:bg-zinc-700">
          {faviconError ? (
            domainInitial
          ) : (
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
              alt={domain}
              width={14}
              height={14}
              className="w-full h-full"
              onError={() => setFaviconError(true)}
              loading="lazy"
            />
          )}
        </Avatar>
        <span className="truncate max-w-[180px]">{children}</span>
      </span>
    </a>
  );
};

export function BotMessage({ content }: { content: string }) {
  const containsLaTeX = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/.test(content || '');
  const processedData = preprocessLaTeX(content || '');
  const [citations, setCitations] = React.useState<Citation[]>([]);
  const [processedContent, setProcessedContent] = React.useState(content);
  const citationsMapRef = React.useRef(new Map<string, Citation>());

  // Process citations whenever content changes
  React.useEffect(() => {
    if (!content) {
      citationsMapRef.current.clear();
      setCitations([]);
      setProcessedContent(content);
      return;
    }

    // Extract all markdown links from content
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = Array.from(content.matchAll(linkRegex));
    const newCitationsMap = new Map<string, Citation>();

    // Process all links into citations
    matches.forEach((match) => {
      const [fullMatch, title, url] = match;
      try {
        new URL(url); // Validate URL
        if (!newCitationsMap.has(url)) {
          const citation: Citation = {
            url,
            title,
            index: newCitationsMap.size + 1
          };
          newCitationsMap.set(url, citation);
        }
      } catch (e) {
        // Invalid URL, skip
      }
    });

    // Update citations state if there are changes
    if (newCitationsMap.size > 0) {
      citationsMapRef.current = newCitationsMap;
      const newCitations = Array.from(newCitationsMap.values())
        .sort((a, b) => a.index - b.index);
      setCitations(newCitations);

      // Replace markdown links with our special citation syntax
      let newContent = content;
      matches.forEach(([fullMatch, title, url]) => {
        const citation = newCitationsMap.get(url);
        if (citation) {
          newContent = newContent.replace(
            fullMatch,
            `\`cite:${citation.index}\``
          );
        }
      });
      setProcessedContent(newContent);
    } else {
      setProcessedContent(content);
    }
  }, [content]);

  const markdownComponents: Components = {
    code: ({ children }) => {
      if (typeof children === 'string' && children.startsWith('cite:')) {
        const index = Number(children.replace('cite:', ''));
        const citation = citations.find(c => c.index === index);
        if (!citation) return <>{children}</>;

        return (
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-1 py-0.5 text-[10px] rounded 
              bg-zinc-100/50 hover:bg-zinc-100 
              dark:bg-zinc-800/50 dark:hover:bg-zinc-800
              text-zinc-600 hover:text-zinc-900
              dark:text-zinc-400 dark:hover:text-zinc-200
              transition-all duration-200 no-underline border border-zinc-200/50 dark:border-zinc-700/50
              hover:border-zinc-300 dark:hover:border-zinc-600
              group shadow-sm hover:shadow backdrop-blur-sm
              align-super cursor-pointer"
          >
            <span className="tabular-nums">{citation.index}</span>
          </a>
        );
      }

      return <code>{children}</code>;
    },
    a: ({ href, children }) => {
      if (!href || !children) {
        return <>{children}</>;
      }

      // Skip if it's not a valid URL
      try {
        new URL(href);
      } catch (e) {
        return <>{children}</>;
      }

      // If not a citation, render as external link
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
  };

  const sharedMarkdownProps = {
    rehypePlugins: containsLaTeX 
      ? [rehypeExternalLinks as any, rehypeKatex]
      : [rehypeExternalLinks as any],
    remarkPlugins: containsLaTeX 
      ? [remarkGfm, remarkMath]
      : [remarkGfm],
    components: markdownComponents,
    className: "prose prose-zinc dark:prose-invert prose-p:text-base prose-p:leading-relaxed prose-p:my-3 prose-pre:text-sm prose-pre:my-3 prose-code:text-sm prose-ul:my-3 prose-ul:text-base prose-ul:list-disc prose-ul:pl-5 prose-ol:my-3 prose-ol:text-base prose-li:my-1 prose-headings:text-zinc-800 dark:prose-headings:text-zinc-200 prose-h1:text-2xl prose-h1:font-semibold prose-h1:mt-6 prose-h1:mb-4 prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-5 prose-h2:mb-3 prose-h3:text-lg prose-h3:font-medium prose-h3:mt-4 prose-h3:mb-2 prose-hr:my-6 prose-blockquote:text-base prose-blockquote:my-3 prose-blockquote:pl-4 prose-blockquote:border-l-2 prose-blockquote:border-zinc-300 prose-blockquote:dark:border-zinc-700 prose-blockquote:italic [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 max-w-none"
  };

  return (
    <div className="space-y-6">
      <div className="prose-container">
        <MemoizedReactMarkdown
          {...sharedMarkdownProps}
        >
          {containsLaTeX ? processedData : processedContent}
        </MemoizedReactMarkdown>
      </div>
      {citations.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <CitationsSection citations={citations} />
        </div>
      )}
    </div>
  );
}

const preprocessLaTeX = (content: string) => {
  const blockProcessedContent = content.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, equation) => `$$${equation}$$`
  );
  const inlineProcessedContent = blockProcessedContent.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, equation) => `$${equation}$`
  );
  return inlineProcessedContent;
};