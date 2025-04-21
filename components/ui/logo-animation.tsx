"use client"

import { useEffect, useRef } from "react"

interface LogoAnimationProps {
  className?: string
}

export function LogoAnimation({ className = "" }: LogoAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    // Define the blue color palette from the logo
    const colors = [
      "#2c7359", // Dark green
      "#3a8f71", // Medium green
      "#61b992", // Light green
      "#204d3e", // Deep green
      "#183d31", // Very dark green
    ]

    // Create blocks class
    class Block {
      x: number
      y: number
      size: number
      color: string
      speed: number
      angle: number

      constructor(x: number, y: number, size: number) {
        this.x = x
        this.y = y
        this.size = size
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.speed = 0.2 + Math.random() * 0.5
        this.angle = Math.random() * Math.PI * 2
      }

      update() {
        this.x += Math.cos(this.angle) * this.speed
        this.y += Math.sin(this.angle) * this.speed

        // Bounce off walls
        if (canvas && (this.x <= 0 || this.x + this.size >= canvas.width)) {
          this.angle = Math.PI - this.angle
        }
        if (canvas && (this.y <= 0 || this.y + this.size >= canvas.height)) {
          this.angle = -this.angle
        }
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.fillRect(this.x, this.y, this.size, this.size)
      }
    }

    // Create blocks
    const blocks: Block[] = []
    const blockCount = 15

    for (let i = 0; i < blockCount; i++) {
      const size = 10 + Math.random() * 30
      const x = Math.random() * ((canvas?.width || 300) - size)
      const y = Math.random() * ((canvas?.height || 300) - size)
      blocks.push(new Block(x, y, size))
    }

    // Animation loop
    let animationFrameId: number

    const animate = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw and update blocks
      blocks.forEach((block) => {
        block.update()
        block.draw()
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

  return <canvas ref={canvasRef} className={`${className}`} />
} 