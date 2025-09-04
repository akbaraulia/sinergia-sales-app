'use client'

import React from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/Table'
import { useToast } from '@/components/common/ToastProvider'

export default function SalonDashboard() {
  const { showToast } = useToast()

  const salonStats = [
    {
      title: 'Total Point',
      value: '12,450',
      change: '+15.2%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      title: 'Active Contracts',
      value: '28',
      change: '+8.1%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Revenue This Month',
      value: 'Rp 18,450,000',
      change: '+22.5%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      title: 'Active Outlets',
      value: '5',
      change: '0%',
      changeType: 'neutral' as const,
      icon: (
        <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2 0H3m2-5.5V21m0-16H5a2 2 0 00-2 2v14a2 2 0 002 2h2.28" />
        </svg>
      )
    }
  ]

  const salonContracts = [
    { 
      id: 'SC-2024-001', 
      customerName: 'Sarah Wijaya', 
      contractType: 'The Club Premium', 
      startDate: '2024-01-10',
      endDate: '2024-07-10',
      status: 'active',
      remainingPoints: 450
    },
    { 
      id: 'SC-2024-002', 
      customerName: 'Maya Sari', 
      contractType: 'Basic Package', 
      startDate: '2024-01-12',
      endDate: '2024-04-12',
      status: 'expired',
      remainingPoints: 0
    },
    { 
      id: 'SC-2024-003', 
      customerName: 'Linda Kusuma', 
      contractType: 'The Club VIP', 
      startDate: '2024-01-15',
      endDate: '2024-12-15',
      status: 'active',
      remainingPoints: 1250
    },
    { 
      id: 'SC-2024-004', 
      customerName: 'Dewi Anggraini', 
      contractType: 'Standard Care', 
      startDate: '2024-01-18',
      endDate: '2024-06-18',
      status: 'pending',
      remainingPoints: 800
    }
  ]

  const contractColumns = [
    { key: 'id' as const, label: 'Contract ID', sortable: true },
    { key: 'customerName' as const, label: 'Customer', sortable: true },
    { key: 'contractType' as const, label: 'Package Type', sortable: true },
    { 
      key: 'status' as const, 
      label: 'Status', 
      render: (value: string) => {
        const statusMap: { [key: string]: any } = {
          'active': 'approved',
          'expired': 'rejected',
          'pending': 'pending'
        }
        return <StatusBadge status={statusMap[value] || 'draft'} />
      }
    },
    { 
      key: 'remainingPoints' as const, 
      label: 'Points Left',
      render: (value: number) => (
        <Badge variant={value > 0 ? 'success' : 'error'}>
          {value} pts
        </Badge>
      )
    },
    { key: 'endDate' as const, label: 'End Date', sortable: true },
  ]

  const salonOutlets = [
    { name: 'Sinergia Salon Sudirman', class: 'Premium', activeContracts: 12 },
    { name: 'Sinergia Salon Kelapa Gading', class: 'Standard', activeContracts: 8 },
    { name: 'Sinergia Salon PIK', class: 'Premium', activeContracts: 15 },
    { name: 'Sinergia Salon Senayan', class: 'VIP', activeContracts: 6 },
    { name: 'Sinergia Salon Kemang', class: 'Standard', activeContracts: 9 }
  ]

  const quickSalonActions = [
    {
      title: 'New Contract',
      description: 'Create new salon contract',
      href: '/salon/contracts/new',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      title: 'Point History',
      description: 'View customer point usage',
      href: '/salon/points',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: 'Sales Report',
      description: 'View salon revenue report',
      href: '/salon/reports',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
  ]

  const handleContractClick = (contract: typeof salonContracts[0]) => {
    showToast.info(`Opening contract ${contract.id}`, 'Contract Details')
  }

  return (
    <AuthGuard requiredPermissions={['salon:read']}>
      <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Salon Dashboard 💄
              </h1>
              <p className="opacity-90">
                Monitor salon performance and customer contracts
              </p>
            </div>
            <Button 
              variant="outline" 
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => showToast.success('Salon data refreshed!')}
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {salonStats.map((stat, index) => (
            <div key={index} className="stats-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.changeType === 'increase' ? '↗' : stat.changeType === 'decrease' ? '↘' : '→'} {stat.change}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">vs last month</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickSalonActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-purple-600">
                    {action.icon}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Contracts</h2>
            <Button variant="outline" size="sm">
              View All Contracts
            </Button>
          </div>
          <DataTable
            data={salonContracts}
            columns={contractColumns}
            onRowClick={handleContractClick}
            emptyMessage="No contracts found"
          />
        </div>

        {/* Salon Outlets */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Salon Outlets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salonOutlets.map((outlet, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{outlet.name}</h3>
                  <Badge variant={outlet.class === 'VIP' ? 'success' : outlet.class === 'Premium' ? 'warning' : 'default'}>
                    {outlet.class}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Active Contracts: <span className="font-medium">{outlet.activeContracts}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}
