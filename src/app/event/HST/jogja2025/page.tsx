'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function EventIndexPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto redirect to Day 1
    router.push('/event/HST/jogja2025/1')
  }, [router])

  return (
    <div className="min-h-screen bg-jet-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-asparagus-500 mb-4"></div>
        <p className="text-white text-lg">Redirecting to Day 1...</p>
      </div>
    </div>
  )
}
