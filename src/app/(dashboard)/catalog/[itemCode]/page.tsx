'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/common/ToastProvider'
import { useAuthStore } from '@/store/authStore'
import { ERP_CONFIG } from '@/lib/constants/erp'

interface StockLevel {
  warehouse_id: string
  warehouse_name: string
  projected_qty: number
}

interface SellableItem {
  item_code: string
  custom_old_item_code?: string
  item_name: string
  item_group: string
  brand?: string | null
  price: number
  stock_uom: string
  creation: string
  image?: string
  stock_qty?: number
  description?: string
  is_stock_item?: boolean
  disabled?: boolean
  stock_levels?: StockLevel[]
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const { user } = useAuthStore()
  
  const itemCode = decodeURIComponent(params.itemCode as string)
  
  const [item, setItem] = useState<SellableItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generate image URL from ERP
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null
    // Remove leading slash if present and construct full URL
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    return `${ERP_CONFIG.BASE_URL}/${cleanPath}`
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Fetch product details
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!itemCode) return
      
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/erp/items', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        if (data.success && Array.isArray(data.items)) {
          // Find the specific item
          const foundItem = data.items.find((i: SellableItem) => i.item_code === itemCode)
          
          if (foundItem) {
            setItem(foundItem)
            console.log('📦 [DETAIL] Item found:', foundItem)
            console.log('🖼️ [DETAIL] Image field:', foundItem.image)
          } else {
            setError(`Product with code "${itemCode}" not found`)
          }
        } else {
          setError('Failed to load product data')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product details'
        console.error('❌ [DETAIL] Fetch error:', errorMessage)
        setError(errorMessage)
        showToast.error('Failed to load product details', errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchItemDetails()
  }, [itemCode, showToast])

  // Check if user has catalog permissions
  const canViewCatalog = user?.permissions && user.permissions.length > 0

  if (!canViewCatalog) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-4 md:p-6 lg:p-8">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">
                Access Restricted
              </h2>
              <p className="text-jet-600 dark:text-gray-300">
                You need permissions to view product details.
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
            {/* Back Navigation */}
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Catalog
              </Button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center text-asparagus-600 dark:text-asparagus-400">
                  <div className="animate-spin h-8 w-8 border-4 border-asparagus-200 dark:border-asparagus-800 border-t-asparagus-600 dark:border-t-asparagus-400 rounded-full mr-4" />
                  <span className="text-lg font-medium">Loading product details...</span>
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
                  Product Not Found
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={() => router.push('/catalog')} variant="outline">
                  Return to Catalog
                </Button>
              </div>
            )}

            {/* Product Details */}
            {item && !loading && (
              <div className="bg-gradient-to-br from-white to-champagne-50 dark:from-dark-surface dark:to-jet-800 rounded-xl shadow-lg border border-champagne-200 dark:border-dark-border">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
                  {/* Product Image */}
                  <div className="space-y-4">
                    <div className="aspect-square bg-gradient-to-br from-asparagus-100 to-asparagus-200 dark:from-asparagus-800 dark:to-asparagus-900 rounded-lg flex items-center justify-center overflow-hidden">
                      {getImageUrl(item.image) ? (
                        <img 
                          src={getImageUrl(item.image)!} 
                          alt={item.item_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            console.log('❌ [DETAIL] Image failed to load:', getImageUrl(item.image))
                            target.style.display = 'none'
                            target.parentElement!.innerHTML = `
                              <div class="text-asparagus-600 dark:text-asparagus-300 text-center">
                                <svg class="w-24 h-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <p class="text-sm text-gray-500">Image not available</p>
                              </div>
                            `
                          }}
                          onLoad={() => {
                            console.log('✅ [DETAIL] Image loaded successfully:', getImageUrl(item.image))
                          }}
                        />
                      ) : (
                        <div className="text-asparagus-600 dark:text-asparagus-300 text-center">
                          <svg className="w-24 h-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <p className="text-sm text-gray-500">No image available</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Image Debug Info */}
                    <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <p><strong>Image Field:</strong> {item.image || 'null'}</p>
                      <p><strong>Generated URL:</strong> {getImageUrl(item.image) || 'null'}</p>
                    </div>
                  </div>

                  {/* Product Information */}
                  <div className="space-y-6">
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      {!item.disabled && (
                        <Badge variant="success" size="sm">Active</Badge>
                      )}
                      {item.brand && (
                        <Badge variant="secondary" size="sm">{item.brand}</Badge>
                      )}
                      <Badge variant="outline" size="sm">{item.item_group}</Badge>
                      {!item.is_stock_item && (
                        <Badge variant="outline" size="sm">Service</Badge>
                      )}
                    </div>

                    {/* Product Title */}
                    <div>
                      <p className="font-mono text-sm text-jet-600 dark:text-gray-400 mb-2">
                        {item.item_code}
                      </p>
                      <h1 className="text-2xl md:text-3xl font-bold text-jet-800 dark:text-white mb-4">
                        {item.item_name}
                      </h1>
                    </div>

                    {/* Price */}
                    <div className="border-t border-b border-champagne-200 dark:border-dark-border py-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Price</p>
                          <p className="text-3xl font-bold text-asparagus-700 dark:text-asparagus-400">
                            {formatCurrency(item.price || 0)}
                          </p>
                          <p className="text-sm text-gray-500">per {item.stock_uom || 'unit'}</p>
                        </div>
                        
                        {item.is_stock_item && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stock</p>
                            <p className={`text-2xl font-bold ${
                              (item.stock_qty || 0) === 0 ? 'text-red-600 dark:text-red-400' : 
                              (item.stock_qty || 0) <= 10 ? 'text-yellow-600 dark:text-yellow-400' : 
                              'text-green-600 dark:text-green-400'
                            }`}>
                              {(item.stock_qty || 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">in stock</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock Levels by Warehouse */}
                    <div>
                      <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Warehouse Stock Levels
                      </h3>
                      
                      {(!item.stock_levels || item.stock_levels.length === 0) ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <div>
                              <p className="font-medium text-blue-800 dark:text-blue-200">Bundle Item</p>
                              <p className="text-sm text-blue-600 dark:text-blue-300">This is a bundle product with no individual stock tracking</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Stock Summary */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                              <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Total Stock</p>
                              <p className="text-xl font-bold text-green-700 dark:text-green-300">
                                {item.stock_levels.reduce((sum, level) => sum + level.projected_qty, 0).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Warehouses</p>
                              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                {item.stock_levels.length}
                              </p>
                            </div>
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                              <p className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1">In Stock</p>
                              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                                {item.stock_levels.filter(level => level.projected_qty > 0).length}
                              </p>
                            </div>
                          </div>
                          
                          {/* Warehouse Stock Table */}
                          <div className="bg-white dark:bg-dark-surface rounded-lg border border-champagne-200 dark:border-dark-border overflow-hidden">
                            <div className="max-h-80 overflow-y-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-jet-800 sticky top-0">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                      Warehouse
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                      Stock
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                                  {item.stock_levels
                                    .sort((a, b) => b.projected_qty - a.projected_qty) // Sort by stock descending
                                    .map((level, index) => (
                                    <tr key={level.warehouse_id} className={index % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50 dark:bg-jet-900/50'}>
                                      <td className="px-4 py-3">
                                        <div>
                                          <p className="text-sm font-medium text-jet-800 dark:text-white">
                                            {level.warehouse_name}
                                          </p>
                                          <p className="text-xs text-gray-500 font-mono">
                                            {level.warehouse_id}
                                          </p>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className={`text-sm font-semibold ${
                                          level.projected_qty === 0 ? 'text-red-600 dark:text-red-400' :
                                          level.projected_qty <= 10 ? 'text-yellow-600 dark:text-yellow-400' :
                                          'text-green-600 dark:text-green-400'
                                        }`}>
                                          {level.projected_qty.toLocaleString()}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        {level.projected_qty === 0 ? (
                                          <Badge variant="error" size="sm">Out of Stock</Badge>
                                        ) : level.projected_qty <= 10 ? (
                                          <Badge variant="warning" size="sm">Low Stock</Badge>
                                        ) : (
                                          <Badge variant="success" size="sm">In Stock</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {item.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-3">
                          Description
                        </h3>
                        <p className="text-jet-600 dark:text-gray-300 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Brand</p>
                        <p className="text-jet-800 dark:text-white font-medium">
                          {item.brand || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Category</p>
                        <p className="text-jet-800 dark:text-white font-medium">
                          {item.item_group}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</p>
                        <p className="text-jet-800 dark:text-white font-medium">
                          {new Date(item.creation).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Unit</p>
                        <p className="text-jet-800 dark:text-white font-medium">
                          {item.stock_uom || '-'}
                        </p>
                      </div>
                    </div>
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
