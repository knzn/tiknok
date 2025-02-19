import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { VideoDetail } from '@/components/features/Video/VideoDetail'

export function VideoPage() {
  const { id } = useParams<{ id: string }>()

  
  return (
    <div className="container max-w-4xl mx-auto py-10">
      <VideoDetail videoId={id!} />
      
    </div>
  )
} 