"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, BarChart2, ExternalLink, TrendingUp, TrendingDown, ChevronRight, ChevronLeft, Vote as VoteIcon } from "lucide-react"
import { motion } from "framer-motion"
import { ICapScoreboard } from "@/components/icap-scoreboard"

// Define types
type StoryCategory = "trending" | "investment" | "policy"

interface Story {
  id: number
  title: string
  excerpt: string
  url: string
  date: string
  image?: string
}

interface EconomicIndicator {
  name: string
  value: string
  change: string
  trending: "up" | "down"
}

interface PollOption {
  id: number
  text: string
  votes: number
}

interface Poll {
  question: string
  options: PollOption[]
  totalVotes: number
}

// Default fallback image
const DEFAULT_IMAGE = "/p-2-91193735-housing-market-fed-rate-cuts.jpg"

// Featured story data by category
const FEATURED_STORIES: Record<StoryCategory, Story[]> = {
  trending: [
    {
      id: 1,
      title: "Housing Market Could See 'Significant Boost' as Fed Signals Rate Cuts",
      excerpt: "Mortgage rates expected to decline throughout 2025, potentially unleashing pent-up demand from both buyers and sellers.",
      image: "/images/p-2-91193735-housing-market-fed-rate-cuts.jpg",
      url: "https://example.com/housing-market-boost",
      date: "May 2, 2025"
    },
    {
      id: 2,
      title: "Commercial Real Estate Recovery Shows Regional Disparities",
      excerpt: "Urban office markets continue to struggle while industrial and sunbelt regions show strength.",
      url: "https://example.com/cre-recovery",
      date: "April 29, 2025"
    },
    {
      id: 3,
      title: "New Regulations Target Real Estate Money Laundering",
      excerpt: "Treasury Department issues stricter reporting requirements for high-value transactions.",
      url: "https://example.com/real-estate-regulations",
      date: "April 25, 2025"
    }
  ],
  investment: [
    {
      id: 4,
      title: "Institutional Investors Pivot to Multifamily in Secondary Markets",
      excerpt: "Blackstone, Starwood among major firms increasing suburban apartment holdings amid urban exodus.",
      image: "/multifamily-investment.jpg",
      url: "https://example.com/multifamily-investment",
      date: "May 1, 2025"
    },
    {
      id: 5,
      title: "REITs Outperforming S&P 500 Year-to-Date",
      excerpt: "Dividend yields and inflation hedging attract investors back to real estate securities.",
      url: "https://example.com/reits-performance",
      date: "April 28, 2025"
    },
    {
      id: 6,
      title: "Build-to-Rent Communities See Surge in Development",
      excerpt: "Single-family rental developments increasingly attract institutional capital.",
      url: "https://example.com/build-to-rent",
      date: "April 22, 2025"
    }
  ],
  policy: [
    {
      id: 7,
      title: "Nationwide Rent Control Bill Advances to Senate Committee",
      excerpt: "Controversial legislation would cap annual rent increases at 3% plus inflation in most markets.",
      image: "/rent-control-bill.jpg",
      url: "https://example.com/rent-control-bill",
      date: "May 3, 2025"
    },
    {
      id: 8,
      title: "Tax Incentives for Affordable Housing Development Expanded",
      excerpt: "New legislation increases LIHTC allocations by 50% over next five years.",
      url: "https://example.com/affordable-housing-incentives",
      date: "April 27, 2025"
    },
    {
      id: 9,
      title: "Climate Disclosure Requirements Coming for Real Estate Firms",
      excerpt: "SEC finalizes rules requiring public companies to report climate risks and emissions.",
      url: "https://example.com/climate-disclosure",
      date: "April 20, 2025"
    }
  ]
}

// Economic indicators data
const ECONOMIC_INDICATORS: EconomicIndicator[] = [
  { name: "30-Yr Fixed Rate", value: "5.12%", change: "-0.23", trending: "down" },
  { name: "Case-Shiller Index", value: "323.5", change: "+1.2%", trending: "up" },
  { name: "Housing Starts", value: "1.42M", change: "+0.8%", trending: "up" },
  { name: "Existing Home Sales", value: "4.38M", change: "-2.4%", trending: "down" },
  { name: "Median Home Price", value: "$428,700", change: "+3.2%", trending: "up" },
  { name: "Rental Vacancy Rate", value: "5.8%", change: "-0.1%", trending: "down" },
  { name: "Construction Spending", value: "$1.97T", change: "+0.5%", trending: "up" }
]

// Poll data
const POLL_OF_THE_DAY: Poll = {
  question: "Which factor will most influence home prices in the next 12 months?",
  options: [
    { id: 1, text: "Interest rates", votes: 42 },
    { id: 2, text: "Housing supply", votes: 35 },
    { id: 3, text: "Employment/Wages", votes: 18 },
    { id: 4, text: "Government policy", votes: 5 }
  ],
  totalVotes: 100
}

export function Spotlight() {
  const [activeTab, setActiveTab] = useState<StoryCategory>("trending")
  const [currentPollVote, setCurrentPollVote] = useState<number | null>(null)
  const [indicatorIndex, setIndicatorIndex] = useState(0)
  const visibleIndicators = 3
  
  // Rotate through economic indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setIndicatorIndex((prev) => 
        prev + 1 >= ECONOMIC_INDICATORS.length ? 0 : prev + 1
      )
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Handle poll vote
  const handleVote = (optionId: number) => {
    if (currentPollVote === null) {
      setCurrentPollVote(optionId)
    }
  }
  
  // Get visible indicators based on current index
  const getVisibleIndicators = () => {
    const indicators: EconomicIndicator[] = []
    for (let i = 0; i < visibleIndicators; i++) {
      const index = (indicatorIndex + i) % ECONOMIC_INDICATORS.length
      indicators.push(ECONOMIC_INDICATORS[index])
    }
    return indicators
  }
  
  return (
    <Card className="mb-8 dark-card overflow-hidden shadow-lg border-0">
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* Top section: Featured stories tabs */}
          <Tabs defaultValue="trending" value={activeTab} onValueChange={(value) => setActiveTab(value as StoryCategory)} className="w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center">
                <Image 
                  src="/tight_cropped_alfred_spotlight.png" 
                  alt="Alfred Spotlight"
                  width={200}
                  height={44}
                  className="object-contain"
                />
              </div>
              <TabsList className="dark-surface-3 p-1">
                <TabsTrigger value="trending" className="text-xs">Trending</TabsTrigger>
                <TabsTrigger value="investment" className="text-xs">Investment</TabsTrigger>
                <TabsTrigger value="policy" className="text-xs">Policy</TabsTrigger>
              </TabsList>
            </div>
            
            {(Object.keys(FEATURED_STORIES) as StoryCategory[]).map((category) => (
              <TabsContent key={category} value={category} className="mt-0 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                  {/* Featured story with image */}
                  <div className="md:col-span-2 border-r border-gray-800 p-5">
                    <div className="flex flex-col">
                      <div className="relative h-[200px] mb-4 rounded-lg overflow-hidden">
                        <Image 
                          src={FEATURED_STORIES[category][0].image || DEFAULT_IMAGE} 
                          alt={FEATURED_STORIES[category][0].title}
                          fill
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wgARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGgP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//aAAwDAQACAAMAAAAQD//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Qf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Qf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8Qf//Z"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-0 p-4">
                          <span className="text-xs bg-[#2c7359] text-white px-2 py-1 rounded-sm">{category.toUpperCase()}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-100 mb-2">
                        {FEATURED_STORIES[category][0].title}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">{FEATURED_STORIES[category][0].excerpt}</p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-gray-400">{FEATURED_STORIES[category][0].date}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-[#3a8f71] hover:text-[#3a8f71] hover:bg-[#2c7359]/10 h-8 flex items-center gap-1"
                          asChild
                        >
                          <a href={FEATURED_STORIES[category][0].url} target="_blank" rel="noopener noreferrer">
                            Read Full Story <ArrowRight className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                      
                      {/* iCap Scoreboard */}
                      <div className="mt-6 pt-6 border-t border-gray-800">
                        <div className="mb-3 flex items-center">
                          <div className="h-6 w-1 bg-[#3a8f71] rounded-full mr-3"></div>
                          <h3 className="font-semibold text-[#3a8f71]">Market Intelligence</h3>
                        </div>
                        <ICapScoreboard />
                      </div>
                    </div>
                  </div>
                  
                  {/* More stories & poll */}
                  <div className="md:col-span-1 p-4">
                    <div className="flex flex-col h-full">
                      {/* More stories */}
                      <h4 className="text-sm font-medium text-gray-400 mb-3">MORE IN {category.toUpperCase()}</h4>
                      <div className="space-y-4 mb-6">
                        {FEATURED_STORIES[category].slice(1, 3).map((story: Story) => (
                          <a 
                            key={story.id} 
                            href={story.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block group"
                          >
                            <h5 className="text-sm font-medium text-gray-200 group-hover:text-[#3a8f71] transition-colors mb-1">
                              {story.title}
                            </h5>
                            <div className="flex items-center text-xs text-gray-400">
                              <span>{story.date}</span>
                              <ExternalLink className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </a>
                        ))}
                      </div>
                      
                      {/* Poll of the day */}
                      <div className="mt-auto">
                        <div className="dark-surface-1 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <div className="p-1 rounded-md bg-[#2c7359]/20 mr-2">
                              <VoteIcon className="h-4 w-4 text-[#3a8f71]" />
                            </div>
                            <h4 className="text-sm font-medium text-[#3a8f71]">Poll of the Day</h4>
                          </div>
                          <p className="text-sm text-gray-200 mb-3">{POLL_OF_THE_DAY.question}</p>
                          
                          <div className="space-y-2 mb-2">
                            {POLL_OF_THE_DAY.options.map((option) => {
                              const percentage = Math.round((option.votes / POLL_OF_THE_DAY.totalVotes) * 100)
                              const isSelected = currentPollVote === option.id
                              
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => handleVote(option.id)}
                                  disabled={currentPollVote !== null}
                                  className={`w-full text-left ${
                                    currentPollVote !== null ? 'cursor-default' : 'cursor-pointer hover:bg-gray-800'
                                  } relative rounded-md p-2 transition-colors border ${
                                    isSelected 
                                      ? 'border-[#2c7359]/40' 
                                      : 'border-transparent'
                                  }`}
                                >
                                  {currentPollVote !== null && (
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ 
                                        duration: 0.6, 
                                        ease: [0.34, 1.56, 0.64, 1], // Spring-like bounce effect
                                        delay: 0.05 * option.id // Subtle staggered animation
                                      }}
                                      className={`absolute inset-y-0 left-0 ${
                                        isSelected 
                                          ? 'bg-gradient-to-r from-[#2c7359]/50 to-[#3a8f71]/30' 
                                          : 'bg-gray-700/30'
                                      } rounded-md`}
                                    />
                                  )}
                                  <div className="relative flex justify-between z-10">
                                    <span className={`text-xs ${
                                      isSelected 
                                        ? 'text-white font-medium' 
                                        : 'text-gray-300'
                                    }`}>
                                      {option.text}
                                    </span>
                                    {currentPollVote !== null && (
                                      <motion.span 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3, delay: 0.3 }}
                                        className={`text-xs ${
                                          isSelected ? 'text-[#61b992]' : 'text-gray-400'
                                        }`}
                                      >
                                        {percentage}%
                                      </motion.span>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                          
                          <div className="text-xs text-center">
                            {currentPollVote === null ? (
                              <motion.div 
                                animate={{ y: [0, -2, 0] }} 
                                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                                className="text-[#3a8f71]"
                              >
                                Click to vote
                              </motion.div>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.5 }}
                                className="text-gray-400"
                              >
                                {POLL_OF_THE_DAY.totalVotes} votes • Results as of May 3, 2025
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          {/* Bottom section: Economic indicators ticker */}
          <div className="dark-surface-2 p-3 border-t border-gray-800">
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <BarChart2 className="h-4 w-4 text-[#3a8f71] mr-2" />
                <span className="text-xs font-medium text-[#3a8f71]">MARKET INDICATORS</span>
              </div>
              
              <div className="flex-1 flex items-center overflow-hidden">
                <motion.div 
                  className="flex space-x-6 items-center"
                  animate={{ x: 0 }}
                  transition={{ ease: "linear", duration: 0.5 }}
                >
                  {getVisibleIndicators().map((indicator, i) => (
                    <div key={`${indicator.name}-${i}`} className="flex items-center space-x-3 whitespace-nowrap">
                      <div>
                        <div className="text-xs text-gray-400">{indicator.name}</div>
                        <div className="text-sm font-medium text-gray-200">{indicator.value}</div>
                      </div>
                      
                      <div className={`flex items-center ${
                        indicator.trending === "up" ? "text-green-500" : "text-red-500"
                      }`}>
                        <span className="text-xs font-medium">{indicator.change}</span>
                        {indicator.trending === "up" ? 
                          <TrendingUp className="h-3 w-3 ml-1" /> : 
                          <TrendingDown className="h-3 w-3 ml-1" />
                        }
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
              
              <div className="flex">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full dark-surface-3 hover:bg-gray-700"
                  onClick={() => setIndicatorIndex((prev) => prev === 0 ? ECONOMIC_INDICATORS.length - 1 : prev - 1)}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full dark-surface-3 hover:bg-gray-700"
                  onClick={() => setIndicatorIndex((prev) => (prev + 1) % ECONOMIC_INDICATORS.length)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 