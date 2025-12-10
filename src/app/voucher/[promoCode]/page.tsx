'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/Modal'
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
  const [selectedVoucherType, setSelectedVoucherType] = useState<string>('') // BBP-TKO or BBP-SLN
  const [priceList] = useState<string>('HET PRICE') // Fixed value, disabled
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [loading, setLoading] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Search states for dropdowns
  const [salesPersonSearch, setSalesPersonSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [salesPersonDropdownOpen, setSalesPersonDropdownOpen] = useState(false)
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)

  // Voucher type options
  const voucherTypeOptions = [
    { value: 'BBP-TKO-.YYYY.-', label: 'Toko', description: 'Bebas Pilih untuk Toko' },
    { value: 'BBP-SLN-.YYYY.-', label: 'Salon', description: 'Bebas Pilih untuk Salon' }
  ]

  // Dropdown options
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([])
  const [erpUsers, setErpUsers] = useState<ERPUser[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [loadingSales, setLoadingSales] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // 🔒 Auto-select branch if user has only 1 allowed branch
  useEffect(() => {
    if (user?.allowed_branches && user.allowed_branches.length === 1) {
      const singleBranch = user.allowed_branches[0]
      setSelectedBranch(singleBranch)
      console.log('🔒 [VOUCHER] Auto-selected single allowed branch:', singleBranch)
    }
  }, [user?.allowed_branches])

  // Calculate totals
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const remainingVoucherValue = promo ? Math.max(0, promo.nilai - cartTotal) : 0
  
  // Validation tolerances:
  // - Upper limit: Can exceed voucher value by max 20,000 (tolerance)
  // - Lower limit: Must be at least (voucher value - 100,000)
  const UPPER_TOLERANCE = 25000 // Can go 25k above voucher value
  const LOWER_TOLERANCE = 100000 // Must be at least 100k below voucher value
  const maxAllowedTotal = (promo?.nilai || 0) + UPPER_TOLERANCE
  const minRequiredTotal = (promo?.nilai || 0) - LOWER_TOLERANCE
  
  const isVoucherExceeded = cartTotal > maxAllowedTotal
  const isBelowMinimum = cartTotal < minRequiredTotal && cartTotal > 0

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

  // Get REMAINING stock after considering items in cart
  const getRemainingStock = (item: SellableItem, branch: string): number => {
    const totalStock = getStockForBranch(item, branch)
    const cartItem = cart.find(ci => ci.item.item_code === item.item_code)
    const qtyInCart = cartItem ? cartItem.quantity : 0
    return Math.max(0, totalStock - qtyInCart)
  }

  // Check if item can be added (has stock in selected branch)
const canAddItem = (item: SellableItem): boolean => {
  if (!item.is_stock_item) return true // Service items always available
  
  if (!selectedBranch) {
    // No branch selected, check total stock
    return (item.stock_qty || 0) > 0
  }
  
  // Check REMAINING stock for selected branch (after cart)
  const remainingStock = getRemainingStock(item, selectedBranch)
  return remainingStock > 0
}


  // Fetch form data using new server script endpoint
  const fetchFormData = useCallback(async () => {
    if (branches.length > 0 && salesPersons.length > 0) {
      console.log('🔄 [VOUCHER_FORM] Form data already loaded, skipping fetch')
      return // Don't refetch if already have data
    }
    
    console.log('📋 [VOUCHER_FORM] Fetching form data (branches, sales persons, price lists)...')
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

      console.log('📡 [VOUCHER_FORM] Form data API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📦 [VOUCHER_FORM] Form data response:', JSON.stringify(data, null, 2))
        
        if (data.success && data.data) {
          // Set branches
          if (data.data.branches && Array.isArray(data.data.branches)) {
            let branchOptions: BranchOption[] = data.data.branches.map((branch: any) => ({
              value: branch.name,
              label: branch.branch || branch.name
            }))
            
            // 🔒 Filter branches by user's allowed_branches
            if (user?.allowed_branches && user.allowed_branches.length > 0) {
              branchOptions = branchOptions.filter(b => user.allowed_branches!.includes(b.value))
              console.log('🔒 [VOUCHER] Filtered branches by allowed_branches:', branchOptions.length)
            }
            
            setBranches(branchOptions)
            console.log('✅ [VOUCHER_FORM] Loaded branches from server script:', branchOptions.length)
            console.log('📍 [VOUCHER_FORM] Branch details:', branchOptions.map(b => ({ value: b.value, label: b.label })))
          }
          
          // Set sales persons
          if (data.data.sales_persons && Array.isArray(data.data.sales_persons)) {
            setSalesPersons(data.data.sales_persons)
            console.log('✅ [VOUCHER_FORM] Loaded sales persons from server script:', data.data.sales_persons.length)
            console.log('👥 [VOUCHER_FORM] Sales person details:', data.data.sales_persons.map((sp: any) => ({ 
              name: sp.name, 
              sales_person_name: sp.sales_person_name,
              employee_name: sp.employee_name 
            })))
          }
          
          // Note: price_list is available in data.data.price_lists if needed later
          if (data.data.price_lists) {
            console.log('💰 [VOUCHER_FORM] Available price lists:', data.data.price_lists.length)
          }
        }
      } else {
        console.error('❌ [VOUCHER_FORM] Failed to fetch form data:', response.status, response.statusText)
        console.log('🔄 [VOUCHER_FORM] Falling back to stock levels for branches...')
        // Fallback to stock levels for branches if server script fails
        await fetchBranchesFromStock()
      }
    } catch (err) {
      console.error('❌ [VOUCHER_FORM] Error fetching form data:', err)
      console.error('❌ [VOUCHER_FORM] Error stack:', err instanceof Error ? err.stack : 'No stack')
      console.log('🔄 [VOUCHER_FORM] Falling back to stock levels for branches...')
      // Fallback to stock levels for branches if server script fails
      await fetchBranchesFromStock()
    } finally {
      setLoadingBranches(false)
      setLoadingSales(false)
      console.log('🏁 [VOUCHER_FORM] Form data fetch completed')
    }
  }, []) // REMOVED dependencies to prevent re-renders

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
          
          let branchOptions: BranchOption[] = Array.from(branchSet)
            .sort()
            .map(branch => ({
              value: branch,
              label: branch
            }))
          
          // 🔒 Filter branches by user's allowed_branches
          if (user?.allowed_branches && user.allowed_branches.length > 0) {
            branchOptions = branchOptions.filter(b => user.allowed_branches!.includes(b.value))
            console.log('🔒 [VOUCHER] Filtered fallback branches by allowed_branches:', branchOptions.length)
          }
          
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
      console.log('🏢 [VOUCHER_CUSTOMERS] No branch selected, clearing customers')
      setErpUsers([])
      return
    }
    
    console.log('👥 [VOUCHER_CUSTOMERS] Fetching customers for branch:', branchId)
    setLoadingUsers(true)
    
    try {
      // 🔒 Use same customer endpoint as customer list page - filtered by branch
      const response = await fetch(`/api/erp/customers?branch=${encodeURIComponent(branchId)}&limit=1000`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 [VOUCHER_CUSTOMERS] Customer API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📦 [VOUCHER_CUSTOMERS] Customer data response:', data.success ? `${data.customers?.length || 0} customers` : 'error')
        
        if (data.success && Array.isArray(data.customers)) {
          // Convert customers to ERPUser format for compatibility
          const customers: ERPUser[] = data.customers.map((customer: any) => ({
            name: customer.name,
            email: customer.email_id || customer.name,
            full_name: customer.customer_name || customer.name,
            user_type: 'Customer'
          }))
          setErpUsers(customers)
          console.log('✅ [VOUCHER_CUSTOMERS] Loaded customers for branch:', branchId, customers.length)
          console.log('👤 [VOUCHER_CUSTOMERS] Sample customers:', customers.slice(0, 3).map(c => ({ 
            name: c.name, 
            full_name: c.full_name,
            branch: branchId
          })))
        } else {
          console.warn('⚠️ [VOUCHER_CUSTOMERS] Unexpected customer data structure or empty results')
          setErpUsers([])
        }
      } else {
        console.error('❌ [VOUCHER_CUSTOMERS] Customer API request failed:', response.status, response.statusText)
        setErpUsers([])
      }
    } catch (err) {
      console.error('❌ [VOUCHER_CUSTOMERS] Failed to fetch customers:', err)
      console.error('❌ [VOUCHER_CUSTOMERS] Error stack:', err instanceof Error ? err.stack : 'No stack')
      setErpUsers([])
    } finally {
      setLoadingUsers(false)
      console.log('🏁 [VOUCHER_CUSTOMERS] Customer fetch completed for branch:', branchId)
    }
  }, [])

  // Fetch promo details
  const fetchPromoDetails = useCallback(async () => {
    if (!promoCode) {
      console.warn('⚠️ [VOUCHER_PROMO] No promo code provided')
      return
    }
    
    console.log('🎯 [VOUCHER_PROMO] Fetching promo details for:', promoCode)
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

      console.log('📡 [VOUCHER_PROMO] API Response status:', response.status)

      if (!response.ok) {
        throw new Error(`Failed to fetch promo: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📦 [VOUCHER_PROMO] API Response data:', JSON.stringify(data, null, 2))
      
      if (data.success && data.promo) {
        setPromo(data.promo)
        console.log('✅ [VOUCHER_PROMO] Promo loaded successfully:', {
          kode: data.promo.kode,
          nama: data.promo.nama,
          nilai: data.promo.nilai,
          brand: data.promo.brand,
          expired: data.promo.expired,
          freeItemsCount: data.promo.free_items?.length || 0
        })
      } else {
        console.error('❌ [VOUCHER_PROMO] Promo not found in response')
        setError('Promo not found')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch promo'
      console.error('❌ [VOUCHER_PROMO] Fetch error:', errorMessage)
      console.error('❌ [VOUCHER_PROMO] Error stack:', err instanceof Error ? err.stack : 'No stack')
      setError(errorMessage)
      showToast.error('Failed to load promo', errorMessage)
    } finally {
      setLoading(false)
      console.log('🏁 [VOUCHER_PROMO] Promo fetch completed')
    }
  }, [promoCode]) // REMOVED showToast dependency

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
  }, [promo?.kode]) // FIXED: Only depend on promo code, not entire promo object

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
    console.log('🔄 [VOUCHER_EFFECT] Branch selection changed:', selectedBranch)
    
    if (selectedBranch) {
      console.log('🏢 [VOUCHER_EFFECT] Fetching customers for new branch:', selectedBranch)
      fetchCustomers(selectedBranch)
      
      // Clear previously selected user when branch changes
      if (selectedUser) {
        console.log('👤 [VOUCHER_EFFECT] Clearing previously selected user:', selectedUser)
        setSelectedUser('')
      }
    } else {
      console.log('🏢 [VOUCHER_EFFECT] No branch selected, clearing customers and user')
      setErpUsers([])
      setSelectedUser('')
    }
  }, [selectedBranch, fetchCustomers])

  // Log state changes for debugging
  useEffect(() => {
    console.log('🛒 [VOUCHER_STATE] Cart updated:', {
      itemCount: cart.length,
      totalValue: cartTotal,
      items: cart.map(item => ({
        code: item.item.item_code,
        name: item.item.item_name,
        qty: item.quantity,
        subtotal: item.subtotal
      }))
    })
  }, [cart, cartTotal])

  useEffect(() => {
    console.log('🎯 [VOUCHER_STATE] Promo state updated:', promo ? {
      kode: promo.kode,
      nama: promo.nama,
      nilai: promo.nilai,
      brand: promo.brand,
      expired: promo.expired,
      freeItemsCount: promo.free_items?.length || 0
    } : 'No promo loaded')
  }, [promo])

  useEffect(() => {
    console.log('📝 [VOUCHER_STATE] Form selections updated:', {
      voucherType: selectedVoucherType,
      branch: selectedBranch,
      salesPerson: selectedSalesPerson,
      customer: selectedUser,
      priceList: priceList
    })
  }, [selectedVoucherType, selectedBranch, selectedSalesPerson, selectedUser, priceList])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Close sales person dropdown if clicking outside
      if (salesPersonDropdownOpen && !target.closest('[data-dropdown="sales-person"]')) {
        setSalesPersonDropdownOpen(false)
        console.log('👥 [VOUCHER_UI] Sales person dropdown closed')
      }
      
      // Close customer dropdown if clicking outside
      if (customerDropdownOpen && !target.closest('[data-dropdown="customer"]')) {
        setCustomerDropdownOpen(false)
        console.log('👤 [VOUCHER_UI] Customer dropdown closed')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [salesPersonDropdownOpen, customerDropdownOpen])

  // Clear customer search when branch changes
  useEffect(() => {
    if (selectedBranch) {
      setCustomerSearch('')
      setCustomerDropdownOpen(false)
      console.log('🏢 [VOUCHER_UI] Branch changed, clearing customer search')
    }
  }, [selectedBranch])

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

  // FILTERED DROPDOWN DATA - Search functionality for large datasets
  const filteredSalesPersons = useMemo(() => {
    if (!salesPersonSearch.trim()) return salesPersons
    
    const query = salesPersonSearch.toLowerCase()
    return salesPersons.filter(person =>
      person.sales_person_name?.toLowerCase().includes(query) ||
      person.employee_name?.toLowerCase().includes(query) ||
      person.name?.toLowerCase().includes(query)
    )
  }, [salesPersons, salesPersonSearch])

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return erpUsers
    
    const query = customerSearch.toLowerCase()
    return erpUsers.filter(customer =>
      customer.full_name?.toLowerCase().includes(query) ||
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    )
  }, [erpUsers, customerSearch])

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
    
    // Check if adding this item would exceed voucher value + tolerance (25k) - BEFORE any state updates
    const UPPER_TOLERANCE = 25000
    const maxAllowed = (promo?.nilai || 0) + UPPER_TOLERANCE
    if (potentialTotal > maxAllowed) {
      const maxRemaining = maxAllowed - currentCartTotal
      const maxQuantity = Math.floor(maxRemaining / item.price)
      if (maxQuantity > 0) {
        showToast.warning(
          'Quantity adjusted', 
          `Maximum quantity for this item: ${maxQuantity} (voucher limit + 20k tolerance)`
        )
        quantity = maxQuantity
      } else {
        showToast.error(
          'Cannot add item', 
          `This item would exceed voucher limit (max: ${formatCurrency(maxAllowed)})`
        )
        return
      }
    }

    // Check REMAINING stock quantity limit for selected branch - BEFORE any state updates
    if (selectedBranch && item.is_stock_item) {
      const remainingStock = getRemainingStock(item, selectedBranch)
      if (remainingStock === 0) {
        showToast.error(
          'Out of stock',
          `This item is already in your cart and no more stock available in branch ${selectedBranch}`
        )
        return
      }
      if (quantity > remainingStock) {
        showToast.warning(
          'Stock limited',
          `Only ${remainingStock} more items available in branch ${selectedBranch}`
        )
        quantity = Math.min(quantity, remainingStock)
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
          const totalStock = getStockForBranch(item, selectedBranch)
          if (newQuantity > totalStock) {
            // Don't show toast here - would cause setState in render
            newCart[existingItemIndex] = {
              ...newCart[existingItemIndex],
              quantity: totalStock,
              subtotal: totalStock * item.price
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
  }, [cart, promo?.nilai, selectedBranch]) // REMOVED showToast from dependencies

  // Remove item from cart - OPTIMIZED
  const removeFromCart = useCallback((itemCode: string) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item.item_code !== itemCode))
    showToast.success('Item removed', 'Item removed from selection')
  }, []) // REMOVED showToast dependency

  // Update item quantity in cart - OPTIMIZED
  const updateCartItemQuantity = useCallback((itemCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemCode)
      return
    }

    setCart(prevCart => {
      const cartItem = prevCart.find(item => item.item.item_code === itemCode)
      if (!cartItem) return prevCart

      // Check stock limit FIRST if item is stock item and branch is selected
      if (selectedBranch && cartItem.item.is_stock_item) {
        const totalStock = getStockForBranch(cartItem.item, selectedBranch)
        if (newQuantity > totalStock) {
          showToast.warning(
            'Stock limited',
            `Only ${totalStock} items available in branch ${selectedBranch}. Maximum quantity reached.`
          )
          newQuantity = totalStock
          // If no stock available, remove item
          if (totalStock === 0) {
            removeFromCart(itemCode)
            return prevCart
          }
        }
      }

      const newSubtotal = cartItem.item.price * newQuantity
      const otherItemsTotal = prevCart
        .filter(item => item.item.item_code !== itemCode)
        .reduce((sum, item) => sum + item.subtotal, 0)
      const potentialTotal = otherItemsTotal + newSubtotal

      // Check voucher limit + tolerance (25k)
      const UPPER_TOLERANCE = 25000
      const maxAllowed = (promo?.nilai || 0) + UPPER_TOLERANCE
      if (potentialTotal > maxAllowed) {
        const maxQuantity = Math.floor((maxAllowed - otherItemsTotal) / cartItem.item.price)
        showToast.warning(
          'Quantity adjusted', 
          `Maximum quantity: ${Math.max(1, Math.floor(maxQuantity))} (voucher limit + 20k tolerance: ${formatCurrency(maxAllowed)})`
        )
        newQuantity = Math.max(1, Math.floor(maxQuantity))
      }

      return prevCart.map(item =>
        item.item.item_code === itemCode
          ? { ...item, quantity: newQuantity, subtotal: item.item.price * newQuantity }
          : item
      )
    })
  }, [removeFromCart, promo?.nilai, selectedBranch]) // Added selectedBranch dependency

  // Show confirmation modal before submit
  const handleSubmitSelection = async () => {
    console.log('🎯 [VOUCHER_SUBMIT] Validating before showing confirmation...')
    
    if (cart.length === 0) {
      console.warn('⚠️ [VOUCHER_SUBMIT] No items in cart')
      showToast.error('No items selected', 'Please select at least one item')
      return
    }

    if (isVoucherExceeded) {
      const maxAllowed = (promo?.nilai || 0) + 25000
      console.warn('⚠️ [VOUCHER_SUBMIT] Voucher limit exceeded:', { cartTotal, voucherValue: promo?.nilai, maxAllowed })
      showToast.error('Voucher limit exceeded', `Total cannot exceed ${formatCurrency(maxAllowed)} (voucher + 25k tolerance)`)
      return
    }

    if (isBelowMinimum) {
      const minRequired = (promo?.nilai || 0) - 100000
      console.warn('⚠️ [VOUCHER_SUBMIT] Below minimum value:', { cartTotal, voucherValue: promo?.nilai, minRequired })
      showToast.error('Below minimum value', `Total must be at least ${formatCurrency(minRequired)} (voucher - 100k)`)
      return
    }

    // Validate required fields
    console.log('🔍 [VOUCHER_SUBMIT] Validating required fields...')
    const validationErrors = []
    
    if (!selectedVoucherType) {
      validationErrors.push('Voucher type is required')
      console.error('❌ [VOUCHER_SUBMIT] Missing voucher type')
    }
    
    if (!selectedBranch) {
      validationErrors.push('Branch is required')
      console.error('❌ [VOUCHER_SUBMIT] Missing branch')
    }

    if (!selectedSalesPerson) {
      validationErrors.push('Sales person is required') 
      console.error('❌ [VOUCHER_SUBMIT] Missing sales person')
    }

    if (!selectedUser) {
      validationErrors.push('Customer is required')
      console.error('❌ [VOUCHER_SUBMIT] Missing customer')
    }

    if (validationErrors.length > 0) {
      console.error('❌ [VOUCHER_SUBMIT] Validation failed:', validationErrors)
      showToast.error('Required fields missing', validationErrors.join(', '))
      return
    }

    console.log('✅ [VOUCHER_SUBMIT] All validation passed - showing confirmation modal')
    setShowConfirmModal(true)
  }

  // Actual submission after confirmation
  const handleConfirmedSubmit = async () => {
    console.log('🎯 [VOUCHER_SUBMIT] Starting confirmed voucher submission...')
    setIsSubmitting(true)
    setShowConfirmModal(false)
    
    try {
      // Prepare submission data
      const submissionData = {
        promoCode: promo?.kode,
        cartItems: cart,
        total: cartTotal,
        voucherValue: promo?.nilai,
        voucherType: selectedVoucherType, // Include selected voucher type
        branch: selectedBranch,
        salesPerson: selectedSalesPerson,
        customerUser: selectedUser,
        priceList: priceList,
        promo: promo, // Include full promo data
        freeItems: promo?.free_items || [] // Include free items
      }
      
      console.log('📦 [VOUCHER_SUBMIT] Submission data prepared:', JSON.stringify(submissionData, null, 2))
      console.log('🛒 [VOUCHER_SUBMIT] Cart summary:', {
        itemCount: cart.length,
        totalValue: cartTotal,
        voucherValue: promo?.nilai,
        voucherType: selectedVoucherType,
        remainingValue: promo?.nilai ? promo.nilai - cartTotal : 0
      })

      // Submit to new Form Bebas Pilih API endpoint
      console.log('📤 [VOUCHER_SUBMIT] Calling Form Bebas Pilih API...')
      const response = await fetch('/api/erp/form-bebas-pilih', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      console.log('📡 [VOUCHER_SUBMIT] API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ [VOUCHER_SUBMIT] API request failed:', response.status, response.statusText)
        console.error('❌ [VOUCHER_SUBMIT] Error details:', errorData)
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📦 [VOUCHER_SUBMIT] API Response data:', JSON.stringify(data, null, 2))
      
      if (data.success) {
        console.log('✅ [VOUCHER_SUBMIT] Form Bebas Pilih created successfully!')
        console.log('🆔 [VOUCHER_SUBMIT] Document name:', data.data?.name)
        console.log('📊 [VOUCHER_SUBMIT] Document status:', data.data?.status)
        console.log('💰 [VOUCHER_SUBMIT] Total value:', data.data?.total_harga)
        console.log('📦 [VOUCHER_SUBMIT] Items count:', data.data?.items_count)
        console.log('🎁 [VOUCHER_SUBMIT] Free items count:', data.data?.free_items_count)
        
        // Log bridging callback result
        if (data.bridging) {
          console.log('🌉 [VOUCHER_SUBMIT] Bridging callback result:', data.bridging)
          if (data.bridging.success) {
            console.log('✅ [VOUCHER_SUBMIT] Bridging to mobile apps successful')
          } else {
            console.warn('⚠️ [VOUCHER_SUBMIT] Bridging to mobile apps failed:', data.bridging.error)
          }
        }
        
        showToast.success(
          'Voucher approved and processed successfully!', 
          `Document ${data.data?.name} approved and queued for mobile apps${
            data.bridging?.success ? ' ✅' : ' (bridging failed ⚠️)'
          }`
        )
        
        // Clear cart after successful submission
        setCart([])
        
        // Redirect to success page or dashboard
        router.push('/dashboard?voucher_success=true')
        
      } else {
        console.error('❌ [VOUCHER_SUBMIT] Submission failed:', data.error)
        console.error('❌ [VOUCHER_SUBMIT] Submitted data:', data.submittedData)
        
        showToast.error(
          'Submission failed', 
          data.error || 'Unknown error occurred'
        )
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit voucher selection'
      console.error('❌ [VOUCHER_SUBMIT] Submit error:', errorMessage)
      console.error('❌ [VOUCHER_SUBMIT] Error details:', err)
      
      showToast.error('Failed to submit', errorMessage)
    } finally {
      setIsSubmitting(false)
      console.log('🏁 [VOUCHER_SUBMIT] Submission process completed')
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
                    {/* Voucher Type Selection */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                        Voucher Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedVoucherType}
                        onChange={(e) => {
                          setSelectedVoucherType(e.target.value)
                          console.log('🎟️ [VOUCHER_UI] Voucher type selected:', e.target.value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                        required
                      >
                        <option value="">Select Voucher Type</option>
                        {voucherTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label} - {option.description}
                          </option>
                        ))}
                      </select>
                      {selectedVoucherType && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ Selected: {voucherTypeOptions.find(opt => opt.value === selectedVoucherType)?.label} 
                          <span className="text-gray-500 ml-1">
                            ({selectedVoucherType})
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Branch Selection */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                        Branch <span className="text-red-500">*</span>
                        {user?.allowed_branches && user.allowed_branches.length === 1 && (
                          <span className="text-xs text-asparagus-600 dark:text-asparagus-400 ml-2">(Auto-selected)</span>
                        )}
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        disabled={user?.allowed_branches && user.allowed_branches.length === 1}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
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

                    {/* Sales Person Selection - SEARCHABLE */}
                    <div data-dropdown="sales-person">
                      <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                        Sales Person <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={salesPersonSearch}
                          onChange={(e) => {
                            setSalesPersonSearch(e.target.value)
                            setSalesPersonDropdownOpen(true)
                          }}
                          onFocus={() => setSalesPersonDropdownOpen(true)}
                          placeholder={selectedSalesPerson ? 
                            salesPersons.find(sp => sp.name === selectedSalesPerson)?.sales_person_name || 'Search sales person...' 
                            : 'Search sales person...'
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white"
                          required
                        />
                        <svg 
                          className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        
                        {/* Dropdown */}
                        {salesPersonDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-auto">
                            {loadingSales ? (
                              <div className="px-3 py-2 text-sm text-gray-500">Loading sales persons...</div>
                            ) : filteredSalesPersons.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                {salesPersonSearch ? 'No sales persons found' : 'No sales persons available'}
                              </div>
                            ) : (
                              <>
                                {salesPersonSearch && (
                                  <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-200 dark:border-gray-600">
                                    {filteredSalesPersons.length} sales person(s) found
                                  </div>
                                )}
                                {filteredSalesPersons.map((sales) => (
                                  <div
                                    key={sales.name}
                                    onClick={() => {
                                      setSelectedSalesPerson(sales.name)
                                      setSalesPersonSearch('')
                                      setSalesPersonDropdownOpen(false)
                                      console.log('👥 [VOUCHER_UI] Sales person selected:', sales.name, sales.sales_person_name)
                                    }}
                                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      selectedSalesPerson === sales.name ? 'bg-asparagus-50 dark:bg-asparagus-900' : ''
                                    }`}
                                  >
                                    <div className="text-sm font-medium text-jet-800 dark:text-white">
                                      {sales.sales_person_name}
                                    </div>
                                    {sales.employee_name && (
                                      <div className="text-xs text-gray-500">
                                        {sales.employee_name}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {loadingSales && (
                        <p className="text-xs text-gray-500 mt-1">Loading sales persons...</p>
                      )}
                      {selectedSalesPerson && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ Selected: {salesPersons.find(sp => sp.name === selectedSalesPerson)?.sales_person_name}
                        </p>
                      )}
                    </div>

                    {/* User Selection - SEARCHABLE */}
                    <div data-dropdown="customer">
                      <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-2">
                        Customer <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value)
                            setCustomerDropdownOpen(true)
                          }}
                          onFocus={() => setCustomerDropdownOpen(true)}
                          placeholder={selectedUser ? 
                            erpUsers.find(u => u.name === selectedUser)?.full_name || 'Search customer...' 
                            : !selectedBranch ? 'Select Branch First' : 'Search customer...'
                          }
                          disabled={!selectedBranch}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                          required
                        />
                        <svg 
                          className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        
                        {/* Dropdown */}
                        {customerDropdownOpen && selectedBranch && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-auto">
                            {loadingUsers ? (
                              <div className="px-3 py-2 text-sm text-gray-500">Loading customers...</div>
                            ) : filteredCustomers.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                {customerSearch ? 'No customers found' : 'No customers available for this branch'}
                              </div>
                            ) : (
                              <>
                                {customerSearch && (
                                  <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-200 dark:border-gray-600">
                                    {filteredCustomers.length} customer(s) found
                                  </div>
                                )}
                                {filteredCustomers.map((user) => (
                                  <div
                                    key={user.name}
                                    onClick={() => {
                                      setSelectedUser(user.name)
                                      setCustomerSearch('')
                                      setCustomerDropdownOpen(false)
                                      console.log('👤 [VOUCHER_UI] Customer selected:', user.name, user.full_name)
                                    }}
                                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      selectedUser === user.name ? 'bg-asparagus-50 dark:bg-asparagus-900' : ''
                                    }`}
                                  >
                                    <div className="text-sm font-medium text-jet-800 dark:text-white">
                                      {user.full_name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {user.name}
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {loadingUsers && (
                        <p className="text-xs text-gray-500 mt-1">Loading customers...</p>
                      )}
                      {selectedBranch && erpUsers.length === 0 && !loadingUsers && (
                        <p className="text-xs text-yellow-600 mt-1">No customers found for this branch</p>
                      )}
                      {selectedUser && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ Selected: {erpUsers.find(u => u.name === selectedUser)?.full_name}
                        </p>
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
                  {(!selectedVoucherType || !selectedBranch || !selectedSalesPerson || !selectedUser) && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        ⚠️ Please fill in all required fields (Voucher Type, Branch, Sales Person, Customer) before adding items
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

                  {selectedVoucherType && selectedBranch && selectedUser && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✅ Voucher Type: <strong>{voucherTypeOptions.find(opt => opt.value === selectedVoucherType)?.label}</strong><br/>
                        📍 Stock quantities shown for branch: <strong>{selectedBranch}</strong><br/>
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
    const UPPER_TOLERANCE = 25000
    const maxAllowedTotal = (promo?.nilai || 0) + UPPER_TOLERANCE
    const remainingWithTolerance = maxAllowedTotal - cartTotal
    const maxQuantity = Math.floor(remainingWithTolerance / item.price)
    const hasStock = canAddItem(item)
    const branchStock = selectedBranch ? getStockForBranch(item, selectedBranch) : (item.stock_qty || 0)
    const remainingStock = selectedBranch ? getRemainingStock(item, selectedBranch) : branchStock
    const qtyInCart = cart.find(ci => ci.item.item_code === item.item_code)?.quantity || 0
    const canAdd = remainingWithTolerance >= item.price && hasStock && selectedVoucherType && selectedBranch && selectedSalesPerson && selectedUser && remainingStock > 0
    
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

          {/* Stock Information - REAL-TIME WITH CART */}
          <div className="text-xs space-y-1">
            {selectedBranch ? (
              <>
                <p className={`font-medium ${
                  remainingStock === 0 ? 'text-red-600 dark:text-red-400' :
                  remainingStock <= 5 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  📦 {selectedBranch}: <strong>{remainingStock.toLocaleString()}</strong> available
                </p>
                {qtyInCart > 0 && (
                  <p className="text-blue-600 dark:text-blue-400 font-medium">
                    🛒 {qtyInCart} in cart ({branchStock.toLocaleString()} total)
                  </p>
                )}
              </>
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
            disabled={!canAdd || remainingStock === 0}
            size="sm"
            className="w-full"
            variant={canAdd && remainingStock > 0 ? "primary" : "outline"}
            type="button"
          >
            {remainingStock === 0 && qtyInCart > 0 ? (
              'All stock in cart'
            ) : remainingStock === 0 ? (
              'Out of Stock'
            ) : !selectedVoucherType || !selectedBranch || !selectedSalesPerson || !selectedUser ? (
              'Fill required fields'
            ) : remainingWithTolerance < item.price ? (
              'Exceeds limit (+25k)'
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
          {maxQuantity > 0 && maxQuantity < 10 && remainingStock > 0 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Max: {Math.min(maxQuantity, remainingStock)} items (voucher limit)
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

      {/* Confirmation Modal - Custom Implementation */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => !isSubmitting && setShowConfirmModal(false)}
          />
          
          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Voucher Submission</h2>
                </div>
                {!isSubmitting && (
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Please review your voucher submission details before confirming:
                </p>

                {/* Voucher Details */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Voucher Type</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {voucherTypeOptions.find(v => v.value === selectedVoucherType)?.label || selectedVoucherType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Branch</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {branches.find(b => b.value === selectedBranch)?.label || selectedBranch}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sales Person</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {salesPersons.find(s => s.name === selectedSalesPerson)?.name || selectedSalesPerson}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {erpUsers.find(u => u.name === selectedUser)?.full_name || selectedUser}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Selected Items ({cart.length})
                  </h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Item
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Qty
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {cart.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.item.item_name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.item.item_code}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                                {item.quantity} {item.item.stock_uom}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                {formatCurrency(item.item.price)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Total Items:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{cart.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Total Value:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Voucher Value:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(promo?.nilai || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-blue-200 dark:border-blue-700">
                      <span className="text-gray-700 dark:text-gray-300">Remaining:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(remainingVoucherValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review Again
                </button>
                <button
                  onClick={handleConfirmedSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Yes, Submit Voucher</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}