"use client"

import { useState, useRef } from "react"
import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  HomeIcon,
  BarChart4,
  FileBarChart,
  Scale,
  Search,
  Globe,
  Database,
  BrainCircuit,
  Lightbulb,
  Clock,
  BookOpen,
  MessageCircle,
  Send,
  X
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { createNewChatUrl } from "@/lib/services/chat-navigation"
import { Spotlight } from "@/components/spotlight"

interface EmptyScreenProps {
  submitServerAction: (message: string) => Promise<{ success: boolean, redirectUrl?: string }>
}

// Define the available categories as a type
type QuestionCategory = 
  | "Investment Strategy" 
  | "Regulatory" 
  | "Legal" 
  | "Market Analysis" 
  | "Market Performance"

// Define the color set type
type ColorSet = {
  bg: string
  text: string
  border: string
}

// Define the question item type
interface QuestionItem {
  id: string
  question: string
  icon: React.ElementType
  category: QuestionCategory
}

const EmptyScreen: React.FC<EmptyScreenProps> = ({ submitServerAction }) => {
  const router = useRouter()
  const [isCustomMessageOpen, setIsCustomMessageOpen] = useState(false)
  const [customMessage, setCustomMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmitMessage = async (message: string) => {
    try {
      // First try using the server action if available
      if (submitServerAction) {
        const result = await submitServerAction(message);
        
        // If the server action succeeds and provides a redirect URL, use it
        if (result.success && result.redirectUrl) {
          router.push(result.redirectUrl);
          return;
        }
      }
      
      // Fallback to client-side navigation if server action doesn't handle it
      const chatUrl = createNewChatUrl(message);
      router.push(chatUrl);
    } catch (error) {
      console.error("Error submitting message:", error);
    }
  }

  const handleSubmitCustomMessage = () => {
    if (customMessage.trim()) {
      handleSubmitMessage(customMessage.trim())
      setCustomMessage("")
      setIsCustomMessageOpen(false)
    }
  }

  const toggleCustomMessage = () => {
    setIsCustomMessageOpen(!isCustomMessageOpen)
    // Focus the textarea when opening
    if (!isCustomMessageOpen) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }

  // Color palette for the question categories - dark mode optimized with rich greys
  const categoryColors: Record<QuestionCategory, ColorSet> = {
    "Investment Strategy": { 
      bg: "dark-surface-2 bg-gradient-to-r from-emerald-900/30 to-emerald-950/20", 
      text: "text-emerald-300", 
      border: "border-0" 
    },
    "Regulatory": { 
      bg: "dark-surface-2 bg-gradient-to-r from-gray-800/30 to-gray-900/20", 
      text: "text-gray-300", 
      border: "border-0" 
    },
    "Legal": { 
      bg: "dark-surface-2 bg-gradient-to-r from-purple-900/30 to-purple-950/20", 
      text: "text-purple-300", 
      border: "border-0" 
    },
    "Market Analysis": { 
      bg: "dark-surface-2 bg-gradient-to-r from-amber-900/30 to-amber-950/20", 
      text: "text-amber-300", 
      border: "border-0" 
    },
    "Market Performance": { 
      bg: "dark-surface-2 bg-gradient-to-r from-rose-900/30 to-rose-950/20", 
      text: "text-rose-300", 
      border: "border-0" 
    },
  }

  const recommendedQuestions: QuestionItem[] = [
    {
      id: "q1",
      question:
        "What are the highest yielding foreclosure markets for investors interested in fix and flip or single-family rentals strategies?",
      icon: HomeIcon,
      category: "Investment Strategy",
    },
    {
      id: "q2",
      question:
        "What are the most pressing political and regulatory developments impacting real estate development and sales by region?",
      icon: Globe,
      category: "Regulatory",
    },
    {
      id: "q3",
      question: "What are the most important considerations when foreclosing in Judicial vs. Non-Judicial states?",
      icon: Scale,
      category: "Legal",
    },
    {
      id: "q4",
      question:
        "What are the highest yielding foreclosure markets for investors interested in fix and flip or single family rentals properties?",
      icon: BarChart4,
      category: "Market Analysis",
    },
    {
      id: "q5",
      question:
        "Analyze the market and operating strategies of the top publicly traded real estate brokerage companies.",
      icon: FileBarChart,
      category: "Market Performance",
    },
  ]

  const alfredFeatures = [
    {
      title: "Real Estate Insights",
      description: "Get accurate and detailed real estate data for any market or property type.",
      icon: HomeIcon,
    },
    {
      title: "Finance Expertise",
      description: "Understand complex financing options, trends, and strategies for real estate investments.",
      icon: BarChart4,
    },
    {
      title: "Policy Updates",
      description: "Stay informed on the latest real estate policies, regulations, and legal developments.",
      icon: Scale,
    },
    {
      title: "Real-Time Information",
      description: "Access up-to-date market data and news with sources to ensure reliability.",
      icon: Clock,
    },
  ]

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-2">
      {/* Replace ALFReD Introduction with the new Spotlight component */}
      <Spotlight />

      {/* Ask ALFReD Anything - Colorful buttons section */}
      <div className="mb-8 px-2 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-transparent">
              <Search className="h-4 w-4 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-100 ml-3">Ask ALFReD Anything</h3>
          </div>
          
          {/* Chat Bubble Icon */}
          <button 
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isCustomMessageOpen 
                ? 'bg-[#2c7359] text-white shadow-md' 
                : 'dark-surface-3 text-gray-200 hover:bg-gray-800/50'
            }`}
            onClick={toggleCustomMessage}
            aria-label={isCustomMessageOpen ? "Close custom message" : "Open custom message"}
          >
            {isCustomMessageOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isCustomMessageOpen && (
            <motion.div 
              className="mb-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-end gap-2 dark-surface-1 rounded-lg p-3 shadow-md">
                <Textarea
                  ref={textareaRef}
                  placeholder="Ask ALFReD a custom question..."
                  className="flex-1 resize-none min-h-[80px] max-h-[160px] dark-surface-2 border-0 focus-visible:ring-gray-500/30 text-white"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitCustomMessage();
                    }
                  }}
                />
                <Button 
                  className="bg-gray-700 hover:bg-gray-600 h-10 shadow-md" 
                  onClick={handleSubmitCustomMessage}
                  disabled={!customMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-gray-300 mb-5">Try these example questions or ask your own:</p>

        <div className="flex flex-wrap gap-2">
          {recommendedQuestions.map((item) => {
            const colorSet = categoryColors[item.category] || {
              bg: "dark-surface-2",
              text: "text-gray-300",
              border: "border-0",
            }

            return (
              <button
                key={item.id}
                className={`${colorSet.bg} ${colorSet.text} ${colorSet.border} rounded-full py-2 px-4 text-sm font-medium 
                transition-all duration-200 
                flex items-center 
                shadow-md hover:shadow-lg hover:scale-[1.02] hover:translate-y-[-2px] 
                active:scale-[0.98] active:shadow-sm active:translate-y-[0px]
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500/40`}
                onClick={() => {
                  // Create the "press" effect visually
                  const btn = document.getElementById(`question-${item.id}`);
                  if (btn) {
                    btn.classList.add('animate-pulse-quick');
                    setTimeout(() => {
                      btn.classList.remove('animate-pulse-quick');
                    }, 300);
                  }
                  handleSubmitMessage(item.question);
                }}
                id={`question-${item.id}`}
              >
                <item.icon className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{item.question}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ALFReD Features */}
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-lg bg-[#2c7359]/20">
            <Lightbulb className="h-4 w-4 text-[#3a8f71]" />
          </div>
          <h3 className="text-xl font-bold text-[#3a8f71] ml-3">What ALFReD Can Do For You</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {alfredFeatures.map((feature, index) => (
            <Card
              key={index}
              className="dark-card border-0 hover:border-0 hover:shadow-lg transition-all h-full"
            >
              <CardContent className="p-6 flex flex-col h-full">
                <div className="p-3 rounded-lg bg-[#2c7359]/20 w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-[#3a8f71]" />
                </div>
                <h4 className="text-lg font-semibold text-[#3a8f71] mb-2">{feature.title}</h4>
                <p className="text-gray-300 text-sm flex-grow">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator className="my-8 dark-surface-2 h-px" />

      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Database className="h-4 w-4 text-[#3a8f71]" />
          <p className="text-sm font-medium text-[#3a8f71]">Powered by ALFReD</p>
        </div>
        <p className="text-xs text-gray-400">
          ALFReD integrates data from FRED, SEC, HMDA, and other official sources
        </p>
        <div className="flex items-center justify-center mt-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Impact Capitol. All rights reserved.
          </p>
        </div>
        <div className="flex items-center justify-center mt-4">
          <BookOpen className="h-4 w-4 text-gray-400 mr-1" />
          <a href="#" className="text-xs text-[#3a8f71] hover:underline">
            Learn more about our data sources
          </a>
        </div>
      </div>
    </div>
  )
}

export default EmptyScreen

