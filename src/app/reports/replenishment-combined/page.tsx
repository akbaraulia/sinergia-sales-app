'use client'

import { useState, useEffect } from 'react'
import type { CombinedReportRow, CombinedReportResponse, CombinedBranchData } from '@/types/combined-replenishment'
import { ACTIVE_ERP_BRANCHES, getBranchDisplayName } from '@/lib/constants/branch-mapping'

export default function CombinedReplenishmentPage() {
  const [data, setData] = useState<CombinedReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [branch, setBranch] = useState('')
  const [discrepancyFilter, setDiscrepancyFilter] = useState<'all' | 'critical' | 'warning' | 'ok'>('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(50)
  const [metadata, setMetadata] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [page])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (branch) params.append('branch', branch)
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const url = `/api/reports/replenishment-combined?${params.toString()}`
      const response = await fetch(url)
      const result: CombinedReportResponse = await response.json()

      if (result.success && result.data) {
        // Apply client-side discrepancy filter
        let filteredData = result.data
        if (discrepancyFilter !== 'all') {
          filteredData = result.data.filter(row => row.overall_discrepancy === discrepancyFilter)
        }
        
        setData(filteredData)
        setTotal(result.total || 0)
        setTotalPages(result.totalPages || 1)
        setMetadata(result.metadata)
      } else {
        setError(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleReset = () => {
    setSearch('')
    setBranch('')
    setDiscrepancyFilter('all')
    setPage(1)
    setTimeout(fetchData, 100)
  }

  const toggleRow = (itemCode: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(itemCode)) {
      newExpanded.delete(itemCode)
    } else {
      newExpanded.add(itemCode)
    }
    setExpandedRows(newExpanded)
  }

  const getDiscrepancyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'ok': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'sivfu_only': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'erp_only': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getDiscrepancyLabel = (level: string) => {
    switch (level) {
      case 'critical': return '🔴 Critical'
      case 'warning': return '⚠️ Warning'
      case 'ok': return '✅ OK'
      case 'sivfu_only': return '📘 SIVFU Only'
      case 'erp_only': return '📙 ERP Only'
      default: return '-'
    }
  }

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-'
    const parsed = typeof num === 'string' ? parseFloat(num) : num
    if (isNaN(parsed)) return '-'
    return Math.round(parsed).toLocaleString('id-ID')
  }

  const formatDecimal = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-'
    const parsed = typeof num === 'string' ? parseFloat(num) : num
    if (isNaN(parsed)) return '-'
    return parsed.toFixed(1)
  }

  const safeToFixed = (num: any, decimals: number): string => {
    if (num === null || num === undefined) return ''
    const parsed = typeof num === 'string' ? parseFloat(num) : num
    if (isNaN(parsed)) return ''
    return parsed.toFixed(decimals)
  }

  const safeNumber = (num: any): number => {
    if (num === null || num === undefined) return 0
    const parsed = typeof num === 'string' ? parseFloat(num) : num
    return isNaN(parsed) ? 0 : parsed
  }

  const exportToCSV = () => {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    let csvContent = 'Item Code,Item Name,Branch,SIVFU Stock,SIVFU Replen,SIVFU DOI,SIVFU Avg Flow,'
    csvContent += 'ERP Stock,ERP Replen,ERP DOI,ERP Avg Flow,'
    csvContent += 'Delta Stock,Delta Stock %,Delta Replen,Delta Replen %,Discrepancy\\n'

    data.forEach(row => {
      row.branches.forEach(branch => {
        csvContent += `"${row.item_code}","${row.item_name}",${branch.branch_code},`
        csvContent += `${branch.sivfu.stock},${branch.sivfu.replenishment},${branch.sivfu.doi || ''},${safeToFixed(branch.sivfu.avg_flow, 1)},`
        csvContent += `${branch.erp.stock},${safeToFixed(branch.erp.replenishment, 0)},${branch.erp.doi || ''},${safeToFixed(branch.erp.avg_flow, 1)},`
        csvContent += `${branch.delta.stock},${safeToFixed(branch.delta.stock_percentage, 1)}%,`
        csvContent += `${safeToFixed(branch.delta.replenishment, 0)},${safeToFixed(branch.delta.replenishment_percentage, 1)}%,`
        csvContent += `${branch.discrepancy_level}\\n`
      })
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `combined-replenishment-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-[98vw] mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔗 Combined Replenishment Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            SIVFU vs ERP comparison with branch mapping - Side-by-side analysis for decision making
          </p>
          {metadata && (
            <div className="mt-3 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>📊 SIVFU Branches: <strong>{metadata.sivfu_branches_count}</strong></span>
              <span>📊 ERP Branches: <strong>{metadata.erp_branches_count}</strong></span>
              <span>🔗 Mapped: <strong>{metadata.mapped_branches_count}</strong></span>
              <span>⏱️ Query: <strong>{metadata.query_time_ms}ms</strong></span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="🔍 Search item code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {ACTIVE_ERP_BRANCHES.map(b => (
                <option key={b} value={b}>{getBranchDisplayName(b)}</option>
              ))}
            </select>

            <select
              value={discrepancyFilter}
              onChange={(e) => setDiscrepancyFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Discrepancies</option>
              <option value="critical">🔴 Critical Only</option>
              <option value="warning">⚠️ Warning Only</option>
              <option value="ok">✅ OK Only</option>
            </select>

            <button
              onClick={exportToCSV}
              disabled={loading || data.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              📥 Export CSV
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              🔍 Search
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              🔄 Reset
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            📦 Total Items: <strong>{total}</strong> | Page: <strong>{page} / {totalPages}</strong>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Merging SIVFU and ERP data...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Branch</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Stock (Δ)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Replen (Δ)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">DOI</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((row) => (
                    <>
                      {row.branches.map((branch, idx) => (
                        <tr key={`${row.item_code}-${branch.branch_code}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          {idx === 0 && (
                            <td rowSpan={row.branches.length} className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              <div className="font-mono text-xs text-gray-500">{row.item_code}</div>
                              <div>{row.item_name}</div>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {getBranchDisplayName(branch.branch_code)}
                            {branch.sivfu_branches.length > 1 && (
                              <div className="text-xs text-gray-500">({branch.sivfu_branches.join(', ')})</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {formatNumber(branch.sivfu.stock)} / {formatNumber(branch.erp.stock)}
                            </div>
                            <div className={`text-xs ${safeNumber(branch.delta.stock) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {safeNumber(branch.delta.stock) > 0 ? '+' : ''}{formatNumber(branch.delta.stock)} ({safeToFixed(branch.delta.stock_percentage, 1)}%)
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {formatNumber(branch.sivfu.replenishment)} / {formatNumber(branch.erp.replenishment)}
                            </div>
                            <div className={`text-xs ${safeNumber(branch.delta.replenishment) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {safeNumber(branch.delta.replenishment) > 0 ? '+' : ''}{formatNumber(branch.delta.replenishment)} ({safeToFixed(branch.delta.replenishment_percentage, 1)}%)
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                            {formatDecimal(branch.sivfu.doi)} / {formatDecimal(branch.erp.doi)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getDiscrepancyColor(branch.discrepancy_level)}`}>
                              {getDiscrepancyLabel(branch.discrepancy_level)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => toggleRow(`${row.item_code}-${branch.branch_code}`)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
                            >
                              {expandedRows.has(`${row.item_code}-${branch.branch_code}`) ? '▼ Hide' : '▶ Show'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {row.branches.map(branch => 
                        expandedRows.has(`${row.item_code}-${branch.branch_code}`) && (
                          <tr key={`${row.item_code}-${branch.branch_code}-details`} className="bg-gray-50 dark:bg-gray-700/30">
                            <td colSpan={7} className="px-8 py-4">
                              <div className="grid grid-cols-2 gap-6">
                                {/* SIVFU Details */}
                                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                  <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-3">📘 SIVFU Data</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Stock:</span><strong>{formatNumber(branch.sivfu.stock)}</strong></div>
                                    <div className="flex justify-between"><span>Replenishment:</span><strong className="text-green-600">{formatNumber(branch.sivfu.replenishment)}</strong></div>
                                    <div className="flex justify-between"><span>DOI:</span><strong>{formatDecimal(branch.sivfu.doi)}</strong></div>
                                    <div className="flex justify-between"><span>Avg Flow:</span><strong>{formatDecimal(branch.sivfu.avg_flow)}</strong></div>
                                    <div className="flex justify-between"><span>Buffer:</span><strong>{branch.sivfu.buffer}x</strong></div>
                                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                                      <div className="text-xs text-gray-600 dark:text-gray-400">Sales M1-M3: {formatNumber(branch.sivfu.sales_m1)} / {formatNumber(branch.sivfu.sales_m2)} / {formatNumber(branch.sivfu.sales_m3)}</div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">Lain M1-M3: {formatNumber(branch.sivfu.lain_m1)} / {formatNumber(branch.sivfu.lain_m2)} / {formatNumber(branch.sivfu.lain_m3)}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* ERP Details */}
                                <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                  <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-3">📙 ERP Data</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Stock:</span><strong>{formatNumber(branch.erp.stock)}</strong></div>
                                    <div className="flex justify-between"><span>Replenishment:</span><strong className={safeNumber(branch.erp.replenishment) < 0 ? 'text-red-600' : 'text-green-600'}>{formatNumber(branch.erp.replenishment)}</strong></div>
                                    <div className="flex justify-between"><span>DOI:</span><strong>{formatDecimal(branch.erp.doi)}</strong></div>
                                    <div className="flex justify-between"><span>Avg Flow:</span><strong>{formatDecimal(branch.erp.avg_flow)}</strong></div>
                                    <div className="flex justify-between"><span>Buffer:</span><strong>{branch.erp.buffer}x</strong></div>
                                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                                      <div className="text-xs text-gray-600 dark:text-gray-400">Sales M1-M3: {formatNumber(branch.erp.sales_m1)} / {formatNumber(branch.erp.sales_m2)} / {formatNumber(branch.erp.sales_m3)}</div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">BBK M1-M3: {formatNumber(branch.erp.bbk_m1)} / {formatNumber(branch.erp.bbk_m2)} / {formatNumber(branch.erp.bbk_m3)}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </>
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

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
