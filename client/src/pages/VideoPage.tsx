import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { VideoService } from '../services/video.service'
import { VideoPlayer } from '../components/features/Video/VideoPlayer'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import type { Video } from '@/types/video.types'

export const VideoPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [video, setVideo] = useState<Video | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchVideo = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await VideoService.getVideo(id!)
        console.log('Fetched video data:', data)
        
        if (mounted && data) {
          setVideo(data)
          // Only redirect if it's a short video
          if (data.aspectRatio === 0.5625) {
            navigate(`/shorts/${id}`)
          }
        } else {
          setError('Video not found')
        }
      } catch (error: any) {
        console.error('Error fetching video:', error)
        if (mounted) {
          setError(error?.response?.data?.message || error?.message || 'Failed to load video')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (id) {
      fetchVideo()
    }

    return () => {
      mounted = false
    }
  }, [id, navigate])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-red-500">Video not found</div>
      </div>
    )
  }

  if (video.status === 'processing') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">{video.title}</h2>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <p className="text-blue-600">Processing video... This may take a few minutes.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <VideoPlayer 
        src={video.hlsUrl} 
        poster={video.thumbnailUrl}
        aspectRatio={video.aspectRatio || 16/9}
        autoPlay
      />
      <div className="mt-4">
        <h1 className="text-2xl font-bold">{video.title}</h1>
        <div className="flex items-center mt-2 space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              By {video.userId.username}
            </span>
            <span>•</span>
            <span className="text-sm text-gray-600">
              {video.views?.toLocaleString() || 0} views
            </span>
          </div>
        </div>
        {video.description && (
          <p className="mt-4 text-gray-600">{video.description}</p>
        )}
        {video.quality && video.quality.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            Available in: {video.quality.join(', ')}
          </div>
        )}
      </div>
    </div>
  )
} 