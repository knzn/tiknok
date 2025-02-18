import { api } from '../lib/api'
import type { Video } from '@/types/video.types'

// Move Video interface to a local definition for now to fix the import error
export interface Video {
  id?: string
  _id?: string
  title: string
  description?: string
  url?: string
  hlsUrl: string
  thumbnailUrl?: string
  duration?: number
  userId: {
    _id: string
    username: string
  }
  views?: number
  likes?: number
  comments?: number
  status: 'processing' | 'ready' | 'public' | 'private'
  category?: string
  tags?: string[]
  quality?: string[]
  createdAt: string
  updatedAt: string
  aspectRatio?: number
}

interface VideoResponse {
  data: Video[]
  nextPage?: number
  total?: number
}

interface VideoUploadResponse {
  _id: string  // MongoDB returns _id
  id?: string
  title: string
  status: 'processing' | 'ready' | 'public' | 'private'
  description?: string
  url: string
  hlsUrl: string
  thumbnailUrl?: string
  duration: number
  userId: string
  views: number
  likes: number
  comments: number
  category?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  aspectRatio?: number
}

export const VideoService = {
  async getVideos(params?: { page?: number, limit?: number }): Promise<VideoResponse> {
    const { data } = await api.get<VideoResponse>('/videos', { params })
    return data
  },

  async getVideo(id: string): Promise<Video> {
    try {
      if (!id) {
        throw new Error('Video ID is required')
      }
      const { data } = await api.get<Video>(`/videos/${id}`)
      return data
    } catch (error) {
      console.error('Error in getVideo:', error)
      throw error
    }
  },

  async uploadVideo(formData: FormData): Promise<Video> {
    try {
      // Server returns the video data directly
      const { data } = await api.post<Video>('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Store processing video info
      const processingVideo = {
        id: data._id,
        title: data.title,
        timestamp: new Date().toISOString()
      }

      // Update localStorage with processing video
      const storedVideos = JSON.parse(localStorage.getItem('processingVideos') || '[]')
      localStorage.setItem('processingVideos', JSON.stringify([
        ...storedVideos,
        processingVideo
      ]))

      return data
    } catch (error) {
      console.error('Upload service error:', error)
      throw error
    }
  },

  async pollVideoStatus(videoId: string) {
    if (!videoId) return

    const maxAttempts = 60 // 5 minutes
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) return

      try {
        const video = await this.getVideo(videoId)
        
        if (video.status === 'ready') {
          // Video is ready, update localStorage
          const storedVideos = JSON.parse(localStorage.getItem('processingVideos') || '[]')
          const updatedVideos = storedVideos.filter((v: any) => v.id !== videoId)
          localStorage.setItem('processingVideos', JSON.stringify(updatedVideos))
          
          // Dispatch event
          window.dispatchEvent(new CustomEvent('videoProcessingComplete', {
            detail: { video }
          }))
          return
        }

        attempts++
        setTimeout(poll, 5000) // Poll every 5 seconds
      } catch (error) {
        console.error('Error polling video status:', error)
        attempts++
        setTimeout(poll, 5000)
      }
    }

    poll()
  },

  async likeVideo(id: string): Promise<void> {
    await api.post(`/videos/${id}/like`)
  },

  async unlikeVideo(id: string): Promise<void> {
    await api.delete(`/videos/${id}/like`)
  },

  async addComment(id: string, content: string): Promise<void> {
    await api.post(`/videos/${id}/comments`, { content })
  }
} 