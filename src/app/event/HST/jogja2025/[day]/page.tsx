'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const EVENT_INFO = {
  title: 'HST Event Jogja 2025',
  description: 'Highlights from our amazing event in Yogyakarta',
  totalDays: 3
}

const DAY_DESCRIPTIONS = {
  '1': 'Opening Ceremony & Keynote Sessions',
  '2': 'Workshops & Interactive Sessions',
  '3': 'Closing Ceremony & Networking'
}

export default function EventVideoPage() {
  const params = useParams()
  const router = useRouter()
  const day = params?.day as string
  const dayNumber = parseInt(day)

  const [videoError, setVideoError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Validate day parameter
  useEffect(() => {
    if (!dayNumber || dayNumber < 1 || dayNumber > EVENT_INFO.totalDays) {
      router.push('/event/HST/jogja2025/1')
    }
  }, [dayNumber, router])

  const videoPath = `/video/DAY ${dayNumber}.webm`
  const dayDescription = DAY_DESCRIPTIONS[dayNumber.toString() as keyof typeof DAY_DESCRIPTIONS] || 'Event Highlights'

  const handleVideoLoad = () => {
    setIsLoading(false)
  }

  const handleVideoError = () => {
    setVideoError(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-jet-900 via-jet-800 to-asparagus-900">
      {/* Header */}
      <header className="bg-jet-900/50 backdrop-blur border-b border-asparagus-700/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {EVENT_INFO.title}
            </h1>
            <p className="text-sm text-gray-400">
              {EVENT_INFO.description}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Day Info Card */}
        <div className="bg-jet-800/50 backdrop-blur border border-asparagus-700/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Day {dayNumber}
              </h2>
              <p className="text-lg text-gray-300">
                {dayDescription}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-asparagus-600/20 border border-asparagus-500/30 rounded-lg">
                <svg className="w-5 h-5 text-asparagus-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-sm font-medium text-asparagus-300">Video Highlights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-asparagus-700/30 relative">
          {isLoading && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-jet-900 z-10">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-asparagus-500 mb-4"></div>
                <p className="text-gray-400 text-lg">Loading video...</p>
              </div>
            </div>
          )}

          {videoError ? (
            <div className="aspect-video flex items-center justify-center bg-jet-900">
              <div className="text-center px-4">
                <svg className="w-20 h-20 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">Video Not Available</h3>
                <p className="text-gray-400 mb-4">
                  Could not load video for Day {dayNumber}
                </p>
                <p className="text-sm text-gray-500">
                  Expected path: <code className="bg-jet-800 px-2 py-1 rounded">{videoPath}</code>
                </p>
              </div>
            </div>
          ) : (
            <video
              key={videoPath}
              controls
              controlsList="nodownload"
              className="w-full aspect-video bg-black"
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
              preload="metadata"
            >
              <source src={videoPath} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {/* Event Description */}
        <div className="mt-8 bg-jet-800/30 backdrop-blur border border-asparagus-700/20 rounded-xl p-8">
          <h3 className="text-xl font-bold text-white mb-4">About HST Jogja 2025</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            This is the official video documentation of our {EVENT_INFO.totalDays}-day event held in the beautiful city of Yogyakarta. 
            Each day brought unique experiences, learning opportunities, and memorable moments with our community.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {Object.entries(DAY_DESCRIPTIONS).map(([d, desc]) => (
              <div key={d} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-asparagus-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-asparagus-400">{d}</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Day {d}</p>
                  <p className="text-sm text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-asparagus-700/30 bg-jet-900/50 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} HST Event - Jogja 2025. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by Sinergia Sales Platform
          </p>
        </div>
      </footer>
    </div>
  )
}
