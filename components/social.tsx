"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Heart, Share2, Image as ImageIcon, Link as LinkIcon, TrendingUp, Twitter, Linkedin, ThumbsUp, Award, Verified, Users, Activity, Zap, UserCheck, Bookmark, BarChart } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

type AuthorRole = 'expert' | 'verified';

type Comment = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
}

type Post = {
  id: string;
  title: string;
  author: string;
  authorTitle: string;
  authorImage: string;
  authorRole: AuthorRole;
  content: string;
  image: string;
  likes: number;
  comments: Comment[];
  category: string;
  timestamp: string;
  platform: 'twitter' | 'linkedin';
  bookmarked?: boolean;
}

// Mock data with enhanced structure
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'Market Analysis: Downtown Commercial Real Estate Trends',
    author: 'Sarah Johnson',
    authorTitle: 'Senior Market Analyst',
    authorImage: '/images/Profile_avatar_placeholder_large.png',
    authorRole: 'expert',
    content: 'Recent trends show a significant shift in downtown commercial real estate. The post-pandemic landscape has created unique opportunities for investors and developers.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    likes: 45,
    comments: [
      {
        id: 'c1',
        author: 'Michael Chen',
        content: 'Great analysis! The flexible workspace trend is definitely something we are seeing in our market as well.',
        timestamp: '1 hour ago',
        likes: 12
      },
      {
        id: 'c2',
        author: 'Emily Rodriguez',
        content: 'Would love to see more data on the sustainability premium rates you mentioned.',
        timestamp: '30 minutes ago',
        likes: 8
      }
    ],
    category: 'Commercial',
    timestamp: '2 hours ago',
    platform: 'linkedin'
  },
  {
    id: '2',
    title: 'Residential Market Update: Q1 2024',
    author: 'Michael Chen',
    authorTitle: 'Real Estate Investment Strategist',
    authorImage: '/images/Profile_avatar_placeholder_large.png',
    authorRole: 'verified',
    content: 'First quarter results indicate strong growth in suburban residential properties. We are seeing increased demand in areas with good school districts and easy commute access.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    likes: 32,
    comments: [
      {
        id: 'c3',
        author: 'Lisa Wang',
        content: 'The school district correlation is spot on. Any data on price premiums for top-rated districts?',
        timestamp: '1 hour ago',
        likes: 5
      }
    ],
    category: 'Residential',
    timestamp: '5 hours ago',
    platform: 'twitter'
  },
  {
    id: '3',
    title: 'REIT Performance Analysis: Healthcare Sector',
    author: 'David Kim',
    authorTitle: 'Healthcare Analyst',
    authorImage: '/images/Profile_avatar_placeholder_large.png',
    authorRole: 'expert',
    content: 'Healthcare REITs are showing remarkable resilience in 2024. Senior living facilities and medical office buildings are leading the recovery.',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
    likes: 78,
    comments: [
      {
        id: 'c4',
        author: 'Rachel Thompson',
        content: 'Interesting analysis. Have you looked into the impact of new healthcare policies on these trends?',
        timestamp: '45 minutes ago',
        likes: 15
      }
    ],
    category: 'REITs',
    timestamp: '1 day ago',
    bookmarked: true,
    platform: 'linkedin'
  }
]

const authorRoleBadges: Record<AuthorRole, { icon: LucideIcon; color: string; label: string }> = {
  expert: { icon: Award, color: "#3a8f71", label: "Expert" },
  verified: { icon: Verified, color: "#1DA1F2", label: "Verified" }
};

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

function PostCard({ post, onClick }: PostCardProps) {
  const PlatformIcon = post.platform === "twitter" ? Twitter : Linkedin;
  const roleInfo = authorRoleBadges[post.authorRole];
  const RoleBadgeIcon = roleInfo?.icon;
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all bg-gradient-to-br from-gray-900/80 to-gray-950/90 border-0"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-gray-800">
              <AvatarImage src={post.authorImage} alt={post.author} />
              <AvatarFallback>{post.author[0]}</AvatarFallback>
            </Avatar>
            {roleInfo && (
              <div 
                className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full flex items-center justify-center border-2 border-gray-950"
                style={{ backgroundColor: roleInfo.color }}
                title={roleInfo.label}
              >
                <RoleBadgeIcon className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-100">{post.author}</h3>
              <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center",
                post.platform === "twitter" ? "bg-[#1DA1F2]" : "bg-[#0A66C2]"
              )}>
                <PlatformIcon className="h-3 w-3 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-400">{post.authorTitle}</p>
          </div>
          <span className="px-3 py-1 bg-gray-800/50 text-gray-300 rounded-full text-xs">
            {post.category}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-100 mb-2">{post.title}</h4>
          <p className="text-gray-300">{post.content}</p>
        </div>
        {post.image && (
          <div className="relative h-64 overflow-hidden rounded-lg">
            <img 
              src={post.image} 
              alt={post.title}
              className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="flex items-center justify-between pt-2 text-gray-400">
          <span className="text-sm">{post.timestamp}</span>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hover:text-[#2c7359] text-gray-400">
              <ThumbsUp className="h-4 w-4 mr-2" />
              {post.likes}
            </Button>
            <Button variant="ghost" size="sm" className="hover:text-[#2c7359] text-gray-400">
              <MessageSquare className="h-4 w-4 mr-2" />
              {post.comments.length}
            </Button>
            <Button variant="ghost" size="sm" className="hover:text-[#2c7359] text-gray-400">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ACTIVE_USERS = [
  {
    name: "Emma Thompson",
    role: "Property Analyst",
    avatar: "/images/Profile_avatar_placeholder_large.png",
    status: "online",
    lastActive: "Now"
  },
  {
    name: "John Martinez",
    role: "Investment Advisor",
    avatar: "/images/Profile_avatar_placeholder_large.png",
    status: "online",
    lastActive: "2m ago"
  },
  {
    name: "Sarah Chen",
    role: "Market Researcher",
    avatar: "/images/Profile_avatar_placeholder_large.png",
    status: "online",
    lastActive: "5m ago"
  }
];

const TRENDING_TOPICS = [
  { topic: "Market Analysis", posts: 156, trend: "+12%" },
  { topic: "Investment Strategy", posts: 98, trend: "+8%" },
  { topic: "Property Tech", posts: 87, trend: "+15%" },
  { topic: "REITs", posts: 76, trend: "+5%" }
];

const COMMUNITY_STATS = [
  { label: "Active Members", value: "2.4k", icon: Users, trend: "+15%" },
  { label: "Posts Today", value: "156", icon: MessageSquare, trend: "+8%" },
  { label: "Total Interactions", value: "12.8k", icon: Activity, trend: "+25%" }
];

export function Social() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  // Filter posts based on search and category
  const filteredPosts = MOCK_POSTS
    .filter(post => {
      const matchesSearch = searchQuery === '' || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeTab === 'all' || post.category.toLowerCase() === activeTab
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes
        case 'discussed':
          return b.comments.length - a.comments.length
        default:
          return b.id.localeCompare(a.id)
      }
    })

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="md:col-span-3">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-100">Real Estate Social</h1>
                <p className="text-gray-400">Connect and share insights with real estate professionals</p>
              </div>
              <Button 
                className="bg-[#2c7359] hover:bg-[#2c7359]/90 text-white"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create Post
              </Button>
            </div>

            <div className="flex gap-4 items-center">
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm bg-gray-900/50 border-gray-800"
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-gray-900/50 border-gray-800">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="discussed">Most Discussed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full bg-gray-900/50 p-1">
                <TabsTrigger value="all" className="flex-1">All Posts</TabsTrigger>
                <TabsTrigger value="residential" className="flex-1">Residential</TabsTrigger>
                <TabsTrigger value="commercial" className="flex-1">Commercial</TabsTrigger>
                <TabsTrigger value="reits" className="flex-1">REITs</TabsTrigger>
                <TabsTrigger value="market-analysis" className="flex-1">Market Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-4">
                {filteredPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post}
                    onClick={() => setSelectedPost(post)}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Community Stats */}
          <Card className="bg-gradient-to-br from-gray-900/80 to-gray-950/90 border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart className="h-5 w-5 text-[#2c7359]" />
                Community Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {COMMUNITY_STATS.map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-900/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#2c7359]/20 flex items-center justify-center">
                      <stat.icon className="h-4 w-4 text-[#2c7359]" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">{stat.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#2c7359]">{stat.value}</div>
                    <div className="text-xs text-emerald-500">{stat.trend}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card className="bg-gradient-to-br from-gray-900/80 to-gray-950/90 border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#2c7359]" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TRENDING_TOPICS.map((topic, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-900/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[#2c7359] font-medium">#{i + 1}</span>
                      <span className="text-sm text-gray-300">{topic.topic}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{topic.posts} posts</div>
                      <div className="text-xs text-emerald-500">{topic.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="bg-gradient-to-br from-gray-900/80 to-gray-950/90 border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#2c7359]" />
                Active Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {ACTIVE_USERS.map((user, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-900/50 cursor-pointer transition-colors">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-gray-800">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-gray-950" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-200">{user.name}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400">{user.role}</p>
                          <span className="text-xs text-emerald-500">{user.lastActive}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl bg-gray-950 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Create a Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Post Title" className="bg-gray-900/50 border-gray-800" />
            <Select>
              <SelectTrigger className="bg-gray-900/50 border-gray-800">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="reits">REITs</SelectItem>
                <SelectItem value="market-analysis">Market Analysis</SelectItem>
              </SelectContent>
            </Select>
            <textarea
              className="w-full min-h-[200px] p-3 rounded-md bg-gray-900/50 border border-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#2c7359] text-gray-100"
              placeholder="Write your post..."
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2 border-gray-800 text-gray-300">
                <ImageIcon className="h-4 w-4" />
                Add Image
              </Button>
              <Button variant="outline" className="flex items-center gap-2 border-gray-800 text-gray-300">
                <LinkIcon className="h-4 w-4" />
                Add Link
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-gray-800 text-gray-300">
                Cancel
              </Button>
              <Button className="bg-[#2c7359] hover:bg-[#2c7359]/90 text-white">
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-950 border-gray-800">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10 border-2 border-gray-800">
                    <AvatarImage src={selectedPost.authorImage} alt={selectedPost.author} />
                    <AvatarFallback>{selectedPost.author[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-100">{selectedPost.author}</h3>
                    <p className="text-sm text-gray-400">{selectedPost.timestamp}</p>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-gray-800/50 text-gray-300 rounded-full text-xs">
                    {selectedPost.category}
                  </span>
                </div>
              </DialogHeader>

              {selectedPost.image && (
                <div className="mb-6 relative h-96 overflow-hidden rounded-lg">
                  <img 
                    src={selectedPost.image} 
                    alt={selectedPost.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none mb-6 text-gray-300">
                <h2 className="text-xl font-semibold text-gray-100 mb-4">{selectedPost.title}</h2>
                {selectedPost.content}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" className="hover:text-[#2c7359] text-gray-400">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {selectedPost.likes}
                </Button>
                <Button variant="ghost" size="sm" className="hover:text-[#2c7359] text-gray-400">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {selectedPost.comments.length}
                </Button>
                <Button variant="ghost" size="sm" className="hover:text-[#2c7359] text-gray-400 ml-auto">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <textarea
                      className="w-full min-h-[100px] p-3 rounded-md bg-gray-900/50 border border-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#2c7359] text-gray-100"
                      placeholder="Write a comment..."
                    />
                    <Button className="mt-2 bg-[#2c7359] hover:bg-[#2c7359]/90 text-white">
                      Post Comment
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedPost.comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-800 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-100">{comment.author}</span>
                        <span className="text-sm text-gray-400">
                          {comment.timestamp}
                        </span>
                      </div>
                      <p className="mb-2 text-gray-300">{comment.content}</p>
                      <div className="flex gap-4">
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400 hover:text-[#2c7359]">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {comment.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400 hover:text-[#2c7359]">
                          Reply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 