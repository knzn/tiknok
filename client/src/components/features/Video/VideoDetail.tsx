import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { VideoService } from '@/services/video.service'
import { VideoPlayer } from './VideoPlayer'
import { CommentSection } from '../Comment/CommentSection'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { Video } from '@video-app/shared/types/video.types'

interface VideoDetailProps {
  videoId: string
}

export function VideoDetail({ videoId }: VideoDetailProps) {
  const [showComments, setShowComments] = useState(false)
  const { data: video, isLoading, error } = useQuery<Video>({
    queryKey: ['video', videoId],
    queryFn: () => VideoService.getVideo(videoId)
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load video'} />
  }

  if (!video) {
    return <div>Video not found</div>
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative aspect-video">
        <VideoPlayer 
          src={video.hlsUrl}
          poster={video.thumbnailUrl}
          aspectRatio={video.aspectRatio || 16/9}
          autoPlay
        />
        
        {/* Actions Container - Centered vertically on the right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
          {/* Like Button */}
          <button className="action-button group bg-gray-900/80 p-2 rounded-full hover:bg-gray-800/80 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
              />
            </svg>
            <span className="absolute -right-10 bg-gray-900/80 px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {video.likes || 0}
            </span>
          </button>

          {/* Comment Button */}
          <button 
            className="action-button group bg-gray-900/80 p-2 rounded-full hover:bg-gray-800/80 transition-colors"
            onClick={() => setShowComments(true)}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            <span className="absolute -right-10 bg-gray-900/80 px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {video.comments || 0}
            </span>
          </button>
        </div>

        {/* Video Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* Video Info */}
      <div className="mt-4">
        <h1 className="text-2xl font-bold">{video.title}</h1>
        <div className="flex items-center mt-2 space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {video.views?.toLocaleString() || 0} views
            </span>
            <span>•</span>
            <span className="text-sm text-gray-600">
              {new Date(video.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {video.description && (
          <p className="mt-4 text-gray-600">{video.description}</p>
        )}
      </div>

      {/* Comment Section */}
      <CommentSection
        videoId={videoId}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  )
}