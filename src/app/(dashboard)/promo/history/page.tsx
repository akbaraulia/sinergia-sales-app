'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/common/AuthGuard'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/common/ToastProvider'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils/format'

// Form Bebas Pilih item interface
interface FormBebasPilihItem {
  name: string
  kode: string
  brand: string
  customer_code: string
  branch: string
  sales_person_name: string
  nilai: number
  total_harga: number
  status: string
  creation: string
  modified: string
  owner: string
}

export default function FormBebasPilihListPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user } = useAuthStore()
  
  // State
  const [forms, setForms] = useState<FormBebasPilihItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  
  // Static date - always today (24 hours filter handled by server)
  const todayDate = new Date().toISOString().split('T')[0]
  
  // Fetch forms from API
  const fetchForms = useCallback(async () => {
    if (!user?.email) {
      console.log('⚠️ [FORM_LIST] No user email available')
      setError('User not logged in')
      setLoading(false)
      return
    }
    
    console.log('📋 [FORM_LIST] Fetching forms for:', user.email, 'date:', todayDate)
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/erp/form-bebas-pilih-list?created_by=${encodeURIComponent(user.email)}&created_at=${encodeURIComponent(todayDate)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      )
      
      console.log('📡 [FORM_LIST] API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📦 [FORM_LIST] Data received:', data)
      
      if (data.success) {
        // Ensure data is array - handle different response structures
        const formData = Array.isArray(data.data) ? data.data : []
        setForms(formData)
        console.log('✅ [FORM_LIST] Forms loaded:', formData.length)
      } else {
        throw new Error(data.error || 'Failed to fetch forms')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load forms'
      console.error('❌ [FORM_LIST] Error:', errorMessage)
      setError(errorMessage)
      showToast.error('Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.email, todayDate])
  
  // Initial fetch
  useEffect(() => {
    fetchForms()
  }, [fetchForms])
  
  // Copy document name to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(text)
    setTimeout(() => setCopySuccess(null), 2000)
    showToast.success('Tersalin!', `${text} telah disalin ke clipboard`)
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Get status badge variant
  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success'
      case 'draft':
        return 'warning'
      case 'rejected':
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  // Check permissions
  const canViewForms = user?.permissions && user.permissions.length > 0

  if (!canViewForms) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Akses Ditolak
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Anda tidak memiliki akses untuk melihat halaman ini.
            </p>
          </div>
        </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Riwayat Form Bebas Pilih
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Daftar form bebas pilih yang Anda buat
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Static date info badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Hari ini: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          {/* Refresh Button */}
          <Button
            onClick={fetchForms}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <svg 
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          
          {/* Create New Button */}
          <Button
            onClick={() => router.push('/promo')}
            className="flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Baru
          </Button>
        </div>
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Menampilkan form yang dibuat oleh <strong>{user?.email}</strong> dalam <strong>24 jam terakhir</strong>
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Data di-filter otomatis berdasarkan tanggal hari ini ({todayDate})
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Memuat data...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Gagal Memuat Data</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchForms} variant="outline">
            Coba Lagi
          </Button>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Tidak Ada Data</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Belum ada form bebas pilih yang dibuat pada tanggal ini.
          </p>
          <Button onClick={() => router.push('/promo')}>
            Buat Form Baru
          </Button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Form Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{forms.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Nilai Voucher</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(forms.reduce((sum, f) => sum + (Number(f.nilai) || 0), 0))}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      No. Dokumen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kode Voucher
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nilai Voucher
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Harga
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {forms.map((form, index) => (
                    <tr key={form.name || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                            {form.name}
                          </span>
                          <button
                            onClick={() => copyToClipboard(form.name)}
                            className={`p-1 rounded transition-colors ${
                              copySuccess === form.name
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                            title="Salin nomor dokumen"
                          >
                            {copySuccess === form.name ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {form.kode || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {form.customer_code || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {form.branch || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(form.nilai || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(form.total_harga || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getStatusVariant(form.status)}>
                          {form.status || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(form.creation)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => copyToClipboard(form.name)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
