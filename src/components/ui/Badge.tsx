import React from 'react'
import { cn } from '@/lib/utils/format'

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'danger' | 'info' | 'outline' | 'primary'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  icon
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    secondary: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-asparagus-100 text-asparagus-800 dark:bg-asparagus-900 dark:text-asparagus-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    outline: 'border border-gray-300 text-gray-700 bg-transparent dark:border-gray-600 dark:text-gray-300'
  }

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <span className={cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      {icon && (
        <span className={cn(iconSizes[size], 'mr-1.5')}>
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'draft'
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusConfig = {
    active: {
      variant: 'success' as const,
      label: 'Active',
      icon: (
        <div className="w-2 h-2 bg-green-500 rounded-full" />
      )
    },
    inactive: {
      variant: 'default' as const,
      label: 'Inactive',
      icon: (
        <div className="w-2 h-2 bg-gray-500 rounded-full" />
      )
    },
    pending: {
      variant: 'warning' as const,
      label: 'Pending',
      icon: (
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
      )
    },
    approved: {
      variant: 'success' as const,
      label: 'Approved',
      icon: (
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    },
    rejected: {
      variant: 'error' as const,
      label: 'Rejected',
      icon: (
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )
    },
    draft: {
      variant: 'outline' as const,
      label: 'Draft',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    }
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      icon={config.icon}
      className={className}
    >
      {config.label}
    </Badge>
  )
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  className?: string
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  const priorityConfig = {
    low: {
      variant: 'default' as const,
      label: 'Low',
      className: 'bg-gray-100 text-gray-600'
    },
    medium: {
      variant: 'info' as const,
      label: 'Medium',
      className: 'bg-blue-100 text-blue-700'
    },
    high: {
      variant: 'warning' as const,
      label: 'High',
      className: 'bg-orange-100 text-orange-700'
    },
    urgent: {
      variant: 'error' as const,
      label: 'Urgent',
      className: 'bg-red-100 text-red-700'
    }
  }

  const config = priorityConfig[priority]

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
