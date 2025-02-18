import { useAuthStore } from '../stores/authStore'

export function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div className="container max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Username</h2>
            <p className="text-muted-foreground">{user?.username}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Email</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 