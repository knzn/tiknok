import { Request, Response } from 'express'
import { VideoProcessingService } from '../services/video-processing.service'
import { VideoModel } from '../models/video.model'
import { AuthRequest } from '../../auth/types/auth.types'
import multer from 'multer'
import path from 'path'
import { CommentModel } from '../models/comment.model'

const storage = multer.diskStorage({
  destination: 'uploads/temp',
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Not a video file'))
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
})

export class VideoController {
  constructor(private videoProcessingService: VideoProcessingService) {}

  upload = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      console.log('Upload request:', {
        file: req.file,
        body: req.body,
        user: req.user,
        headers: req.headers
      })

      if (!req.file) {
        res.status(400).json({ error: 'No video file provided' })
        return
      }

      if (!req.user?.id) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const video = await VideoModel.create({
        title: req.body.title,
        description: req.body.description,
        userId: req.user.id,
        status: 'processing'
      })

      // Start processing in background
      this.videoProcessingService.processVideo(
        req.file.path,
        `uploads/${video.id}`,
        video.id
      ).catch(console.error)

      // Return the video with _id as id
      res.status(201).json({
        ...video.toJSON(),
        id: video._id
      })
    } catch (error) {
      console.error('Upload error:', error)
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  getVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      const video = await VideoModel.findById(req.params.id)
        .populate('userId', 'username profilePicture')
      
      if (!video) {
        console.log('Video not found:', req.params.id)
        res.status(404).json({ error: 'Video not found' })
        return
      }

      console.log('Found video:', JSON.stringify(video, null, 2))
      
      // Convert _id to id in response
      const videoData = video.toJSON()
      const response = {
        ...videoData,
        id: videoData._id,
        hlsUrl: videoData.hlsUrl || null,
        thumbnailUrl: videoData.thumbnailUrl || null
      }
      
      console.log('Sending response:', JSON.stringify(response, null, 2))
      res.json(response)
    } catch (error) {
      console.error('Error getting video:', error)
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  getVideos = async (req: Request, res: Response): Promise<void> => {
    try {
      const videos = await VideoModel.find()
        .populate('userId', 'username profilePicture')
        .sort({ createdAt: -1 })
      
      res.json(videos)
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  getTopVideos = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params
      let query = {}
      
      switch (type) {
        case 'likes':
          query = { likes: { $exists: true } }
          break
        case 'views':
          query = { views: { $exists: true } }
          break
        case 'trending':
          // Last 24 hours with most views
          query = {
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
          break
        default:
          res.status(400).json({ error: 'Invalid type' })
          return
      }

      const videos = await VideoModel.find(query)
        .populate('userId', 'username profilePicture')
        .sort({ [type === 'trending' ? 'views' : type]: -1 })
        .limit(5)

      res.json(videos)
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  async addComment(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { videoId } = req.params
      const { content } = req.body
      const userId = req.user.id

      const video = await VideoModel.findById(videoId)
      if (!video) {
        return res.status(404).json({ error: 'Video not found' })
      }

      const comment = await CommentModel.create({
        content,
        videoId,
        userId
      })

      await comment.populate('userId', 'username profilePicture')

      return res.status(201).json(comment)
    } catch (error) {
      console.error('Error adding comment:', error)
      return res.status(500).json({ error: 'Failed to add comment' })
    }
  }

  async getComments(req: Request, res: Response): Promise<Response> {
    try {
      const { videoId } = req.params
      
      const comments = await CommentModel.find({ videoId })
        .populate('userId', 'username profilePicture')
        .sort({ createdAt: -1 })
        .limit(100)

      return res.json(comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      return res.status(500).json({ error: 'Failed to fetch comments' })
    }
  }

  async deleteComment(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { videoId, commentId } = req.params
      const userId = req.user.id

      const comment = await CommentModel.findById(commentId)
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' })
      }

      // Check if user owns the comment
      if (comment.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' })
      }

      await CommentModel.findByIdAndDelete(commentId)
      return res.status(200).json({ message: 'Comment deleted successfully' })
    } catch (error) {
      console.error('Error deleting comment:', error)
      return res.status(500).json({ error: 'Failed to delete comment' })
    }
  }
} 