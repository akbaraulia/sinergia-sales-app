'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/common/ToastProvider'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils/format'
import { ERP_CONFIG } from '@/lib/constants/erp'

interface FreeItem {
  item_code: string
  item_name: string
  stock_uom: string
  qty: number
  price_list_rate: number
  total_price: number
}

interface PromoData {
  name: string
  kode: string
  nama: string
  nilai: number
  expired: string
  brand: string
  free_items: FreeItem[]
}

interface StockLevel {
  warehouse_id: string
  warehouse_name: string
  projected_qty: number
  branch: string
}

interface SellableItem {
  item_code: string
  custom_old_item_code?: string
  item_name: string
  item_group: string
  brand?: string | null
  custom_subbrand?: string | null
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

interface BranchOption {
  value: string
  label: string
}

interface SalesPerson {
  name: string
  sales_person_name: string
  employee_name?: string
}

interface ERPUser {
  name: string
  email: string
  full_name: string
  user_type: string
}

interface CartItem {
  item: SellableItem
  quantity: number
  subtotal: number
}

export default function VoucherFormPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const { user } = useAuthStore()
  
  const promoCode = decodeURIComponent(params.promoCode as string)
  
  // State management - OPTIMIZED
  const [promo, setPromo] = useState<PromoData | null>(null)
  const [allItems, setAllItems] = useState<SellableItem[]>([]) // Store ALL items once
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [priceList] = useState<string>('HET PRICE') // Fixed value, disabled
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [loading, setLoading] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dropdown options
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([])
  const [erpUsers, setErpUsers] = useState<ERPUser[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [loadingSales, setLoadingSales] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Calculate totals
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const remainingVoucherValue = promo ? Math.max(0, promo.nilai - cartTotal) : 0
  const isVoucherExceeded = cartTotal > (promo?.nilai || 0)

  // Generate image URL from ERP
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    return `${ERP_CONFIG.BASE_URL}/${cleanPath}`
  }

  // Get stock for selected branch
  const getStockForBranch = (item: SellableItem, branch: string): number => {
    if (!item.stock_levels || !branch) {
      return item.stock_qty || 0
  }
  
    const branchStock = item.stock_levels
      .filter(level => level.branch === branch)
      .reduce((sum, level) => sum + level.projected_qty, 0)
  
  return Math.max(0, branchStock)
}

  // Check if item can be added (has stock in selected branch)
const canAddItem = (item: SellableItem): boolean => {
  if (!item.is_stock_item) return true // Service items always available
  
  if (!selectedBranch) {
    // No branch selected, check total stock
    return (item.stock_qty || 0) > 0
  }
  
  // Check stock for selected branch
  const branchStock = getStockForBranch(item, selectedBranch)
  return branchStock > 0
}


  // Fetch form data using new server script endpoint
  const fetchFormData = useCallback(async () => {
    if (branches.length > 0 && salesPersons.length > 0) return // Don't refetch if already have data
    
    setLoadingBranches(true)
    setLoadingSales(true)
    
    try {
      // Use new API wrapper for server script to get branch, sales_person, and price_list data
      const response = await fetch(`/api/erp/form-data?get_data=branch,sales_person,price_list`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📦 [VOUCHER] Form data response:', data)
        
        if (data.success && data.data) {
          // Set branches
          if (data.data.branches && Array.isArray(data.data.branches)) {
            const branchOptions: BranchOption[] = data.data.branches.map((branch: any) => ({
              value: branch.name,
              label: branch.branch || branch.name
            }))
            setBranches(branchOptions)
            console.log('✅ [VOUCHER] Loaded branches from server script:', branchOptions.length)
          }
          
          // Set sales persons
          if (data.data.sales_persons && Array.isArray(data.data.sales_persons)) {
            setSalesPersons(data.data.sales_persons)
            console.log('✅ [VOUCHER] Loaded sales persons from server script:', data.data.sales_persons.length)
          }
          
          // Note: price_list is available in data.data.price_lists if needed later
        }
      } else {
        console.error('❌ [VOUCHER] Failed to fetch form data:', response.status, response.statusText)
        // Fallback to stock levels for branches if server script fails
        await fetchBranchesFromStock()
      }
    } catch (err) {
      console.error('❌ [VOUCHER] Error fetching form data:', err)
      // Fallback to stock levels for branches if server script fails
      await fetchBranchesFromStock()
    } finally {
      setLoadingBranches(false)
      setLoadingSales(false)
    }
  }, [branches.length, salesPersons.length])

  // Fallback: Fetch branches from stock levels (if server script fails)
  const fetchBranchesFromStock = useCallback(async () => {
    try {
      const response = await fetch('/api/erp/items', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.items)) {
          const branchSet = new Set<string>()
          
          data.items.forEach((item: SellableItem) => {
            if (item.stock_levels) {
              item.stock_levels.forEach(level => {
                if (level.branch && level.branch !== 'TIDAK ADA BRANCH') {
                  branchSet.add(level.branch)
                }
              })
            }
          })
          
          const branchOptions: BranchOption[] = Array.from(branchSet)
            .sort()
            .map(branch => ({
              value: branch,
              label: branch
            }))
          
          setBranches(branchOptions)
          console.log('✅ [VOUCHER] Loaded branches from fallback (stock levels):', branchOptions.length)
        }
      }
    } catch (err) {
      console.error('❌ [VOUCHER] Failed to fetch branches from fallback:', err)
    }
  }, [])

  // Fetch customers based on selected branch
  const fetchCustomers = useCallback(async (branchId: string) => {
    if (!branchId) {
      setErpUsers([])
      return
    }
    
    setLoadingUsers(true)
    try {
      // Use API wrapper for server script to get customers for specific branch
      const response = await fetch(`/api/erp/form-data?get_data=customer&branch_id=${encodeURIComponent(branchId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📦 [VOUCHER] Customer data response:', data)
        
        if (data.success && data.data && data.data.customers && Array.isArray(data.data.customers)) {
          // Convert customers to ERPUser format for compatibility
          const customers: ERPUser[] = data.data.customers.map((customer: any) => ({
            name: customer.name,
            email: customer.name, // Use name as email fallback
            full_name: customer.customer_name || customer.name,
            user_type: 'Customer'
          }))
          setErpUsers(customers)
          console.log('✅ [VOUCHER] Loaded customers for branch:', branchId, customers.length)
        } else if (data.success && data.data && data.data.customers && data.data.customers.error) {
          console.warn('⚠️ [VOUCHER] Customer fetch error:', data.data.customers.error)
          setErpUsers([])
        }
      }
    } catch (err) {
      console.error('❌ [VOUCHER] Failed to fetch customers:', err)
      setErpUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  // Fetch promo details
  const fetchPromoDetails = useCallback(async () => {
    if (!promoCode) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/erp/promo/${encodeURIComponent(promoCode)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch promo: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.promo) {
        setPromo(data.promo)
        console.log('🎯 [VOUCHER] Loaded promo:', data.promo)
      } else {
        setError('Promo not found')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch promo'
      console.error('❌ [VOUCHER] Promo fetch error:', errorMessage)
      setError(errorMessage)
      showToast.error('Failed to load promo', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [promoCode, showToast])

  // Fetch available items (filtered by brand if specified) - OPTIMIZED: Only fetch ONCE
  const fetchAvailableItems = useCallback(async () => {
    if (!promo || allItems.length > 0) return // Don't refetch if already have items
    
    setLoadingItems(true)

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
        // Store ALL items, don't filter yet - filtering happens in useMemo
        const activeItems = data.items.filter((item: SellableItem) => 
          !item.disabled && 
          (item.is_stock_item ? (item.stock_qty || 0) > 0 : true)
        )
        
        setAllItems(activeItems) // Set ALL items once
        console.log(`✅ [VOUCHER] Loaded ${activeItems.length} items total`)
      } else {
        setAllItems([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch items'
      console.error('❌ [VOUCHER] Items fetch error:', errorMessage)
      // Don't use showToast here to prevent re-renders
    } finally {
      setLoadingItems(false)
    }
  }, [promo, allItems.length]) // REMOVED showToast dependency

  // Initialize data
  useEffect(() => {
    fetchPromoDetails()
    fetchFormData() // Use new consolidated endpoint
  }, [fetchPromoDetails, fetchFormData])

  useEffect(() => {
    if (promo) {
      fetchAvailableItems()
    }
  }, [promo, fetchAvailableItems])

  // Fetch customers when branch is selected
  useEffect(() => {
    if (selectedBranch) {
      fetchCustomers(selectedBranch)
      // Clear previously selected user when branch changes
      setSelectedUser('')
    } else {
      setErpUsers([])
      setSelectedUser('')
    }
  }, [selectedBranch, fetchCustomers])

  // OPTIMIZED FILTERING - Using useMemo like catalog
  const filteredItems = useMemo(() => {
    let filtered = allItems

    // Brand filter - if promo has specific brand, match brand OR custom_subbrand
    if (promo?.brand && promo.brand.trim() !== '') {
      const promoBrand = promo.brand.toLowerCase()
      filtered = filtered.filter(item => {
        const itemBrand = item.brand?.toLowerCase() || ''
        const itemSubbrand = item.custom_subbrand?.toLowerCase() || ''
        
        return itemBrand.includes(promoBrand) ||
               itemBrand === promoBrand ||
               itemSubbrand.includes(promoBrand) ||
               itemSubbrand === promoBrand
      })
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(item =>
        item.item_name?.toLowerCase().includes(query) ||
        item.item_code?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.custom_subbrand?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [allItems, promo?.brand, searchQuery])

  // PAGINATION - Like catalog
  const totalItems = filteredItems.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

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

  // Filter items by search - REMOVED, now using useMemo above
  // const filteredItems = availableItems.filter(item =>
  //   searchQuery === '' ||
  //   item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   item.item_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  // )

  // Add item to cart - FIXED: Avoid setState in render by moving toast calls outside
  const addToCart = useCallback((item: SellableItem, quantity: number = 1) => {
    // Check if item can be added (stock check) - BEFORE any state updates
    const hasStockCheck = item.is_stock_item 
      ? selectedBranch 
        ? getStockForBranch(item, selectedBranch) > 0
        : (item.stock_qty || 0) > 0
      : true
      
    if (!hasStockCheck) {
      showToast.error(
        'Out of stock',
        selectedBranch 
          ? `This item is out of stock in branch ${selectedBranch}`
          : 'This item is out of stock'
      )
      return
    }

    // Get current cart total
    const currentCartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
    const currentRemainingValue = promo ? Math.max(0, promo.nilai - currentCartTotal) : 0
    
    const newSubtotal = item.price * quantity
    const potentialTotal = currentCartTotal + newSubtotal
    
    // Check if adding this item would exceed voucher value - BEFORE any state updates
    if (potentialTotal > (promo?.nilai || 0)) {
      const maxQuantity = Math.floor(currentRemainingValue / item.price)
      if (maxQuantity > 0) {
        showToast.warning(
          'Quantity adjusted', 
          `Maximum quantity for this item: ${maxQuantity} (to stay within voucher limit)`
        )
        quantity = maxQuantity
      } else {
        showToast.error(
          'Cannot add item', 
          `This item would exceed your voucher value`
        )
        return
      }
    }

    // Check stock quantity limit for selected branch - BEFORE any state updates
    if (selectedBranch && item.is_stock_item) {
      const availableStock = getStockForBranch(item, selectedBranch)
      if (quantity > availableStock) {
        showToast.warning(
          'Stock limited',
          `Only ${availableStock} items available in branch ${selectedBranch}`
        )
        quantity = Math.min(quantity, availableStock)
      }
    }

    // Now safely update cart state
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.item.item_code === item.item_code)
      
      if (existingItemIndex !== -1) {
        // Update existing item quantity
        const newCart = [...prevCart]
        const newQuantity = newCart[existingItemIndex].quantity + quantity
        
        // Check stock limit again for total quantity
        if (selectedBranch && item.is_stock_item) {
          const availableStock = getStockForBranch(item, selectedBranch)
          if (newQuantity > availableStock) {
            // Don't show toast here - would cause setState in render
            newCart[existingItemIndex] = {
              ...newCart[existingItemIndex],
              quantity: availableStock,
              subtotal: availableStock * item.price
            }
            return newCart
          }
        }
        
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newQuantity,
          subtotal: newQuantity * item.price
        }
        return newCart
      } else {
        // Add new item
        return [...prevCart, {
          item,
          quantity,
          subtotal: item.price * quantity
        }]
      }
    })
    
    // Show success toast AFTER state update
    showToast.success('Item added', `${item.item_name} added to selection`)
  }, [cart, promo, selectedBranch, showToast]) // Add cart to dependencies for current total

  // Remove item from cart - OPTIMIZED
  const removeFromCart = useCallback((itemCode: string) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item.item_code !== itemCode))
    showToast.success('Item removed', 'Item removed from selection')
  }, [showToast])

  // Update item quantity in cart - OPTIMIZED
  const updateCartItemQuantity = useCallback((itemCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemCode)
      return
    }

    setCart(prevCart => {
      const cartItem = prevCart.find(item => item.item.item_code === itemCode)
      if (!cartItem) return prevCart

      const newSubtotal = cartItem.item.price * newQuantity
      const otherItemsTotal = prevCart
        .filter(item => item.item.item_code !== itemCode)
        .reduce((sum, item) => sum + item.subtotal, 0)
      const potentialTotal = otherItemsTotal + newSubtotal

      // Check voucher limit
      if (potentialTotal > (promo?.nilai || 0)) {
        const maxQuantity = Math.floor((promo?.nilai || 0) - otherItemsTotal) / cartItem.item.price
        showToast.warning(
          'Quantity adjusted', 
          `Maximum quantity: ${Math.max(1, Math.floor(maxQuantity))} (voucher limit: ${formatCurrency(promo?.nilai || 0)})`
        )
        newQuantity = Math.max(1, Math.floor(maxQuantity))
      }

      return prevCart.map(item =>
        item.item.item_code === itemCode
          ? { ...item, quantity: newQuantity, subtotal: item.item.price * newQuantity }
          : item
      )
    })
  }, [removeFromCart, promo?.nilai, showToast, formatCurrency])

  // Submit voucher selection
  const handleSubmitSelection = async () => {
    if (cart.length === 0) {
      showToast.error('No items selected', 'Please select at least one item')
      return
    }

    if (isVoucherExceeded) {
      showToast.error('Voucher limit exceeded', `Total cannot exceed ${formatCurrency(promo?.nilai || 0)}`)
      return
    }

    // Validate required fields
    if (!selectedBranch) {
      showToast.error('Branch required', 'Please select a branch')
      return
    }

    if (!selectedSalesPerson) {
      showToast.error('Sales person required', 'Please select a sales person')
      return
    }

    if (!selectedUser) {
      showToast.error('Customer required', 'Please select a customer')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Here you would submit the selection to your backend
      const submissionData = {
        promoCode: promo?.kode,
        cartItems: cart,
        total: cartTotal,
        voucherValue: promo?.nilai,
        branch: selectedBranch,
        salesPerson: selectedSalesPerson,
        customerUser: selectedUser,
        priceList: priceList
      }
      
      console.log('🎯 [VOUCHER] Submitting selection:', submissionData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      showToast.success('Selection submitted', 'Your voucher selection has been processed')
      
      // Redirect or handle success
      router.push('/dashboard')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit selection'
      console.error('❌ [VOUCHER] Submit error:', errorMessage)
      showToast.error('Failed to submit', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check permissions
  const canUseVoucher = user?.permissions && user.permissions.length > 0

  if (!canUseVoucher) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-isabelline via-white to-champagne-50 dark:from-dark-bg dark:via-dark-surface dark:to-jet-800">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">
                Access Restricted
              </h2>
              <p className="text-jet-600 dark:text-gray-300">
                You need to be logged in to use vouchers.
              </p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
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
                    🎟️ Voucher Bebas Pilih
                  </h1>
                  {promo && (
                    <p className="text-sm text-white/90 mt-1">
                      {promo.kode} - {promo.nama}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Cart Summary */}
              <div className="text-right text-white">
                <div className="text-sm opacity-90">Voucher Value</div>
                <div className="text-lg font-bold">
                  {promo ? formatCurrency(promo.nilai) : '-'}
                </div>
                <div className={`text-sm ${isVoucherExceeded ? 'text-red-200' : 'text-green-200'}`}>
                  Used: {formatCurrency(cartTotal)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="inline-flex items-center text-asparagus-600 dark:text-asparagus-400">
              <div className="animate-spin h-8 w-8 border-4 border-asparagus-200 dark:border-asparagus-800 border-t-asparagus-600 dark:border-t-asparagus-400 rounded-full mr-4" />
              <span className="text-lg font-medium">Loading voucher...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center max-w-md">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                Voucher Not Found
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && promo && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Items Selection */}
              <div className="lg:col-span-2 space-y-6">
                {/* Search Bar */}
                <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4 border border-champagne-200 dark:border-dark-border">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items by name, code, brand, or subbrand..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                  />
                  {promo.brand && (
                    <p className="text-sm text-jet-600 dark:text-gray-300 mt-2">
                      <Badge variant="secondary" size="sm">{promo.brand}</Badge>
                      <span className="ml-2">Items filtered by voucher brand</span>
                    </p>
                  )}
                </div>

                {/* Form Fields */}
                <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4 border border-champagne-200 dark:border-dark-border">
                  <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4">
                    Order Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Branch Selection */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                        Branch <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                        required
                      >
                        <option value="">Select Branch</option>
                        {branches.map((branch) => (
                          <option key={branch.value} value={branch.value}>
                            {branch.label}
                          </option>
                        ))}
                      </select>
                      {loadingBranches && (
                        <p className="text-xs text-gray-500 mt-1">Loading branches...</p>
                      )}
                    </div>

                    {/* Sales Person Selection */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                        Sales Person <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedSalesPerson}
                        onChange={(e) => setSelectedSalesPerson(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                        required
                      >
                        <option value="">Select Sales Person</option>
                        {salesPersons.map((sales) => (
                          <option key={sales.name} value={sales.name}>
                            {sales.sales_person_name} {sales.employee_name && `(${sales.employee_name})`}
                          </option>
                        ))}
                      </select>
                      {loadingSales && (
                        <p className="text-xs text-gray-500 mt-1">Loading sales persons...</p>
                      )}
                    </div>

                    {/* User Selection */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                        Customer <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                        required
                        disabled={!selectedBranch}
                      >
                        <option value="">
                          {!selectedBranch ? 'Select Branch First' : 'Select Customer'}
                        </option>
                        {erpUsers.map((user) => (
                          <option key={user.name} value={user.name}>
                            {user.full_name} ({user.name})
                          </option>
                        ))}
                      </select>
                      {loadingUsers && (
                        <p className="text-xs text-gray-500 mt-1">Loading customers...</p>
                      )}
                      {selectedBranch && erpUsers.length === 0 && !loadingUsers && (
                        <p className="text-xs text-yellow-600 mt-1">No customers found for this branch</p>
                      )}
                    </div>

                    {/* Price List (Disabled) */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                        Price List
                      </label>
                      <input
                        type="text"
                        value={priceList}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Validation Messages */}
                  {(!selectedBranch || !selectedSalesPerson || !selectedUser) && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        ⚠️ Please fill in all required fields (Branch, Sales Person, Customer) before adding items
                      </p>
                    </div>
                  )}

                  {selectedBranch && !selectedUser && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        � Select a customer from branch <strong>{selectedBranch}</strong> to continue
                      </p>
                    </div>
                  )}

                  {selectedBranch && selectedUser && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        �📍 Stock quantities shown for branch: <strong>{selectedBranch}</strong><br/>
                        👤 Customer: <strong>{erpUsers.find(u => u.name === selectedUser)?.full_name}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* Items Grid */}
                <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-champagne-200 dark:border-dark-border">
                  <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                    <h2 className="text-lg font-semibold text-jet-800 dark:text-white">
                      Available Items
                      {loadingItems && (
                        <div className="inline-block ml-2 animate-spin h-4 w-4 border-2 border-asparagus-600 border-t-transparent rounded-full" />
                      )}
                    </h2>
                    <p className="text-sm text-jet-600 dark:text-gray-300">
                      {totalItems} items available {filteredItems.length !== allItems.length && `(filtered from ${allItems.length})`}
                    </p>
                  </div>
                  
                  <div className="p-4">
                    {loadingItems ? (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center text-asparagus-600 dark:text-asparagus-400">
                          <div className="animate-spin h-6 w-6 border-2 border-asparagus-600 border-t-transparent rounded-full mr-2" />
                          Loading items...
                        </div>
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-4">
                          <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                          No Items Found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchQuery ? 'Try adjusting your search terms.' : 'No items available for this voucher.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Pagination Info */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-sm text-gray-500">
                            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
                          </div>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value))
                              setCurrentPage(1)
                            }}
                            className="px-3 py-1 border border-gray-300 dark:border-dark-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                          >
                            <option value={6}>6 per page</option>
                            <option value={12}>12 per page</option>
                            <option value={24}>24 per page</option>
                            <option value={48}>48 per page</option>
                          </select>
                        </div>

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
  {currentItems.map((item) => {
    const imageUrl = getImageUrl(item.image)
    const maxQuantity = Math.floor(remainingVoucherValue / item.price)
    const hasStock = canAddItem(item)
    const branchStock = selectedBranch ? getStockForBranch(item, selectedBranch) : (item.stock_qty || 0)
    const canAdd = remainingVoucherValue >= item.price && hasStock && selectedBranch && selectedSalesPerson && selectedUser && branchStock > 0
    
    return (
      <div key={item.item_code} className={`relative border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:shadow-md transition-shadow ${!hasStock ? 'opacity-60' : ''}`}>
        {/* Stock Badge - UPDATED */}
        {!hasStock && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="error" size="sm">Out of Stock</Badge>
          </div>
        )}
        
        {/* Item Image */}
        <div className="aspect-square bg-gradient-to-br from-asparagus-100 to-asparagus-200 dark:from-asparagus-800 dark:to-asparagus-900 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={item.item_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="text-asparagus-600 dark:text-asparagus-300 text-center">
              <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-xs text-gray-500">No image</p>
            </div>
          )}
        </div>

        {/* Item Info */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-gray-500">{item.item_code}</div>
          <h3 className="font-medium text-sm text-jet-800 dark:text-white line-clamp-2">
            {item.item_name}
          </h3>
          
          <div className="flex flex-wrap gap-1">
            {item.brand && <Badge variant="secondary" size="xs">{item.brand}</Badge>}
            {item.custom_subbrand && <Badge variant="outline" size="xs">{item.custom_subbrand}</Badge>}
            <Badge variant="outline" size="xs">{item.item_group}</Badge>
          </div>

          <div className="text-lg font-bold text-asparagus-700 dark:text-asparagus-400">
            {formatCurrency(item.price)}
            <span className="text-xs text-gray-500 font-normal">/{item.stock_uom}</span>
          </div>

          {/* Stock Information - MOVED BELOW PRICE */}
          <div className="text-xs">
            {selectedBranch ? (
              <p className={`font-medium ${
                branchStock === 0 ? 'text-red-600 dark:text-red-400' :
                branchStock <= 10 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-green-600 dark:text-green-400'
              }`}>
                📦 {selectedBranch}: {branchStock.toLocaleString()} units
              </p>
            ) : (
              <p className={`font-medium ${
                (item.stock_qty || 0) === 0 ? 'text-red-600 dark:text-red-400' :
                (item.stock_qty || 0) <= 10 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-green-600 dark:text-green-400'
              }`}>
                📦 Total: {(item.stock_qty || 0).toLocaleString()} units
              </p>
            )}
          </div>

          {/* Add to Cart Button - FIXED VALIDATION */}
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addToCart(item)
            }}
            disabled={!canAdd || !hasStock || branchStock === 0}
            size="sm"
            className="w-full"
            variant={canAdd && hasStock && branchStock > 0 ? "primary" : "outline"}
            type="button"
          >
            {branchStock === 0 ? (
              'Out of Stock'
            ) : !hasStock ? (
              'Out of Stock'
            ) : !selectedBranch || !selectedSalesPerson || !selectedUser ? (
              'Fill required fields'
            ) : remainingVoucherValue < item.price ? (
              'Exceeds voucher value'
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add to Selection
              </>
            )}
          </Button>
          
          {/* Voucher Limit Warning */}
          {maxQuantity > 0 && maxQuantity < 10 && hasStock && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Max: {Math.min(maxQuantity, branchStock)} items (voucher limit)
            </p>
          )}
        </div>
      </div>
    )
  })}
</div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center">
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <Button
                              onClick={goToPreviousPage}
                              disabled={currentPage === 1}
                              variant="outline"
                              size="sm"
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-dark-border"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </Button>
                            
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
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-dark-border"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Button>
                          </nav>
                        </div>
                      )}
                    </>
                    )}
                  </div>
                </div>
              </div>

              {/* Cart/Selection Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* Voucher Info */}
                  <div className="bg-gradient-to-br from-asparagus-100 to-asparagus-200 dark:from-asparagus-800 dark:to-asparagus-900 rounded-lg p-4 border border-asparagus-300 dark:border-asparagus-600">
                    <h3 className="font-semibold text-asparagus-800 dark:text-asparagus-200 mb-2">
                      Voucher Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-asparagus-700 dark:text-asparagus-300">Code:</span>
                        <span className="font-mono font-medium text-asparagus-800 dark:text-asparagus-200">{promo.kode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-asparagus-700 dark:text-asparagus-300">Value:</span>
                        <span className="font-bold text-asparagus-800 dark:text-asparagus-200">{formatCurrency(promo.nilai)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-asparagus-700 dark:text-asparagus-300">Expires:</span>
                        <span className="text-asparagus-800 dark:text-asparagus-200">{new Date(promo.expired).toLocaleDateString('id-ID')}</span>
                      </div>
                      {promo.brand && (
                        <div className="flex justify-between">
                          <span className="text-asparagus-700 dark:text-asparagus-300">Brand:</span>
                          <Badge variant="secondary" size="sm">{promo.brand}</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Free Items Info */}
                  {promo.free_items && promo.free_items.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        Free Items Included
                      </h3>
                      <div className="space-y-2">
                        {promo.free_items.map((freeItem, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white/50 dark:bg-black/20 rounded">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                                {freeItem.item_name}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-300 font-mono">
                                {freeItem.item_code}
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                                {freeItem.qty} {freeItem.stock_uom}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400">
                                Worth {formatCurrency(freeItem.total_price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                        <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                          💡 These items will be automatically added to your order when you confirm your selection
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cart */}
                  <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-champagne-200 dark:border-dark-border">
                    <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                      <h3 className="font-semibold text-jet-800 dark:text-white">
                        Your Selection ({cart.length})
                      </h3>
                    </div>

                    <div className="p-4">
                      {cart.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <p className="text-gray-500 text-sm">No items selected</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {cart.map((cartItem) => (
                            <div key={cartItem.item.item_code} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-jet-900/50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-jet-800 dark:text-white truncate">
                                  {cartItem.item.item_name}
                                </h4>
                                <p className="text-xs text-gray-500 font-mono">{cartItem.item.item_code}</p>
                                <p className="text-sm font-semibold text-asparagus-700 dark:text-asparagus-400">
                                  {formatCurrency(cartItem.subtotal)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-3">
                                <Button
                                  onClick={() => updateCartItemQuantity(cartItem.item.item_code, cartItem.quantity - 1)}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                >
                                  -
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">{cartItem.quantity}</span>
                                <Button
                                  onClick={() => updateCartItemQuantity(cartItem.item.item_code, cartItem.quantity + 1)}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  disabled={cartTotal + cartItem.item.price > promo.nilai}
                                >
                                  +
                                </Button>
                                <Button
                                  onClick={() => removeFromCart(cartItem.item.item_code)}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cart Summary */}
                    {cart.length > 0 && (
                      <div className="p-4 border-t border-gray-200 dark:border-dark-border">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-jet-600 dark:text-gray-300">Total Selected:</span>
                            <span className="font-semibold text-jet-800 dark:text-white">
                              {formatCurrency(cartTotal)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-jet-600 dark:text-gray-300">Remaining:</span>
                            <span className={`font-semibold ${
                              isVoucherExceeded 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {formatCurrency(remainingVoucherValue)}
                            </span>
                          </div>
                        </div>

                        {isVoucherExceeded && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-xs text-red-700 dark:text-red-300">
                              Selection exceeds voucher value. Please reduce quantities.
                            </p>
                          </div>
                        )}

                        <Button
                          onClick={handleSubmitSelection}
                          disabled={cart.length === 0 || isVoucherExceeded || isSubmitting}
                          className="w-full mt-4"
                          size="lg"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Confirm Selection
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}