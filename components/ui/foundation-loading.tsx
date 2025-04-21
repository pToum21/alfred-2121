"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { nanoid } from 'nanoid'

// Define the tile colors to match Impact Capitol branding
const colors = {
  darkest: "#2c7359",
  medium: "#3a8f71",
  lightest: "#61b992",
}

// Generate unique IDs for filter and gradient to avoid conflicts with multiple instances
const filterId = `tile-shadow-${nanoid(6)}`

// Define the tile configurations for different states - scaled down by 40%
const tileStates = [
  // Initial state (as provided in the SVG)
  [
    { id: 1, x: 8, y: 8, width: 64, height: 24, fill: colors.darkest },
    { id: 2, x: 76, y: 8, width: 36, height: 24, fill: colors.lightest },
    { id: 3, x: 8, y: 36, width: 48, height: 24, fill: colors.medium },
    { id: 4, x: 60, y: 36, width: 52, height: 24, fill: colors.medium },
    { id: 5, x: 8, y: 64, width: 24, height: 24, fill: colors.lightest },
    { id: 6, x: 36, y: 64, width: 76, height: 24, fill: colors.darkest },
  ],
  // State 2: Tiles shift horizontally
  [
    { id: 1, x: 36, y: 8, width: 64, height: 24, fill: colors.medium },
    { id: 2, x: 8, y: 8, width: 24, height: 24, fill: colors.lightest },
    { id: 3, x: 60, y: 36, width: 52, height: 24, fill: colors.darkest },
    { id: 4, x: 8, y: 36, width: 48, height: 24, fill: colors.medium },
    { id: 5, x: 76, y: 64, width: 36, height: 24, fill: colors.darkest },
    { id: 6, x: 8, y: 64, width: 64, height: 24, fill: colors.lightest },
  ],
  // State 3: Tiles shift vertically
  [
    { id: 1, x: 8, y: 36, width: 64, height: 24, fill: colors.lightest },
    { id: 2, x: 76, y: 36, width: 36, height: 24, fill: colors.darkest },
    { id: 3, x: 8, y: 64, width: 48, height: 24, fill: colors.medium },
    { id: 4, x: 60, y: 64, width: 52, height: 24, fill: colors.darkest },
    { id: 5, x: 8, y: 8, width: 24, height: 24, fill: colors.medium },
    { id: 6, x: 36, y: 8, width: 76, height: 24, fill: colors.lightest },
  ],
]

export default function FoundationLoading({
  size = "tiny",
  autoPlay = true,
}: {
  size?: "tiny" | "small" | "medium"
  autoPlay?: boolean
}) {
  const [stateIndex, setStateIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(autoPlay)
  const controls = useAnimation()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Determine size based on prop - make all sizes smaller
  const sizeClasses = {
    tiny: "w-[120px]",
    small: "w-[150px]",
    medium: "w-[200px]",
  }

  const startAnimation = () => {
    setIsAnimating(true)
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      setStateIndex((prevIndex) => (prevIndex + 1) % tileStates.length)
    }, 800) // Speed up animation for better hover experience
  }

  const stopAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsAnimating(false)
    // Reset to initial state when animation stops
    setStateIndex(0)
  }

  useEffect(() => {
    if (autoPlay) {
      startAnimation()
    } else {
      stopAnimation()
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoPlay])

  useEffect(() => {
    // Trigger a subtle pulse animation when the state changes
    controls.start({
      scale: [1, 1.05, 1], // Slightly more noticeable
      transition: { duration: 0.4 },
    })
  }, [stateIndex, controls])

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="relative"
        animate={controls}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 100"
          className={`${sizeClasses[size]}`}
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <defs>
            <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Animated tiles */}
          <AnimatePresence>
            {tileStates[stateIndex].map((tile) => (
              <motion.rect
                key={tile.id}
                initial={{
                  opacity: 0.8,
                  scale: 0.97,
                }}
                animate={{
                  x: tile.x,
                  y: tile.y,
                  width: tile.width,
                  height: tile.height,
                  fill: tile.fill,
                  opacity: 1,
                  scale: 1,
                  filter: `url(#${filterId})`,
                  rx: 3,
                  ry: 3,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 250, // More springy
                  damping: 20,    // Less damping
                  mass: 0.8,      // Lighter
                }}
              />
            ))}
          </AnimatePresence>
        </motion.svg>
      </motion.div>
    </div>
  )
} 