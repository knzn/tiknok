import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'
import { VideoProcessingTracker } from '../features/Video/VideoProcessingTracker'

interface MainLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16">
        <div className="container flex">
          {showSidebar && (
            <Sidebar className="hidden md:block" />
          )}
          <main className="flex-1 px-4 md:px-6 py-6">
            {children}
          </main>
        </div>
      </div>
      <Footer />
      <VideoProcessingTracker />
    </div>
  )
}