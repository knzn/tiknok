import { VideoProcessingService } from '../services/video-processing.service'
import { Request, Response } from 'express'
import { promises as fs } from 'fs'
import { ObjectId } from 'mongodb'
import { VideoModel } from '../models/video.model'
import { AuthRequest } from '../middleware/auth'

export class VideoController {
  static async uploadVideo(req: AuthRequest, res: Response) {
    let videoId: string | undefined
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' })
      }

      console.log('Upload request received:', {
        file: {
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        body: req.body
      })

      videoId = new ObjectId().toString()
      
      // Create video document with initial status
      const video = await VideoModel.create({
        _id: videoId,
        title: req.body.title,
        description: req.body.description,
        userId: req.user!.id,
        status: 'processing',
        processingProgress: 0,
        processingStage: 'initializing'
      })

      // Return the video immediately
      res.status(201).json({
        ...video.toJSON(),
        id: video._id
      })

      // Process video in background
      try {
        // Update to metadata stage
        await VideoModel.findByIdAndUpdate(videoId, {
          processingStage: 'metadata'
        })

        const processedVideo = await VideoProcessingService.processVideo(req.file.path, videoId)

        // Update with final info
        await VideoModel.findByIdAndUpdate(videoId, {
          hlsUrl: `/hls/${videoId}/master.m3u8`,
          thumbnailUrl: `/thumbnails/${videoId}.jpg`,
          duration: processedVideo.duration,
          resolution: processedVideo.resolution,
          status: 'ready',
          processingStage: 'ready',
          processingProgress: 100
        })

        // Cleanup
        await fs.unlink(req.file.path)
        console.log('Video processing completed:', videoId)
      } catch (error) {
        console.error('Video processing failed:', error)
        await VideoModel.findByIdAndUpdate(videoId, {
          status: 'failed',
          processingStage: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } catch (error) {
      if (videoId) {
        await VideoModel.findByIdAndUpdate(videoId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          processingStage: 'failed'
        }).catch(console.error)
      }
      
      console.error('Upload error:', error)
      res.status(500).json({ 
        error: 'Failed to process video',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
} 