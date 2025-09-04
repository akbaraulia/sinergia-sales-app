'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'

const API_TEST_CREDENTIALS = {
  salon: {
    email: process.env.NEXT_PUBLIC_DEMO_SALON_EMAIL || 'salon@example.com',
    password: process.env.NEXT_PUBLIC_DEMO_SALON_PASSWORD || 'demo_password',
    description: 'Salon Account (Customer role)'
  },
  sales: {
    email: process.env.NEXT_PUBLIC_DEMO_SALES_EMAIL || 'sales@example.com', 
    password: process.env.NEXT_PUBLIC_DEMO_SALES_PASSWORD || 'demo_password',
    description: 'Sales Account (Sales role)'
  },
  admin: {
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || 'demo_password',
    description: 'Admin Account (Static admin)'
  }
}

export default function APITestPage() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<string | null>(null)

  const testCredential = async (type: keyof typeof API_TEST_CREDENTIALS) => {
    const { email, password, description } = API_TEST_CREDENTIALS[type]
    
    setLoading(type)
    
    try {
      console.log(`🧪 Testing ${type} login: ${email}`)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()
      
      setResults(prev => ({
        ...prev,
        [type]: {
          ...result,
          timestamp: new Date().toISOString(),
          status: response.status
        }
      }))
      
      console.log(`Result for ${type}:`, result)
      
    } catch (error) {
      console.error(`Error testing ${type}:`, error)
      setResults(prev => ({
        ...prev,
        [type]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setLoading(null)
    }
  }

  const clearResults = () => {
    setResults({})
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          ERPNext API Test
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(API_TEST_CREDENTIALS).map(([type, cred]) => (
            <div key={type} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2 capitalize">
                {type} Login
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {cred.description}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {cred.email}
              </p>
              
              <Button
                onClick={() => testCredential(type as keyof typeof API_TEST_CREDENTIALS)}
                disabled={loading === type}
                className="w-full"
              >
                {loading === type ? 'Testing...' : `Test ${type}`}
              </Button>

              {results[type] && (
                <div className={`mt-4 p-3 rounded text-sm ${
                  results[type].success 
                    ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  <div className="font-semibold mb-1">
                    {results[type].success ? '✅ Success' : '❌ Failed'}
                  </div>
                  {results[type].success ? (
                    <div>
                      <div>Name: {results[type].user?.name}</div>
                      <div>Role: {results[type].user?.role}</div>
                      <div>Permissions: {results[type].user?.permissions?.length || 0}</div>
                    </div>
                  ) : (
                    <div>Error: {results[type].error}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4 mb-8">
          <Button onClick={clearResults} variant="outline">
            Clear Results
          </Button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Raw Results</h3>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
