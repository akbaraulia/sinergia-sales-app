'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/common/ToastProvider'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface FreeItem {
  item_code: string
  item_name: string
  stock_uom: string
  qty: number
  price_list_rate: number
  total_price: number
}

interface PromoItem {
  name: string
  kode: string
  nama: string
  nilai: number
  expired: string
  brand: string
  free_items: FreeItem[]
}

export default function PromoPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user } = useAuthStore()
  
  const [promos, setPromos] = useState<PromoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Fetch promo data
  const fetchPromos = async () => {
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/erp/promo', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch promos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📦 [PROMO] API Response:', data)
      
      if (data.success && Array.isArray(data.promos)) {
        setPromos(data.promos)
        console.log(`✅ [PROMO] Loaded ${data.promos.length} promos`)
      } else {
        console.warn('⚠️ [PROMO] Unexpected data structure:', data)
        setPromos([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch promos'
      console.error('❌ [PROMO] Error:', errorMessage)
      setError(errorMessage)
      showToast.error('Failed to load promos', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Initial data load
  useEffect(() => {
    if (promos.length === 0 && !loading) {
      fetchPromos()
    }
  }, [])

  // Toggle row expansion
  const toggleRowExpansion = (kode: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(kode)) {
      newExpanded.delete(kode)
    } else {
      newExpanded.add(kode)
    }
    setExpandedRows(newExpanded)
  }

  // Filter promos based on search
  const filteredPromos = promos.filter(promo =>
    promo.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.brand.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination calculations
  const totalItems = filteredPromos.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPromos = filteredPromos.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    setExpandedRows(new Set()) // Reset expanded rows when changing page
  }

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
    setExpandedRows(new Set())
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
    setExpandedRows(new Set())
  }

  // Check permissions - only admin and sales can access
  const canViewPromos = user?.permissions && 
    (user.permissions.includes('admin') || user.permissions.includes('sales'))

  if (!canViewPromos) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-4 md:p-6 lg:p-8">
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">
                Access Restricted
              </h2>
              <p className="text-jet-600 dark:text-gray-300">
                You need admin or sales permissions to view promo data.
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
        <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-isabelline via-white to-champagne-50 dark:from-dark-bg dark:via-dark-surface dark:to-jet-800 min-h-full">
          <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-asparagus to-asparagus-700 dark:from-asparagus-600 dark:to-asparagus-800 rounded-lg shadow-lg p-4 md:p-6 border border-asparagus-200 dark:border-asparagus-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-sm">
                    🎯 Promo Bebas Pilih
                  </h1>
                  <p className="text-sm md:text-base text-white/90 dark:text-white/80 mt-1 drop-shadow-sm">
                    Manage promotion programs with free item selections
                  </p>
                </div>
                <Button 
                  onClick={fetchPromos}
                  disabled={loading}
                  size="sm"
                  variant="secondary"
                  className="w-full sm:w-auto bg-white/95 hover:bg-white text-asparagus-700 hover:text-asparagus-800 border border-white/80 hover:border-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-asparagus-700 border-t-transparent rounded-full" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4 md:p-6 border border-champagne-200 dark:border-dark-border">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by code, name, or brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white text-sm"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                  <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {totalItems > 0 ? `${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems}` : '0 of 0'}
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-12 text-center">
                <div className="inline-flex items-center text-asparagus-600 dark:text-asparagus-400">
                  <div className="animate-spin h-8 w-8 border-4 border-asparagus-200 dark:border-asparagus-800 border-t-asparagus-600 dark:border-t-asparagus-400 rounded-full mr-4" />
                  <span className="text-lg font-medium">Loading promo data...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <div className="text-red-600 dark:text-red-400 mb-2">
                  <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                  Failed to Load Promo Data
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={fetchPromos} variant="outline">
                  Try Again
                </Button>
              </div>
            )}

            {/* Promo Table */}
            {!loading && !error && (
              <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-champagne-200 dark:border-dark-border overflow-hidden">
                {filteredPromos.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2m16-7H4m16 0l-2-9H6l-2 9" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      No Promos Found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'Try adjusting your search criteria.' : 'No promo data available.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-jet-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Promo Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Brand
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Value
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Expired
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Free Items
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                          {currentPromos.map((promo, index) => (
                            <React.Fragment key={promo.kode}>
                              <tr className={index % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50 dark:bg-jet-900/50'}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-jet-800 dark:text-white font-mono">
                                    {promo.kode}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-jet-800 dark:text-white max-w-xs truncate" title={promo.nama}>
                                    {promo.nama}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge variant="secondary" size="sm">
                                    {promo.brand}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div className="text-sm font-semibold text-asparagus-700 dark:text-asparagus-400">
                                    {formatCurrency(promo.nilai)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-jet-600 dark:text-gray-300">
                                    {formatDate(promo.expired)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <Badge variant="info" size="sm">
                                    {promo.free_items.length} item{promo.free_items.length !== 1 ? 's' : ''}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <Button
                                    onClick={() => toggleRowExpansion(promo.kode)}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                  >
                                    {expandedRows.has(promo.kode) ? (
                                      <>
                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                        Hide
                                      </>
                                    ) : (
                                      <>
                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        Details
                                      </>
                                    )}
                                  </Button>
                                </td>
                              </tr>
                              
                              {/* Expanded Row Details */}
                              {expandedRows.has(promo.kode) && (
                                <tr>
                                  <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-jet-900/30">
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="text-sm font-semibold text-jet-800 dark:text-white mb-2">
                                          Promo Details:
                                        </h4>
                                        <p className="text-sm text-jet-600 dark:text-gray-300">
                                          {promo.nama}
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="text-sm font-semibold text-jet-800 dark:text-white mb-3">
                                          Free Items ({promo.free_items.length}):
                                        </h4>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                          {promo.free_items.map((item, itemIndex) => (
                                            <div key={itemIndex} className="bg-white dark:bg-dark-surface p-3 rounded-md border border-gray-200 dark:border-dark-border">
                                              <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                                    {item.item_code}
                                                  </p>
                                                  <p className="text-sm font-medium text-jet-800 dark:text-white">
                                                    {item.item_name}
                                                  </p>
                                                </div>
                                                <div className="text-right">
                                                  <Badge variant="success" size="sm">
                                                    FREE
                                                  </Badge>
                                                </div>
                                              </div>
                                              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                                <span>Qty: {item.qty} {item.stock_uom}</span>
                                                <span className="line-through">
                                                  {formatCurrency(item.price_list_rate)}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Use Voucher Button */}
                                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-border">
                                        <Button
                                          onClick={() => router.push(`/voucher/${encodeURIComponent(promo.kode)}`)}
                                          variant="primary"
                                          size="sm"
                                          className="w-full sm:w-auto"
                                        >
                                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                          </svg>
                                          Use This Voucher
                                        </Button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="bg-white dark:bg-dark-surface px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-dark-border sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <Button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            variant="outline"
                            size="sm"
                          >
                            Previous
                          </Button>
                          <Button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            size="sm"
                          >
                            Next
                          </Button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              Showing{' '}
                              <span className="font-medium">{startIndex + 1}</span>
                              {' '}to{' '}
                              <span className="font-medium">{Math.min(endIndex, totalItems)}</span>
                              {' '}of{' '}
                              <span className="font-medium">{totalItems}</span>
                              {' '}results
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <Button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                variant="outline"
                                size="sm"
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </Button>
                              
                              {/* Page Numbers */}
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number
                                if (totalPages <= 5) {
                                  pageNum = i + 1
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i
                                } else {
                                  pageNum = currentPage - 2 + i
                                }
                                
                                return (
                                  <Button
                                    key={pageNum}
                                    onClick={() => goToPage(pageNum)}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                      currentPage === pageNum
                                        ? 'z-10 bg-asparagus-50 dark:bg-asparagus-900 border-asparagus-500 text-asparagus-600 dark:text-asparagus-300'
                                        : 'bg-white dark:bg-dark-surface border-gray-300 dark:border-dark-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    {pageNum}
                                  </Button>
                                )
                              })}
                              
                              <Button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                variant="outline"
                                size="sm"
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" fill="none" viewBox="0 20 20" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
