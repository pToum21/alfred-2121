import React from 'react'
import Link from 'next/link'
import { FaTwitter } from 'react-icons/fa'
import { FaRegFileAlt } from 'react-icons/fa'
import { Button } from './ui/button'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-fit p-1 md:p-2 fixed bottom-0 right-0 z-50 bg-background/80 backdrop-blur-sm rounded-tl-md">
      <div className="flex items-center justify-end">
        <Button
          variant={'ghost'}
          size={'sm'}
          className="text-muted-foreground hover:text-muted-foreground/80 hover:bg-accent p-1"
        >
          <Link 
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaRegFileAlt size={18} style={{ fontWeight: 100 }} />
          </Link>
        </Button>
        
        <div className="mx-2 h-3 w-px bg-muted-foreground/30"></div>
        
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto flex items-center text-xs text-muted-foreground/80 hover:text-primary"
          asChild
        >
          <a 
            href="https://impactcapitoldc.com" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <span className="whitespace-nowrap">© {currentYear} Powered by </span>
            <span className="font-medium ml-1">Impact Capitol</span>
          </a>
        </Button>
        
        <div className="mx-2 h-3 w-px bg-muted-foreground/30"></div>
        
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto flex items-center text-muted-foreground/80 hover:text-primary"
          asChild
        >
          <Link href="https://twitter.com/impactcapitoldc" target="_blank">
            <FaTwitter size={24} />
          </Link>
        </Button>
      </div>
    </footer>
  )
}

export default Footer