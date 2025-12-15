'use client'

import React from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/Table'
import { useToast } from '@/components/common/ToastProvider'
import { useAuthStore } from '@/store/authStore'

export default function DashboardPage() {
  const { showToast } = useToast()
  const { user } = useAuthStore()

  // Sales Dashboard Data
  const salesStatsCards = [
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
      title: 'Target per Bulan',
      value: 'Rp 50M',
      change: '90.5%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      title: 'New Open Outlet',
      value: '12',
      change: '+25%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ]

  // Salon Dashboard Data
  const salonStatsCards = [
    {
      title: 'Jumlah Point',
      value: '1,450',
      change: '+15.3%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      title: 'Kontrak Aktif',
      value: '23',
      change: '+8.7%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Pencapaian Kontrak',
      value: '87%',
      change: '+12%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: 'Kelas Salon',
      value: '5',
      change: '+2',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ]

  // Admin sees everything
  const adminStatsCards = [
    ...salesStatsCards.slice(0, 2),
    ...salonStatsCards.slice(0, 2)
  ]

  // Get stats based on role
  const getStatsCards = () => {
    if (!user) return salesStatsCards
    
    if (user.permissions.includes('admin')) {
      return adminStatsCards
    } else if (user.permissions.includes('salon')) {
      return salonStatsCards  
    } else {
      return salesStatsCards
    }
  }

  const statsCards = getStatsCards()

  // Role-based Quick Actions
  const salesQuickActions = [
    {
      title: 'Product Catalog',
      description: 'Browse and select products',
      href: '/catalog',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      title: 'Customer Activation',
      description: 'Activate and manage customer accounts',
      href: '/customers/activation',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      title: 'Promo Bebas Pilih',
      description: 'View promotion programs with free items',
      href: '/promo',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    {
      title: 'Sales Orders',
      description: 'View and manage sales orders',
      href: '/sales/orders',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ]

  const salonQuickActions = [
    {
      title: 'View Point Balance',
      description: 'Check your current points',
      href: '/salon/points',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      title: 'Contract Management',
      description: 'Manage salon contracts',
      href: '/salon/contracts',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Sales History',
      description: 'View your sales timeline',
      href: '/salon/sales-history',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ]

  const adminQuickActions = [
    {
      title: 'Product Catalog',
      description: 'Browse and manage products',
      href: '/catalog',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      title: 'Customer Activation',
      description: 'Activate and manage customer accounts',
      href: '/customers/activation',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      title: 'Promo Bebas Pilih',
      description: 'Manage promotion programs with free items',
      href: '/promo',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    {
      title: 'Sales Orders',
      description: 'View all sales orders',
      href: '/sales/orders',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ]

  const getQuickActions = () => {
    if (!user) return salesQuickActions
    
    if (user.permissions.includes('admin')) {
      return adminQuickActions
    } else if (user.permissions.includes('salon')) {
      return salonQuickActions
    } else {
      return salesQuickActions
    }
  }

  const quickActions = getQuickActions()

  // Sales orders data
  const adminOrders = [
    { 
      id: 'SO-2024-001', 
      customer: 'PT Maju Mundur', 
      total: 'Rp 2,450,000', 
      status: 'completed',
      date: '2024-01-15',
      salesPerson: 'John Sales' 
    },
    { 
      id: 'SO-2024-002', 
      customer: 'CV Berkah Jaya', 
      total: 'Rp 1,200,000', 
      status: 'pending',
      date: '2024-01-15',
      salesPerson: 'Jane Smith' 
    },
    { 
      id: 'SO-2024-003', 
      customer: 'UD Sumber Rejeki', 
      total: 'Rp 875,000', 
      status: 'processing',
      date: '2024-01-14',
      salesPerson: 'Bob Wilson' 
    },
    { 
      id: 'SO-2024-004', 
      customer: 'PT Digital Solutions', 
      total: 'Rp 3,200,000', 
      status: 'completed',
      date: '2024-01-14',
      salesPerson: 'John Sales' 
    },
    { 
      id: 'SO-2024-005', 
      customer: 'CV Kreatif Nusantara', 
      total: 'Rp 1,650,000', 
      status: 'cancelled',
      date: '2024-01-13',
      salesPerson: 'Alice Brown' 
    }
  ]

  const salesOrders = [
    { 
      id: 'SO-2024-001', 
      customer: 'PT Maju Mundur', 
      total: 'Rp 2,450,000', 
      status: 'completed',
      date: '2024-01-15' 
    },
    { 
      id: 'SO-2024-004', 
      customer: 'PT Digital Solutions', 
      total: 'Rp 3,200,000', 
      status: 'completed',
      date: '2024-01-14' 
    },
    { 
      id: 'SO-2024-008', 
      customer: 'PT Tech Innovate', 
      total: 'Rp 1,800,000', 
      status: 'processing',
      date: '2024-01-12' 
    }
  ]

  const salonOrders = [
    { 
      id: 'SO-2024-006', 
      customer: 'Beauty Salon Premium', 
      total: 'Rp 950,000', 
      status: 'completed',
      date: '2024-01-15' 
    },
    { 
      id: 'SO-2024-007', 
      customer: 'Glamour Hair Studio', 
      total: 'Rp 650,000', 
      status: 'pending',
      date: '2024-01-14' 
    },
    { 
      id: 'SO-2024-009', 
      customer: 'Elite Beauty Center', 
      total: 'Rp 1,450,000', 
      status: 'processing',
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
          'cancelled': 'rejected',
          'active': 'active'
        }
        return <StatusBadge status={statusMap[value] || 'draft'} />
      }
    },
    { key: 'date' as const, label: 'Date', sortable: true },
  ]

  const getTableData = () => {
    if (!user) return { data: adminOrders, columns: orderColumns, title: 'Recent Orders', viewAllLink: '/sales/orders' }

    if (user.permissions.includes('admin')) {
      return { 
        data: adminOrders,
        columns: [...orderColumns, { key: 'salesPerson', label: 'Sales Person' }],
        title: 'All Sales Orders',
        viewAllLink: '/sales/orders'
      }
    }

    if (user.permissions.includes('salon')) {
      return { 
        data: salonOrders,
        columns: orderColumns,
        title: 'Salon Orders',
        viewAllLink: '/salon/orders'
      }
    }

    return { 
      data: salesOrders,
      columns: orderColumns,
      title: 'My Sales Orders',
      viewAllLink: '/sales/orders'
    }
  }

  const tableConfig = getTableData()

  const handleOrderClick = (order: any) => {
    const itemType = 'order'
    showToast.info(`Opening ${itemType} ${order.id}`, `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Details`)
  }

  // Welcome message functions - INI YANG LO MINTA DIBENERIN
  const getWelcomeMessage = () => {
    if (!user) return 'Welcome back! 👋'
    
    if (user.permissions.includes('admin')) {
      return `Welcome back, ${user.name}! 🎯`
    } else if (user.permissions.includes('salon')) {
      return `Welcome back, ${user.name}! 💇‍♀️`
    } else {
      return `Welcome back, ${user.name}! 💼`
    }
  }

  const getWelcomeSubtext = () => {
    if (!user) return "Here's your dashboard overview."
    
    if (user.permissions.includes('admin')) {
      return 'Monitor and manage your entire business operations.'
    } else if (user.permissions.includes('salon')) {
      return 'Track your points, contracts, and salon performance.'
    } else {
      return "Here's what's happening with your sales today."
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-isabelline via-white to-champagne-50 dark:from-dark-bg dark:via-dark-surface dark:to-jet-800 min-h-full">
          <div className="space-y-6 md:space-y-8">
            {/* Welcome Header - FIXED CONTRAST */}
            <div className="bg-gradient-to-r from-asparagus to-asparagus-700 dark:from-asparagus-600 dark:to-asparagus-800 rounded-lg shadow-lg p-4 md:p-6 border border-asparagus-200 dark:border-asparagus-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-sm">
                    {getWelcomeMessage()}
                  </h1>
                  <p className="text-sm md:text-base text-white/90 dark:text-white/80 mt-1 drop-shadow-sm">
                    {getWelcomeSubtext()}
                  </p>
                </div>
                <Button 
                  onClick={() => showToast.success('Dashboard refreshed!')}
                  size="sm"
                  variant="secondary"
                  className="w-full sm:w-auto bg-white/95 hover:bg-white text-asparagus-700 hover:text-asparagus-800 border border-white/80 hover:border-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {statsCards.map((stat, index) => {
                const cardColors = [
                  'from-green-400 to-green-600',
                  'from-blue-400 to-blue-600', 
                  'from-purple-400 to-purple-600',
                  'from-orange-400 to-orange-600'
                ]
                const cardColor = cardColors[index % cardColors.length]
                
                return (
                  <div key={index} className={`stats-card p-4 md:p-6 bg-gradient-to-br ${cardColor} rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 hover:shadow-xl`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-white/95 truncate drop-shadow-sm">{stat.title}</p>
                        <p className="text-lg md:text-2xl font-bold text-white mt-1 md:mt-2 drop-shadow-sm">{stat.value}</p>
                        <div className="flex items-center mt-1 md:mt-2">
                          <span className="text-xs md:text-sm font-medium text-white/95 drop-shadow-sm">
                            {stat.changeType === 'increase' ? '↗' : '↘'} {stat.change}
                          </span>
                          <span className="text-white/80 text-xs md:text-sm ml-2 hidden sm:inline drop-shadow-sm">vs last month</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg shadow-inner">
                          <div className="text-white drop-shadow-sm">
                            {stat.icon}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Actions - BETTER COLOR HANDLING */}
            <div className="bg-gradient-to-br from-champagne-100 to-champagne-300 dark:from-champagne-800 dark:to-champagne-900 rounded-lg shadow-lg p-4 md:p-6 border border-champagne-300 dark:border-champagne-600">
              <h2 className="text-base md:text-lg font-semibold text-jet-800 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="p-3 md:p-4 bg-white/90 hover:bg-white dark:bg-dark-surface/80 dark:hover:bg-dark-surface backdrop-blur-sm border border-white/60 dark:border-dark-border rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 group"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 text-asparagus-600 group-hover:text-asparagus-700 dark:text-asparagus-400 dark:group-hover:text-asparagus-300 group-hover:scale-110 transition-all duration-200">
                        {action.icon}
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-jet-700 dark:text-white truncate">{action.title}</h3>
                        <p className="text-xs md:text-sm text-jet-600 dark:text-gray-300 mt-1 line-clamp-2">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

           {/* Recent Orders/Contracts - IMPROVED TABLE STYLING */}
            <div className="bg-gradient-to-br from-isabelline-50 to-white dark:from-dark-surface dark:to-dark-bg rounded-lg shadow-lg p-4 md:p-6 border border-isabelline-300 dark:border-dark-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
                <h2 className="text-base md:text-lg font-semibold text-jet-800 dark:text-white">{tableConfig.title}</h2>
                <Link href={tableConfig.viewAllLink}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto border-asparagus-500 text-asparagus-700 hover:bg-asparagus-500 hover:text-white dark:border-asparagus-400 dark:text-asparagus-400 dark:hover:bg-asparagus-500 dark:hover:text-white transition-all duration-200"
                  >
                    View All {user?.permissions.includes('salon') ? 'Contracts' : 'Orders'}
                  </Button>
                </Link>
              </div>
              
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="bg-white/80 dark:bg-dark-surface/90 backdrop-blur-sm rounded-lg border border-white/60 dark:border-dark-border shadow-inner">
                    <DataTable
                      data={tableConfig.data as any}
                      columns={tableConfig.columns as any}
                      onRowClick={handleOrderClick}
                      emptyMessage={`No ${user?.permissions.includes('salon') ? 'contracts' : 'orders'} found`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}