'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { LoadingCard } from '@/components/ui/Loading'
import { useToast } from '@/components/common/ToastProvider'
import type { SalesOrder } from '@/types/sales-order'
import { ERP_CONFIG } from '@/lib/constants/erp'

export default function SalesOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [order, setOrder] = useState<SalesOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null)

  const soId = params.id as string

  useEffect(() => {
    if (soId) {
      fetchOrderDetail()
    }
  }, [soId])

  // Keyboard support for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage])

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales-orders?so_id=${encodeURIComponent(soId)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details')
      }

      const result = await response.json()
      if (result.data && result.data.length > 0) {
        setOrder(result.data[0])
      } else {
        throw new Error('Order not found')
      }
    } catch (error: any) {
      console.error('Error fetching order detail:', error)
      showToast.error('Failed to load order details', error.message)
      setOrder(null)
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
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return '/placeholder-product.png'
    if (imagePath.startsWith('http')) return imagePath
    return `${ERP_CONFIG.BASE_URL}${imagePath}`
  }

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <LoadingCard title="Loading order details..." message="Please wait while we fetch your data" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!order) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-4 md:p-6 lg:p-8">
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-jet-700 dark:text-white mb-4">
                Order Not Found
              </h3>
              <Button onClick={() => router.push('/sales/orders')} variant="primary">
                Back to Orders
              </Button>
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
          
          {/* Back Button */}
          <Button
            onClick={() => router.push('/sales/orders')}
            variant="outline"
            className="mb-6"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Button>

          {/* Order Header */}
          <div className="bg-gradient-to-r from-asparagus to-asparagus-700 dark:from-asparagus-600 dark:to-asparagus-800 rounded-lg shadow-lg p-6 mb-6 border border-asparagus-200 dark:border-asparagus-600">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-white drop-shadow-sm">
                    {order.name}
                  </h1>
                  <StatusBadge status={getStatusBadge(order.status)} />
                </div>
                <p className="text-white/90 text-lg drop-shadow-sm">
                  {order.customer_name}
                </p>
                <p className="text-white/80 text-sm drop-shadow-sm">
                  {order.customer}
                </p>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-sm text-white/80 drop-shadow-sm">Total Amount</p>
                <p className="text-3xl font-bold text-white drop-shadow-sm">
                  {formatCurrency(order.grand_total)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Transaction Details */}
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-asparagus-600 dark:text-asparagus-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Transaction Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-jet-600 dark:text-gray-400 mb-1">
                    Transaction Date
                  </label>
                  <p className="text-jet-800 dark:text-white">
                    {formatDate(order.transaction_date)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-jet-600 dark:text-gray-400 mb-1">
                    Delivery Date
                  </label>
                  <p className="text-jet-800 dark:text-white">
                    {formatDate(order.delivery_date)}
                  </p>
                </div>
                {order.po_no && (
                  <div>
                    <label className="block text-sm font-medium text-jet-600 dark:text-gray-400 mb-1">
                      PO Number
                    </label>
                    <p className="text-jet-800 dark:text-white">
                      {order.po_no}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery & Billing Progress */}
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-jet-600 dark:text-gray-400">
                      Delivered
                    </label>
                    <span className="text-sm font-bold text-jet-800 dark:text-white">
                      {order.per_delivered}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${order.per_delivered}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-jet-600 dark:text-gray-400">
                      Billed
                    </label>
                    <span className="text-sm font-bold text-jet-800 dark:text-white">
                      {order.per_billed}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${order.per_billed}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Team */}
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-asparagus-600 dark:text-asparagus-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Sales Team
              </h3>
              {order.sales_team && order.sales_team.length > 0 ? (
                <div className="space-y-3">
                  {order.sales_team.map((member, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gradient-to-r from-asparagus-50 to-champagne-50 dark:from-asparagus-900/20 dark:to-champagne-900/20 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-asparagus to-asparagus-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-jet-600 dark:text-gray-400">
                  No sales team assigned
                </p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-champagne-200 dark:border-dark-border overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-champagne-100 to-champagne-200 dark:from-champagne-800 dark:to-champagne-900 border-b border-champagne-300 dark:border-champagne-600">
              <h3 className="text-lg font-semibold text-jet-800 dark:text-white flex items-center">
                <svg className="h-5 w-5 mr-2 text-asparagus-600 dark:text-asparagus-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Order Items ({order.items.length})
              </h3>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-gradient-to-r from-isabelline-50 to-white dark:from-dark-bg dark:to-dark-surface rounded-lg border border-champagne-200 dark:border-dark-border hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div 
                        onClick={() => setSelectedImage({ url: getImageUrl(item.image), name: item.item_name })}
                        className="relative w-20 h-20 bg-white dark:bg-dark-bg rounded-lg overflow-hidden border border-champagne-300 dark:border-dark-border cursor-pointer hover:border-asparagus-500 dark:hover:border-asparagus-400 transition-colors group"
                      >
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.item_name}
                          fill
                          className="object-contain p-2 group-hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-product.png'
                          }}
                        />
                        {/* Zoom icon overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <svg className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-jet-800 dark:text-white mb-1">
                            {item.item_name}
                          </h4>
                          <p className="text-sm text-jet-600 dark:text-gray-400 mb-2">
                            Code: {item.item_code}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <div>
                              <span className="text-jet-600 dark:text-gray-400">Qty: </span>
                              <span className="font-medium text-jet-800 dark:text-white">{item.qty}</span>
                            </div>
                            <div>
                              <span className="text-jet-600 dark:text-gray-400">Rate: </span>
                              <span className="font-medium text-jet-800 dark:text-white">{formatCurrency(item.rate)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-jet-600 dark:text-gray-400 mb-1">Amount</p>
                          <p className="text-xl font-bold text-asparagus-600 dark:text-asparagus-400">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-champagne-300 dark:border-dark-border">
                <div className="flex justify-end">
                  <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-champagne-200 dark:border-dark-border">
                      <span className="text-jet-700 dark:text-gray-300 font-medium">
                        Total Items:
                      </span>
                      <span className="text-jet-800 dark:text-white font-semibold">
                        {order.items.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-champagne-200 dark:border-dark-border">
                      <span className="text-jet-700 dark:text-gray-300 font-medium">
                        Total Quantity:
                      </span>
                      <span className="text-jet-800 dark:text-white font-semibold">
                        {order.items.reduce((sum, item) => sum + item.qty, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 bg-gradient-to-r from-asparagus-50 to-champagne-50 dark:from-asparagus-900/20 dark:to-champagne-900/20 p-4 rounded-lg">
                      <span className="text-lg font-bold text-jet-800 dark:text-white">
                        Grand Total:
                      </span>
                      <span className="text-2xl font-bold text-asparagus-600 dark:text-asparagus-400">
                        {formatCurrency(order.grand_total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="mt-6 bg-gradient-to-r from-champagne-100 to-champagne-200 dark:from-champagne-800 dark:to-champagne-900 rounded-lg p-4 border border-champagne-300 dark:border-champagne-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-jet-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm text-jet-700 dark:text-gray-300">
                  Company: <span className="font-medium text-jet-800 dark:text-white">{order.company}</span>
                </span>
              </div>
              <Button
                onClick={() => router.push('/sales/orders')}
                variant="outline"
                size="sm"
              >
                View All Orders
              </Button>
            </div>
          </div>
        </div>

        {/* Image Preview Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="relative max-w-4xl max-h-[90vh] w-full bg-white dark:bg-dark-surface rounded-lg shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-champagne-200 dark:border-dark-border bg-gradient-to-r from-asparagus-50 to-champagne-50 dark:from-asparagus-900/20 dark:to-champagne-900/20">
                <h3 className="text-lg font-semibold text-jet-800 dark:text-white truncate pr-4">
                  {selectedImage.name}
                </h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="flex-shrink-0 p-2 hover:bg-white/50 dark:hover:bg-dark-bg/50 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6 text-jet-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body - Image */}
              <div className="relative w-full h-[calc(90vh-8rem)] bg-gradient-to-br from-isabelline-50 to-white dark:from-dark-bg dark:to-dark-surface flex items-center justify-center p-8">
                <div className="relative w-full h-full">
                  <Image
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-product.png'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-4 border-t border-champagne-200 dark:border-dark-border bg-gradient-to-r from-champagne-50 to-champagne-100 dark:from-champagne-900/10 dark:to-champagne-800/10">
                <div className="text-sm text-jet-600 dark:text-gray-400">
                  Click outside or press ESC to close
                </div>
                <Button
                  onClick={() => setSelectedImage(null)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
