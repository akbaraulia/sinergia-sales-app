'use client'

import { useState, useEffect } from 'react'

interface RawRow {
  company: string
  branch_code: string
  branch_name: string
  warehouse: string
  item_code: string
  item_name: string
  current_qty: number
  current_stock_value: number
  delivery_note_qty_m0: number
  delivery_note_qty_m1: number
  delivery_note_qty_m2: number
  delivery_note_qty_m3: number
  material_issue_qty_m0: number
  material_issue_qty_m1: number
  material_issue_qty_m2: number
  material_issue_qty_m3: number
  adjusted_current_qty: number
  avg_flow_m1_to_m3: number
  doi_adjusted: number | null
}

export default function RawDataDebugPage() {
  const [rawData, setRawData] = useState<RawRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(50)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table')

  useEffect(() => {
    fetchRawData()
  }, [])

  const fetchRawData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      params.append('limit', limit.toString())
      params.append('raw', 'true') // Flag to get raw data

      const response = await fetch(`/api/reports/replenishment/raw?${params}`)
      const result = await response.json()

      if (result.success && result.data) {
        setRawData(result.data)
      } else {
        setError(result.error || 'Failed to fetch raw data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  const downloadJSON = () => {
    const json = JSON.stringify(rawData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `raw-data-${new Date().toISOString()}.json`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-[98vw] mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 RAW Data Debug - Replenishment Query
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Data mentah SEBELUM di-pivot - Satu row = satu item di satu warehouse
          </p>
          <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            ⚠️ Data ini belum di-pivot! Tiap item bisa muncul berkali-kali (per warehouse)
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔍 Search (Item Code, Name, Warehouse)
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari item..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Limit
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={500}>500 rows</option>
              </select>
            </div>
            <button
              onClick={fetchRawData}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              🔄 Refresh
            </button>
            <button
              onClick={downloadJSON}
              disabled={rawData.length === 0}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              📥 Download JSON
            </button>
            <div className="flex gap-2 border-l pl-4 ml-4">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                📊 Table View
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'json' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                📄 JSON View
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Rows</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{rawData.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">Unique Items</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(rawData.map(r => r.item_code)).size}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">Unique Warehouses</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(rawData.map(r => r.warehouse)).size}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">Unique Branches</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(rawData.map(r => r.branch_name)).size}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading raw data...</p>
          </div>
        )}

        {/* Table View */}
        {!loading && !error && viewMode === 'table' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-r">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-r">Company</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-r">Branch</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-r">Branch Code</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-r">Warehouse</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-r">Item Code</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-r min-w-[200px]">Item Name</th>
                    <th className="px-3 py-2 text-right font-semibold text-blue-700 dark:text-blue-400 border-r">Current Qty</th>
                    <th className="px-3 py-2 text-right font-semibold text-blue-700 dark:text-blue-400 border-r">Stock Value</th>
                    <th className="px-3 py-2 text-right font-semibold text-green-700 dark:text-green-400 border-r">DN M0</th>
                    <th className="px-3 py-2 text-right font-semibold text-green-700 dark:text-green-400 border-r">DN M1</th>
                    <th className="px-3 py-2 text-right font-semibold text-green-700 dark:text-green-400 border-r">DN M2</th>
                    <th className="px-3 py-2 text-right font-semibold text-green-700 dark:text-green-400 border-r">DN M3</th>
                    <th className="px-3 py-2 text-right font-semibold text-purple-700 dark:text-purple-400 border-r">MI M0</th>
                    <th className="px-3 py-2 text-right font-semibold text-purple-700 dark:text-purple-400 border-r">MI M1</th>
                    <th className="px-3 py-2 text-right font-semibold text-purple-700 dark:text-purple-400 border-r">MI M2</th>
                    <th className="px-3 py-2 text-right font-semibold text-purple-700 dark:text-purple-400 border-r">MI M3</th>
                    <th className="px-3 py-2 text-right font-semibold text-orange-700 dark:text-orange-400 border-r">Avg Flow</th>
                    <th className="px-3 py-2 text-right font-semibold text-red-700 dark:text-red-400">DOI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rawData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400 border-r">{idx + 1}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100 border-r">{row.company}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100 border-r">{row.branch_name}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100 border-r font-mono">{row.branch_code}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100 border-r">{row.warehouse}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100 border-r font-mono">{row.item_code}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100 border-r">{row.item_name}</td>
                      <td className="px-3 py-2 text-right text-blue-700 dark:text-blue-400 border-r font-semibold">{formatNumber(row.current_qty)}</td>
                      <td className="px-3 py-2 text-right text-blue-700 dark:text-blue-400 border-r">{formatNumber(row.current_stock_value)}</td>
                      <td className="px-3 py-2 text-right text-green-700 dark:text-green-400 border-r">{formatNumber(row.delivery_note_qty_m0)}</td>
                      <td className="px-3 py-2 text-right text-green-700 dark:text-green-400 border-r">{formatNumber(row.delivery_note_qty_m1)}</td>
                      <td className="px-3 py-2 text-right text-green-700 dark:text-green-400 border-r">{formatNumber(row.delivery_note_qty_m2)}</td>
                      <td className="px-3 py-2 text-right text-green-700 dark:text-green-400 border-r">{formatNumber(row.delivery_note_qty_m3)}</td>
                      <td className="px-3 py-2 text-right text-purple-700 dark:text-purple-400 border-r">{formatNumber(row.material_issue_qty_m0)}</td>
                      <td className="px-3 py-2 text-right text-purple-700 dark:text-purple-400 border-r">{formatNumber(row.material_issue_qty_m1)}</td>
                      <td className="px-3 py-2 text-right text-purple-700 dark:text-purple-400 border-r">{formatNumber(row.material_issue_qty_m2)}</td>
                      <td className="px-3 py-2 text-right text-purple-700 dark:text-purple-400 border-r">{formatNumber(row.material_issue_qty_m3)}</td>
                      <td className="px-3 py-2 text-right text-orange-700 dark:text-orange-400 border-r">{formatNumber(row.avg_flow_m1_to_m3)}</td>
                      <td className={`px-3 py-2 text-right font-bold ${
                        row.doi_adjusted !== null && row.doi_adjusted < 30 ? 'text-red-600' :
                        row.doi_adjusted !== null && row.doi_adjusted > 90 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {formatNumber(row.doi_adjusted)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rawData.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                📭 No raw data
              </div>
            )}
          </div>
        )}

        {/* JSON View - FULL RAW DB NAMING */}
        {!loading && !error && viewMode === 'json' && (
          <div className="bg-gray-900 rounded-lg shadow-sm overflow-hidden">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-sm font-semibold text-gray-300">📄 Pure JSON - Database Column Names</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Ini naming asli dari database query, belum dikasih header apapun! 🔥
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(rawData, null, 2))
                    alert(`✅ Copied ${rawData.length} rows to clipboard!`)
                  }}
                  className="text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  📋 Copy All ({rawData.length} rows)
                </button>
                <button
                  onClick={() => {
                    const beautified = JSON.stringify(rawData, null, 2)
                    const blob = new Blob([beautified], { type: 'application/json' })
                    const link = document.createElement('a')
                    link.href = URL.createObjectURL(blob)
                    link.download = `raw-data-db-naming-${new Date().toISOString()}.json`
                    link.click()
                  }}
                  className="text-xs px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
                >
                  💾 Save JSON
                </button>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono leading-relaxed">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
            {rawData.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                📭 No data
              </div>
            )}
          </div>
        )}

        {/* Quick JSON Preview (only in table mode) */}
        {!loading && !error && viewMode === 'table' && rawData.length > 0 && (
          <div className="mt-6 bg-gray-900 rounded-lg shadow-sm p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-300">📄 Quick JSON Preview (first 3 rows)</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(rawData.slice(0, 3), null, 2))
                    alert('✅ Copied 3 rows to clipboard!')
                  }}
                  className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  👁️ View Full JSON
                </button>
              </div>
            </div>
            <pre className="text-xs text-green-400 overflow-x-auto max-h-96 font-mono">
              {JSON.stringify(rawData.slice(0, 3), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
