'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useToast } from '@/components/common/ToastProvider'

export interface AreaBranch {
  name: string
  branch: string
}

export interface AreaRayon {
  name: string
}

export interface AreaData {
  branches: AreaBranch[]
  rayons: AreaRayon[]
}

export type AreaType = 'branch' | 'rayon'

interface AreaFilterProps {
  selectedArea: string
  areaType: AreaType
  onAreaChange: (area: string) => void
  areaData?: AreaData
  loading?: boolean
  className?: string
  placeholder?: string
  showAllOption?: boolean
  allOptionLabel?: string
  autoFetch?: boolean
  disabled?: boolean
}

export function AreaFilter({
  selectedArea,
  areaType,
  onAreaChange,
  areaData: externalAreaData,
  loading: externalLoading = false,
  className = '',
  placeholder = 'Search area...',
  showAllOption = true,
  allOptionLabel = 'All Areas',
  autoFetch = true,
  disabled = false
}: AreaFilterProps) {
  const { showToast } = useToast()
  
  // Internal state for area data if not provided externally
  const [internalAreaData, setInternalAreaData] = useState<AreaData>({ branches: [], rayons: [] })
  const [internalLoading, setInternalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Search and dropdown state
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Use external data if provided, otherwise use internal
  const areaData = externalAreaData || internalAreaData
  const loading = externalLoading || internalLoading

  // Get current area list based on type
  const currentAreaList = useMemo(() => {
    return areaType === 'branch' ? areaData.branches : areaData.rayons
  }, [areaData, areaType])

  // Filter areas based on search query
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return currentAreaList
    
    const query = searchQuery.toLowerCase()
    return currentAreaList.filter(area => {
      if (areaType === 'branch') {
        const branch = area as AreaBranch
        return branch.name.toLowerCase().includes(query) || 
               branch.branch.toLowerCase().includes(query)
      } else {
        return area.name.toLowerCase().includes(query)
      }
    })
  }, [currentAreaList, searchQuery, areaType])

  // Get display name for selected area
  const selectedAreaDisplay = useMemo(() => {
    if (!selectedArea || selectedArea === 'all') return ''
    
    const foundArea = currentAreaList.find(area => {
      if (areaType === 'branch') {
        return (area as AreaBranch).name === selectedArea
      } else {
        return area.name === selectedArea
      }
    })
    
    if (foundArea) {
      if (areaType === 'branch') {
        return (foundArea as AreaBranch).branch
      } else {
        return foundArea.name
      }
    }
    
    return selectedArea
  }, [selectedArea, currentAreaList, areaType])

  // Fetch area data from API
  const fetchAreaData = useCallback(async () => {
    if (!autoFetch || externalAreaData || internalLoading) return
    
    setInternalLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/erp/area', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch area data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📦 [AREA_FILTER] Area API Response:', data)
      
      if (data.success) {
        const areaData: AreaData = {
          branches: data.branches || [],
          rayons: data.rayons || []
        }
        setInternalAreaData(areaData)
        console.log(`✅ [AREA_FILTER] Loaded ${data.count?.branches || 0} branches and ${data.count?.rayons || 0} rayons`)
      } else {
        console.warn('⚠️ [AREA_FILTER] Unexpected area data structure:', data)
        setInternalAreaData({ branches: [], rayons: [] })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch area data'
      console.error('❌ [AREA_FILTER] Area fetch error:', errorMessage)
      setError(errorMessage)
      showToast.error('Failed to load area data', errorMessage)
    } finally {
      setInternalLoading(false)
    }
  }, [autoFetch, externalAreaData, showToast])

  // Auto-fetch area data on mount if needed
  useEffect(() => {
    if (autoFetch && !externalAreaData && internalAreaData.branches.length === 0 && internalAreaData.rayons.length === 0 && !internalLoading) {
      fetchAreaData()
    }
  }, []) // Empty dependency to run only once

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (event.key === 'Enter' || event.key === 'ArrowDown') {
        setIsDropdownOpen(true)
        setHighlightedIndex(showAllOption ? 0 : (filteredAreas.length > 0 ? 0 : -1))
        event.preventDefault()
      }
      return
    }

    const totalOptions = (showAllOption ? 1 : 0) + filteredAreas.length

    switch (event.key) {
      case 'ArrowDown':
        setHighlightedIndex(prev => (prev + 1) % totalOptions)
        event.preventDefault()
        break
      case 'ArrowUp':
        setHighlightedIndex(prev => prev <= 0 ? totalOptions - 1 : prev - 1)
        event.preventDefault()
        break
      case 'Enter':
        if (highlightedIndex >= 0) {
          if (showAllOption && highlightedIndex === 0) {
            handleAreaSelect('all')
          } else {
            const areaIndex = showAllOption ? highlightedIndex - 1 : highlightedIndex
            if (areaIndex >= 0 && areaIndex < filteredAreas.length) {
              const area = filteredAreas[areaIndex]
              handleAreaSelect(areaType === 'branch' ? (area as AreaBranch).name : area.name)
            }
          }
        }
        event.preventDefault()
        break
      case 'Escape':
        setIsDropdownOpen(false)
        setHighlightedIndex(-1)
        event.preventDefault()
        break
    }
  }

  // Handle area selection
  const handleAreaSelect = (areaValue: string) => {
    onAreaChange(areaValue)
    setIsDropdownOpen(false)
    setHighlightedIndex(-1)
    setSearchQuery('')
    
    // Update input display
    if (areaValue === 'all') {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchQuery(value)
    setIsDropdownOpen(true)
    setHighlightedIndex(showAllOption && value === '' ? 0 : (filteredAreas.length > 0 ? 0 : -1))
  }

  // Handle input focus
  const handleInputFocus = () => {
    setIsDropdownOpen(true)
    if (selectedArea !== 'all') {
      setSearchQuery('')
    }
  }

  return (
    <div className={`area-filter relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isDropdownOpen ? searchQuery : (selectedArea === 'all' ? '' : selectedAreaDisplay)}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Loading...' : placeholder}
          disabled={disabled || loading}
          className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-asparagus-500 focus:border-asparagus-500 bg-white dark:bg-dark-surface text-jet-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Dropdown Arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg 
            className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Loading areas...</div>
          )}
          
          {!loading && (
            <>
              {/* All Option */}
              {showAllOption && (
                <button
                  type="button"
                  onClick={() => handleAreaSelect('all')}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    highlightedIndex === 0 ? 'bg-asparagus-100 dark:bg-asparagus-800 text-asparagus-700 dark:text-asparagus-300' : 'text-jet-800 dark:text-white'
                  }`}
                >
                  {allOptionLabel}
                </button>
              )}
              
              {/* Area Options */}
              {filteredAreas.length === 0 && searchQuery ? (
                <div className="px-3 py-2 text-sm text-gray-500">No areas found matching "{searchQuery}"</div>
              ) : (
                filteredAreas.map((area, index) => {
                  const optionIndex = showAllOption ? index + 1 : index
                  const areaValue = areaType === 'branch' ? (area as AreaBranch).name : area.name
                  const displayText = areaType === 'branch' ? (area as AreaBranch).branch : area.name
                  
                  return (
                    <button
                      key={areaValue}
                      type="button"
                      onClick={() => handleAreaSelect(areaValue)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        highlightedIndex === optionIndex ? 'bg-asparagus-100 dark:bg-asparagus-800 text-asparagus-700 dark:text-asparagus-300' : 'text-jet-800 dark:text-white'
                      }`}
                    >
                      <div className="truncate">{displayText}</div>
                      {areaType === 'rayon' && area.name.includes(' - ') && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {area.name.split(' - ')[0]}
                        </div>
                      )}
                    </button>
                  )
                })
              )}
              
              {!loading && filteredAreas.length === 0 && !searchQuery && (
                <div className="px-3 py-2 text-sm text-gray-500">No areas available</div>
              )}
            </>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
          <button
            onClick={fetchAreaData}
            className="ml-2 text-asparagus-600 dark:text-asparagus-400 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

// Hook for managing area filter state and logic
export function useAreaFilter(initialArea: string = 'all', areaType: AreaType = 'branch') {
  const [selectedArea, setSelectedArea] = useState<string>(initialArea)
  const [areaData, setAreaData] = useState<AreaData>({ branches: [], rayons: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const fetchAreaData = useCallback(async () => {
    if (loading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/erp/area', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch area data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📦 [USE_AREA_FILTER] Area API Response:', data)
      
      if (data.success) {
        const areaData: AreaData = {
          branches: data.branches || [],
          rayons: data.rayons || []
        }
        setAreaData(areaData)
        console.log(`✅ [USE_AREA_FILTER] Loaded ${data.count?.branches || 0} branches and ${data.count?.rayons || 0} rayons`)
      } else {
        console.warn('⚠️ [USE_AREA_FILTER] Unexpected area data structure:', data)
        setAreaData({ branches: [], rayons: [] })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch area data'
      console.error('❌ [USE_AREA_FILTER] Area fetch error:', errorMessage)
      setError(errorMessage)
      showToast.error('Failed to load area data', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const resetAreaFilter = useCallback(() => {
    setSelectedArea('all')
  }, [])

  // Auto fetch area data on mount
  useEffect(() => {
    if (areaData.branches.length === 0 && areaData.rayons.length === 0 && !loading) {
      fetchAreaData()
    }
  }, []) // Empty dependency to run only once

  return {
    selectedArea,
    setSelectedArea,
    areaData,
    loading,
    error,
    fetchAreaData,
    resetAreaFilter,
    areaType
  }
}

export default AreaFilter
