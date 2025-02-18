import { useEffect, useState, useRef, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { VideoService } from '../services/video.service'
import { VideoCard } from '../components/features/Video/VideoCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import type { Video } from '@video-app/shared/types/video.types'

const VIDEOS_PER_PAGE = 5

export function Home() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ['videos'],
    queryFn: ({ pageParam = 1 }) => 
      VideoService.getVideos({ page: pageParam, limit: VIDEOS_PER_PAGE }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY
    const deltaY = touchStartY.current - touchEndY

    // Determine swipe direction
    if (Math.abs(deltaY) > 50) { // Minimum swipe distance
      if (deltaY > 0 && currentVideoIndex < (videos?.length || 0) - 1) {
        // Swipe up - next video
        setCurrentVideoIndex(prev => prev + 1)
      } else if (deltaY < 0 && currentVideoIndex > 0) {
        // Swipe down - previous video
        setCurrentVideoIndex(prev => prev - 1)
      }
    }
  }, [currentVideoIndex])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('touchstart', handleTouchStart)
      container.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart)
        container.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [handleTouchEnd])

  // Load more videos when reaching the end
  useEffect(() => {
    if (currentVideoIndex === (videos?.length || 0) - 2 && hasNextPage) {
      fetchNextPage()
    }
  }, [currentVideoIndex, hasNextPage, fetchNextPage])

  const videos = data?.pages.flatMap(page => page.data) || []

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-10">
        Failed to load videos
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="h-[calc(100vh-4rem)] overflow-hidden"
    >
      <div 
        className="h-full transition-transform duration-300"
        style={{ transform: `translateY(-${currentVideoIndex * 100}%)` }}
      >
        {videos.map((video, index) => (
          <div 
            key={video.id} 
            className="h-full snap-center"
          >
            <VideoCard 
              video={video} 
              isActive={currentVideoIndex === index}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home 