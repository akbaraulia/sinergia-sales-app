'use client'

import React from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/Table'
import { useToast } from '@/components/common/ToastProvider'

export default function DashboardPage() {
  const { showToast } = useToast()

  const statsCards = [
    {
      title: 'Total Sales',
      value: 'Rp 45,231,890',
      change: '+20.1%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      title: 'Orders Today',
      value: '24',
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      title: 'Active Customers',
      value: '2,350',
      change: '+3.2%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a5.978 5.978 0 00-2.5-.5c-.886 0-1.72.2-2.5.5" />
        </svg>
      )
    },
    {
      title: 'Inventory Items',
      value: '1,429',
      change: '-2.4%',
      changeType: 'decrease' as const,
      icon: (
        <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    }
  ]

  const recentOrders = [
    { 
      id: 'SO-2024-001', 
      customer: 'PT Maju Mundur', 
      total: 'Rp 2,450,000', 
      status: 'completed',
      date: '2024-01-15' 
    },
    { 
      id: 'SO-2024-002', 
      customer: 'CV Berkah Jaya', 
      total: 'Rp 1,200,000', 
      status: 'pending',
      date: '2024-01-15' 
    },
    { 
      id: 'SO-2024-003', 
      customer: 'UD Sumber Rejeki', 
      total: 'Rp 875,000', 
      status: 'processing',
      date: '2024-01-14' 
    },
    { 
      id: 'SO-2024-004', 
      customer: 'PT Digital Solutions', 
      total: 'Rp 3,200,000', 
      status: 'completed',
      date: '2024-01-14' 
    },
    { 
      id: 'SO-2024-005', 
      customer: 'CV Kreatif Nusantara', 
      total: 'Rp 1,650,000', 
      status: 'cancelled',
      date: '2024-01-13' 
    }
  ]

  const orderColumns = [
    { key: 'id' as const, label: 'Order ID', sortable: true },
    { key: 'customer' as const, label: 'Customer', sortable: true },
    { key: 'total' as const, label: 'Total', sortable: true },
    { 
      key: 'status' as const, 
      label: 'Status', 
      render: (value: string) => {
        const statusMap: { [key: string]: any } = {
          'completed': 'approved',
          'pending': 'pending',
          'processing': 'active',
          'cancelled': 'rejected'
        }
        return <StatusBadge status={statusMap[value] || 'draft'} />
      }
    },
    { key: 'date' as const, label: 'Date', sortable: true },
  ]

  const quickActions = [
    {
      title: 'New Sales Order',
      description: 'Create a new sales order',
      href: '/sales/orders/new',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      title: 'Add Customer',
      description: 'Register a new customer',
      href: '/sales/customers/new',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      title: 'Stock Report',
      description: 'View current stock levels',
      href: '/inventory/stock',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ]

  const handleOrderClick = (order: typeof recentOrders[0]) => {
    showToast.info(`Opening order ${order.id}`, 'Order Details')
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, John! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your sales today.
              </p>
            </div>
            <Button onClick={() => showToast.success('Dashboard refreshed!')}>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <div key={index} className="stats-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.changeType === 'increase' ? '↗' : '↘'} {stat.change}
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
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="p-4 border border-gray-200 rounded-lg hover:border-asparagus hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-asparagus">
                    {action.icon}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/sales/orders">
              <Button variant="outline" size="sm">
                View All Orders
              </Button>
            </Link>
          </div>
          <DataTable
            data={recentOrders}
            columns={orderColumns}
            onRowClick={handleOrderClick}
            emptyMessage="No orders found"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
