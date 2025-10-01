'use client'

import { useState, useEffect } from 'react'
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

  const exportToCSV = () => {
    if (data.length === 0) return

    const headers = [
      'Company', 'Branch Code', 'Branch Name', 'Warehouse', 'Item Code', 'Item Name',
      'Current Qty', 'Current Stock Value',
      `Sales ${monthLabels.m0}`, `Sales ${monthLabels.m1}`, `Sales ${monthLabels.m2}`, `Sales ${monthLabels.m3}`,
      `Material Issue/BBP ${monthLabels.m0}`, `Material Issue/BBP ${monthLabels.m1}`, `Material Issue/BBP ${monthLabels.m2}`, `Material Issue/BBP ${monthLabels.m3}`,
      'Adjusted Current Qty', 'Avg Flow M1-M3', 'DOI Adjusted'
    ]

    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        row.company,
        row.branch_code,
        `"${row.branch_name}"`,
        row.warehouse,
        row.item_code,
        `"${row.item_name || ''}"`,
        row.current_qty,
        row.current_stock_value,
        row.delivery_note_qty_m0,
        row.delivery_note_qty_m1,
        row.delivery_note_qty_m2,
        row.delivery_note_qty_m3,
        row.material_issue_qty_m0,
        row.material_issue_qty_m1,
        row.material_issue_qty_m2,
        row.material_issue_qty_m3,
        row.adjusted_current_qty,
        row.avg_flow_m1_to_m3 || '',
        row.doi_adjusted || ''
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `replenishment-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-[98vw] mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Replenishment Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stock analysis with Sales and Material Issue/BBP data - Dynamic monthly views (current month through 3 months ago)
          </p>
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
              disabled={data.length === 0}
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

        {/* Data Table */}
        {!loading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600">Warehouse</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600">Item Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600">Item Name</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600">Current Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600">Stock Value</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-blue-700 dark:text-blue-400 border-r dark:border-gray-600">Sales {monthLabels.m0}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-blue-700 dark:text-blue-400 border-r dark:border-gray-600">Sales {monthLabels.m1}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-blue-700 dark:text-blue-400 border-r dark:border-gray-600">Sales {monthLabels.m2}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-blue-700 dark:text-blue-400 border-r dark:border-gray-600">Sales {monthLabels.m3}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-purple-700 dark:text-purple-400 border-r dark:border-gray-600">Material Issue/BBP {monthLabels.m0}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-purple-700 dark:text-purple-400 border-r dark:border-gray-600">Material Issue/BBP {monthLabels.m1}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-purple-700 dark:text-purple-400 border-r dark:border-gray-600">Material Issue/BBP {monthLabels.m2}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-purple-700 dark:text-purple-400 border-r dark:border-gray-600">Material Issue/BBP {monthLabels.m3}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600">Adj. Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-600">Avg Flow</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-red-700 dark:text-red-400">DOI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">{row.company}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">
                        <div className="font-medium">{row.branch_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{row.branch_code}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">{row.warehouse}</td>
                      <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">{row.item_code}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 max-w-xs truncate">{row.item_name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">{formatNumber(row.current_qty)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 border-r dark:border-gray-700 text-xs">{formatCurrency(row.current_stock_value)}</td>
                      <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">{formatNumber(row.delivery_note_qty_m0)}</td>
                      <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">{formatNumber(row.delivery_note_qty_m1)}</td>
                      <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">{formatNumber(row.delivery_note_qty_m2)}</td>
                      <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">{formatNumber(row.delivery_note_qty_m3)}</td>
                      <td className="px-4 py-3 text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">{formatNumber(row.material_issue_qty_m0)}</td>
                      <td className="px-4 py-3 text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">{formatNumber(row.material_issue_qty_m1)}</td>
                      <td className="px-4 py-3 text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">{formatNumber(row.material_issue_qty_m2)}</td>
                      <td className="px-4 py-3 text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">{formatNumber(row.material_issue_qty_m3)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">{formatNumber(row.adjusted_current_qty)}</td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">{formatNumber(row.avg_flow_m1_to_m3)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-700 dark:text-red-400">
                        {row.doi_adjusted !== null ? formatNumber(row.doi_adjusted) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
