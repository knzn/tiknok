export interface Video {
  id: string
  title: string
  description?: string
  url: string
  hlsUrl: string
  thumbnailUrl?: string
  duration?: number
  userId: string
  views: number
  likes?: number
  comments?: number
  status: 'processing' | 'ready' | 'public' | 'private'
  category?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  aspectRatio?: number
  quality?: string[]
  user?: {
    id: string
    username: string
  }
} 