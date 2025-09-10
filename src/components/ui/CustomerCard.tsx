'use client'

import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Customer } from '@/types/customer'
import { formatCurrency, getInitials } from '@/lib/utils/format'

interface CustomerCardProps {
  customer: Customer
}

export function CustomerCard({ customer }: CustomerCardProps) {
  // Format address for display
  const formatAddress = (address?: string) => {
    if (!address) return 'No address'
    
    // Remove HTML tags and clean up the address
    const cleanAddress = address
      .replace(/<br\s*\/?>/gi, ', ')
      .replace(/\n/g, ', ')
      .replace(/,\s*,/g, ',')
      .replace(/,\s*$/, '')
      .trim()
    
    // Limit length for mobile display
    return cleanAddress.length > 80 ? cleanAddress.substring(0, 80) + '...' : cleanAddress
  }

  // Get status badge variant
  const getStatusVariant = (status?: string) => {
    if (!status) return 'outline'
    if (status.toLowerCase().includes('vvip')) return 'success'
    if (status.toLowerCase().includes('reguler')) return 'secondary'
    return 'outline'
  }

  return (
    <Link
      href={`/customers/${encodeURIComponent(customer.name)}`}
      className="block"
    >
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 hover:shadow-md hover:border-asparagus-300 dark:hover:border-asparagus-600 transition-all duration-200 cursor-pointer">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-asparagus-100 to-asparagus-200 dark:from-asparagus-800 dark:to-asparagus-900 rounded-full flex items-center justify-center">
              {customer.image ? (
                <img 
                  src={customer.image} 
                  alt={customer.customer_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-asparagus-700 dark:text-asparagus-300">
                  {getInitials(customer.customer_name)}
                </span>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-jet-800 dark:text-white truncate">
                  {customer.customer_name}
                </h3>
                
                {customer.custom_customer_id && (
                  <p className="text-sm text-gray-500 font-mono">
                    ID: {customer.custom_customer_id}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              {customer.custom_status && (
                <Badge 
                  variant={getStatusVariant(customer.custom_status)}
                  size="sm"
                >
                  {customer.custom_status}
                </Badge>
              )}
            </div>

            {/* Contact Info */}
            <div className="mt-2 space-y-1">
              {customer.mobile_no && (
                <p className="text-sm text-jet-600 dark:text-gray-300 flex items-center">
                  <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {customer.mobile_no}
                </p>
              )}
              
              {customer.email_id && (
                <p className="text-sm text-jet-600 dark:text-gray-300 flex items-center truncate">
                  <svg className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {customer.email_id}
                </p>
              )}
            </div>

            {/* Area Info */}
            <div className="mt-2 flex flex-wrap gap-2">
              {customer.custom_branch && (
                <Badge variant="outline" size="xs">
                  📍 {customer.custom_branch}
                </Badge>
              )}
              {customer.custom_rayon && (
                <Badge variant="outline" size="xs">
                  🏪 {customer.custom_rayon}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="font-semibold text-asparagus-700 dark:text-asparagus-400">
                    {customer.calculated_loyalty_points || 0}
                  </p>
                  <p className="text-xs text-gray-500">Points</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(customer.custom_lifetime_omset || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Lifetime</p>
                </div>
              </div>
              
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
