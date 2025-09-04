'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/Table'
import { useToast } from '@/components/common/ToastProvider'
import { useAuthStore } from '@/store/authStore'
import { ERP_CONFIG } from '@/lib/constants/erp'
import BrandFilter, { ItemBrand, useBrandFilter } from '@/components/filters/BrandFilter'

interface SellableItem {
  item_code: string
  custom_old_item_code?: string
  item_name: string
  item_group: string
  brand?: string
  price: number
  stock_uom: string
  creation: string
  image?: string
  stock_qty?: number
  description?: string
  is_stock_item?: boolean
  disabled?: boolean
}

export default function CatalogPage() {
  const { showToast } = useToast()
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Use brand filter hook
  const {
    selectedBrand,
    setSelectedBrand,
    brands,
    loading: brandsLoading,
    error: brandError,
    fetchBrands,
    resetBrandFilter
  } = useBrandFilter('all')
  
  // State management
  const [items, setItems] = useState<SellableItem[]>([])
  const [filteredItems, setFilteredItems] = useState<SellableItem[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [itemGroupFilter, setItemGroupFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [stockFilter, setStockFilter] = useState<string>('all') // all, in-stock, out-of-stock
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize search from URL params
  useEffect(() => {
    const brand = searchParams.get('brand')
    const search = searchParams.get('search')
    const group = searchParams.get('group')
    
    if (brand) setSelectedBrand(brand)
    if (search) setSearchQuery(search)
    if (group) setItemGroupFilter(group)
  }, [searchParams, setSelectedBrand])

  // Fetch sellable items from ERP via API route
  const fetchItems = useCallback(async () => {
    if (loading) return
    
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
      console.log('📦 [CATALOG] Items API Response:', data)
      
      if (data.success && Array.isArray(data.items)) {
        // Debug first few items for image field
        if (data.items.length > 0) {
          console.log('🖼️ [CATALOG] Sample item image fields:', data.items.slice(0, 3).map((item: any) => ({
            item_code: item.item_code,
            item_name: item.item_name,
            image: item.image,
            hasImage: !!item.image
          })))
        }
        
        setItems(data.items)
        console.log(`✅ [CATALOG] Loaded ${data.items.length} items`)
      } else {
        console.warn('⚠️ [CATALOG] Unexpected items data structure:', data)
        setItems([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch items'
      console.error('❌ [CATALOG] Items fetch error:', errorMessage)
      setError(errorMessage)
      showToast.error('Failed to load items', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [loading, showToast])

  // Initial data load - Fix infinite loop
  useEffect(() => {
    const initializeData = async () => {
      if (!loading && items.length === 0) {
        await fetchItems()  
      }
    }
    
    initializeData()
  }, []) // Empty dependency array - only run once

  // Separate effect for when user manually refreshes
  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchBrands(), fetchItems()])
  }, [fetchBrands, fetchItems])

  // Get unique item groups for filter
  const itemGroups = useMemo(() => {
    const groups = Array.from(new Set(items.map(item => item.item_group).filter(Boolean)))
    return groups.sort()
  }, [items])

  // Filter items based on all filter criteria - OPTIMIZED FOR PERFORMANCE
  useEffect(() => {
    let filtered = items

    // Brand filter
    if (selectedBrand && selectedBrand !== 'all') {
      filtered = filtered.filter(item => 
        item.brand?.toLowerCase() === selectedBrand.toLowerCase()
      )
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(item =>
        item.item_name?.toLowerCase().includes(query) ||
        item.item_code?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query)
      )
    }

    // Item group filter
    if (itemGroupFilter && itemGroupFilter !== 'all') {
      filtered = filtered.filter(item => item.item_group === itemGroupFilter)
    }

    // Price range filter
    if (priceRange.min || priceRange.max) {
      const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0
      const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity
      
      filtered = filtered.filter(item => {
        const price = item.price || 0
        return price >= minPrice && price <= maxPrice
      })
    }

    // Stock filter
    if (stockFilter !== 'all') {
      if (stockFilter === 'in-stock') {
        filtered = filtered.filter(item => item.is_stock_item && (item.stock_qty || 0) > 0)
      } else if (stockFilter === 'out-of-stock') {
        filtered = filtered.filter(item => item.is_stock_item && (item.stock_qty || 0) === 0)
      }
    }

    setFilteredItems(filtered)
  }, [items, selectedBrand, searchQuery, itemGroupFilter, priceRange, stockFilter])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Generate image URL from ERP
  const getImageUrl = (imagePath?: string) => {
    console.log('🖼️ [URL] Processing image path:', imagePath)
    
    if (!imagePath) {
      console.log('🖼️ [URL] No image path provided, returning null')
      return null
    }
    
    // Remove leading slash if present and construct full URL
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    const fullUrl = `${ERP_CONFIG.BASE_URL}/${cleanPath}`
    
    console.log('🖼️ [URL] Generated image URL using ERP_CONFIG.BASE_URL:', fullUrl)
    console.log('🖼️ [URL] ERP_CONFIG.BASE_URL:', ERP_CONFIG.BASE_URL)
    return fullUrl
  }

  // Handle product detail view
  const handleProductDetail = (item: SellableItem) => {
    console.log('📋 [CATALOG] Navigating to product details:', item.item_code)
    // Navigate to product detail page
    router.push(`/catalog/${encodeURIComponent(item.item_code)}`)
  }

  // Pagination calculations
  const totalItems = filteredItems.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }



  // Clear all filters
  const clearFilters = () => {
    resetBrandFilter()
    setSearchQuery('')
    setPriceRange({ min: '', max: '' })
    setItemGroupFilter('all')
    setStockFilter('all')
    showToast.success('Filters cleared', 'Showing all items')
  }

  // Table columns for items (remove actions column since it's not a key of SellableItem)
  const itemColumns = [
    { 
      key: 'item_code' as const, 
      label: 'Code', 
      sortable: true,
      render: (value: string | number | boolean | undefined, item: SellableItem) => (
        <div className="font-mono text-sm">
          {value || ''}
          {!item.disabled && (
            <Badge variant="success" size="sm" className="ml-2">Active</Badge>
          )}
        </div>
      )
    },
    { 
      key: 'item_name' as const, 
      label: 'Item Name', 
      sortable: true,
      render: (value: string | number | boolean | undefined, item: SellableItem) => (
        <div>
          <div className="font-medium text-jet-800 dark:text-white">{value || ''}</div>
          {item.description && (
            <div className="text-sm text-jet-600 dark:text-gray-300 truncate max-w-xs">
              {item.description}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'brand' as const, 
      label: 'Brand', 
      sortable: true,
      render: (value: string | number | boolean | undefined) => value ? (
        <Badge variant="secondary" size="sm">{String(value)}</Badge>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    { 
      key: 'item_group' as const, 
      label: 'Group', 
      sortable: true,
      render: (value: string | number | boolean | undefined) => (
        <Badge variant="outline" size="sm">{String(value || '')}</Badge>
      )
    },
    { 
      key: 'price' as const, 
      label: 'Price', 
      sortable: true,
      render: (value: string | number | boolean | undefined, item: SellableItem) => (
        <div className="text-right font-medium text-asparagus-700 dark:text-asparagus-400">
          {formatCurrency(Number(value || 0))}
          <div className="text-xs text-gray-500">/{item.stock_uom || 'unit'}</div>
        </div>
      )
    },
    { 
      key: 'stock_qty' as const, 
      label: 'Stock', 
      sortable: true,
      render: (value: string | number | boolean | undefined, item: SellableItem) => {
        if (!item.is_stock_item) {
          return <Badge variant="secondary" size="sm">Service</Badge>
        }
        
        const qty = Number(value || 0)
        const isLowStock = qty <= 10 && qty > 0
        const isOutOfStock = qty === 0
        
        return (
          <div className="text-right">
            <div className={`font-medium ${
              isOutOfStock ? 'text-red-600 dark:text-red-400' : 
              isLowStock ? 'text-yellow-600 dark:text-yellow-400' : 
              'text-green-600 dark:text-green-400'
            }`}>
              {qty.toLocaleString()}
            </div>
            {isLowStock && <Badge variant="warning" size="xs">Low</Badge>}
            {isOutOfStock && <Badge variant="danger" size="xs">Out</Badge>}
          </div>
        )
      }
    }
  ]

  // Product Card Component for Grid View
  const ProductCard: React.FC<{ item: SellableItem }> = ({ item }) => {
    const qty = Number(item.stock_qty || 0)
    const isLowStock = item.is_stock_item && qty <= 10 && qty > 0
    const isOutOfStock = item.is_stock_item && qty === 0
    const imageUrl = getImageUrl(item.image)

    return (
      <div 
        className="group bg-gradient-to-br from-white to-champagne-50 dark:from-dark-surface dark:to-jet-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-champagne-200 dark:border-dark-border hover:border-asparagus-300 dark:hover:border-asparagus-600 p-4 hover:transform hover:scale-105 cursor-pointer"
        onClick={() => handleProductDetail(item)}
      >
        {/* Item Image */}
        <div className="aspect-square bg-gradient-to-br from-asparagus-100 to-asparagus-200 dark:from-asparagus-800 dark:to-asparagus-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={item.item_name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                console.log('❌ [CARD] Image failed to load for', item.item_code, ':', imageUrl)
                console.log('❌ [CARD] Original image field:', item.image)
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.parentElement!.innerHTML = `
                  <div class="text-asparagus-600 dark:text-asparagus-300 text-center">
                    <svg class="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p class="text-xs text-gray-500">Image unavailable</p>
                  </div>
                `
              }}
              onLoad={() => {
                console.log('✅ [CARD] Image loaded successfully for', item.item_code, ':', imageUrl)
              }}
            />
          ) : (
            <div className="text-asparagus-600 dark:text-asparagus-300 text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-xs text-gray-500">No image</p>
            </div>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {!item.disabled && (
            <Badge variant="success" size="xs">Active</Badge>
          )}
          {item.brand && (
            <Badge variant="secondary" size="xs">{item.brand}</Badge>
          )}
          {isLowStock && <Badge variant="warning" size="xs">Low Stock</Badge>}
          {isOutOfStock && <Badge variant="danger" size="xs">Out of Stock</Badge>}
          {!item.is_stock_item && <Badge variant="outline" size="xs">Service</Badge>}
        </div>

        {/* Item Details */}
        <div className="space-y-2">
          <div className="font-mono text-xs text-jet-600 dark:text-gray-400">
            {item.item_code}
          </div>
          
          <h3 className="font-semibold text-jet-800 dark:text-white text-sm line-clamp-2 min-h-[2.5rem]">
            {item.item_name}
          </h3>
          
          <div className="text-xs text-jet-600 dark:text-gray-300">
            <Badge variant="outline" size="xs">{item.item_group}</Badge>
          </div>

          {item.description && (
            <p className="text-xs text-jet-600 dark:text-gray-400 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Price and Stock */}
        <div className="mt-4 pt-4 border-t border-champagne-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-asparagus-700 dark:text-asparagus-400">
                {formatCurrency(item.price || 0)}
              </div>
              <div className="text-xs text-gray-500">
                per {item.stock_uom || 'unit'}
              </div>
            </div>
            
            {item.is_stock_item && (
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  isOutOfStock ? 'text-red-600 dark:text-red-400' : 
                  isLowStock ? 'text-yellow-600 dark:text-yellow-400' : 
                  'text-green-600 dark:text-green-400'
                }`}>
                  {qty.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">in stock</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Check if user has catalog permissions - Allow all authenticated users
  const canViewCatalog = user?.permissions && user.permissions.length > 0 // Any authenticated user with permissions can view catalog

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
                You need sales permissions to view the catalog.
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
                    📦 Product Catalog
                  </h1>
                  <p className="text-sm md:text-base text-white/90 dark:text-white/80 mt-1 drop-shadow-sm">
                    Browse and select products for sales orders
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleRefresh}
                    disabled={loading}
                    size="sm"
                    variant="secondary"
                    className="bg-white/95 hover:bg-white text-asparagus-700 hover:text-asparagus-800 border border-white/80 hover:border-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="p-4 md:p-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-white/95 truncate">Total Items</p>
                    <p className="text-lg md:text-2xl font-bold text-white mt-1">{items.length.toLocaleString()}</p>
                  </div>
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              
              <div className="p-4 md:p-6 bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-white/95 truncate">Brands</p>
                    <p className="text-lg md:text-2xl font-bold text-white mt-1">{brands.length.toLocaleString()}</p>
                  </div>
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
              
              <div className="p-4 md:p-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-white/95 truncate">Filtered Items</p>
                    <p className="text-lg md:text-2xl font-bold text-white mt-1">{filteredItems.length.toLocaleString()}</p>
                  </div>
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                </div>
              </div>
              
              <div className="p-4 md:p-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-white/95 truncate">Item Groups</p>
                    <p className="text-lg md:text-2xl font-bold text-white mt-1">{itemGroups.length.toLocaleString()}</p>
                  </div>
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-gradient-to-br from-champagne-100 to-champagne-300 dark:from-champagne-800 dark:to-champagne-900 rounded-lg shadow-lg p-4 md:p-6 border border-champagne-300 dark:border-champagne-600">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <h2 className="text-base md:text-lg font-semibold text-jet-800 dark:text-white">Filters</h2>
                <Button 
                  onClick={clearFilters}
                  size="sm"
                  variant="outline"
                  className="w-full lg:w-auto"
                >
                  Clear All Filters
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Search */}
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                    Search Items
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, code, brand..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                  />
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                    Brand
                  </label>
                  <BrandFilter
                    selectedBrand={selectedBrand}
                    onBrandChange={setSelectedBrand}
                    autoFetch={true}
                  />
                </div>

                {/* Item Group Filter */}
                <div>
                  <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                    Group
                  </label>
                  <select
                    value={itemGroupFilter}
                    onChange={(e) => setItemGroupFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                  >
                    <option value="all">All Groups</option>
                    {itemGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    placeholder="999999999"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* View Mode Toggle and Stock Filter */}
            <div className="bg-gradient-to-br from-champagne-100 to-champagne-300 dark:from-champagne-800 dark:to-champagne-900 rounded-lg shadow-lg p-4 md:p-6 border border-champagne-300 dark:border-champagne-600">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <h2 className="text-base md:text-lg font-semibold text-jet-800 dark:text-white">View Options</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Stock Filter */}
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                  >
                    <option value="all">All Items</option>
                    <option value="in-stock">In Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                  
                  {/* View Mode Toggle */}
                  <div className="flex bg-white dark:bg-dark-surface rounded-md border border-gray-300 dark:border-dark-border">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 text-sm font-medium rounded-l-md transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-asparagus-600 text-white shadow-sm'
                          : 'text-jet-600 dark:text-gray-300 hover:text-jet-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-border'
                      }`}
                    >
                      <svg className="h-4 w-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-md transition-all duration-200 ${
                        viewMode === 'table'
                          ? 'bg-asparagus-600 text-white shadow-sm'
                          : 'text-jet-600 dark:text-gray-300 hover:text-jet-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-border'
                      }`}
                    >
                      <svg className="h-4 w-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Table
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Items per page */}
              {viewMode === 'grid' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-jet-700 dark:text-gray-300">
                      Items per page:
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1) // Reset to first page
                      }}
                      className="px-2 py-1 border border-gray-300 dark:border-dark-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                      <option value={96}>96</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Items Display */}
            <div className="bg-gradient-to-br from-isabelline-50 to-white dark:from-dark-surface dark:to-dark-bg rounded-lg shadow-lg p-4 md:p-6 border border-isabelline-300 dark:border-dark-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-jet-800 dark:text-white">
                    Product Items
                  </h2>
                  <p className="text-sm text-jet-600 dark:text-gray-300">
                    {viewMode === 'grid' ? (
                      `Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} items (Page ${currentPage}/${totalPages})`
                    ) : (
                      `Showing ${filteredItems.length} of ${items.length} items`
                    )}
                  </p>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center text-asparagus-600 dark:text-asparagus-400">
                    <div className="animate-spin h-8 w-8 border-4 border-asparagus-200 dark:border-asparagus-800 border-t-asparagus-600 dark:border-t-asparagus-400 rounded-full mr-4" />
                    <span className="text-lg font-medium">Loading products...</span>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredItems.length === 0 && (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-jet-800 dark:text-white mb-2">
                    {items.length === 0 ? 'No Products Available' : 'No Products Match Your Filters'}
                  </h3>
                  <p className="text-jet-600 dark:text-gray-400 mb-6">
                    {items.length === 0 
                      ? 'There are no products in the catalog yet.' 
                      : 'Try adjusting your search terms or filters to find what you\'re looking for.'
                    }
                  </p>
                  {filteredItems.length !== items.length && (
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}

              {/* Grid View */}
              {!loading && viewMode === 'grid' && filteredItems.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {currentItems.map((item, index) => (
                      <ProductCard key={`${item.item_code}-${index}`} item={item} />
                    ))}
                  </div>

                  {/* Pagination for Grid View */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-champagne-200 dark:border-dark-border">
                      <div className="flex items-center gap-2 text-sm text-jet-600 dark:text-gray-400">
                        <span>Page {currentPage} of {totalPages}</span>
                        <span>•</span>
                        <span>{totalItems} total items</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => goToPage(1)}
                          disabled={currentPage === 1}
                          size="sm"
                          variant="outline"
                        >
                          First
                        </Button>
                        <Button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          size="sm"
                          variant="outline"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </Button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
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
                                onClick={() => goToPage(pageNum)}
                                size="sm"
                                variant={currentPage === pageNum ? "primary" : "outline"}
                                className="w-10"
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        
                        <Button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          size="sm"
                          variant="outline"
                        >
                          Next
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Button>
                        <Button
                          onClick={() => goToPage(totalPages)}
                          disabled={currentPage === totalPages}
                          size="sm"
                          variant="outline"
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Table View */}
              {!loading && viewMode === 'table' && filteredItems.length > 0 && (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="bg-white/80 dark:bg-dark-surface/90 backdrop-blur-sm rounded-lg border border-white/60 dark:border-dark-border shadow-inner">
                      <DataTable
                        data={filteredItems}
                        columns={itemColumns}
                        onRowClick={handleProductDetail}
                        loading={loading}
                        emptyMessage="No items match your filters"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
