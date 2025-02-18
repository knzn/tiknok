import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/video-app',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  uploadDir: 'uploads',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  // Add other environment configurations as needed
} 