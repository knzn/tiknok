import { z } from 'zod'
import { UserSchema } from './auth.types'

export const VideoSchema = z.object({
  id: z.string(),
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  userId: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().optional(),
  views: z.number().default(0),
  status: z.enum(['processing', 'public', 'private']).default('processing'),
  quality: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: UserSchema.optional()
})

export type Video = z.infer<typeof VideoSchema>

export const VideoUploadSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional()
})

export type VideoUpload = z.infer<typeof VideoUploadSchema>

export interface Video {
  id: string
  title: string
  description?: string
  url: string
  thumbnailUrl?: string
  hlsUrl?: string
  status: 'processing' | 'ready' | 'failed'
  createdAt: string
  updatedAt: string
  userId: string
} 