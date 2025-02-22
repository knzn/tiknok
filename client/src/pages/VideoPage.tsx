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
      <div className="w-full h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-red-500">{error || 'Video not found'}</div>
      </div>
    )
  }

  if (video.status === 'processing') {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl mx-4 bg-blue-50 p-4 rounded-lg">
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
    <div className="w-full min-h-screen bg-black">
      <div className="w-full max-w-[1280px] mx-auto">
        <div className="w-full aspect-video">
          <VideoPlayer 
            src={video.hlsUrl} 
            poster={video.thumbnailUrl}
            aspectRatio={video.aspectRatio || 16/9}
            autoPlay
          />
        </div>
        <div className="mt-6 text-white px-4">
          <h1 className="text-xl md:text-2xl font-bold">{video.title}</h1>
          <div className="flex flex-wrap items-center mt-4 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">
                By {video.userId.username}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-300">
                {video.views?.toLocaleString() || 0} views
              </span>
            </div>
          </div>
          {video.description && (
            <p className="mt-4 text-gray-300">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  )
} 