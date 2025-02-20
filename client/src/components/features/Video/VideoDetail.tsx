import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { VideoService } from '@/services/video.service'
import { VideoPlayer } from './VideoPlayer'
import { CommentSection } from '../Comment/CommentSection'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/stores/authStore'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Video } from '@video-app/shared/types/video.types'

interface VideoDetailProps {
  videoId: string
}

export function VideoDetail({ videoId }: VideoDetailProps) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // State
  const [showComments, setShowComments] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Query
  const { data: video, isLoading: isLoadingVideo, error } = useQuery<Video>({
    queryKey: ['video', videoId],
    queryFn: () => VideoService.getVideo(videoId)
  })

  // Check if user is owner
  // const isOwner = user?.id === video?.userId?._id || user?.id === video?.userId?.id
  const isOwner = user?.id === video?.userId._id

  // Handlers
  const handleEdit = () => {
    setEditTitle(video?.title || '')
    setEditDescription(video?.description || '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle('')
    setEditDescription('')
  }

  const handleSaveEdit = async () => {
    if (!video) return

    try {
      setIsLoading(true)
      const updatedVideo = await VideoService.updateVideo(videoId, {
        title: editTitle.trim(),
        description: editDescription.trim()
      })

      // Update cache
      queryClient.setQueryData(['video', videoId], updatedVideo)
      
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Video updated successfully"
      })
    } catch (error) {
      console.error('Failed to update video:', error)
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      await VideoService.deleteVideo(videoId)
      
      toast({
        title: "Success",
        description: "Video deleted successfully"
      })
      
      // Navigate back to home page
      navigate('/')
    } catch (error) {
      console.error('Failed to delete video:', error)
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoadingVideo) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load video'} />
  }

  if (!video) {
    return <div>Video not found</div>
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative aspect-video">
        <VideoPlayer 
          src={video.hlsUrl}
          poster={video.thumbnailUrl}
          aspectRatio={video.aspectRatio || 16/9}
          autoPlay
        />
        
        {/* Actions Container */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
          {/* Like Button */}
          <button className="action-button group bg-gray-900/80 p-2 rounded-full hover:bg-gray-800/80 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
              />
            </svg>
          </button>

          {/* Comment Button */}
          <button 
            className="action-button group bg-gray-900/80 p-2 rounded-full hover:bg-gray-800/80 transition-colors"
            onClick={() => setShowComments(true)}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </button>

          {/* Owner Actions */}
          {isOwner && (
            <>
              <button 
                className="action-button group bg-red-600/80 p-2 rounded-full hover:bg-red-700/80 transition-colors"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-6 h-6 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Video Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* Video Info */}
      <div className="mt-4">
        {isEditing ? (
          <div className="space-y-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Video title"
              className="text-2xl font-bold"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Video description"
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isLoading || (!editTitle.trim() && !editDescription.trim())}
              >
                {isLoading ? <LoadingSpinner size={16} /> : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <>
          <div>
            {/* Owner Actions */}
            {isOwner && (
              <>
                <button 
                  className="action-button group bg-gray-900/80 p-2 rounded-full hover:bg-gray-800/80 transition-colors"
                  onClick={handleEdit}
                >
                  <Pencil className="w-3 h-3 text-white" />
                </button>
              </>
            )}
          </div>
            <h1 className="text-2xl font-bold">{video.title}</h1>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {video.views?.toLocaleString() || 0} views
                </span>
                <span>•</span>
                <span className="text-sm text-gray-600">
                  {new Date(video.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {video.description && (
              <p className="mt-4 text-gray-600">{video.description}</p>
            )}
          </>
        )}
      </div>

      {/* Comment Section */}
      <CommentSection
        videoId={videoId}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}