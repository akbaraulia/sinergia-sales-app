'use client'

import { useState, useEffect, Fragment } from 'react'
import type { ReplenishmentReportRow, ReplenishmentReportResponse, BranchWithWarehouses, StructuredFiltersResponse } from '@/types/replenishment'

export default function ReplenishmentReportPage() {
  const [data, setData] = useState<ReplenishmentReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(100)
  const [filters, setFilters] = useState({
    branch: '',
    warehouse: '',
    itemCode: '',
    company: ''
  })
  
  // Filter options from API
  const [branchesWithWarehouses, setBranchesWithWarehouses] = useState<BranchWithWarehouses[]>([])
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false)
  
  // Calculate dynamic month labels
  const getMonthLabel = (monthsAgo: number): string => {
    const date = new Date()
    date.setMonth(date.getMonth() - monthsAgo)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
  }
  
  const monthLabels = {
    m0: getMonthLabel(0),
    m1: getMonthLabel(1),
    m2: getMonthLabel(2),
    m3: getMonthLabel(3)
  }

  // Buffer mapping per branch
  const getBufferByBranch = (branchCode: string): number => {
    if (!branchCode) return 1 // Default if no branch code
    const branch = branchCode.toUpperCase()
    if (['JKT', 'HO', 'MKP'].includes(branch)) return 1
    if (['YGY', 'SBY'].includes(branch)) return 2
    if (['MDN', 'PKB', 'PLG', 'PDG', 'DP', 'PKU'].includes(branch)) return 2
    if (['KPG', 'MND', 'MKS', 'BKP', 'PTK'].includes(branch)) return 4
    return 1 // Default buffer
  }

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [page]) // Re-fetch when page changes
  
  // Fetch filter options
  useEffect(() => {
    fetchFilterOptions()
  }, [])
  
  const fetchFilterOptions = async () => {
    try {
      setFilterOptionsLoading(true)
      const response = await fetch('/api/erp/structured-filters')
      const result: StructuredFiltersResponse = await response.json()
      
      if (result.success && result.branches_with_warehouses) {
        setBranchesWithWarehouses(result.branches_with_warehouses)
      }
    } catch (err) {
      console.error('Failed to fetch filter options:', err)
    } finally {
      setFilterOptionsLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filters.branch) params.append('branch', filters.branch)
      if (filters.warehouse) params.append('warehouse', filters.warehouse)
      if (filters.itemCode) params.append('item_code', filters.itemCode)
      if (filters.company) params.append('company', filters.company)
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const url = `/api/reports/replenishment${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      const result: ReplenishmentReportResponse = await response.json()

      if (result.success && result.data) {
        setData(result.data)
        setTotal(result.total || 0)
        setTotalPages(result.totalPages || 1)
      } else {
        setError(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    setPage(1) // Reset to page 1
    fetchData()
  }

  const handleResetFilters = () => {
    setFilters({
      branch: '',
      warehouse: '',
      itemCode: '',
      company: ''
    })
    setSearch('')
    setPage(1)
    setTimeout(fetchData, 100)
  }

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-'
    // Round to 2 decimals and remove trailing zeros
    const rounded = Math.round(num * 100) / 100
    return rounded.toLocaleString('id-ID', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })
  }

  const formatCurrency = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-'
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`
  }

  const fetchAllDataForExport = async (): Promise<ReplenishmentReportRow[]> => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filters.branch) params.append('branch', filters.branch)
      if (filters.warehouse) params.append('warehouse', filters.warehouse)
      if (filters.itemCode) params.append('item_code', filters.itemCode)
      if (filters.company) params.append('company', filters.company)
      // Fetch all data without pagination
      params.append('limit', '999999')

      const url = `/api/reports/replenishment${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      const result: ReplenishmentReportResponse = await response.json()

      if (result.success && result.data) {
        return result.data
      }
      return []
    } catch (err) {
      console.error('Failed to fetch all data for export:', err)
      return []
    }
  }

  const exportToCSV = async () => {
    if (loading) return

    // Show loading state
    const originalButtonText = 'Export CSV'
    const exportButton = document.querySelector('[data-export-btn]') as HTMLButtonElement
    if (exportButton) {
      exportButton.textContent = '⏳ Fetching all data...'
      exportButton.disabled = true
    }

    try {
      // Fetch ALL data (not just current page)
      const allData = await fetchAllDataForExport()
      
      if (allData.length === 0) {
        alert('No data to export')
        return
      }

      // Collect ALL unique warehouses across all items (not just first item)
      const allWarehousesSet = new Set<string>()
      const warehouseDetails = new Map<string, { branch: string, warehouse: string }>()
      
      allData.forEach(row => {
        row.warehouses.forEach(wh => {
          const key = wh.warehouse
          allWarehousesSet.add(key)
          if (!warehouseDetails.has(key)) {
            warehouseDetails.set(key, {
              branch: wh.branch_name,
              warehouse: wh.warehouse
            })
          }
        })
      })

      // Sort warehouses for consistent ordering
      const sortedWarehouseKeys = Array.from(allWarehousesSet).sort((a, b) => {
        const detailA = warehouseDetails.get(a)!
        const detailB = warehouseDetails.get(b)!
        const branchCompare = detailA.branch.localeCompare(detailB.branch)
        return branchCompare !== 0 ? branchCompare : detailA.warehouse.localeCompare(detailB.warehouse)
      })

      // Build dynamic headers based on ALL warehouses
      const warehouseHeaders: string[] = []
      sortedWarehouseKeys.forEach(whKey => {
        const detail = warehouseDetails.get(whKey)!
        const whPrefix = `${detail.branch} - ${detail.warehouse}`
        warehouseHeaders.push(
          `${whPrefix} - Total Stock`,
          `${whPrefix} - Sales ${monthLabels.m0}`,
          `${whPrefix} - Sales ${monthLabels.m1}`,
          `${whPrefix} - Sales ${monthLabels.m2}`,
          `${whPrefix} - Sales ${monthLabels.m3}`,
          `${whPrefix} - BBK ${monthLabels.m0}`,
          `${whPrefix} - BBK ${monthLabels.m1}`,
          `${whPrefix} - BBK ${monthLabels.m2}`,
          `${whPrefix} - BBK ${monthLabels.m3}`,
          `${whPrefix} - Avg Flow`,
          `${whPrefix} - DOI`,
          `${whPrefix} - REPLENISHMENT`
        )
      })

      const headers = [
        'Company',
        'Item Code',
        'Item Name',
        ...warehouseHeaders,
        'Total Qty',
        'Total Stock Value',
        'Overall DOI'
      ]

      const csvRows = [
        headers.join(','),
        ...allData.map(row => {
          const warehouseData: (string | number)[] = []
          
          // For each warehouse in sorted order, find its data or use 0
          sortedWarehouseKeys.forEach(whKey => {
            const wh = row.warehouses.find(w => w.warehouse === whKey)
            if (wh) {
              const buffer = getBufferByBranch(wh.branch_code)
              const replenishment = wh.current_qty - (wh.avg_flow_m1_to_m3 * buffer)
              
              warehouseData.push(
                wh.current_qty,
                wh.delivery_note_qty_m0,
                wh.delivery_note_qty_m1,
                wh.delivery_note_qty_m2,
                wh.delivery_note_qty_m3,
                wh.material_issue_qty_m0,
                wh.material_issue_qty_m1,
                wh.material_issue_qty_m2,
                wh.material_issue_qty_m3,
                wh.avg_flow_m1_to_m3,
                wh.doi_adjusted || '',
                replenishment
              )
            } else {
              // Warehouse not present for this item - fill with zeros
              warehouseData.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0)
            }
          })

          return [
            row.company,
            row.item_code,
            `"${row.item_name || ''}"`,
            ...warehouseData,
            row.total_current_qty,
            row.total_stock_value,
            row.overall_doi || ''
          ].join(',')
        })
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `replenishment-report-pivoted-${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      // Show success message
      if (exportButton) {
        exportButton.textContent = `✅ Exported ${allData.length} items × ${sortedWarehouseKeys.length} warehouses`
        setTimeout(() => {
          exportButton.textContent = originalButtonText
          exportButton.disabled = false
        }, 3000)
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data')
      if (exportButton) {
        exportButton.textContent = originalButtonText
        exportButton.disabled = false
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-[98vw] mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Replenishment Report (Pivoted View)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stock analysis per item with all warehouses displayed horizontally - Much lighter CSV exports! 🚀
          </p>
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            💡 One row per item, all warehouses shown as columns - Perfect for daily email reports
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <input
              type="text"
              placeholder="🔍 Search all..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Branch Filter */}
            <select
              value={filters.branch}
              onChange={(e) => {
                handleFilterChange('branch', e.target.value)
                // Reset warehouse when branch changes
                if (e.target.value === '') {
                  handleFilterChange('warehouse', '')
                }
              }}
              disabled={filterOptionsLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Branches</option>
              {branchesWithWarehouses.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.branch_label}
                </option>
              ))}
            </select>

            {/* Warehouse Filter */}
            <select
              value={filters.warehouse}
              onChange={(e) => handleFilterChange('warehouse', e.target.value)}
              disabled={filterOptionsLoading || !filters.branch}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {filters.branch ? 'All Warehouses' : 'Select Branch First'}
              </option>
              {filters.branch &&
                branchesWithWarehouses
                  .find((b) => b.name === filters.branch)
                  ?.warehouses.map((warehouse) => (
                    <option key={warehouse.name} value={warehouse.name}>
                      {warehouse.warehouse_name}
                    </option>
                  ))}
            </select>

            <input
              type="text"
              placeholder="Item Code"
              value={filters.itemCode}
              onChange={(e) => handleFilterChange('itemCode', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Company"
              value={filters.company}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              🔍 Apply Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              🔄 Reset
            </button>
            <button
              onClick={exportToCSV}
              disabled={loading}
              data-export-btn
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📥 Export CSV
            </button>
            <div className="flex-1" />
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
              <span>{loading ? '⏳ Loading...' : `📦 ${data.length} of ${total} records`}</span>
              {!loading && totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    ←
                  </button>
                  <span className="text-xs">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">❌ Error: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading replenishment data...</p>
          </div>
        )}

        {/* Data Table - Pivoted Horizontal View */}
        {!loading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {data.length > 0 && (() => {
                // Collect all unique warehouses from all items for consistent columns
                const allWarehousesSet = new Set<string>()
                const warehouseDetails = new Map<string, { branch: string, warehouse: string, branch_code: string }>()
                
                data.forEach(row => {
                  row.warehouses.forEach(wh => {
                    const key = wh.warehouse
                    allWarehousesSet.add(key)
                    if (!warehouseDetails.has(key)) {
                      warehouseDetails.set(key, {
                        branch: wh.branch_name,
                        warehouse: wh.warehouse,
                        branch_code: wh.branch_code
                      })
                    }
                  })
                })

                // Sort warehouses for consistent ordering
                const sortedWarehouseKeys = Array.from(allWarehousesSet).sort((a, b) => {
                  const detailA = warehouseDetails.get(a)!
                  const detailB = warehouseDetails.get(b)!
                  const branchCompare = detailA.branch.localeCompare(detailB.branch)
                  return branchCompare !== 0 ? branchCompare : detailA.warehouse.localeCompare(detailB.warehouse)
                })

                return (
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                      <tr>
                        {/* Fixed columns */}
                        <th rowSpan={2} className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600 sticky left-0 bg-gray-100 dark:bg-gray-700 z-10">
                          Company
                        </th>
                        <th rowSpan={2} className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600 sticky left-[100px] bg-gray-100 dark:bg-gray-700 z-10">
                          Item Code
                        </th>
                        <th rowSpan={2} className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600 sticky left-[200px] bg-gray-100 dark:bg-gray-700 z-10 min-w-[200px]">
                          Item Name
                        </th>
                        
                        {/* Dynamic warehouse columns - ALL warehouses */}
                        {sortedWarehouseKeys.map((whKey) => {
                          const detail = warehouseDetails.get(whKey)!
                          return (
                            <th key={whKey} colSpan={12} className="px-3 py-2 text-center font-semibold text-asparagus-700 dark:text-asparagus-400 border-r-2 border-asparagus-300 dark:border-asparagus-600">
                              {detail.branch} - {detail.warehouse}
                            </th>
                          )
                        })}
                        
                        {/* Totals columns */}
                        <th colSpan={3} className="px-3 py-2 text-center font-semibold text-red-700 dark:text-red-400 border-l-2 border-red-300">
                          TOTALS
                        </th>
                      </tr>
                      <tr>
                        {/* Sub-headers for each warehouse */}
                        {sortedWarehouseKeys.map((whKey) => (
                          <Fragment key={whKey}>
                            <th className="px-2 py-1 text-right text-gray-600 dark:text-gray-400 border-r dark:border-gray-600">Total Stock</th>
                            <th className="px-2 py-1 text-right text-blue-600 dark:text-blue-400 border-r dark:border-gray-600">Sales {monthLabels.m0}</th>
                            <th className="px-2 py-1 text-right text-blue-600 dark:text-blue-400 border-r dark:border-gray-600">Sales {monthLabels.m1}</th>
                            <th className="px-2 py-1 text-right text-blue-600 dark:text-blue-400 border-r dark:border-gray-600">Sales {monthLabels.m2}</th>
                            <th className="px-2 py-1 text-right text-blue-600 dark:text-blue-400 border-r dark:border-gray-600">Sales {monthLabels.m3}</th>
                            <th className="px-2 py-1 text-right text-purple-600 dark:text-purple-400 border-r dark:border-gray-600">BBK {monthLabels.m0}</th>
                            <th className="px-2 py-1 text-right text-purple-600 dark:text-purple-400 border-r dark:border-gray-600">BBK {monthLabels.m1}</th>
                            <th className="px-2 py-1 text-right text-purple-600 dark:text-purple-400 border-r dark:border-gray-600">BBK {monthLabels.m2}</th>
                            <th className="px-2 py-1 text-right text-purple-600 dark:text-purple-400 border-r dark:border-gray-600">BBK {monthLabels.m3}</th>
                            <th className="px-2 py-1 text-right text-gray-600 dark:text-gray-400 border-r dark:border-gray-600">Avg Flow</th>
                            <th className="px-2 py-1 text-right text-red-600 dark:text-red-400 border-r dark:border-gray-600">DOI</th>
                            <th className="px-2 py-1 text-right text-orange-600 dark:text-orange-400 border-r-2 border-asparagus-300 dark:border-asparagus-600">REPLENISHMENT</th>
                          </Fragment>
                        ))}
                        
                        {/* Total sub-headers */}
                        <th className="px-2 py-1 text-right text-red-600 dark:text-red-400 border-l-2 border-red-300">Total Qty</th>
                        <th className="px-2 py-1 text-right text-red-600 dark:text-red-400">Total Value</th>
                        <th className="px-2 py-1 text-right text-red-600 dark:text-red-400">Overall DOI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          {/* Fixed columns */}
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-800">
                            {row.company}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 sticky left-[100px] bg-white dark:bg-gray-800">
                            {row.item_code}
                          </td>
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 sticky left-[200px] bg-white dark:bg-gray-800 min-w-[200px]">
                            {row.item_name}
                          </td>
                          
                          {/* Dynamic warehouse data - ALL warehouses, fill with 0 if missing */}
                          {sortedWarehouseKeys.map((whKey) => {
                            const wh = row.warehouses.find(w => w.warehouse === whKey)
                            if (wh) {
                              const buffer = getBufferByBranch(wh.branch_code)
                              const replenishment = wh.current_qty - (wh.avg_flow_m1_to_m3 * buffer)
                              
                              return (
                                <Fragment key={whKey}>
                                  <td className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">
                                    {formatNumber(wh.current_qty)}
                                  </td>
                                  <td className="px-2 py-2 text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                                    {formatNumber(wh.delivery_note_qty_m0)}
                                  </td>
                                  <td className="px-2 py-2 text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                                    {formatNumber(wh.delivery_note_qty_m1)}
                                  </td>
                                  <td className="px-2 py-2 text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                                    {formatNumber(wh.delivery_note_qty_m2)}
                                  </td>
                                  <td className="px-2 py-2 text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                                    {formatNumber(wh.delivery_note_qty_m3)}
                                  </td>
                                  <td className="px-2 py-2 text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                                    {formatNumber(wh.material_issue_qty_m0)}
                                  </td>
                                  <td className="px-2 py-2 text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                                    {formatNumber(wh.material_issue_qty_m1)}
                                  </td>
                                  <td className="px-2 py-2 text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                                    {formatNumber(wh.material_issue_qty_m2)}
                                  </td>
                                  <td className="px-2 py-2 text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                                    {formatNumber(wh.material_issue_qty_m3)}
                                  </td>
                                  <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
                                    {formatNumber(wh.avg_flow_m1_to_m3)}
                                  </td>
                                  <td className={`px-2 py-2 text-right font-bold border-r dark:border-gray-700 ${
                                    wh.doi_adjusted !== null && wh.doi_adjusted < 30 ? 'text-red-600 dark:text-red-400' :
                                    wh.doi_adjusted !== null && wh.doi_adjusted > 90 ? 'text-orange-600 dark:text-orange-400' :
                                    'text-green-600 dark:text-green-400'
                                  }`}>
                                    {wh.doi_adjusted !== null ? formatNumber(wh.doi_adjusted) : '-'}
                                  </td>
                                  <td className={`px-2 py-2 text-right font-bold border-r-2 border-asparagus-300 dark:border-asparagus-600 ${
                                    replenishment < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                  }`}>
                                    {formatNumber(replenishment)}
                                  </td>
                                </Fragment>
                              )
                            } else {
                              // Warehouse not present for this item - show dashes
                              return (
                                <Fragment key={whKey}>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r dark:border-gray-700">-</td>
                                  <td className="px-2 py-2 text-right text-gray-400 dark:text-gray-600 border-r-2 border-asparagus-300 dark:border-asparagus-600">-</td>
                                </Fragment>
                              )
                            }
                          })}
                          
                          {/* Totals */}
                          <td className="px-2 py-2 text-right font-bold text-red-700 dark:text-red-400 border-l-2 border-red-300">
                            {formatNumber(row.total_current_qty)}
                          </td>
                          <td className="px-2 py-2 text-right font-bold text-red-700 dark:text-red-400">
                            {formatCurrency(row.total_stock_value)}
                          </td>
                          <td className={`px-2 py-2 text-right font-bold ${
                            row.overall_doi !== null && row.overall_doi < 30 ? 'text-red-600 dark:text-red-400' :
                            row.overall_doi !== null && row.overall_doi > 90 ? 'text-orange-600 dark:text-orange-400' :
                            'text-green-600 dark:text-green-400'
                          }`}>
                            {row.overall_doi !== null ? formatNumber(row.overall_doi) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              })()}
            </div>

            {data.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                📭 No data available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
