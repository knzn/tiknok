import { Router, RequestHandler } from 'express'
import multer from 'multer'
import { authMiddleware } from '../../auth/middleware/auth.middleware'
import { UserController } from '../controllers/user.controller'
import { AuthRequest } from '../../auth/middleware/auth.middleware'
import path from 'path'

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../../uploads/profiles'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  }
})

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})

// Create wrapper handlers for type safety
const updateProfileHandler: RequestHandler = async (req, res, next) => {
  try {
    await UserController.updateProfile(req as AuthRequest, res)
    return
  } catch (error) {
    next(error)
  }
}

const updateProfilePictureHandler: RequestHandler = async (req, res, next) => {
  try {
    await UserController.updateProfilePicture(req as AuthRequest, res)
    return
  } catch (error) {
    next(error)
  }
}

const updateCoverPhotoHandler: RequestHandler = async (req, res, next) => {
  try {
    await UserController.updateCoverPhoto(req as AuthRequest, res)
    return
  } catch (error) {
    next(error)
  }
}

// Profile routes
router.patch('/profile', authMiddleware, updateProfileHandler)
router.post('/profile/picture', authMiddleware, upload.single('profilePicture'), updateProfilePictureHandler)
router.post('/profile/cover', authMiddleware, upload.single('coverPhoto'), updateCoverPhotoHandler)

export { router as userRoutes } 