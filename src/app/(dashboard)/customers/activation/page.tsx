'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/common/AuthGuard'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/common/ToastProvider'
import { Customer } from '@/types/customer'
import { AreaFilter } from '@/components/filters'

interface SearchFilters {
  customer_id: string
  customer_name: string
  branch: string
  rayon: string
}

interface SuccessModalData {
  customerName: string
  email: string
  password: string
}

export default function CustomerActivationPage() {
  const { user } = useAuthStore()
  const { showToast } = useToast()

  // Search & Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    customer_id: '',
    customer_name: '',
    branch: '',
    rayon: ''
  })
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Results state
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showList, setShowList] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Activation form state
  const [email, setEmail] = useState('')
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [activating, setActivating] = useState(false)

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState<SuccessModalData | null>(null)

  // 🔒 Auto-select branch if user has only 1 allowed branch
  useEffect(() => {
    if (user?.allowed_branches && user.allowed_branches.length === 1) {
      const singleBranch = user.allowed_branches[0]
      setFilters(prev => ({ ...prev, branch: singleBranch }))
      console.log('🔒 [ACTIVATION] Auto-selected single allowed branch:', singleBranch)
    }
  }, [user?.allowed_branches])

  // Get activation status badge
  const getStatusBadge = (customer: Customer) => {
    const status = customer.activation_status || 'Unknown'
    
    if (status === 'Activated') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          ✓ Activated
        </span>
      )
    } else if (status.includes('Pending') || status.includes('Dummy')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          ⏳ Pending (Dummy)
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          ○ Not Registered
        </span>
      )
    }
  }

  // Handle filter change
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Handle search
  const handleSearch = async () => {
    const hasFilter = Object.values(filters).some(v => v.trim().length > 0)
    if (!hasFilter) {
      showToast.warning('Filter required', 'Please enter at least one search criteria')
      return
    }

    setSearchLoading(true)
    setShowList(false)
    setShowForm(false)
    setSelectedCustomer(null)
    setCurrentPage(1) // Reset to first page on new search

    try {
      const params = new URLSearchParams()
      if (filters.customer_id.trim()) params.append('customer_id', filters.customer_id.trim())
      if (filters.customer_name.trim()) params.append('name', filters.customer_name.trim())
      if (filters.branch.trim()) params.append('branch', filters.branch.trim())
      if (filters.rayon.trim()) params.append('rayon', filters.rayon.trim())

      const response = await fetch(`/api/customers/activation/search?${params.toString()}`)
      const data = await response.json()

      if (data.success && data.customers) {
        if (data.customers.length === 0) {
          showToast.info('No results', 'No customers found with the given criteria')
          setSearchResults([])
        } else if (data.customers.length === 1 && filters.customer_id.trim()) {
          // Direct to form if customer_id is unique
          const customer = data.customers[0]
          
          // Check if primary_address is empty or null
          if (!customer.primary_address || customer.primary_address.trim() === '') {
            showToast.error(
              'Primary Address Required',
              'This customer does not have a primary address set. Please ask admin to set the primary address in ERP first before activation.'
            )
            setSearchResults([customer]) // Show in list so user can see the customer
            setShowList(true)
          } else if (!customer.custom_rayon || customer.custom_rayon.trim() === '') {
            showToast.error(
              'Rayon Required',
              'This customer does not have a rayon assigned. Please ask admin to set the rayon in ERP first before activation.'
            )
            setSearchResults([customer]) // Show in list so user can see the customer
            setShowList(true)
          } else {
            setSelectedCustomer(customer)
            setEmail(customer.custom_login_email || customer.email_id || '')
            setEmailConfirmed(false)
            setShowForm(true)
            showToast.success('Customer found', `Found: ${customer.customer_name}`)
          }
        } else {
          // Show list for multiple results
          setSearchResults(data.customers)
          setShowList(true)
          showToast.success('Search complete', `Found ${data.customers.length} customers`)
        }
      } else {
        showToast.error('Search failed', data.error || 'Failed to search customers')
      }
    } catch (error) {
      console.error('Search error:', error)
      showToast.error('Search failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setSearchLoading(false)
    }
  }

  // Handle select customer from list
  const handleSelectCustomer = (customer: Customer) => {
    // Check if primary_address is empty or null
    if (!customer.primary_address || customer.primary_address.trim() === '') {
      showToast.error(
        'Primary Address Required',
        'This customer does not have a primary address set. Please ask admin to set the primary address in ERP first before activation.'
      )
      return
    }

    // Check if rayon is empty or null
    if (!customer.custom_rayon || customer.custom_rayon.trim() === '') {
      showToast.error(
        'Rayon Required',
        'This customer does not have a rayon assigned. Please ask admin to set the rayon in ERP first before activation.'
      )
      return
    }

    setSelectedCustomer(customer)
    setEmail(customer.custom_login_email || customer.email_id || '')
    setEmailConfirmed(false)
    setShowList(false)
    setShowForm(true)
  }

  // Handle activation submit
  const handleActivate = async () => {
    if (!selectedCustomer) return

    // Validation
    if (!email || !email.includes('@')) {
      showToast.warning('Invalid email', 'Please enter a valid email address')
      return
    }

    setActivating(true)

    try {
      // Get linked user ID if exists
      const linkedUserId = selectedCustomer.linked_user_account?.user_id || null

      const response = await fetch('/api/customers/activation/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: selectedCustomer.name,
          email: email,
          update_customer_email: !emailConfirmed, // Update if email not confirmed (was changed)
          linked_user_id: linkedUserId // Pass existing linked user if available
        })
      })

      const data = await response.json()

      if (data.success) {
        // Show success modal with password
        setSuccessData({
          customerName: selectedCustomer.customer_name,
          email: email,
          password: data.data.default_password
        })
        setShowSuccessModal(true)
      } else {
        showToast.error('Activation failed', data.error || 'Failed to activate customer')
      }
    } catch (error) {
      console.error('Activation error:', error)
      showToast.error('Activation failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setActivating(false)
    }
  }

  // Handle success modal close
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    setSuccessData(null)
    handleReset()
  }

  // Handle download PDF
  const handleDownloadPDF = () => {
    if (!successData) return

    // Create simple text content for PDF
    const content = `
CUSTOMER ACTIVATION SUCCESS
===========================

Customer: ${successData.customerName}
Email: ${successData.email}
Password: ${successData.password}

IMPORTANT NOTES:
- Please save this password securely
- Customer can change password in STEC mobile app
- Contact support if you need assistance

Generated: ${new Date().toLocaleString('id-ID')}
    `.trim()

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activation-${successData.email}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast.success('Downloaded', 'Activation data downloaded successfully')
  }

  // Handle reset
  const handleReset = () => {
    setFilters({
      customer_id: '',
      customer_name: '',
      branch: '',
      rayon: ''
    })
    setSearchResults([])
    setSelectedCustomer(null)
    setShowList(false)
    setShowForm(false)
    setEmail('')
    setEmailConfirmed(false)
    setCurrentPage(1)
  }

  // Handle back to list
  const handleBackToList = () => {
    setSelectedCustomer(null)
    setShowForm(false)
    setShowList(true)
    setEmail('')
    setEmailConfirmed(false)
  }

  // Check permission
  const hasAccess = user?.permissions.includes('admin') || user?.permissions.includes('sales')

  if (!hasAccess) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">
                Access Restricted
              </h2>
              <p className="text-jet-600 dark:text-gray-300">
                You don't have permission to access customer activation.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-isabelline via-white to-champagne-50 dark:from-dark-bg dark:via-dark-surface dark:to-jet-800">
          {/* Header */}
          <div className="sticky top-0 z-30 bg-gradient-to-r from-asparagus to-asparagus-700 dark:from-asparagus-600 dark:to-asparagus-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white dark:bg-dark-surface rounded-lg shadow-md">
                    <svg className="h-6 w-6 text-asparagus-600 dark:text-asparagus-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Customer Activation</h1>
                    <p className="text-sm text-asparagus-100 dark:text-asparagus-200">
                      Activate mobile app access for customers (STEC App)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-6">
              {/* Search Filters */}
              <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
                <h2 className="text-lg font-semibold text-jet-800 dark:text-white mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-asparagus-600 dark:text-asparagus-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Customer
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-1">
                      Customer ID
                    </label>
                    <input
                      type="text"
                      value={filters.customer_id}
                      onChange={(e) => handleFilterChange('customer_id', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="e.g., CUST-00001"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-asparagus-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={filters.customer_name}
                      onChange={(e) => handleFilterChange('customer_name', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="e.g., Salon ABC"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-asparagus-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-1">
                      Branch {user?.allowed_branches && user.allowed_branches.length === 1 && (
                        <span className="text-xs text-asparagus-600 dark:text-asparagus-400 ml-1">(Auto-selected)</span>
                      )}
                    </label>
                    <AreaFilter
                      selectedArea={filters.branch}
                      areaType="branch"
                      onAreaChange={(value) => handleFilterChange('branch', value)}
                      placeholder="Search branch..."
                      showAllOption={false}
                      disabled={user?.allowed_branches && user.allowed_branches.length === 1}
                      allowedBranches={user?.allowed_branches}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-1">
                      Rayon
                    </label>
                    <input
                      type="text"
                      value={filters.rayon}
                      onChange={(e) => handleFilterChange('rayon', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="e.g., R01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-asparagus-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-jet-600 dark:text-gray-400">
                    * At least one filter is required
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSearch}
                      disabled={searchLoading}
                      className="px-4 py-2 bg-asparagus-600 text-white rounded-md hover:bg-asparagus-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {searchLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Search
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Results List */}
              {showList && searchResults.length > 0 && (() => {
                // Pagination logic
                const startIndex = (currentPage - 1) * pageSize
                const endIndex = startIndex + pageSize
                const paginatedResults = searchResults.slice(startIndex, endIndex)
                const totalPages = Math.ceil(searchResults.length / pageSize)

                return (
                  <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-champagne-200 dark:border-dark-border overflow-hidden">
                    {/* Header */}
                    <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h2 className="text-lg font-semibold text-jet-800 dark:text-white">
                          Search Results ({searchResults.length})
                        </h2>
                        
                        {/* Page Size Selector */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600 dark:text-gray-400">
                            Show:
                          </label>
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value))
                              setCurrentPage(1)
                            }}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-asparagus-500"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Grid Cards - Mobile First */}
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedResults.map((customer) => (
                          <div
                            key={customer.name}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            {/* Status Badge */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">
                                  Customer ID
                                </p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {customer.custom_customer_id || '-'}
                                </p>
                              </div>
                              {getStatusBadge(customer)}
                            </div>

                            {/* Customer Name */}
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">
                                Name
                              </p>
                              <p className="text-base font-medium text-gray-900 dark:text-white line-clamp-2">
                                {customer.customer_name}
                              </p>
                            </div>

                            {/* Branch & Rayon */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">
                                  Branch
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {customer.custom_branch || '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">
                                  Rayon
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {customer.custom_rayon || '-'}
                                </p>
                              </div>
                            </div>

                            {/* Validation Warnings */}
                            {(!customer.primary_address || customer.primary_address.trim() === '') && (
                              <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-start">
                                  <svg className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <span className="font-medium">No Primary Address, Contact Admin To Fill Required Address Data</span>
                                </p>
                              </div>
                            )}
                            {(!customer.custom_rayon || customer.custom_rayon.trim() === '') && (
                              <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-start">
                                  <svg className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <span className="font-medium">No Rayon Assigned</span>
                                </p>
                              </div>
                            )}
                            {((!customer.primary_address || customer.primary_address.trim() === '') || (!customer.custom_rayon || customer.custom_rayon.trim() === '')) && (
                              <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                  ⚠️ Contact Admin to fix the issues above
                                </p>
                              </div>
                            )}

                            {/* Action Button */}
                            <button
                              onClick={() => handleSelectCustomer(customer)}
                              disabled={(!customer.primary_address || customer.primary_address.trim() === '') || (!customer.custom_rayon || customer.custom_rayon.trim() === '')}
                              className={`w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                (!customer.primary_address || customer.primary_address.trim() === '') || (!customer.custom_rayon || customer.custom_rayon.trim() === '')
                                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                  : 'bg-asparagus-600 text-white hover:bg-asparagus-700'
                              }`}
                            >
                              {(!customer.primary_address || customer.primary_address.trim() === '') || (!customer.custom_rayon || customer.custom_rayon.trim() === '') ? (
                                <>
                                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Blocked
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  {customer.activation_status === 'Activated' ? 'View/Edit' : 'Select'}
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(endIndex, searchResults.length)}</span> of{' '}
                            <span className="font-medium">{searchResults.length}</span> results
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Previous
                            </button>
                            
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum
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
                                  <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                      currentPage === pageNum
                                        ? 'bg-asparagus-600 text-white'
                                        : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                )
                              })}
                            </div>
                            
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions Summary */}
                    <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                          💡 <strong>Tip:</strong> Click the button on any card to activate or edit that customer
                        </p>
                        <button
                          onClick={handleReset}
                          className="text-sm text-asparagus-600 hover:text-asparagus-700 dark:text-asparagus-400 dark:hover:text-asparagus-300 font-medium whitespace-nowrap"
                        >
                          New Search
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Activation Form */}
              {showForm && selectedCustomer && (
                <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-6 border border-champagne-200 dark:border-dark-border">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-jet-800 dark:text-white flex items-center">
                      <svg className="h-5 w-5 mr-2 text-asparagus-600 dark:text-asparagus-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Customer Activation
                    </h2>
                    {showList && (
                      <button
                        onClick={handleBackToList}
                        className="text-sm text-asparagus-600 hover:text-asparagus-700 dark:text-asparagus-400 dark:hover:text-asparagus-300"
                      >
                        ← Back to List
                      </button>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Customer ID</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCustomer.custom_customer_id || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Customer Name</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCustomer.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCustomer.custom_branch || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rayon</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCustomer.custom_rayon || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Current Status</p>
                        <div className="mt-1">{getStatusBadge(selectedCustomer)}</div>
                      </div>
                      {selectedCustomer.linked_user_account && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Linked User</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCustomer.linked_user_account.user_id}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Activation Form */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <p className="font-medium mb-1">Activation Process:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>If email is incorrect, uncheck the confirmation box and edit it</li>
                            <li>Customer can change password later in STEC mobile app</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-gray-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setEmailConfirmed(false) // Reset confirmation if email changed
                        }}
                        disabled={emailConfirmed}
                        placeholder="customer@example.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-asparagus-500 focus:border-transparent
                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emailConfirm"
                        checked={emailConfirmed}
                        onChange={(e) => setEmailConfirmed(e.target.checked)}
                        className="h-4 w-4 text-asparagus-600 focus:ring-asparagus-500 border-gray-300 rounded"
                      />
                      <label htmlFor="emailConfirm" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        Email address is correct (confirm before activation)
                      </label>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4">
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleActivate}
                        disabled={activating || !email}
                        className="px-6 py-2 bg-asparagus-600 text-white rounded-md hover:bg-asparagus-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {activating ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Activating...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Activate Customer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && successData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-green-500 dark:border-green-600">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Activation Successful! 🎉
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customer has been activated for STEC mobile app
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-semibold mb-2">⚠️ IMPORTANT - Save This Information!</p>
                    <div className="space-y-1">
                      <p><strong>Customer:</strong> {successData.customerName}</p>
                      <p><strong>Email:</strong> {successData.email}</p>
                      <p><strong>Password:</strong> <span className="font-mono bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">{successData.password}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 Customer can change password in <strong>STEC mobile app</strong> after first login
                </p>
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Activation Data (TXT)
                </button>
                <button
                  onClick={handleCloseSuccessModal}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
