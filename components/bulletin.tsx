"use client"

import { useEffect, useRef, useState } from "react"
import { BookOpen, TrendingUp, ExternalLink, ChevronRight, History, Clock, ChevronDown, ChevronUp, Twitter, Linkedin, MessageSquare, ThumbsUp, Share2, Repeat2, Crown, Award, Star, Shield, Verified } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { getChats } from "@/lib/actions/chat"
import { Chat } from "@/lib/types"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { getNewChatUrl } from '@/lib/services/chat-navigation'
import Image from "next/image"

// Expert posts data
type SocialPlatform = "twitter" | "linkedin" | "substack";
type AuthorRole = "admin" | "expert" | "verified" | "analyst" | "contributor";

interface ExpertPost {
  id: number;
  author: string;
  authorTitle: string;
  authorImage: string;
  authorRole: AuthorRole;
  platform: SocialPlatform;
  content: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  url: string;
  isDaily?: boolean;
}

// Map author roles to icons and colors
const authorRoleBadges: Record<AuthorRole, { icon: React.ElementType; color: string; label: string }> = {
  admin: { icon: Crown, color: "#FFD700", label: "Admin" },
  expert: { icon: Award, color: "#3a8f71", label: "Expert" },
  verified: { icon: Verified, color: "#1DA1F2", label: "Verified" },
  analyst: { icon: Star, color: "#F59E0B", label: "Analyst" },
  contributor: { icon: Shield, color: "#8B5CF6", label: "Contributor" }
};

const EXPERT_POSTS: ExpertPost[] = [
  {
    id: 1,
    author: "Tim Rood",
    authorTitle: "CEO at Impact Capitol, Former Fannie Mae Executive",
    authorImage: "/images/rood.jpg",
    authorRole: "admin",
    platform: "twitter",
    content: "THE DAILY DOSE: Mortgage rates climb back up to 6.87% after a brief dip. This trend may be temporary as Fed signals future rate cuts. Housing affordability remains central to economic recovery efforts. Builders showing strong starts in entry-level housing to meet pent-up demand.",
    date: "1h ago",
    likes: 257,
    comments: 42,
    shares: 89,
    url: "https://twitter.com/",
    isDaily: true
  },
  {
    id: 2,
    author: "Alfred Pollard",
    authorTitle: "Advisor at Impact Capitol, Former General Counsel at FHFA",
    authorImage: "/images/Profile_avatar_placeholder_large.png",
    authorRole: "expert",
    platform: "linkedin",
    content: "New data confirms what we've been tracking: Homebuilders are aggressively pursuing built-to-rent communities to address the growing rental demand. With cap rates compressing, we're seeing increased institutional interest in these developments as an alternative to traditional multifamily investments.",
    date: "5h ago",
    likes: 342,
    comments: 64,
    shares: 112,
    url: "https://linkedin.com/"
  },
  {
    id: 3,
    author: "Billy Mullins",
    authorTitle: "Director of IT, Impact Capitol",
    authorImage: "/images/Profile_avatar_placeholder_large.png",
    authorRole: "analyst",
    platform: "twitter",
    content: "Bond market fluctuations pointing to potential mortgage rate relief by Q3. The Fed's balancing act between inflation control and growth stimulus is reaching a critical point. Smart mortgage professionals should be preparing clients now for an advantageous refinance window later this year.",
    date: "Yesterday",
    likes: 198,
    comments: 37,
    shares: 76,
    url: "https://twitter.com/"
  }
];

// Format date for recent chats display with more granular timestamps for today
const formatChatDate = (date: Date | string) => {
  const parsedDate = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // For items from today, show relative time
  if (
    parsedDate.getDate() === now.getDate() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getFullYear() === now.getFullYear()
  ) {
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return "Today";
  } else if (
    parsedDate.getDate() === yesterday.getDate() &&
    parsedDate.getMonth() === yesterday.getMonth() &&
    parsedDate.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  } else {
    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  }
};

// Expert Post Component
function ExpertPostItem({ post }: { post: ExpertPost }) {
  const PlatformIcon = post.platform === "twitter" ? Twitter : post.platform === "linkedin" ? Linkedin : MessageSquare;
  const roleInfo = authorRoleBadges[post.authorRole];
  const RoleBadgeIcon = roleInfo.icon;
  
  return (
    <div className={`p-4 rounded-lg border-0 ${post.isDaily ? 'bg-gradient-to-br from-gray-900/80 to-gray-950/90' : 'dark-surface-1'} shadow-sm hover:shadow-md transition-all`}>
      {post.isDaily && (
        <div className="mb-2 flex items-center">
          <div className="bg-[#2c7359] px-2 py-0.5 rounded text-xs font-semibold text-white">
            THE DAILY DOSE
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-800">
            <Image 
              src={post.authorImage} 
              alt={post.author} 
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          
          {/* Author role badge - positioned to overlap */}
          <div 
            className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full flex items-center justify-center border-2 border-gray-950 shadow-md"
            style={{ backgroundColor: roleInfo.color }}
            title={roleInfo.label}
          >
            <RoleBadgeIcon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="font-medium text-sm text-gray-100">{post.author}</h4>
            
            {/* Platform badge */}
            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
              post.platform === 'twitter' ? 'bg-[#1DA1F2]' : 
              post.platform === 'linkedin' ? 'bg-[#0A66C2]' : 
              'bg-[#FF6719]'
            }`}>
              <PlatformIcon className="h-3 w-3 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-400">{post.authorTitle}</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-200 mb-3">{post.content}</p>
      
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{post.date}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            <span>{post.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{post.comments}</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            <span>{post.shares}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Recent Chat Item Component - using dark grey accents
function RecentChatItem({ chat }: { chat: Chat }) {
  const router = useRouter();

  const handleClick = () => {
    if (chat.path) {
      router.push(chat.path);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="p-3 rounded-lg dark-surface-1 hover:dark-surface-2 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        // Allow keyboard navigation
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <div className="p-2 rounded-full bg-[#2c7359]/20">
        <Clock className="h-4 w-4 text-[#3a8f71]" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-gray-200 truncate">
          {chat.title || "Untitled Chat"}
        </h4>
        <div className="flex items-center text-xs text-gray-400">
          <span>{formatChatDate(chat.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// Main Bulletin Component
export function Bulletin({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const router = useRouter();

  // Fetch all chats
  useEffect(() => {
    const loadAllChats = async () => {
      try {
        const chats = await getChats();
        setRecentChats(chats.slice(0, 3)); // Get only the 3 most recent chats
        setAllChats(chats); // Save all chats
      } catch (error) {
        console.error("Error loading chats:", error);
      }
    };
    
    loadAllChats();
  }, []);

  // Toggle history expansion
  const toggleHistory = () => {
    setIsHistoryExpanded(!isHistoryExpanded);
  };

  // Canvas animation setup (enhanced with circles)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Define the green color palette
    const colors = [
      "#2c7359", // Primary Green
      "#3a8f71", // Lighter Green
      "#204d3e", // Darker Green
      "#183d31", // Very Dark Green
      "#61b992", // Light Green
    ]

    // Create Circle class for advanced animation
    class Circle {
      x: number
      y: number
      size: number
      color: string
      speedX: number
      speedY: number
      opacity: number
      pulse: number
      pulseSpeed: number
      glowing: boolean

      constructor(x: number, y: number, size: number) {
        this.x = x
        this.y = y
        this.size = size
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.opacity = 0.05 + Math.random() * 0.15
        this.pulse = Math.random() * Math.PI * 2
        this.pulseSpeed = 0.01 + Math.random() * 0.02
        this.glowing = Math.random() > 0.7
      }

      update() {
        // Update position
        this.x += this.speedX
        this.y += this.speedY

        // Pulse animation
        this.pulse += this.pulseSpeed
        
        // Bounce off walls with slight angle change
        if (canvas && (this.x <= this.size || this.x >= canvas.width - this.size)) {
          this.speedX = -this.speedX * 0.95
          this.speedX += (Math.random() - 0.5) * 0.05
        }
        if (canvas && (this.y <= this.size || this.y >= canvas.height - this.size)) {
          this.speedY = -this.speedY * 0.95
          this.speedY += (Math.random() - 0.5) * 0.05
        }
      }

      draw() {
        if (!ctx) return
        
        // Create pulsing effect using sine wave
        const pulseScale = 1 + Math.sin(this.pulse) * 0.1
        const currentSize = this.size * pulseScale
        
        // Base circle
        ctx.globalAlpha = this.opacity
        ctx.beginPath()
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
        
        // Glow effect for some circles
        if (this.glowing) {
          const glow = ctx.createRadialGradient(
            this.x, this.y, currentSize * 0.2,
            this.x, this.y, currentSize * 2
          )
          glow.addColorStop(0, this.color)
          glow.addColorStop(1, 'rgba(0,0,0,0)')
          
          ctx.globalAlpha = this.opacity * 0.4
          ctx.beginPath()
          ctx.arc(this.x, this.y, currentSize * 2, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()
        }
        
        // Ring effect
        ctx.globalAlpha = this.opacity * 0.7
        ctx.beginPath()
        ctx.arc(this.x, this.y, currentSize * 1.2, 0, Math.PI * 2)
        ctx.strokeStyle = this.color
        ctx.lineWidth = 1
        ctx.stroke()
        
        ctx.globalAlpha = 1
      }
    }

    // Create circles
    const circles: Circle[] = []
    const circleCount = 15 // More circles for a richer look

    for (let i = 0; i < circleCount; i++) {
      const size = 5 + Math.random() * 20
      const x = Math.random() * ((canvas?.width || 300) - size * 2) + size
      const y = Math.random() * ((canvas?.height || 300) - size * 2) + size
      circles.push(new Circle(x, y, size))
    }

    // Animation loop
    let animationFrameId: number

    const animate = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw and update circles
      circles.forEach((circle) => {
        circle.update()
        circle.draw()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Clean up function
    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      cancelAnimationFrame(animationFrameId) // Cancel animation frame on cleanup
    }
  }, [])

  return (
    <Card className={`h-auto overflow-hidden shadow-md dark-card border-0 ${className}`}>
      <div className="relative h-full">
        {/* Animated background */}
        <canvas ref={canvasRef} className="absolute inset-0" />

        {/* Content overlay */}
        <div className="relative z-10 p-6 h-full flex flex-col">
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <Image 
                src="/tight_cropped_insider_hub.png" 
                alt="Insider Hub"
                width={140}
                height={30}
                className="object-contain"
              />
            </div>
          </div>

          {/* Experts section */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-1 bg-[#3a8f71] rounded-full"></div>
            <h3 className="font-semibold text-[#3a8f71]">Expert Insights</h3>
          </div>

          <div className="space-y-3 mb-5">
            {EXPERT_POSTS.map((post) => (
              <ExpertPostItem key={post.id} post={post} />
            ))}
          </div>

          <Separator className="my-4 dark-surface-2 h-px" />

          {/* Continue where you left off section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-[#ebb142] rounded-full"></div>
              <h3 className="font-semibold text-[#ebb142]">Continue Where You Left Off</h3>
            </div>
            {allChats.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-[#ebb142] hover:bg-[#ebb142]/10 bg-transparent flex items-center gap-1"
                onClick={toggleHistory}
              >
                {isHistoryExpanded ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>View All</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {recentChats.length > 0 ? (
              <>
                {/* Always show recent chats */}
                {!isHistoryExpanded && recentChats.map((chat) => (
                  <RecentChatItem key={chat.id} chat={chat} />
                ))}
                
                {/* Expanded history section */}
                <AnimatePresence>
                  {isHistoryExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                        {allChats.map((chat) => (
                          <RecentChatItem key={chat.id} chat={chat} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="p-4 rounded-lg border-0 dark-surface-2 text-center shadow-sm">
                <p className="text-sm text-gray-300">No recent conversations</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-[#3a8f71] hover:bg-[#2c7359]/20"
                  onClick={() => router.push(getNewChatUrl())}
                >
                  Start a new conversation
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
} 