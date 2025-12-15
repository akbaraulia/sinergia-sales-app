'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { LoadingCard } from '@/components/ui/Loading'
import { useToast } from '@/components/common/ToastProvider'
import type { SalesOrder } from '@/types/sales-order'

export default function SalesOrdersPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchSalesOrders()
  }, [])

  const fetchSalesOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sales-orders')
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales orders')
      }

      const result = await response.json()
      setOrders(result.data || [])
    } catch (error: any) {
      console.error('Error fetching sales orders:', error)
      showToast.error('Failed to load sales orders', error.message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, 'approved' | 'pending' | 'active' | 'rejected' | 'draft'> = {
      'Completed': 'approved',
      'To Deliver and Bill': 'active',
      'To Bill': 'active',
      'To Deliver': 'active',
      'Draft': 'draft',
      'Cancelled': 'rejected',
      'On Hold': 'pending'
    }
    return statusMap[status] || 'draft'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  // Get unique statuses for filter
  const uniqueStatuses = Array.from(new Set(orders.map(o => o.status)))

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <LoadingCard title="Loading sales orders..." message="Please wait while we fetch your data" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-isabelline via-white to-champagne-50 dark:from-dark-bg dark:via-dark-surface dark:to-jet-800 min-h-full">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-asparagus to-asparagus-700 dark:from-asparagus-600 dark:to-asparagus-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm flex items-center">
                  <svg className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Sales Orders
                </h1>
                <p className="text-white/90 mt-2 drop-shadow-sm">
                  View and manage your sales orders
                </p>
              </div>
              <Button
                onClick={fetchSalesOrders}
                variant="secondary"
                className="bg-white/95 hover:bg-white text-asparagus-700 hover:text-asparagus-800"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4 mb-6 border border-champagne-200 dark:border-dark-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                  Search Orders
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by order number or customer..."
                    className="w-full px-4 py-2 pl-10 border border-champagne-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 dark:bg-dark-bg dark:text-white"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-champagne-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 dark:bg-dark-bg dark:text-white"
                >
                  <option value="all">All Status</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-jet-600 dark:text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-jet-600 dark:text-gray-400">
                  Per page:
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1 border border-champagne-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 dark:bg-dark-bg dark:text-white text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-12 text-center border border-champagne-200 dark:border-dark-border">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-jet-700 dark:text-white mb-2">
                No sales orders found
              </h3>
              <p className="text-jet-600 dark:text-gray-400">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No orders available at the moment'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {paginatedOrders.map((order) => (
                <div
                  key={order.name}
                  onClick={() => router.push(`/sales/orders/${encodeURIComponent(order.name)}`)}
                  className="bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-champagne-200 dark:border-dark-border hover:shadow-xl hover:border-asparagus-300 dark:hover:border-asparagus-600 transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-asparagus-700 dark:text-asparagus-400">
                            {order.name}
                          </h3>
                          <StatusBadge status={getStatusBadge(order.status)} />
                        </div>
                        <p className="text-jet-700 dark:text-white font-medium truncate">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-jet-600 dark:text-gray-400 truncate">
                          {order.customer}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-asparagus-600 dark:text-asparagus-400">
                          {formatCurrency(order.grand_total)}
                        </p>
                        <p className="text-sm text-jet-600 dark:text-gray-400 mt-1">
                          {order.items.length} items
                        </p>
                      </div>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-champagne-200 dark:border-dark-border">
                      <div>
                        <label className="block text-xs font-medium text-jet-600 dark:text-gray-400 mb-1">
                          Transaction Date
                        </label>
                        <p className="text-sm text-jet-800 dark:text-white font-medium">
                          {formatDate(order.transaction_date)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-jet-600 dark:text-gray-400 mb-1">
                          Delivery Date
                        </label>
                        <p className="text-sm text-jet-800 dark:text-white font-medium">
                          {formatDate(order.delivery_date)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-jet-600 dark:text-gray-400 mb-1">
                          Delivered
                        </label>
                        <p className="text-sm text-jet-800 dark:text-white font-medium">
                          {order.per_delivered}%
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-jet-600 dark:text-gray-400 mb-1">
                          Billed
                        </label>
                        <p className="text-sm text-jet-800 dark:text-white font-medium">
                          {order.per_billed}%
                        </p>
                      </div>
                    </div>

                    {/* Sales Team */}
                    {order.sales_team && order.sales_team.length > 0 && (
                      <div className="flex items-center space-x-2 pt-4 border-t border-champagne-200 dark:border-dark-border">
                        <svg className="h-5 w-5 text-asparagus-600 dark:text-asparagus-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm text-jet-700 dark:text-gray-300">
                          {order.sales_team.map(member => member.sales_person_name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Click indicator */}
                  <div className="bg-gradient-to-r from-asparagus-50 to-champagne-50 dark:from-asparagus-900/20 dark:to-champagne-900/20 px-6 py-3 flex items-center justify-between border-t border-champagne-200 dark:border-dark-border">
                    <span className="text-sm text-asparagus-700 dark:text-asparagus-400 font-medium">
                      Click to view details
                    </span>
                    <svg className="h-5 w-5 text-asparagus-600 dark:text-asparagus-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredOrders.length > 0 && totalPages > 1 && (
            <div className="mt-6 bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4 border border-champagne-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                {/* Page Info */}
                <div className="text-sm text-jet-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center space-x-2">
                  {/* First Page */}
                  <Button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </Button>

                  {/* Previous Page */}
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </Button>

                  {/* Page Numbers */}
                  <div className="hidden md:flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
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
                          onClick={() => setCurrentPage(pageNum)}
                          variant={currentPage === pageNum ? 'primary' : 'outline'}
                          size="sm"
                          className="min-w-[2.5rem]"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  {/* Next Page */}
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>

                  {/* Last Page */}
                  <Button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>

                {/* Mobile: Simple page indicator */}
                <div className="md:hidden text-sm text-jet-600 dark:text-gray-400">
                  {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
