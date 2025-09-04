import React from 'react'
import { cn } from '@/lib/utils/format'

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  className?: string
  onClose?: () => void
  icon?: boolean
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className,
  onClose,
  icon = true
}) => {
  const variants = {
    info: {
      container: 'border-blue-200 bg-blue-50 text-blue-800',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    },
    success: {
      container: 'border-green-200 bg-green-50 text-green-800',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      container: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    error: {
      container: 'border-red-200 bg-red-50 text-red-800',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    }
  }

  const currentVariant = variants[variant]

  return (
    <div className={cn(
      'rounded-md border p-4',
      currentVariant.container,
      className
    )}>
      <div className="flex">
        {icon && (
          <div className="flex-shrink-0">
            {currentVariant.icon}
          </div>
        )}
        <div className={cn('flex-1', icon && 'ml-3')}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-sm font-medium mb-1">{title}</h3>
              )}
              <div className={cn(
                'text-sm',
                title ? 'mt-1' : 'mt-0'
              )}>
                {children}
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className={cn(
                  'ml-4 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  variant === 'info' && 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600',
                  variant === 'success' && 'text-green-500 hover:bg-green-100 focus:ring-green-600',
                  variant === 'warning' && 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600',
                  variant === 'error' && 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                )}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ToastProps extends Omit<AlertProps, 'onClose'> {
  id: string
  duration?: number
  onDismiss: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({
  id,
  duration = 5000,
  onDismiss,
  ...alertProps
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  return (
    <div className="animate-in slide-in-from-right-full">
      <Alert
        {...alertProps}
        onClose={() => onDismiss(id)}
        className={cn('shadow-lg', alertProps.className)}
      />
    </div>
  )
}
