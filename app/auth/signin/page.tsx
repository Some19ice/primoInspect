'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      } else if (data.user) {
        // Get user profile to determine role-based redirect
        const { profile } = await supabaseAuth.getProfile()
        
        if (profile) {
          // Redirect based on role (FR-001: Role-aware dashboards)
          switch (profile.role) {
            case 'EXECUTIVE':
              router.push('/dashboard/executive')
              break
            case 'PROJECT_MANAGER':
              router.push('/dashboard/manager')
              break
            case 'INSPECTOR':
              router.push('/dashboard/inspector')
              break
            default:
              router.push('/dashboard/inspector')
          }
        } else {
          router.push('/dashboard/inspector')
        }
      }
    } catch (error) {
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

          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-blue-800">
              Demo Accounts (Create via Supabase)
            </h3>
            <div className="space-y-1 text-xs text-blue-600">
              <div>
                <strong>Executive:</strong> Create account with role: EXECUTIVE
              </div>
              <div>
                <strong>Project Manager:</strong> Create account with role: PROJECT_MANAGER
              </div>
              <div>
                <strong>Inspector:</strong> Create account with role: INSPECTOR
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
