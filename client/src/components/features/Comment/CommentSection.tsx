import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/stores/authStore'
import { VideoService } from '@/services/video.service'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Comment {
  id: string
  content: string
  userId: {
    username: string
    profilePicture?: string
  }
  createdAt: string
}

interface CommentSectionProps {
  videoId: string
  isOpen: boolean
  onClose: () => void
}

export function CommentSection({ videoId, isOpen, onClose }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const { register, handleSubmit, reset } = useForm<{ content: string }>()

  const onSubmit = async (data: { content: string }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to comment",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      await VideoService.addComment(videoId, data.content)
      
      // Add optimistic update
      const newComment: Comment = {
        id: Date.now().toString(), // Temporary ID
        content: data.content,
        userId: {
          username: user.username,
          profilePicture: user.profilePicture
        },
        createdAt: new Date().toISOString()
      }
      
      setComments(prev => [newComment, ...prev])
      reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="comment-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Comment Section */}
          <motion.div
            className="comment-section"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Comments ({comments.length})</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-b">
              <Textarea
                {...register('content', { required: true })}
                placeholder="Add a comment..."
                className="w-full resize-none"
                disabled={isLoading}
              />
              <div className="mt-2 flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <LoadingSpinner size={16} className="mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Post
                </Button>
              </div>
            </form>

            {/* Comments List */}
            <div className="overflow-y-auto h-[calc(100vh-200px)]">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 border-b">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {comment.userId.profilePicture ? (
                        <img
                          src={comment.userId.profilePicture}
                          alt={comment.userId.username}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <span className="text-sm">
                          {comment.userId.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{comment.userId.username}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 