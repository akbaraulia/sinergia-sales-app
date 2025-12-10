'use client'

import React, { useState, useCallback, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Pagination, PaginationInfo, CustomerCard } from '@/components/ui'
import { useToast } from '@/components/common/ToastProvider'
import { useAuthStore } from '@/store/authStore'
import { AreaFilter } from '@/components/filters/AreaFilter'
import { Customer, CustomerAPIResponse, PaginationInfo as PaginationType } from '@/types/customer'

export default function CustomersPage() {
  const { showToast } = useToast()
  const { user } = useAuthStore()

  // State management
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedRayon, setSelectedRayon] = useState<string>('all')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerId, setCustomerId] = useState<string>('')
  const [hasSearched, setHasSearched] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
    totalPages: 0
  })

  // 🔒 Auto-select branch if user has only 1 allowed branch
  useEffect(() => {
    if (user?.allowed_branches && user.allowed_branches.length === 1) {
      const singleBranch = user.allowed_branches[0]
      setSelectedBranch(singleBranch)
      console.log('🔒 [CUSTOMERS] Auto-selected single allowed branch:', singleBranch)
    }
  }, [user?.allowed_branches])

  // Check if filters are applied
  const hasFilters = selectedBranch !== 'all' || selectedRayon !== 'all'
  const hasNameSearch = customerName.trim().length > 0
  const hasIdSearch = customerId.trim().length > 0
  const canSearch = hasFilters || hasNameSearch || hasIdSearch

  // Fetch customers based on filters
  const fetchCustomers = useCallback(async (page: number = 1, resetResults: boolean = false) => {
    if (!canSearch) {
      showToast.warning('Filter required', 'Please select Branch/Rayon or enter customer name/ID to search')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Build query parameters with specific fields
      const params = new URLSearchParams()
      if (selectedBranch !== 'all') params.append('branch', selectedBranch)
      if (selectedRayon !== 'all') params.append('rayon', selectedRayon)
      if (customerName.trim()) params.append('name', customerName.trim())
      if (customerId.trim()) params.append('customer_id', customerId.trim())
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/erp/customers?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`)
      }

      const data: CustomerAPIResponse = await response.json()
      console.log('📦 [CUSTOMERS] API Response:', data)

      if (data.success) {
        if (resetResults || page === 1) {
          setCustomers(data.customers)
        } else {
          setCustomers(prev => [...prev, ...data.customers])
        }
        
        setPagination(data.pagination)
        setCurrentPage(page)
        setHasSearched(true)
        
        const message = page === 1 
          ? `Found ${data.pagination.total} customers`
          : `Loaded ${data.customers.length} more customers`
        showToast.success('Customers loaded', message)
      } else {
        setError(data.error || 'Failed to fetch customers')
        showToast.error('Failed to load customers', data.error || 'Unknown error')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers'
      console.error('❌ [CUSTOMERS] Fetch error:', errorMessage)
      setError(errorMessage)
        showToast.error('Failed to load customers', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [selectedBranch, selectedRayon, customerName, customerId, canSearch, showToast])  // Load more customers (append to existing)
  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchCustomers(currentPage + 1, false)
    }
  }

  // Search customers (reset results)
  const searchCustomers = () => {
    fetchCustomers(1, true)
  }

  // Handle pagination page change
  const handlePageChange = (page: number) => {
    fetchCustomers(page, true)
  }

  // Reset search
  const handleReset = () => {
    setSelectedBranch('all')
    setSelectedRayon('all')
    setCustomerName('')
    setCustomerId('')
    setCustomers([])
    setHasSearched(false)
    setError(null)
    setCurrentPage(1)
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false,
      totalPages: 0
    })
  }

  // Check if user has access to customers
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
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-sm">
                    👥 Customer Intelligence
                  </h1>
                  <p className="text-sm text-white/90 mt-1">
                    Find and manage your customers efficiently
                  </p>
                </div>
                
                {hasSearched && (
                  <div className="text-right text-white">
                    <div className="text-sm opacity-90">Total Found</div>
                    <div className="text-lg font-bold">{pagination.total}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-6">
              {/* Filters Section */}
              <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4 border border-champagne-200 dark:border-dark-border">
                <h2 className="text-lg font-semibold text-jet-800 dark:text-white mb-4">
                  🔍 Search Filters
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Branch Filter */}
                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                      Branch {user?.allowed_branches && user.allowed_branches.length === 1 && (
                        <span className="text-xs text-asparagus-600 dark:text-asparagus-400">(Auto-selected)</span>
                      )}
                    </label>
                    <AreaFilter
                      selectedArea={selectedBranch}
                      areaType="branch"
                      onAreaChange={setSelectedBranch}
                      placeholder="Search branch..."
                      allOptionLabel="All Branches"
                      disabled={user?.allowed_branches && user.allowed_branches.length === 1}
                      allowedBranches={user?.allowed_branches}
                    />
                  </div>

                  {/* Rayon Filter */}
                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                      Rayon
                    </label>
                    <AreaFilter
                      selectedArea={selectedRayon}
                      areaType="rayon"
                      onAreaChange={setSelectedRayon}
                      placeholder="Search rayon..."
                      allOptionLabel="All Rayons"
                    />
                  </div>
                </div>

                {/* Customer Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                    Search Customer
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Name Search */}
                    <div className="relative">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && canSearch) {
                            searchCustomers()
                          }
                        }}
                        placeholder="Search by customer name..."
                        className="w-full px-4 py-3 pl-10 pr-4 text-sm border border-gray-300 dark:border-dark-border rounded-lg 
                                   focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 
                                   bg-white dark:bg-dark-surface text-jet-800 dark:text-white
                                   placeholder-gray-500 dark:placeholder-gray-400
                                   transition-colors duration-200"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      {customerName && (
                        <button
                          onClick={() => setCustomerName('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Customer ID Search */}
                    <div className="relative">
                      <input
                        type="text"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && canSearch) {
                            searchCustomers()
                          }
                        }}
                        placeholder="Search by customer ID..."
                        className="w-full px-4 py-3 pl-10 pr-4 text-sm border border-gray-300 dark:border-dark-border rounded-lg 
                                   focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 
                                   bg-white dark:bg-dark-surface text-jet-800 dark:text-white
                                   placeholder-gray-500 dark:placeholder-gray-400
                                   transition-colors duration-200"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </div>
                      {customerId && (
                        <button
                          onClick={() => setCustomerId('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Search by customer name, customer ID, or use area filters above
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={searchCustomers}
                    disabled={!canSearch || loading}
                    className="flex-1 sm:flex-none"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Customers
                      </>
                    )}
                  </Button>
                  
                  {hasSearched && (
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="lg"
                      className="flex-1 sm:flex-none"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </Button>
                  )}
                </div>

                {/* Filter Status */}
                {!canSearch && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      💡 Please select Branch/Rayon filters OR enter customer name/ID to search
                    </p>
                  </div>
                )}

                {/* Active Filters Display */}
                {canSearch && (hasFilters || hasNameSearch || hasIdSearch) && (
                  <div className="mt-4 p-3 bg-asparagus-50 dark:bg-asparagus-900/20 border border-asparagus-200 dark:border-asparagus-800 rounded-lg">
                    <p className="text-sm text-asparagus-700 dark:text-asparagus-300 mb-2">
                      🔍 Active Filters:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBranch !== 'all' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-asparagus-100 dark:bg-asparagus-800 text-asparagus-700 dark:text-asparagus-300">
                          Branch: {selectedBranch}
                        </span>
                      )}
                      {selectedRayon !== 'all' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-asparagus-100 dark:bg-asparagus-800 text-asparagus-700 dark:text-asparagus-300">
                          Rayon: {selectedRayon}
                        </span>
                      )}
                      {customerName && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300">
                          Name: "{customerName}"
                        </span>
                      )}
                      {customerId && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300">
                          ID: "{customerId}"
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Results Section */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                    Error Loading Customers
                  </h3>
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <Button onClick={searchCustomers} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 animate-pulse">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State - No Search */}
              {!hasSearched && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Ready to Search Customers
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Use the area filters (Branch/Rayon) or search by customer name/ID above. Select your criteria and click "Search Customers" to begin.
                  </p>
                </div>
              )}

              {/* Empty State - No Results */}
              {hasSearched && !loading && customers.length === 0 && !error && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No Customers Found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    No customers match your current filter criteria. Try adjusting your search filters.
                  </p>
                </div>
              )}

              {/* Customer Results */}
              {hasSearched && !loading && customers.length > 0 && (
                <div className="space-y-6">
                  {/* Results Header with Pagination Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-jet-800 dark:text-white">
                        Customer Results
                      </h2>
                      <PaginationInfo
                        currentPage={pagination.page}
                        limit={pagination.limit}
                        total={pagination.total}
                        count={customers.length}
                        className="mt-1"
                      />
                    </div>
                    
                    {/* Load More Button for Mobile */}
                    {pagination.hasMore && (
                      <Button
                        onClick={loadMore}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="sm:hidden"
                      >
                        {loading ? 'Loading...' : 'Load More'}
                      </Button>
                    )}
                  </div>
                  
                  {/* Customer Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    {customers.map((customer) => (
                      <CustomerCard 
                        key={customer.name} 
                        customer={customer} 
                      />
                    ))}
                  </div>
                  
                  {/* Desktop Pagination */}
                  <div className="hidden sm:block">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      hasMore={pagination.hasMore}
                      onPageChange={handlePageChange}
                      loading={loading}
                      className="justify-center"
                    />
                  </div>
                  
                  {/* Mobile Load More */}
                  {pagination.hasMore && (
                    <div className="sm:hidden text-center">
                      <Button
                        onClick={loadMore}
                        disabled={loading}
                        variant="outline"
                        size="lg"
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2" />
                            Loading More...
                          </>
                        ) : (
                          <>
                            Load More ({pagination.total - customers.length} remaining)
                            <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
