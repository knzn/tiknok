import mongoose from 'mongoose'
import { User } from '@video-app/shared/types/auth.types'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, default: null },
  profilePicture: { type: String },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
}, { timestamps: true })

// Add indexes
userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ username: 1 }, { unique: true })
userSchema.index({ displayName: 1 }, { unique: false }) // Remove unique constraint on displayName

// Add pre-save middleware to set displayName
userSchema.pre('save', function(next) {
  if (!this.displayName) {
    this.displayName = this.username
  }
  next()
})

export const UserModel = mongoose.model<User>('User', userSchema) 