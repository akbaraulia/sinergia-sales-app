'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/common/ToastProvider'
import { useAuthStore } from '@/store/authStore'
import { Customer, CustomerDetailAPIResponse } from '@/types/customer'
import { formatCurrency } from '@/lib/utils/format'

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const { user } = useAuthStore()
  
  const customerName = decodeURIComponent(params.customerName as string)
  
  // State management
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch customer detail
  const fetchCustomerDetail = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/erp/customers/${encodeURIComponent(customerName)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch customer: ${response.status} ${response.statusText}`)
      }

      const data: CustomerDetailAPIResponse = await response.json()
      console.log('📦 [CUSTOMER DETAIL] API Response:', data)

      if (data.success && data.customer) {
        setCustomer(data.customer)
      } else {
        setError(data.error || 'Customer not found')
        showToast.error('Customer not found', data.error || 'Unable to load customer details')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer'
      console.error('❌ [CUSTOMER DETAIL] Fetch error:', errorMessage)
      setError(errorMessage)
      showToast.error('Failed to load customer', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [customerName, showToast])

  // Load customer on mount
  useEffect(() => {
    if (customerName) {
      fetchCustomerDetail()
    }
  }, [fetchCustomerDetail])

  // Format address for display
  const formatAddress = (address?: string) => {
    if (!address) return 'No address available'
    
    // Remove HTML tags and clean up the address
    return address
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\n+/g, '\n')
      .trim()
  }

  // Get status badge variant
  const getStatusVariant = (status?: string) => {
    if (!status) return 'outline'
    if (status.toLowerCase().includes('vvip')) return 'success'
    if (status.toLowerCase().includes('reguler')) return 'secondary'
    return 'outline'
  }

  // Get loyalty tier color
  const getLoyaltyTierColor = (tier?: string) => {
    if (!tier) return 'text-gray-500'
    if (tier.toLowerCase().includes('gold')) return 'text-yellow-600'
    if (tier.toLowerCase().includes('silver')) return 'text-gray-400'
    if (tier.toLowerCase().includes('platinum')) return 'text-purple-600'
    return 'text-blue-600'
  }

  // Check if user has access
  const hasCustomerAccess = user?.permissions.includes('admin') || user?.permissions.includes('sales')

  if (!hasCustomerAccess) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">
                Access Restricted
              </h2>
              <p className="text-jet-600 dark:text-gray-300">
                You don't have permission to view customer data.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-isabelline via-white to-champagne-50 dark:from-dark-bg dark:via-dark-surface dark:to-jet-800">
          {/* Header */}
          <div className="sticky top-0 z-50 bg-gradient-to-r from-asparagus to-asparagus-700 dark:from-asparagus-600 dark:to-asparagus-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => router.back()}
                    variant="secondary"
                    size="sm"
                    className="bg-white/95 hover:bg-white text-asparagus-700 hover:text-asparagus-800"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </Button>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-sm">
                      👤 Customer Detail
                    </h1>
                    {customer && (
                      <p className="text-sm text-white/90 mt-1">
                        {customer.customer_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Loading State */}
            {loading && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
                
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                  Customer Not Found
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={fetchCustomerDetail} variant="outline">
                  Try Again
                </Button>
              </div>
            )}

            {/* Customer Detail */}
            {customer && !loading && (
              <div className="space-y-6">
                {/* Customer Header */}
                <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
                  <div className="flex items-start space-x-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-br from-asparagus-100 to-asparagus-200 dark:from-asparagus-800 dark:to-asparagus-900 rounded-full flex items-center justify-center">
                        {customer.image ? (
                          <img 
                            src={customer.image} 
                            alt={customer.customer_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-asparagus-700 dark:text-asparagus-300">
                            {customer.customer_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-jet-800 dark:text-white">
                            {customer.customer_name}
                          </h2>
                          
                          {customer.custom_customer_id && (
                            <p className="text-sm text-gray-500 font-mono mt-1">
                              Customer ID: {customer.custom_customer_id}
                            </p>
                          )}
                          
                          <p className="text-base text-jet-600 dark:text-gray-300 mt-1">
                            {customer.customer_group} • {customer.territory}
                          </p>
                        </div>

                        {/* Status Badge */}
                        {customer.custom_status && (
                          <Badge 
                            variant={getStatusVariant(customer.custom_status)}
                            size="lg"
                          >
                            {customer.custom_status}
                          </Badge>
                        )}
                      </div>

                      {/* Area Info */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {customer.custom_branch && (
                          <Badge variant="outline">
                            📍 Branch: {customer.custom_branch}
                          </Badge>
                        )}
                        {customer.custom_rayon && (
                          <Badge variant="outline">
                            🏪 Rayon: {customer.custom_rayon}
                          </Badge>
                        )}
                        {customer.default_price_list && (
                          <Badge variant="outline">
                            💰 Price List: {customer.default_price_list}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
                  <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-asparagus-600 dark:text-asparagus-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.mobile_no && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Mobile Number
                        </label>
                        <div className="flex items-center space-x-2">
                          <p className="text-base text-jet-800 dark:text-white">{customer.mobile_no}</p>
                          <a 
                            href={`tel:${customer.mobile_no}`}
                            className="text-asparagus-600 dark:text-asparagus-400 hover:text-asparagus-700 dark:hover:text-asparagus-300"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {customer.email_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email Address
                        </label>
                        <div className="flex items-center space-x-2">
                          <p className="text-base text-jet-800 dark:text-white break-all">{customer.email_id}</p>
                          <a 
                            href={`mailto:${customer.email_id}`}
                            className="text-asparagus-600 dark:text-asparagus-400 hover:text-asparagus-700 dark:hover:text-asparagus-300"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {customer.primary_address && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Primary Address
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <pre className="text-sm text-jet-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                          {formatAddress(customer.primary_address)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Business Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Loyalty Program */}
                  <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
                    <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Loyalty Program
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Points
                        </label>
                        <p className="text-3xl font-bold text-yellow-600">
                          {customer.calculated_loyalty_points || 0}
                        </p>
                      </div>
                      
                      {customer.loyalty_program && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Program Type
                          </label>
                          <p className="text-base text-jet-800 dark:text-white">
                            {customer.loyalty_program}
                          </p>
                        </div>
                      )}
                      
                      {customer.loyalty_program_tier && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tier Level
                          </label>
                          <p className={`text-base font-medium ${getLoyaltyTierColor(customer.loyalty_program_tier)}`}>
                            {customer.loyalty_program_tier}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sales Performance */}
                  <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
                    <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Sales Performance
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Lifetime Omset
                        </label>
                        <p className="text-3xl font-bold text-green-600">
                          {formatCurrency(customer.custom_lifetime_omset || 0)}
                        </p>
                      </div>
                      
                      {customer.custom_nama_salontoko && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Salon/Toko Name
                          </label>
                          <p className="text-base text-jet-800 dark:text-white">
                            {customer.custom_nama_salontoko}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sales Team */}
                {customer.sales_team && customer.sales_team.length > 0 && (
                  <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
                    <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-asparagus-600 dark:text-asparagus-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Sales Team
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customer.sales_team.map((member, index) => (
                        <div 
                          key={index}
                          className="flex items-center space-x-3 p-4 bg-gradient-to-r from-asparagus-50 to-champagne-50 dark:from-asparagus-900/20 dark:to-champagne-900/20 rounded-lg border border-asparagus-200 dark:border-asparagus-800"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-asparagus to-asparagus-700 rounded-full flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {member.sales_person_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-jet-800 dark:text-white truncate">
                              {member.sales_person_name}
                            </p>
                            <p className="text-xs text-jet-600 dark:text-gray-400 truncate">
                              {member.sales_person}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge variant="success" size="sm">
                              Active
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
                  <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {customer.mobile_no && (
                      <Button
                        onClick={() => window.open(`tel:${customer.mobile_no}`, '_self')}
                        variant="outline"
                        className="flex-1"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call Customer
                      </Button>
                    )}
                    
                    {customer.email_id && (
                      <Button
                        onClick={() => window.open(`mailto:${customer.email_id}`, '_self')}
                        variant="outline"
                        className="flex-1"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Email
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => showToast.info('Feature coming soon', 'Create sales order functionality will be available soon')}
                      className="flex-1"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Order
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
