import React from 'react'
import { cn } from '@/lib/utils'
import { Search, Repeat2, MessageSquareShare, SquarePlay, Globe } from 'lucide-react'
import { Separator } from './ui/separator'

type SectionProps = {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  title?: string | React.ReactNode
  separator?: boolean
  icon?: React.ReactNode
}

function IconSparkles({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 14 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <path
        d="M7.73047 16.2559C7.81836 16.2559 7.88916 16.2266 7.94287 16.168C8.00146 16.1143 8.03809 16.0435 8.05273 15.9556C8.15039 15.1841 8.25781 14.5347 8.375 14.0073C8.49707 13.48 8.6582 13.0479 8.8584 12.7109C9.05859 12.374 9.32471 12.1055 9.65674 11.9053C9.98877 11.7051 10.4136 11.5513 10.9312 11.4438C11.4536 11.3315 12.0933 11.2339 12.8501 11.1509C12.9429 11.1411 13.0161 11.1069 13.0698 11.0483C13.1284 10.9897 13.1577 10.9165 13.1577 10.8286C13.1577 10.7407 13.1284 10.6675 13.0698 10.6089C13.0161 10.5503 12.9429 10.5161 12.8501 10.5063C12.0933 10.4233 11.4536 10.3281 10.9312 10.2207C10.4136 10.1084 9.98877 9.95215 9.65674 9.75195C9.32471 9.55176 9.05859 9.2832 8.8584 8.94629C8.6582 8.60938 8.49707 8.17725 8.375 7.6499C8.25781 7.12256 8.15039 6.4707 8.05273 5.69434C8.03809 5.61133 8.00146 5.54297 7.94287 5.48926C7.88916 5.43066 7.81836 5.40137 7.73047 5.40137C7.64258 5.40137 7.56934 5.43066 7.51074 5.48926C7.45703 5.54297 7.42285 5.61133 7.4082 5.69434C7.31543 6.4707 7.20801 7.12256 7.08594 7.6499C6.96875 8.17725 6.80762 8.60938 6.60254 8.94629C6.40234 9.2832 6.13623 9.55176 5.8042 9.75195C5.47217 9.95215 5.04736 10.1084 4.52979 10.2207C4.01221 10.3281 3.37256 10.4233 2.61084 10.5063C2.51807 10.5161 2.44238 10.5503 2.38379 10.6089C2.3252 10.6675 2.2959 10.7407 2.2959 10.8286C2.2959 10.9165 2.3252 10.9897 2.38379 11.0483C2.44238 11.1069 2.51807 11.1411 2.61084 11.1509C3.36768 11.2485 4.00488 11.3584 4.52246 11.4805C5.04004 11.5977 5.4624 11.7539 5.78955 11.9492C6.12158 12.1445 6.3877 12.4082 6.58789 12.7402C6.78809 13.0674 6.94922 13.4922 7.07129 14.0146C7.19336 14.5371 7.30566 15.1841 7.4082 15.9556C7.42285 16.0435 7.45703 16.1143 7.51074 16.168C7.56934 16.2266 7.64258 16.2559 7.73047 16.2559Z"
        fill="currentColor"
      />
    </svg>
  )
}

export const Section: React.FC<SectionProps> = ({
  children,
  className,
  size = 'md',
  title,
  separator = false,
  icon
}) => {
  let defaultIcon: React.ReactNode

  if (typeof title === 'string') {
    switch (title) {
      case 'Images':
        defaultIcon = <Search size={18} className="mr-2" />
        break
      case 'Videos':
        defaultIcon = <SquarePlay size={18} className="mr-2" />
        break
      case 'Answer':
        defaultIcon = <IconSparkles className="mr-2" />
        break
      case 'Related':
        defaultIcon = <Repeat2 size={18} className="mr-2" />
        break
      case 'Follow-up':
        defaultIcon = <MessageSquareShare size={18} className="mr-2" />
        break
      default:
        defaultIcon = <Globe size={18} className="mr-2" />
    }
  }

  const sectionIcon = icon || defaultIcon

  return (
    <>
      {separator && <Separator className="my-2" />}
      <section
        className={cn(
          `${size === 'sm' ? 'py-1' : size === 'lg' ? 'py-4' : 'py-2'}`,
          className
        )}
      >
        {title && (
          <div className="flex items-center text-lg leading-none py-2">
            {sectionIcon}
            {typeof title === 'string' ? <h2>{title}</h2> : title}
          </div>
        )}
        {children}
      </section>
    </>
  )
}