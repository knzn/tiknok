import React from 'react'
import { cn } from '@/lib/utils'

interface ShortsLayoutProps {
  children: React.ReactNode
  className?: string
}

export function ShortsLayout({ children, className }: ShortsLayoutProps) {
  return (
    <div className={cn(
      "flex h-screen w-full max-w-[500px] mx-auto flex-col bg-black",
      className
    )}>
      {children}
    </div>
  )
} 