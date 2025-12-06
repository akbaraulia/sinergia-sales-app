'use client'

import { useState, useEffect, Fragment } from 'react'

// 35 branches from query (34 + LPG1)
const BRANCHES = [
  'JKT', 'SBY', 'SMG', 'MDN', 'HO', 'MKS', 'BJM', 'PKU', 'DPS', 'PLG',
  'YGY', 'MND', 'KPG', 'PDG', 'PDG1', 'SMR1', 'DP1', 'MDN1', 'AMB', 'HO2',
  'PKU1', 'JMB1', 'BKP', 'PLU1', 'AMB1', 'PLG1', 'MKS1', 'BJM1', 'MKP', 'PHL',
  'PTK1', 'MKPS', 'MKPM', 'MKPN', 'LPG1'
]

interface SIVFURow {
  kode_item: string
  nama_item: string
  hpp_ref: number | null
  
  // National Total
  Nas_Total_Stock: number
  Nas_Total_Replenish: number
  Nas_Total_DOI: number
  Nas_Avg_Flow: number
  Nas_Sales_M0: number
  Nas_Sales_M1: number
  Nas_Sales_M2: number
  Nas_Sales_M3: number
  Nas_Lain_M0: number
  Nas_Lain_M1: number
  Nas_Lain_M2: number
  Nas_Lain_M3: number
  
  // Branch data (dynamic properties for each branch)
  [key: string]: any
}

interface APIResponse {
  success: boolean
  data: SIVFURow[]
  total: number
  page: number
  limit: number
  totalPages: number
  queryTime?: string
  error?: string
}

export default function ReplenishmentSIVFUPage() {
  const [data, setData] = useState<SIVFURow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(100)
  const [queryTime, setQueryTime] = useState('')

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
  }, [page])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const url = `/api/reports/replenishment-sivfu${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      const result: APIResponse = await response.json()

      if (result.success && result.data) {
        setData(result.data)
        setTotal(result.total || 0)
        setTotalPages(result.totalPages || 1)
        setQueryTime(result.queryTime || '')
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

  const handleResetFilters = () => {
    setSearch('')
    setPage(1)
    setTimeout(fetchData, 100)
  }

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-'
    const rounded = Math.round(num * 100) / 100
    return rounded.toLocaleString('id-ID', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 1 
    })
  }

  const formatCurrency = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-'
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`
  }

  const exportToCSV = () => {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    // Build CSV header
    let csvContent = 'Kode Item,Nama Item,HPP,'
    csvContent += 'Total Stock,Total Replenish,Total DOI,Total Avg Flow,'
    csvContent += `Sales ${monthLabels.m0},Sales ${monthLabels.m1},Sales ${monthLabels.m2},Sales ${monthLabels.m3},`
    csvContent += `Lain ${monthLabels.m0},Lain ${monthLabels.m1},Lain ${monthLabels.m2},Lain ${monthLabels.m3},`
    
    // Add branch columns
    BRANCHES.forEach(branch => {
      csvContent += `${branch} Stock,${branch} Sales M0,${branch} Sales M1,${branch} Sales M2,${branch} Sales M3,`
      csvContent += `${branch} Lain M0,${branch} Lain M1,${branch} Lain M2,${branch} Lain M3,${branch} Replenish,${branch} DOI,${branch} Avg Flow,`
    })
    csvContent += '\n'

    // Add data rows
    data.forEach(row => {
      csvContent += `"${row.kode_item}","${row.nama_item}",${row.hpp_ref || 0},`
      csvContent += `${row.Nas_Total_Stock},${row.Nas_Total_Replenish},${row.Nas_Total_DOI},${row.Nas_Avg_Flow || 0},`
      csvContent += `${row.Nas_Sales_M0},${row.Nas_Sales_M1},${row.Nas_Sales_M2},${row.Nas_Sales_M3},`
      csvContent += `${row.Nas_Lain_M0},${row.Nas_Lain_M1},${row.Nas_Lain_M2},${row.Nas_Lain_M3},`
      
      BRANCHES.forEach(branch => {
        // Use pre-calculated Avg Flow from backend
        const avgFlow = row[`${branch}_Avg_Flow`] || 0
        csvContent += `${row[`${branch}_Stock`] || 0},`
        csvContent += `${row[`${branch}_S_M0`] || 0},${row[`${branch}_S_M1`] || 0},${row[`${branch}_S_M2`] || 0},${row[`${branch}_S_M3`] || 0},`
        csvContent += `${row[`${branch}_L_M0`] || 0},${row[`${branch}_L_M1`] || 0},${row[`${branch}_L_M2`] || 0},${row[`${branch}_L_M3`] || 0},`
        csvContent += `${row[`${branch}_Replenish`] || 0},${row[`${branch}_DOI`] || 0},${avgFlow.toFixed(1)},`
      })
      csvContent += '\n'
    })

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `replenishment-sivfu-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-[98vw] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Replenishment SIVFU Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Horizontal pivot view with 35 branches × 11 columns (Stock, Sales M0-M3, Lain M0-M3, Replenish, DOI)
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                🔍 Search Item
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Kode Item or Nama Item"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-asparagus-500 focus:border-transparent"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 bg-asparagus-600 text-white rounded-md hover:bg-asparagus-700 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                🔎 Search
              </button>
              <button
                onClick={handleResetFilters}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                🔄 Reset
              </button>
              <button
                onClick={exportToCSV}
                disabled={loading || data.length === 0}
                data-export-btn
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>📦 Total Items: <strong>{total}</strong></span>
            <span>📄 Page: <strong>{page} / {totalPages}</strong></span>
            {queryTime && <span>⏱️ Query Time: <strong>{queryTime}</strong></span>}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-asparagus-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading SIVFU data...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-asparagus-50 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    {/* Fixed columns */}
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-asparagus-50 dark:bg-gray-700 z-20">
                      Kode Item
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky left-[120px] bg-asparagus-50 dark:bg-gray-700 z-20 min-w-[200px]">
                      Nama Item
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky left-[320px] bg-asparagus-50 dark:bg-gray-700 z-20">
                      HPP
                    </th>
                    
                    {/* National Total Header */}
                    <th colSpan={12} className="px-3 py-2 text-center text-xs font-bold text-white bg-red-600 dark:bg-red-700 uppercase border-l-2 border-red-800">
                      📊 TOTAL NASIONAL
                    </th>
                    
                    {/* Branch Headers */}
                    {BRANCHES.map(branch => (
                      <th key={branch} colSpan={12} className="px-3 py-2 text-center text-xs font-bold text-white bg-asparagus-600 dark:bg-asparagus-700 uppercase border-l-2 border-asparagus-800">
                        {branch}
                      </th>
                    ))}
                  </tr>
                  
                  {/* Sub-headers */}
                  <tr>
                    <th className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 sticky left-0 bg-asparagus-50 dark:bg-gray-700 z-20"></th>
                    <th className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 sticky left-[120px] bg-asparagus-50 dark:bg-gray-700 z-20"></th>
                    <th className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 sticky left-[320px] bg-asparagus-50 dark:bg-gray-700 z-20"></th>
                    
                    {/* National sub-headers */}
                    <th className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300 text-center border-r dark:border-gray-600">Stock</th>
                    <th className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300 text-center border-r dark:border-gray-600">Replen</th>
                    <th className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300 text-center border-r dark:border-gray-600">DOI</th>
                    <th className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300 text-center border-r dark:border-gray-600">Avg Flow</th>
                    <th className="px-2 py-2 text-xs text-blue-700 dark:text-blue-400 text-center border-r dark:border-gray-600">S-{monthLabels.m0}</th>
                    <th className="px-2 py-2 text-xs text-blue-700 dark:text-blue-400 text-center border-r dark:border-gray-600">S-{monthLabels.m1}</th>
                    <th className="px-2 py-2 text-xs text-blue-700 dark:text-blue-400 text-center border-r dark:border-gray-600">S-{monthLabels.m2}</th>
                    <th className="px-2 py-2 text-xs text-blue-700 dark:text-blue-400 text-center border-r dark:border-gray-600">S-{monthLabels.m3}</th>
                    <th className="px-2 py-2 text-xs text-purple-700 dark:text-purple-400 text-center border-r dark:border-gray-600">L-{monthLabels.m0}</th>
                    <th className="px-2 py-2 text-xs text-purple-700 dark:text-purple-400 text-center border-r dark:border-gray-600">L-{monthLabels.m1}</th>
                    <th className="px-2 py-2 text-xs text-purple-700 dark:text-purple-400 text-center border-r dark:border-gray-600">L-{monthLabels.m2}</th>
                    <th className="px-2 py-2 text-xs text-purple-700 dark:text-purple-400 text-center border-r-2 border-red-300 dark:border-red-600">L-{monthLabels.m3}</th>
                    
                    {/* Branch sub-headers (repeated 35 times) */}
                    {BRANCHES.map(branch => (
                      <Fragment key={`${branch}-subheader`}>
                        <th className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300 text-center border-r dark:border-gray-600">Stock</th>
                        <th className="px-2 py-2 text-xs text-blue-700 dark:text-blue-400 text-center border-r dark:border-gray-600">S-M0</th>
                        <th className="px-2 py-2 text-xs text-blue-700 dark:text-blue-400 text-center border-r dark:border-gray-600">S-M1</th>
                        <th className="px-2 py-2 text-xs text-blue-700 dark:text-blue-400 text-center border-r dark:border-gray-600">S-M2</th>
                        <th className="px-2 py-2 text-xs text-blue-700 dark:text-blue-400 text-center border-r dark:border-gray-600">S-M3</th>
                        <th className="px-2 py-2 text-xs text-purple-700 dark:text-purple-400 text-center border-r dark:border-gray-600">L-M0</th>
                        <th className="px-2 py-2 text-xs text-purple-700 dark:text-purple-400 text-center border-r dark:border-gray-600">L-M1</th>
                        <th className="px-2 py-2 text-xs text-purple-700 dark:text-purple-400 text-center border-r dark:border-gray-600">L-M2</th>
                        <th className="px-2 py-2 text-xs text-purple-700 dark:text-purple-400 text-center border-r dark:border-gray-600">L-M3</th>
                        <th className="px-2 py-2 text-xs text-green-700 dark:text-green-400 text-center border-r dark:border-gray-600">Replen</th>
                        <th className="px-2 py-2 text-xs text-orange-700 dark:text-orange-400 text-center border-r dark:border-gray-600">DOI</th>
                        <th className="px-2 py-2 text-xs text-gray-700 dark:text-gray-300 text-center border-r-2 border-asparagus-300 dark:border-asparagus-600">Avg Flow</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {/* Fixed columns */}
                      <td className="px-3 py-2 font-mono text-sm text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800">
                        {row.kode_item}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 sticky left-[120px] bg-white dark:bg-gray-800 min-w-[200px]">
                        {row.nama_item}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100 sticky left-[320px] bg-white dark:bg-gray-800">
                        {formatCurrency(row.hpp_ref)}
                      </td>
                      
                      {/* National Total data */}
                      <td className="px-2 py-2 text-sm text-right font-semibold text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">
                        {formatNumber(row.Nas_Total_Stock)}
                      </td>
                      <td className={`px-2 py-2 text-sm text-right font-bold border-r dark:border-gray-700 ${
                        row.Nas_Total_Replenish < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {formatNumber(row.Nas_Total_Replenish)}
                      </td>
                      <td className={`px-2 py-2 text-sm text-right font-bold border-r dark:border-gray-700 ${
                        row.Nas_Total_DOI < 30 ? 'text-red-600 dark:text-red-400' :
                        row.Nas_Total_DOI > 90 ? 'text-orange-600 dark:text-orange-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {formatNumber(row.Nas_Total_DOI)}
                      </td>
                      <td className="px-2 py-2 text-sm text-right font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
                        {formatNumber(row.Nas_Avg_Flow)}
                      </td>
                      <td className="px-2 py-2 text-sm text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                        {formatNumber(row.Nas_Sales_M0)}
                      </td>
                      <td className="px-2 py-2 text-sm text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                        {formatNumber(row.Nas_Sales_M1)}
                      </td>
                      <td className="px-2 py-2 text-sm text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                        {formatNumber(row.Nas_Sales_M2)}
                      </td>
                      <td className="px-2 py-2 text-sm text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                        {formatNumber(row.Nas_Sales_M3)}
                      </td>
                      <td className="px-2 py-2 text-sm text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                        {formatNumber(row.Nas_Lain_M0)}
                      </td>
                      <td className="px-2 py-2 text-sm text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                        {formatNumber(row.Nas_Lain_M1)}
                      </td>
                      <td className="px-2 py-2 text-sm text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                        {formatNumber(row.Nas_Lain_M2)}
                      </td>
                      <td className="px-2 py-2 text-sm text-right text-purple-700 dark:text-purple-400 border-r-2 border-red-300 dark:border-red-600">
                        {formatNumber(row.Nas_Lain_M3)}
                      </td>
                      
                      {/* Branch data (35 branches × 12 columns) */}
                      {BRANCHES.map(branch => {
                        const stock = row[`${branch}_Stock`] || 0
                        const replenish = row[`${branch}_Replenish`] || 0
                        const doi = row[`${branch}_DOI`] || 0
                        const sM0 = row[`${branch}_S_M0`] || 0
                        const sM1 = row[`${branch}_S_M1`] || 0
                        const sM2 = row[`${branch}_S_M2`] || 0
                        const sM3 = row[`${branch}_S_M3`] || 0
                        const lM0 = row[`${branch}_L_M0`] || 0
                        const lM1 = row[`${branch}_L_M1`] || 0
                        const lM2 = row[`${branch}_L_M2`] || 0
                        const lM3 = row[`${branch}_L_M3`] || 0
                        // Use pre-calculated Avg Flow from backend
                        const avgFlow = row[`${branch}_Avg_Flow`] || 0
                        
                        return (
                          <Fragment key={`${branch}-${idx}`}>
                            <td className="px-2 py-2 text-sm text-right font-semibold text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">
                              {formatNumber(stock)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                              {formatNumber(sM0)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                              {formatNumber(sM1)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                              {formatNumber(sM2)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right text-blue-700 dark:text-blue-400 border-r dark:border-gray-700">
                              {formatNumber(sM3)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                              {formatNumber(lM0)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                              {formatNumber(lM1)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                              {formatNumber(lM2)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right text-purple-700 dark:text-purple-400 border-r dark:border-gray-700">
                              {formatNumber(lM3)}
                            </td>
                            <td className={`px-2 py-2 text-sm text-right font-bold border-r dark:border-gray-700 ${
                              replenish < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {formatNumber(replenish)}
                            </td>
                            <td className={`px-2 py-2 text-sm text-right font-bold border-r dark:border-gray-700 ${
                              doi < 30 ? 'text-red-600 dark:text-red-400' :
                              doi > 90 ? 'text-orange-600 dark:text-orange-400' :
                              'text-green-600 dark:text-green-400'
                            }`}>
                              {formatNumber(doi)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right font-semibold text-gray-700 dark:text-gray-300 border-r-2 border-asparagus-300 dark:border-asparagus-600">
                              {formatNumber(avgFlow)}
                            </td>
                          </Fragment>
                        )
                      })}
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

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-asparagus-600 text-white rounded-md hover:bg-asparagus-700 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-asparagus-600 text-white rounded-md hover:bg-asparagus-700 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
