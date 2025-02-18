import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Video } from '@video-app/shared/types/video.types'

interface VideoCardProps {
  video: Video
  onVideoClick?: () => void
}

export const VideoCard = ({ video, onVideoClick }: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link 
      to={`/video/${video.id}`}
      className="video-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onVideoClick}
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
          <span>{video.views?.toLocaleString() || 0} views</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-4 z-20">
        <button className="action-button group">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </button>

        {/* Comment Button */}
        <button className="action-button group">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {/* Share Button */}
        <button className="action-button group">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {/* User Info */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          {video.user?.username?.charAt(0).toUpperCase()}
        </div>
        <span className="text-white font-medium">@{video.user?.username}</span>
      </div>
    </Link>
  )
} 