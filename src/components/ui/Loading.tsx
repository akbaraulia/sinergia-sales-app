import React from 'react'
import { cn } from '@/lib/utils/format'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-asparagus',
        sizeClasses[size],
        className
      )}
    />
  )
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ size = 'md', className }) => {
  const dotSizes = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  }

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-asparagus rounded-full animate-pulse',
            dotSizes[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

interface SkeletonProps {
  className?: string
  rows?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, rows = 1 }) => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gray-200 rounded',
            i > 0 && 'mt-2',
            className || 'h-4'
          )}
        />
      ))}
    </div>
  )
}

interface LoadingCardProps {
  title?: string
  message?: string
  className?: string
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  title = 'Loading...', 
  message,
  className 
}) => {
  return (
    <div className={cn('card flex items-center justify-center p-8', className)}>
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        {message && (
          <p className="text-gray-500">{message}</p>
        )}
      </div>
    </div>
  )
}

interface ButtonSpinnerProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
}

export const ButtonSpinner: React.FC<ButtonSpinnerProps> = ({ 
  loading = false, 
  children, 
  className 
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {loading && <Spinner size="sm" className="mr-2" />}
      {children}
    </div>
  )
}
