'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabaseAuth } from '@/lib/supabase/auth'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await supabaseAuth.signIn(email, password)

      if (error) {
        setError(error.message)
        console.error('Sign in error:', error)
      } else if (data.user) {
        console.log('User signed in successfully:', data.user)
        
        // Get the redirect URL from query params
        const urlParams = new URLSearchParams(window.location.search)
        const redirectTo = urlParams.get('redirectTo')
        
        if (redirectTo) {
          console.log('Redirecting to:', redirectTo)
          router.push(redirectTo)
        } else {
          // Get user role from metadata or session
          const userRole = data.user.user_metadata?.role || 'INSPECTOR'
          console.log('User role from metadata:', userRole)
          
          // Redirect based on role
          const redirectPath = userRole === 'EXECUTIVE' ? '/dashboard/executive' :
                             userRole === 'PROJECT_MANAGER' ? '/dashboard/manager' :
                             '/dashboard/inspector'
          
          console.log('Redirecting to role-based dashboard:', redirectPath)
          router.push(redirectPath)
        }
      }
    } catch (error) {
      console.error('Signin catch error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            PrimoInspect
          </CardTitle>
          <CardDescription>
            Digital Inspection Platform for Renewable Energy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation text-base"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation text-base"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
                required
              />
            </div>
            
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-blue-800">
              Demo Login Instructions
            </h3>
            <div className="space-y-2 text-xs text-blue-600">
              <div>
                <strong>To create demo accounts:</strong>
              </div>
              <div>1. Go to <strong>Sign Up</strong> page</div>
              <div>2. Create account with one of these emails:</div>
              <div className="ml-2 space-y-1">
                <div>• <strong>executive@demo.com</strong> (Executive role)</div>
                <div>• <strong>manager@demo.com</strong> (Project Manager role)</div>
                <div>• <strong>inspector@demo.com</strong> (Inspector role)</div>
              </div>
              <div>3. Use any password (min 8 characters)</div>
              <div>4. Return here to sign in</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
