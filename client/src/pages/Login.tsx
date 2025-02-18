import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  return (
    <div className="container max-w-lg mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
      <LoginForm />
    </div>
  )
} 