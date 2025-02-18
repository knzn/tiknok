import React from 'react'
import { Heart, MessageCircle, Share2 } from 'lucide-react'

interface ShortVideoProps {
  videoUrl: string
  title: string
  username: string
  likes?: number
  comments?: number
}

export function ShortVideo({ 
  videoUrl, 
  title, 
  username, 
  likes = 0, 
  comments = 0 
}: ShortVideoProps) {
  return (
    <div className="relative h-full w-full snap-start">
      <video
        className="h-full w-full object-cover"
        src={videoUrl}
        loop
        playsInline
      />
      
      {/* Overlay with gradient */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Video Info */}
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <h2 className="text-white font-medium text-lg">{title}</h2>
            <p className="text-white/80 text-sm">@{username}</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4">
            <button className="flex flex-col items-center">
              <Heart className="w-6 h-6 text-white" />
              <span className="text-white text-sm">{likes}</span>
            </button>
            
            <button className="flex flex-col items-center">
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="text-white text-sm">{comments}</span>
            </button>
            
            <button className="flex flex-col items-center">
              <Share2 className="w-6 h-6 text-white" />
              <span className="text-white text-sm">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 