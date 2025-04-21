"use client"

import type React from "react"
import { useState } from "react"
import { AlertCircle, Building, Building2, Home, LineChart, TrendingUp, BarChart2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import Image from "next/image"

type SentimentTile = {
  id: string
  title: string
  score: number
  icon: React.ReactNode
  analysis: string
  trend: "up" | "down" | "stable"
}

export function ICapScoreboard() {
  const [open, setOpen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<SentimentTile | null>(null)

  const sentimentData: SentimentTile[] = [
    {
      id: "residential",
      title: "Residential",
      score: 78,
      icon: <Home className="h-5 w-5" />,
      analysis:
        "Housing demand remains strong despite rising interest rates. Inventory constraints continue to push prices upward in most metropolitan areas, though at a slower pace than previous quarters.",
      trend: "up",
    },
    {
      id: "commercial",
      title: "Commercial",
      score: 62,
      icon: <Building className="h-5 w-5" />,
      analysis:
        "Office vacancies remain elevated as hybrid work models persist. Retail showing signs of recovery in high-traffic areas, while industrial spaces continue to outperform due to e-commerce demand.",
      trend: "down",
    },
    {
      id: "mortgage",
      title: "Mortgage",
      score: 65,
      icon: <TrendingUp className="h-5 w-5" />,
      analysis:
        "Higher interest rates have cooled refinancing activity significantly. New mortgage originations have slowed but remain resilient in the purchase market. Credit quality metrics remain strong.",
      trend: "down",
    },
    {
      id: "reit",
      title: "REIT/CMBS",
      score: 71,
      icon: <LineChart className="h-5 w-5" />,
      analysis:
        "REITs showing sector-specific performance with data centers and industrial leading, while office and retail lag. CMBS delinquency rates have stabilized but remain elevated for hospitality and retail.",
      trend: "stable",
    },
    {
      id: "regulatory",
      title: "Regulatory",
      score: 83,
      icon: <AlertCircle className="h-5 w-5" />,
      analysis:
        "Regulatory environment remains favorable with limited new restrictions. Housing affordability initiatives gaining traction at state and local levels. Environmental regulations increasingly impacting development costs.",
      trend: "up",
    },
    {
      id: "political",
      title: "Political",
      score: 68,
      icon: <Building2 className="h-5 w-5" />,
      analysis:
        "Political uncertainty affecting long-term investment decisions. Housing policy remains contentious with competing proposals for addressing affordability and supply constraints.",
      trend: "stable",
    },
  ]

  const handleTileClick = (tile: SentimentTile) => {
    setSelectedTile(tile)
    setOpen(true)
  }

  // Function to calculate the stroke dash offset for circular progress
  const calculateCircumference = (radius: number) => 2 * Math.PI * radius
  const calculateStrokeDashoffset = (percent: number, circumference: number) => {
    return circumference - (percent / 100) * circumference
  }

  // Function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return "#3a8f71" // Primary green
    if (score >= 75) return "#61b992" // Light green
    if (score >= 70) return "#2c7359" // Dark green
    if (score >= 65) return "#ebb142" // Amber from project
    return "#f87171" // Red from project
  }

  // Function to get text color class based on score
  const getTextColorClass = (score: number) => {
    if (score >= 85) return "text-[#3a8f71]"
    if (score >= 75) return "text-[#61b992]"
    if (score >= 70) return "text-[#2c7359]"
    if (score >= 65) return "text-[#ebb142]"
    return "text-[#f87171]"
  }

  // Function to get background color class based on score
  const getBgColorClass = (score: number) => {
    if (score >= 85) return "bg-[#3a8f71]/20"
    if (score >= 75) return "bg-[#61b992]/20"
    if (score >= 70) return "bg-[#2c7359]/20"
    if (score >= 65) return "bg-[#ebb142]/20"
    return "bg-[#f87171]/20"
  }

  // Function to get sentiment text based on score
  const getSentimentText = (score: number) => {
    if (score >= 85) return "Excellent"
    if (score >= 75) return "Very Positive"
    if (score >= 70) return "Positive"
    if (score >= 65) return "Neutral"
    return "Concerning"
  }

  return (
    <div className="w-full px-4 py-3 dark-surface-2 text-white rounded-lg shadow-md border border-gray-800 overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <div>
            <div className="flex items-center">
              <Image 
                src="/i-cap-cropped.png" 
                alt="iCap Scoreboard"
                width={120}
                height={28}
                className="object-contain"
              />
              <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-[#3a8f71]/20 text-[#61b992] rounded uppercase tracking-wider">Live</span>
            </div>
            <p className="text-gray-400 text-xs">Real Estate Market Sentiment Analysis</p>
          </div>
        </div>
        <div className="text-xs text-gray-500 flex items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3a8f71] mr-1 animate-pulse"></div>
          <span className="text-[10px] uppercase tracking-wider">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {sentimentData.map((tile) => {
          const radius = 28
          const circumference = calculateCircumference(radius)
          const strokeDashoffset = calculateStrokeDashoffset(tile.score, circumference)
          const scoreColor = getScoreColor(tile.score)
          const textColorClass = getTextColorClass(tile.score)
          const bgColorClass = getBgColorClass(tile.score)

          return (
            <div
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              className={cn(
                "relative rounded-lg p-3 cursor-pointer transition-all duration-200",
                "hover:shadow-lg hover:shadow-black/30 hover:translate-y-[-2px]",
                bgColorClass,
                "border border-gray-800",
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-full", bgColorClass)}>
                    <div className={textColorClass}>{tile.icon}</div>
                  </div>
                  <h3 className="font-medium text-sm">{tile.title}</h3>
                </div>
                <div className="flex items-center">
                  {tile.trend === "up" && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-[#3a8f71]" />
                    </div>
                  )}
                  {tile.trend === "down" && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-[#f87171] rotate-180" />
                    </div>
                  )}
                  {tile.trend === "stable" && (
                    <div className="h-0.5 w-4 bg-gray-400 rounded-full"></div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                {/* Score circle */}
                <div className="flex items-center">
                  <div className="relative w-14 h-14">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Subtle glow effect */}
                      <defs>
                        <filter id={`glow-${tile.id}`} x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="36"
                        fill="transparent"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="3"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="36"
                        fill="transparent"
                        stroke={scoreColor}
                        strokeWidth="3"
                        strokeDasharray={2 * Math.PI * 36}
                        strokeDashoffset={calculateStrokeDashoffset(tile.score, 2 * Math.PI * 36)}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        filter={`url(#glow-${tile.id})`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className={cn("block text-base font-bold leading-none", textColorClass)}>
                          {tile.score}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">Sentiment</div>
                  <div className={cn("text-xs font-medium", textColorClass)}>{getSentimentText(tile.score)}</div>
                  <div className="text-[10px] text-gray-500 flex items-center mt-1">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mr-1",
                      tile.trend === "up" ? "bg-[#3a8f71]" : 
                      tile.trend === "down" ? "bg-[#f87171]" : 
                      "bg-gray-500"
                    )}></div>
                    {tile.trend === "up" ? "Rising" : tile.trend === "down" ? "Declining" : "Stable"}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
          {selectedTile && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-full", getBgColorClass(selectedTile.score))}>
                    <div className={getTextColorClass(selectedTile.score)}>{selectedTile.icon}</div>
                  </div>
                  <DialogTitle>{selectedTile.title} Market</DialogTitle>
                </div>
                <DialogDescription className="text-gray-400">
                  Current sentiment score:{" "}
                  <span className={cn("font-bold", getTextColorClass(selectedTile.score))}>
                    {selectedTile.score}
                  </span>
                  <span className="text-xs ml-2">
                    ({selectedTile.trend === "up" ? "↑" : selectedTile.trend === "down" ? "↓" : "→"}{" "}
                    {selectedTile.trend === "up" ? "+4.2%" : selectedTile.trend === "down" ? "-2.8%" : "±0.3%"})
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">Analysis</h4>
                  <p className="text-sm text-gray-400">{selectedTile.analysis}</p>
                </div>

                <div className="bg-black/50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Key Metrics</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-xs">
                    <div>
                      <div className="text-gray-500 mb-1 text-[10px] uppercase tracking-wider">Volatility</div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              i < 2 ? getTextColorClass(selectedTile.score) : "bg-gray-700",
                              i < 2 ? "opacity-100" : "opacity-30",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1 text-[10px] uppercase tracking-wider">Liquidity</div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              i < (selectedTile.score > 70 ? 3 : 2) ? getTextColorClass(selectedTile.score) : "bg-gray-700",
                              i < (selectedTile.score > 70 ? 3 : 2) ? "opacity-100" : "opacity-30",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1 text-[10px] uppercase tracking-wider">YoY Change</div>
                      <div
                        className={cn(
                          selectedTile.trend === "up" 
                            ? "text-[#3a8f71]" 
                            : selectedTile.trend === "down" 
                              ? "text-[#f87171]" 
                              : "text-gray-300"
                        )}
                      >
                        {selectedTile.trend === "up" ? "+4.2%" : selectedTile.trend === "down" ? "-2.8%" : "0.3%"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1 text-[10px] uppercase tracking-wider">Forecast</div>
                      <div className="text-gray-300">Stable</div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center justify-end">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3a8f71] mr-1 animate-pulse"></div>
                  Last updated: Today at 14:30 EST
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 