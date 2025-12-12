'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/common/ToastProvider'

// Recipient stored in SQLite (no email)
interface Recipient {
  id: number
  employee_id: string
  employee_name: string
  designation: string | null
  created_at: string
}

// Employee options from ERP (for dropdown)
interface EmployeeOption {
  employee_id: string
  employee_name: string
  department: string | null
  designation: string
  user_email: string
  user_full_name: string
  mobile_no: string | null
}

export default function ReportRecipientsPage() {
  const { showToast } = useToast()
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [adding, setAdding] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Fetch recipients from SQLite
  const fetchRecipients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/report-recipients')
      const data = await response.json()

      if (data.success) {
        setRecipients(data.data)
      } else {
        showToast.error('Failed to load recipients', data.error)
      }
    } catch (error) {
      showToast.error('Error loading recipients', 'Please try again')
      console.error('Fetch recipients error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch employee options from ERP (for dropdown) via proxy API
  const fetchEmployeeOptions = async () => {
    try {
      setLoadingEmployees(true)
      
      // Use proxy API route to avoid CORS
      const response = await fetch('/api/settings/employees', {
        credentials: 'include', // Include cookies for ERP auth
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()

      if (data.success && data.data) {
        setEmployeeOptions(data.data)
        console.log(`✅ Loaded ${data.data.length} employees`)
      } else {
        console.warn('⚠️ No employees found')
        showToast.error('No employees found', data.error || 'Please try again')
      }
    } catch (error) {
      console.error('❌ Fetch employees error:', error)
      showToast.error('Failed to load employee list', error instanceof Error ? error.message : 'Please refresh page')
    } finally {
      setLoadingEmployees(false)
    }
  }

  useEffect(() => {
    fetchRecipients()
    fetchEmployeeOptions()
  }, [])

  // Add recipient
  const handleAddRecipient = async () => {
    if (!selectedEmployee) {
      showToast.error('Employee required', 'Please select an employee')
      return
    }

    try {
      setAdding(true)
      const response = await fetch('/api/settings/report-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmployee.employee_id,
          employee_name: selectedEmployee.employee_name,
          designation: selectedEmployee.designation,
        }),
      })

      const data = await response.json()

      if (data.success) {
        showToast.success('Recipient added!', 'Will receive automated reports')
        setSelectedEmployee(null)
        setShowAddForm(false)
        fetchRecipients()
      } else {
        showToast.error('Failed to add recipient', data.error)
      }
    } catch (error) {
      showToast.error('Error adding recipient', 'Please try again')
      console.error('Add recipient error:', error)
    } finally {
      setAdding(false)
    }
  }

  // Remove recipient
  const handleRemoveRecipient = async (employee_id: string, employee_name: string) => {
    if (!confirm(`Remove ${employee_name} from recipients?`)) return

    try {
      const response = await fetch(`/api/settings/report-recipients?employee_id=${encodeURIComponent(employee_id)}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        showToast.success('Recipient removed', 'No longer receiving reports')
        fetchRecipients()
      } else {
        showToast.error('Failed to remove recipient', data.error)
      }
    } catch (error) {
      showToast.error('Error removing recipient', 'Please try again')
      console.error('Remove recipient error:', error)
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-asparagus to-asparagus-dark rounded-lg shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                  📧 Report Recipients
                </h1>
                <p className="text-sm md:text-base text-white/90 dark:text-white/80 mt-1 drop-shadow-sm">
                  Manage email recipients for automated report delivery
                </p>
              </div>
              
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                size="sm"
                variant="secondary"
                className="bg-white/95 hover:bg-white text-asparagus-700 hover:text-asparagus-800 border border-white/80 hover:border-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Recipient
              </Button>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4 md:p-6 border border-gray-200 dark:border-dark-border">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add New Recipient
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-asparagus"
                  value={selectedEmployee?.employee_id || ''}
                  onChange={(e) => {
                    const emp = employeeOptions.find(opt => opt.employee_id === e.target.value)
                    setSelectedEmployee(emp || null)
                  }}
                  disabled={adding || loadingEmployees}
                >
                  <option value="">{loadingEmployees ? 'Loading employees...' : '-- Select Employee --'}</option>
                  {employeeOptions.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.employee_name} ({emp.user_email}) - {emp.designation}
                    </option>
                  ))}
                </select>
                
                {selectedEmployee && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>ID:</strong> {selectedEmployee.employee_id}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Name:</strong> {selectedEmployee.employee_name}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Email:</strong> {selectedEmployee.user_email}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Designation:</strong> {selectedEmployee.designation}
                    </p>
                    {selectedEmployee.department && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Department:</strong> {selectedEmployee.department}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddRecipient}
                  disabled={adding || !selectedEmployee}
                  size="sm"
                >
                  {adding ? 'Adding...' : 'Add Recipient'}
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false)
                    setSelectedEmployee(null)
                  }}
                  variant="outline"
                  size="sm"
                  disabled={adding}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Recipients Table */}
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-asparagus mx-auto mb-2"></div>
                  Loading recipients...
                </div>
              ) : recipients.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="font-medium">No recipients yet</p>
                  <p className="text-sm mt-1">Add employees to receive automated reports</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Added
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
                    {recipients.map((recipient) => (
                      <tr key={recipient.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {recipient.employee_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {recipient.employee_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {recipient.designation || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(recipient.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveRecipient(recipient.employee_id, recipient.employee_name)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 m-4">
              <div className="flex">
                <svg className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    About Automated Reports
                  </h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                    Recipients listed here will receive automated replenishment reports via email. 
                    Reports are triggered by cronjob and include the last 30 days of data in CSV format.
                    Email addresses are fetched from ERP in real-time (not stored locally for security).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
