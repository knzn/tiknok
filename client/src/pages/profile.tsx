import { useAuthStore } from '../stores/authStore'
import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { ProfileSetupModal } from '../components/profile/ProfileSetupModal'
import { EditProfileModal } from '../components/profile/EditProfileModal'
import { UpdateProfilePictureModal } from '../components/profile/UpdateProfilePictureModal'
import { Camera } from 'lucide-react'

// Add this helper function at the top of the file
const addCacheBuster = (url: string) => {
  if (!url) return url;
  return `${url}?v=${new Date().getTime()}`;
};

// Add this at the top of the file
const getImageUrl = (url: string | undefined) => {
  if (!url) return '';
  const timestamp = new Date().getTime();
  return `${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
};

export function ProfilePage() {
  const { user } = useAuthStore()
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false)
  const [imageVersion, setImageVersion] = useState(0)

  // Check if profile needs setup when component mounts
  useEffect(() => {
    if (user && !user.gamefarmName) {
      setShowSetupModal(true)
    }
  }, [user])

  useEffect(() => {
    if (user?.profilePicture) {
      setImageVersion(prev => prev + 1)
    }
  }, [user?.profilePicture])

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Info Section - Centered with max-width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Centered Profile Picture with Update Button */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-48 h-48 rounded-full border-4 border-background bg-gray-200 overflow-hidden mb-4">
              {user?.profilePicture ? (
                <img
                  src={getImageUrl(user.profilePicture)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  key={imageVersion}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">👤</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-6 right-0 rounded-full"
              onClick={() => setShowProfilePictureModal(true)}
            >
              Edit
            </Button>
          </div>

          {/* Edit Profile Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowEditModal(true)}
          >
            Edit Profile
          </Button>
        </div>

        {/* Profile Details Card */}
        <div className="bg-card rounded-xl p-8 shadow-lg">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold">{user?.gamefarmName || "My Gamefarm"}</h1>
              <p className="text-lg text-muted-foreground mt-2">username: {user?.username}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h2 className="text-xl font-semibold">Location</h2>
                <p className="text-muted-foreground mt-2">{user?.address || "Not specified"}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Contact</h2>
                <p className="text-muted-foreground mt-2">{user?.contactNumber || "Not specified"}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Facebook</h2>
                <p className="text-muted-foreground mt-2">
                  {user?.facebookProfile ? (
                    <a href={user.facebookProfile} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline">
                      Visit Facebook Profile
                    </a>
                  ) : (
                    "Not specified"
                  )}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12 pt-6 border-t">
              <div>
                <span className="text-2xl font-bold">122</span>
                <span className="text-muted-foreground ml-2">followers</span>
              </div>
              <div>
                <span className="text-2xl font-bold">67</span>
                <span className="text-muted-foreground ml-2">following</span>
              </div>
              <div>
                <span className="text-2xl font-bold">37K</span>
                <span className="text-muted-foreground ml-2">likes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileSetupModal 
        isOpen={showSetupModal} 
        onClose={() => setShowSetupModal(false)} 
      />
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
      <UpdateProfilePictureModal
        isOpen={showProfilePictureModal}
        onClose={() => setShowProfilePictureModal(false)}
      />
    </div>
  )
} 