import { Router, Request, Response, RequestHandler } from 'express'
import multer from 'multer'
import path from 'path'
import { promises as fs } from 'fs'
import { VideoController } from '../controllers/video.controller'
import { VideoProcessingService } from '../services/video-processing.service'
import { authMiddleware } from '../../../middleware/auth'
import { VideoModel } from '../models/video.model'
import { CommentModel } from '../models/comment.model'
import { AuthRequest } from '../../auth/types/auth.types'
import { Types, Document } from 'mongoose'

// Create temp upload directory
const TEMP_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'temp')

// Ensure upload directories exist
async function ensureUploadDirs() {
  try {
    await fs.mkdir(TEMP_UPLOAD_DIR, { recursive: true })
    console.log('Upload directories created')
  } catch (error) {
    console.error('Failed to create upload directories:', error)
  }
}

// Create upload directories when module loads
ensureUploadDirs()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    const ext = path.extname(file.originalname)
    cb(null, `${uniqueSuffix}${ext}`)
  }
})

const upload = multer({
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

const router = Router()
const videoProcessingService = new VideoProcessingService()
const videoController = new VideoController(videoProcessingService)

// Cast auth middleware to RequestHandler
const typedAuthMiddleware = authMiddleware as RequestHandler

// Define the User document structure
interface UserDocument extends Document {
  _id: Types.ObjectId
  username: string
  profilePicture?: string
}

// Define the Comment document structure with populated fields
interface CommentDocument extends Document {
  _id: Types.ObjectId
  content: string
  videoId: Types.ObjectId
  userId: Types.ObjectId | UserDocument // Can be either ID or populated user
  createdAt: Date
  updatedAt: Date
}

// Comment handlers with proper typing
const addCommentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { videoId } = req.params
    const { content } = req.body
    const authReq = req as AuthRequest
    const userId = authReq.user.id

    const video = await VideoModel.findById(videoId)
    if (!video) {
      res.status(404).json({ error: 'Video not found' })
      return
    }

    const comment = await CommentModel.create({
      content,
      videoId,
      userId
    })

    await comment.populate('userId', 'username profilePicture')
    res.status(201).json(comment)
  } catch (error) {
    next(error)
  }
}

const getCommentsHandler: RequestHandler = async (req, res, next) => {
  try {
    const { videoId } = req.params
    
    const comments = await CommentModel.find({ videoId })
      .populate('userId', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(100)

    res.json(comments)
  } catch (error) {
    next(error)
  }
}

const deleteCommentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { videoId, commentId } = req.params
    const userId = (req as AuthRequest).user.id

    const comment = await CommentModel.findById(commentId)
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' })
      return
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this comment' })
      return
    }

    await CommentModel.findByIdAndDelete(commentId)
    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    next(error)
  }
}

const updateCommentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { videoId, commentId } = req.params
    const { content } = req.body
    const userId = (req as AuthRequest).user.id

    const comment = await CommentModel.findById(commentId)
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' })
      return
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== userId) {
      res.status(403).json({ error: 'Not authorized to update this comment' })
      return
    }

    const updatedComment = await CommentModel.findByIdAndUpdate(
      commentId,
      { content },
      { new: true }
    ).populate<{ userId: UserDocument }>('userId', 'username profilePicture')

    if (!updatedComment) {
      res.status(404).json({ error: 'Comment not found after update' })
      return
    }

    // Ensure userId is populated
    if (!('username' in updatedComment.userId)) {
      res.status(500).json({ error: 'Failed to populate user data' })
      return
    }

    // Format the response to match the frontend Comment type
    const response = {
      _id: updatedComment._id.toString(),
      content: updatedComment.content,
      userId: {
        _id: updatedComment.userId._id.toString(),
        username: updatedComment.userId.username,
        profilePicture: updatedComment.userId.profilePicture
      },
      createdAt: updatedComment.createdAt.toISOString()
    }

    res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}

// Cast controller methods to RequestHandler
const uploadHandler: RequestHandler = async (req, res, next) => {
  try {
    await videoController.upload(req as AuthRequest, res)
  } catch (error) {
    next(error)
  }
}

// Routes
router.post(
  '/upload',
  typedAuthMiddleware,
  upload.single('video'),
  uploadHandler
)

router.get('/', videoController.getVideos as RequestHandler)
router.get('/top/:type', videoController.getTopVideos as RequestHandler)
router.get('/:id', videoController.getVideo as RequestHandler)

// Comment routes
router.post('/:videoId/comments', typedAuthMiddleware, addCommentHandler)
router.get('/:videoId/comments', getCommentsHandler)
router.delete('/:videoId/comments/:commentId', typedAuthMiddleware, deleteCommentHandler)
router.patch('/:videoId/comments/:commentId', typedAuthMiddleware, updateCommentHandler)

export default router 