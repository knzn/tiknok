import { Router, Request, Response, RequestHandler } from 'express'
import multer from 'multer'
import path from 'path'
import { promises as fs } from 'fs'
import { VideoController } from '../controllers/video.controller'
import { VideoProcessingService } from '../services/video-processing.service'
import { authMiddleware } from '../../../middleware/auth'

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

router.post(
  '/upload', 
  authMiddleware as RequestHandler, 
  upload.single('video'), 
  videoController.upload as RequestHandler
)

router.get('/', videoController.getVideos as RequestHandler)
router.get('/top/:type', videoController.getTopVideos as RequestHandler)
router.get('/:id', videoController.getVideo as RequestHandler)

export default router 