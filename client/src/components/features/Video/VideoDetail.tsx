import { useEffect, useState } from 'react'
import { VideoService } from '@/services/video.service'
import { VideoPlayer } from './VideoPlayer'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Video } from '@video-app/shared/types/video.types'

interface VideoDetailProps {
  videoId: string
}

export function VideoDetail({ videoId }: VideoDetailProps) {
  const [video, setVideo] = useState<Video | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchVideo() {
      try {
        setLoading(true)
        setError(null)
        const data = await VideoService.getVideo(videoId)
        if (mounted) {
          console.log('Video data:', data)
          if (data.status === 'ready') {
            setVideo(data)
          } else {
            setError('Video is still processing')
          }
        }
      } catch (error) {
        console.error('Error fetching video:', error)
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to load video')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchVideo()

    return () => {
      mounted = false
    }
  }, [videoId])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!video) {
    return <div>Video not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <VideoPlayer 
        src={video.hlsUrl}
        poster={video.thumbnailUrl}
        aspectRatio={video.aspectRatio || 16/9}
        autoPlay
      />
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{video.title}</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span>{video.views?.toLocaleString() || 0} views</span>
              <span>•</span>
              <span>{new Date(video.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        {video.description && (
          <p className="text-gray-600">{video.description}</p>
        )}
      </div>
    </div>
  )
} 