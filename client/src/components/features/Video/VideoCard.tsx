import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Video } from '@video-app/shared/types/video.types'

interface VideoCardProps {
  video: Video
  onVideoClick?: () => void
}

export const VideoCard = ({ video, onVideoClick }: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false)

  // Get username safely with fallback
  const username = video.userId?.username || video.user?.username || 'Unknown User'
  const firstLetter = username.charAt(0).toUpperCase()

  return (
    <div 
      className="video-card group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (onVideoClick) onVideoClick()
        else window.location.href = `/video/${video.id}`
      }}
    >
      {/* Video Thumbnail */}
      <img 
        src={video.thumbnailUrl} 
        alt={video.title}
        className="w-full h-full object-cover"
      />

      {/* Overlay Gradient */}
      <div className="video-overlay" />

      {/* Video Info */}
      <div className="absolute bottom-20 left-4 right-16 z-10">
        <h3 className="text-white text-lg font-semibold line-clamp-2">{video.title}</h3>
        <div className="mt-2 flex items-center text-white/80 text-sm">
          <span>{video.views?.toLocaleString() || 0} reactions</span>
        </div>
        <div className="mt-2 flex items-center text-white/80 text-sm">
          <span>{video.views?.toLocaleString() || 0} views</span>
        </div>
      </div>

      {/* User Info */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
          {firstLetter}
        </div>
        <Link 
          to={`/profile/${username}`}
          className="text-white font-medium hover:underline"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          @{username}
        </Link>
      </div>
    </div>
  )
} 