import { api } from '../lib/api'
import type { Video } from '@/types/video.types'
import axios from 'axios'

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

interface ApiComment {
  _id: string
  content: string
  userId: {
    _id: string
    username: string
    profilePicture?: string
  }
  createdAt: string
}

const transformComment = (comment: ApiComment): Comment => ({
  id: comment._id,
  content: comment.content,
  userId: {
    id: comment.userId._id,
    username: comment.userId.username,
    profilePicture: comment.userId.profilePicture
  },
  createdAt: comment.createdAt
})

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
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Remove from processing videos if it's a 404
        const storedVideos = JSON.parse(localStorage.getItem('processingVideos') || '[]')
        const updatedVideos = storedVideos.filter((v: any) => v.id !== id)
        localStorage.setItem('processingVideos', JSON.stringify(updatedVideos))
        
        // Cache the 404 to prevent further requests
        const notFoundCache = {
          id,
          timestamp: Date.now()
        }
        localStorage.setItem(`video_not_found_${id}`, JSON.stringify(notFoundCache))
      }
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
      // Check if already known to not exist
      const notFoundCache = localStorage.getItem(`video_not_found_${videoId}`)
      if (notFoundCache) {
        const { timestamp } = JSON.parse(notFoundCache)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          // Remove from processing videos if it's cached as not found
          const storedVideos = JSON.parse(localStorage.getItem('processingVideos') || '[]')
          const updatedVideos = storedVideos.filter((v: any) => v.id !== videoId)
          localStorage.setItem('processingVideos', JSON.stringify(updatedVideos))
          return
        }
        // Clear old cache
        localStorage.removeItem(`video_not_found_${videoId}`)
      }

      if (attempts >= maxAttempts) {
        // Remove from processing videos after max attempts
        const storedVideos = JSON.parse(localStorage.getItem('processingVideos') || '[]')
        const updatedVideos = storedVideos.filter((v: any) => v.id !== videoId)
        localStorage.setItem('processingVideos', JSON.stringify(updatedVideos))
        return
      }

      try {
        const video = await this.getVideo(videoId)
        
        if (video.status === 'ready' || video.status === 'failed') {
          // Video is complete or failed, remove from processing
          const storedVideos = JSON.parse(localStorage.getItem('processingVideos') || '[]')
          const updatedVideos = storedVideos.filter((v: any) => v.id !== videoId)
          localStorage.setItem('processingVideos', JSON.stringify(updatedVideos))
          
          if (video.status === 'ready') {
            window.dispatchEvent(new CustomEvent('videoProcessingComplete', {
              detail: { video }
            }))
          }
          return
        }

        attempts++
        setTimeout(poll, 5000) // Poll every 5 seconds
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // Cache the 404 response
          const notFoundCache = {
            id: videoId,
            timestamp: Date.now()
          }
          localStorage.setItem(`video_not_found_${videoId}`, JSON.stringify(notFoundCache))
          
          // Remove from processing videos
          const storedVideos = JSON.parse(localStorage.getItem('processingVideos') || '[]')
          const updatedVideos = storedVideos.filter((v: any) => v.id !== videoId)
          localStorage.setItem('processingVideos', JSON.stringify(updatedVideos))
          return
        }
        
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

  async getVideoComments(videoId: string): Promise<Comment[]> {
    try {
      const { data } = await api.get<ApiComment[]>(`/videos/${videoId}/comments`)
      return data.map(comment => ({
        id: comment._id,
        content: comment.content,
        userId: {
          id: comment.userId._id,
          username: comment.userId.username,
          profilePicture: comment.userId.profilePicture
        },
        createdAt: comment.createdAt
      }))
    } catch (error) {
      console.error('Error fetching comments:', error)
      return []
    }
  },

  async addComment(videoId: string, content: string): Promise<Comment> {
    const { data } = await api.post(`/videos/${videoId}/comments`, { content })
    return {
      id: data._id,
      content: data.content,
      userId: {
        id: data.userId._id,
        username: data.userId.username,
        profilePicture: data.userId.profilePicture
      },
      createdAt: data.createdAt
    }
  },

  async updateComment(videoId: string, commentId: string, content: string): Promise<Comment> {
    try {
      const { data } = await api.patch(`/videos/${videoId}/comments/${commentId}`, { 
        content: content.trim() 
      })
      
      return {
        id: data._id || data.id,
        content: data.content,
        userId: {
          id: data.userId._id || data.userId.id,
          username: data.userId.username,
          profilePicture: data.userId.profilePicture
        },
        createdAt: data.createdAt
      }
    } catch (error) {
      console.error('Error in updateComment:', error)
      throw error
    }
  },

  async deleteComment(videoId: string, commentId: string): Promise<void> {
    try {
      await api.delete(`/videos/${videoId}/comments/${commentId}`)
      console.log('Comment deleted successfully')
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  },

  handleCancelEdit: () => {
    setEditingCommentId(null)
    setEditContent('')
  },

  async deleteVideo(videoId: string): Promise<void> {
    try {
      await api.delete(`/videos/${videoId}`)
    } catch (error) {
      console.error('Error deleting video:', error)
      throw error
    }
  },

  async updateVideo(videoId: string, data: { title?: string; description?: string }): Promise<Video> {
    try {
      const response = await api.patch(`/videos/${videoId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating video:', error)
      throw error
    }
  }
} 