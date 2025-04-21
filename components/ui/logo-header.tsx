"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export function LogoHeader() {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <Link href="/">
      <div 
        className="flex items-center" 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div 
          className="relative flex items-center justify-center w-10 h-10"
          whileHover={{ scale: 1.08 }}
          animate={{ 
            scale: isHovered ? 1.08 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src="/Green Icon.svg"
            alt="Impact Capitol"
            width={46}
            height={46}
            className="object-contain"
            priority
          />
        </motion.div>
      </div>
    </Link>
  )
} 