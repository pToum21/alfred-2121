"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Heart, Share, Image as ImageIcon, Link as LinkIcon } from "lucide-react"

// Mock data
const MOCK_POSTS = [
  {
    id: '1',
    title: 'Market Analysis: Downtown Commercial Real Estate Trends',
    author: 'Sarah Johnson',
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
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    title: 'Residential Market Update: Q1 2024',
    author: 'Michael Chen',
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
    timestamp: '5 hours ago'
  },
  {
    id: '3',
    title: 'REIT Performance Analysis: Healthcare Sector',
    author: 'David Kim',
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
    bookmarked: true
  }
]

type Post = typeof MOCK_POSTS[0]

export function Social() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent') // 'recent' | 'popular' | 'discussed'

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
          // 'recent' - assuming newer posts have higher IDs
          return b.id.localeCompare(a.id)
      }
    })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Real Estate Social</h1>
          <p className="text-muted-foreground">Connect and share insights with real estate professionals</p>
        </div>
        <Button 
          className="bg-[#2c7359] hover:bg-[#2c7359]/90"
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
          className="max-w-sm"
        />
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="discussed">Most Discussed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="residential">Residential</TabsTrigger>
          <TabsTrigger value="commercial">Commercial</TabsTrigger>
          <TabsTrigger value="reits">REITs</TabsTrigger>
          <TabsTrigger value="market-analysis">Market Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredPosts.map((post) => (
            <Card 
              key={post.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedPost(post)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl hover:text-[#2c7359]">
                      {post.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Posted by {post.author} · {post.timestamp}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                    {post.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
                {post.image && (
                  <div className="mb-4 relative h-48 overflow-hidden rounded-md">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4 text-muted-foreground">
                  <Button variant="ghost" size="sm" className="hover:text-[#2c7359]">
                    <Heart className="w-4 h-4 mr-2" />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:text-[#2c7359]">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {post.comments.length}
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:text-[#2c7359] ml-auto">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Post Title" />
            <Select>
              <SelectTrigger>
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
              className="w-full min-h-[200px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-[#2c7359]"
              placeholder="Write your post..."
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Add Image
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Add Link
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#2c7359] hover:bg-[#2c7359]/90">
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <DialogTitle className="text-2xl">{selectedPost.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Posted by {selectedPost.author} · {selectedPost.timestamp}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                    {selectedPost.category}
                  </span>
                </div>
              </DialogHeader>

              {selectedPost.image && (
                <div className="mb-6 relative h-96 overflow-hidden rounded-md">
                  <img 
                    src={selectedPost.image} 
                    alt={selectedPost.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none mb-6">
                {selectedPost.content}
              </div>

              <div className="flex items-center gap-4 border-t border-b py-4 mb-6">
                <Button variant="ghost" size="sm" className="hover:text-[#2c7359]">
                  <Heart className="w-4 h-4 mr-2" />
                  {selectedPost.likes}
                </Button>
                <Button variant="ghost" size="sm" className="hover:text-[#2c7359]">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {selectedPost.comments.length}
                </Button>
                <Button variant="ghost" size="sm" className="hover:text-[#2c7359] ml-auto">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <textarea
                      className="w-full min-h-[100px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-[#2c7359]"
                      placeholder="Write a comment..."
                    />
                    <Button className="mt-2 bg-[#2c7359] hover:bg-[#2c7359]/90">
                      Post Comment
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedPost.comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{comment.author}</span>
                        <span className="text-sm text-muted-foreground">
                          {comment.timestamp}
                        </span>
                      </div>
                      <p className="mb-2">{comment.content}</p>
                      <div className="flex gap-4">
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-[#2c7359]">
                          <Heart className="w-3 h-3 mr-1" />
                          {comment.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-[#2c7359]">
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