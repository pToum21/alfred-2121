import React from 'react';
import { Avatar } from './avatar';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FaviconLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const FaviconLink: React.FC<FaviconLinkProps> = ({ href, children, className }) => {
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
    <span className={cn("inline-flex items-center", className)}>
      <Avatar className="w-4 h-4 mr-1 text-xs flex items-center justify-center bg-gray-200 text-gray-600">
        {faviconError ? (
          domainInitial
        ) : (
          <Image
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt={domain}
            width={16}
            height={16}
            className="w-full h-full"
            onError={() => setFaviconError(true)}
          />
        )}
      </Avatar>
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
        {children}
      </a>
    </span>
  );
};