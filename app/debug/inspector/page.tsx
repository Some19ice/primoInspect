'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function InspectorDebugPage() {
  const { profile, user } = useSupabaseAuth()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    if (!profile) {
      setResult({ error: 'No profile loaded' })
      return
    }

    setLoading(true)
    try {
      const url = `/api/inspections?userId=${profile.id}&userRole=${profile.role}`
      console.log('Testing URL:', url)
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      })
    } catch (error) {
      console.error('Error:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Inspector API Debug</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({ user, profile }, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAPI} disabled={loading || !profile}>
            {loading ? 'Testing...' : 'Test /api/inspections'}
          </Button>
          
          {result && (
            <div>
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected URL</CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <code className="bg-gray-100 p-2 rounded block">
              /api/inspections?userId={profile.id}&userRole={profile.role}
            </code>
          ) : (
            <p className="text-gray-500">Waiting for profile to load...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
