'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/common/ToastProvider'

export interface ItemBrand {
  name: string
  description?: string
  item_count?: number
}

interface BrandFilterProps {
  selectedBrand: string
  onBrandChange: (brand: string) => void
  brands?: ItemBrand[]
  loading?: boolean
  className?: string
  placeholder?: string
  showAllOption?: boolean
  allOptionLabel?: string
  autoFetch?: boolean
  disabled?: boolean
}

export function BrandFilter({
  selectedBrand,
  onBrandChange,
  brands: externalBrands,
  loading: externalLoading = false,
  className = '',
  placeholder = 'Select brand...',
  showAllOption = true,
  allOptionLabel = 'All Brands',
  autoFetch = true,
  disabled = false
}: BrandFilterProps) {
  const { showToast } = useToast()
  
  // Internal state for brands if not provided externally
  const [internalBrands, setInternalBrands] = useState<ItemBrand[]>([])
  const [internalLoading, setInternalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use external brands if provided, otherwise use internal
  const brands = externalBrands || internalBrands
  const loading = externalLoading || internalLoading

  // Fetch brands from ERP via API route (only if autoFetch is true and no external brands)
  const fetchBrands = useCallback(async () => {
    if (!autoFetch || externalBrands || internalLoading) return
    
    setInternalLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/erp/brands', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch brands: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📦 [BRAND_FILTER] Brand API Response:', data)
      
      if (data.success && Array.isArray(data.brands)) {
        setInternalBrands(data.brands)
        console.log(`✅ [BRAND_FILTER] Loaded ${data.brands.length} brands`)
      } else {
        console.warn('⚠️ [BRAND_FILTER] Unexpected brand data structure:', data)
        setInternalBrands([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch brands'
      console.error('❌ [BRAND_FILTER] Brand fetch error:', errorMessage)
      setError(errorMessage)
      showToast.error('Failed to load brands', errorMessage)
    } finally {
      setInternalLoading(false)
    }
  }, [autoFetch, externalBrands, showToast])

  // Auto-fetch brands on mount if needed
  useEffect(() => {
    if (autoFetch && !externalBrands && internalBrands.length === 0 && !internalLoading) {
      fetchBrands()
    }
  }, []) // Empty dependency to run only once

  // Handle brand change
  const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    onBrandChange(value)
  }

  return (
    <div className={`brand-filter ${className}`}>
      <select
        value={selectedBrand}
        onChange={handleBrandChange}
        disabled={disabled || loading}
        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {showAllOption && (
          <option value="all">{allOptionLabel}</option>
        )}
        
        {loading && (
          <option value="" disabled>Loading brands...</option>
        )}
        
        {!loading && brands.length === 0 && (
          <option value="" disabled>No brands available</option>
        )}
        
        {!loading && brands.map((brand) => (
          <option key={brand.name} value={brand.name}>
            {brand.name}
            {brand.item_count !== undefined && ` (${brand.item_count})`}
          </option>
        ))}
      </select>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
          <button
            onClick={fetchBrands}
            className="ml-2 text-asparagus-600 dark:text-asparagus-400 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

// Hook for managing brand filter state and logic
export function useBrandFilter(initialBrand: string = 'all') {
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand)
  const [brands, setBrands] = useState<ItemBrand[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const fetchBrands = useCallback(async () => {
    if (loading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/erp/brands', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch brands: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📦 [USE_BRAND_FILTER] Brand API Response:', data)
      
      if (data.success && Array.isArray(data.brands)) {
        setBrands(data.brands)
        console.log(`✅ [USE_BRAND_FILTER] Loaded ${data.brands.length} brands`)
      } else {
        console.warn('⚠️ [USE_BRAND_FILTER] Unexpected brand data structure:', data)
        setBrands([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch brands'
      console.error('❌ [USE_BRAND_FILTER] Brand fetch error:', errorMessage)
      setError(errorMessage)
      showToast.error('Failed to load brands', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const resetBrandFilter = useCallback(() => {
    setSelectedBrand('all')
  }, [])

  // Auto fetch brands on mount
  useEffect(() => {
    if (brands.length === 0 && !loading) {
      fetchBrands()
    }
  }, []) // Empty dependency to run only once

  return {
    selectedBrand,
    setSelectedBrand,
    brands,
    loading,
    error,
    fetchBrands,
    resetBrandFilter
  }
}

export default BrandFilter
