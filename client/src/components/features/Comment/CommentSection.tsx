import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/stores/authStore'
import { VideoService } from '../../../services/video.service'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'
import { useToast } from '../../../components/ui/use-toast'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
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

// Define interfaces
interface User {
  id: string
  username: string
  profilePicture?: string
}

interface Comment {
  id: string
  content: string
  userId: {
    id: string
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
  // State management
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  
  // Hooks
  const { user } = useAuthStore()
  const { toast } = useToast()
  const {
    register: registerComment,
    handleSubmit: handleCommentSubmit,
    reset: resetComment,
  } = useForm<{ content: string }>({
    defaultValues: {
      content: ''
    }
  })

  // Add separate form for editing
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    watch: watchEdit
  } = useForm<{ content: string }>({
    defaultValues: {
      content: ''
    }
  })

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('Current authenticated user:', user)
    }
  }, [user])

  // Fetch comments
  useEffect(() => {
    if (isOpen && videoId) {
      const fetchComments = async () => {
        try {
          setIsFetching(true)
          const fetchedComments = await VideoService.getVideoComments(videoId)
          console.log('Fetched comments:', fetchedComments)
          setComments(fetchedComments)
        } catch (error) {
          console.error('Failed to fetch comments:', error)
          toast({
            title: "Error",
            description: "Failed to load comments",
            variant: "destructive"
          })
        } finally {
          setIsFetching(false)
        }
      }

      fetchComments()
    }
  }, [isOpen, videoId, toast])

  // Submit new comment
  const onSubmit = async (data: { content: string }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to comment",
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Optimistic update
      const optimisticComment: Comment = {
        id: Date.now().toString(),
        content: data.content,
        userId: {
          id: user.id,
          username: user.username,
          profilePicture: user.profilePicture
        },
        createdAt: new Date().toISOString()
      }
      
      setComments(prev => [optimisticComment, ...prev])
      resetComment()
      
      // API call
      const newComment = await VideoService.addComment(videoId, data.content)
      
      // Update with actual comment data
      setComments(prev => 
        prev.map(comment => 
          comment.id === optimisticComment.id ? newComment : comment
        )
      )
      
    } catch (error) {
      // Remove optimistic comment on error
      setComments(prev => prev.filter(comment => comment.id !== Date.now().toString()))
      console.error('Failed to post comment:', error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Edit comment handlers
  const handleEdit = (comment: Comment) => {
    console.log('Starting edit for comment:', comment)
    setEditingCommentId(comment.id)
    // Set the edit form value
    resetEdit({ content: comment.content })
  }

  const handleCancelEdit = () => {
    console.log('Canceling edit')
    setEditingCommentId(null)
    resetEdit() // Reset edit form
  }

  // Delete comment handler
  const handleDeleteComment = async (commentId: string) => {
    // Store current state before deletion
    const currentComments = [...comments]
    
    try {
      setIsLoading(true)
      // Remove comment from UI first (optimistic update)
      setComments(prev => prev.filter(comment => comment.id !== commentId))
      
      // Call API to delete
      await VideoService.deleteComment(videoId, commentId)
      setCommentToDelete(null)
      
      toast({
        title: "Success",
        description: "Comment deleted successfully"
      })
    } catch (error) {
      // Restore previous state if API call fails
      setComments(currentComments)
      console.error('Failed to delete comment:', error)
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Render individual comment
  const renderComment = (comment: Comment) => {
    const isOwner = user?.id === comment.userId.id
    const isEditing = editingCommentId === comment.id

    return (
      <div key={comment.id} className="flex gap-4 py-4 border-b">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0">
          {comment.userId.profilePicture ? (
            <img
              src={comment.userId.profilePicture}
              alt={comment.userId.username}
              className="w-full h-full rounded-full"
            />
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center bg-primary text-white">
              {comment.userId.username[0].toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.userId.username}</span>
              <span className="text-sm text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(comment)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit comment</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCommentToDelete(comment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete comment</span>
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleEditSubmit(async (data) => {
              if (!data.content.trim()) return
              
              try {
                setIsLoading(true)
                const updatedComment = await VideoService.updateComment(
                  videoId, 
                  comment.id, 
                  data.content.trim()
                )
                
                setComments(prev => 
                  prev.map(c => c.id === comment.id ? updatedComment : c)
                )
                
                handleCancelEdit()
                toast({
                  title: "Success",
                  description: "Comment updated successfully"
                })
              } catch (error) {
                console.error('Failed to update comment:', error)
                toast({
                  title: "Error",
                  description: "Failed to update comment",
                  variant: "destructive"
                })
              } finally {
                setIsLoading(false)
              }
            })}>
              <div className="space-y-2">
                <Textarea
                  {...registerEdit('content', {
                    required: 'Comment cannot be empty',
                    validate: value => value.trim() !== '' || 'Comment cannot be empty'
                  })}
                  placeholder="Edit your comment..."
                  className="min-h-[80px] w-full"
                  disabled={isLoading}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={isLoading || watchEdit('content')?.trim() === comment.content.trim()}
                  >
                    {isLoading ? <LoadingSpinner size={16} /> : 'Save'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <p className="mt-1 text-gray-700">{comment.content}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            
            {/* Comment Section */}
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-lg z-50 overflow-hidden flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">Comments</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isFetching ? (
                  <div className="flex justify-center p-4">
                    <LoadingSpinner />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-gray-500">No comments yet</p>
                ) : (
                  comments.map(renderComment)
                )}
              </div>

              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit(onSubmit)} className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    {...registerComment('content', { required: true })}
                    placeholder="Write a comment..."
                    className="flex-1"
                    disabled={isLoading || !user}
                  />
                  <Button type="submit" disabled={isLoading || !user}>
                    {isLoading ? <LoadingSpinner size={20} /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
                {!user && (
                  <p className="text-sm text-gray-500 mt-2">
                    Please log in to comment
                  </p>
                )}
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!commentToDelete} onOpenChange={() => setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => commentToDelete && handleDeleteComment(commentToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}