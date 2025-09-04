'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast } from '@/components/ui/Alert'

interface ToastType {
  id: string
  variant: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: ToastType[]
  addToast: (toast: Omit<ToastType, 'id'>) => void
  removeToast: (id: string) => void
  showToast: {
    info: (message: string, title?: string, duration?: number) => void
    success: (message: string, title?: string, duration?: number) => void
    warning: (message: string, title?: string, duration?: number) => void
    error: (message: string, title?: string, duration?: number) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 5,
  position = 'top-right'
}) => {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const addToast = useCallback((toast: Omit<ToastType, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast = { ...toast, id }
    
    setToasts(prev => {
      const updated = [...prev, newToast]
      // Limit number of toasts
      return updated.length > maxToasts ? updated.slice(-maxToasts) : updated
    })
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = {
    info: (message: string, title?: string, duration?: number) => 
      addToast({ variant: 'info', message, title, duration }),
    success: (message: string, title?: string, duration?: number) => 
      addToast({ variant: 'success', message, title, duration }),
    warning: (message: string, title?: string, duration?: number) => 
      addToast({ variant: 'warning', message, title, duration }),
    error: (message: string, title?: string, duration?: number) => 
      addToast({ variant: 'error', message, title, duration })
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, showToast }}>
      {children}
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className={`fixed z-50 space-y-2 ${positionClasses[position]}`}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="animate-in slide-in-from-right-full duration-300"
            >
              <Toast
                id={toast.id}
                variant={toast.variant}
                title={toast.title}
                duration={toast.duration}
                onDismiss={removeToast}
              >
                {toast.message}
              </Toast>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}
