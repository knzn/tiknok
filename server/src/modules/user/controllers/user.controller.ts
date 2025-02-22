import { Response } from 'express'
import { UserModel } from '../models/user.model'
import { AuthRequest } from '../../auth/middleware/auth.middleware'

export class UserController {
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user.id
      const updateData = req.body

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            gamefarmName: updateData.gamefarmName,
            address: updateData.address,
            contactNumber: updateData.contactNumber,
            facebookProfile: updateData.facebookProfile
          }
        },
        { new: true }
      ).select('-password')

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(updatedUser)
    } catch (error) {
      console.error('Update profile error:', error)
      res.status(500).json({ error: 'Failed to update profile' })
    }
  }

  static async updateProfilePicture(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const userId = req.user.id
      const profilePicture = `${process.env.SERVER_URL || 'http://localhost:3000'}/uploads/profiles/${req.file.filename}`

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { profilePicture } },
        { new: true }
      ).select('-password')

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(updatedUser)
    } catch (error) {
      console.error('Update profile picture error:', error)
      res.status(500).json({ error: 'Failed to update profile picture' })
    }
  }

  static async updateCoverPhoto(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const userId = req.user.id
      const coverPhoto = `/uploads/profiles/${req.file.filename}`

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { coverPhoto } },
        { new: true }
      ).select('-password')

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(updatedUser)
    } catch (error) {
      console.error('Update cover photo error:', error)
      res.status(500).json({ error: 'Failed to update cover photo' })
    }
  }
}