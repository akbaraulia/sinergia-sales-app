'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BarChart, LineChart, DonutChart } from '@/components/charts'
import { useToast } from '@/components/common/ToastProvider'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils/format'

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'
type ReportType = 'sales' | 'orders' | 'targets' | 'outlets'

export default function ReportsPage() {
  const { showToast } = useToast()
  const { user } = useAuthStore()
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly')
  const [selectedType, setSelectedType] = useState<ReportType>('sales')

  // Dummy data - akan diintegrasikan dengan API nanti
  const salesData = [
    { label: 'Jan', value: 45231890, target: 50000000 },
    { label: 'Feb', value: 52341234, target: 50000000 },
    { label: 'Mar', value: 38765432, target: 50000000 },
    { label: 'Apr', value: 61234567, target: 50000000 },
    { label: 'May', value: 47892134, target: 50000000 },
    { label: 'Jun', value: 55678912, target: 50000000 },
  ]

  const ordersData = [
    { label: 'Jan', value: 234 },
    { label: 'Feb', value: 312 },
    { label: 'Mar', value: 198 },
    { label: 'Apr', value: 387 },
    { label: 'May', value: 276 },
    { label: 'Jun', value: 345 },
  ]

  const outletData = [
    { label: 'Jakarta', value: 45, color: 'rgba(114, 154, 75, 0.8)' },
    { label: 'Surabaya', value: 32, color: 'rgba(59, 130, 246, 0.8)' },
    { label: 'Bandung', value: 28, color: 'rgba(147, 51, 234, 0.8)' },
    { label: 'Medan', value: 21, color: 'rgba(249, 115, 22, 0.8)' },
    { label: 'Makassar', value: 18, color: 'rgba(34, 197, 94, 0.8)' },
    { label: 'Others', value: 67, color: 'rgba(239, 68, 68, 0.8)' },
  ]

  const targetVsActualData = [
    { label: 'Target Bulanan', value: 50000000, color: 'rgba(107, 114, 128, 0.5)' },
    { label: 'Actual Sales', value: 55678912, color: 'rgba(114, 154, 75, 0.8)' },
  ]

  // Summary stats
  const summaryStats = [
    {
      title: 'Total Sales',
      value: formatCurrency(301143169),
      change: '+18.2%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      title: 'Total Orders',
      value: '1,752',
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      title: 'Target Achievement',
      value: '111.4%',
      change: '+11.4%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      title: 'New Outlets (NOO)',
      value: '211',
      change: '+25.3%',
      changeType: 'increase' as const,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ]

  const handlePeriodChange = (period: ReportPeriod) => {
    setSelectedPeriod(period)
    showToast.info(`Switched to ${period} view`, 'Reports updated')
  }

  const handleExport = () => {
    showToast.success('Report exported!', 'Check your downloads folder')
  }

  const handleRefresh = () => {
    showToast.info('Refreshing data...', 'Please wait')
    // Simulate refresh
    setTimeout(() => {
      showToast.success('Data refreshed!', 'Reports are up to date')
    }, 1500)
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-isabelline via-white to-champagne-50 dark:from-dark-bg dark:via-dark-surface dark:to-jet-800 min-h-full">
          <div className="space-y-6 md:space-y-8">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-asparagus to-asparagus-700 dark:from-asparagus-600 dark:to-asparagus-800 rounded-lg shadow-lg p-4 md:p-6 border border-asparagus-200 dark:border-asparagus-600">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-sm">
                    📊 Sales Reports & Analytics
                  </h1>
                  <p className="text-sm md:text-base text-white/90 dark:text-white/80 mt-1 drop-shadow-sm">
                    Comprehensive business insights and performance metrics
                  </p>
                  <p className="text-xs text-white/80 mt-1 drop-shadow-sm">
                    Last updated: {formatDate(new Date(), 'long')}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleRefresh}
                    size="sm"
                    variant="secondary"
                    className="bg-white/95 hover:bg-white text-asparagus-700 hover:text-asparagus-800 border border-white/80 hover:border-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                  <Button 
                    onClick={handleExport}
                    size="sm"
                    variant="secondary"
                    className="bg-white/95 hover:bg-white text-asparagus-700 hover:text-asparagus-800 border border-white/80 hover:border-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Period Selector */}
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4 border border-gray-200 dark:border-dark-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-sm font-medium text-gray-900 dark:text-white">Report Period</h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'daily', label: 'Daily' },
                    { key: 'weekly', label: 'Weekly' },
                    { key: 'monthly', label: 'Monthly' },
                    { key: 'yearly', label: 'Yearly' }
                  ].map(period => (
                    <Button
                      key={period.key}
                      size="sm"
                      variant={selectedPeriod === period.key ? "default" : "outline"}
                      onClick={() => handlePeriodChange(period.key as ReportPeriod)}
                      className="text-xs"
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {summaryStats.map((stat, index) => {
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
                          <span className="text-white/80 text-xs md:text-sm ml-2 hidden sm:inline drop-shadow-sm">vs last period</span>
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Sales vs Target Chart */}
              <div className="lg:col-span-2">
                <BarChart
                  data={salesData}
                  title="📈 Monthly Sales vs Target"
                  height={300}
                  showValues={true}
                  showTargets={true}
                  className="shadow-lg"
                />
              </div>

              {/* Orders Chart */}
              <LineChart
                data={ordersData}
                title="📋 Orders Trend"
                height={250}
                showGrid={true}
                className="shadow-lg"
              />

              {/* Target vs Actual Donut */}
              <DonutChart
                data={targetVsActualData}
                title="🎯 Target vs Actual (This Month)"
                height={250}
                showLegend={true}
                centerText="111.4%"
                className="shadow-lg"
              />

              {/* Outlet Distribution */}
              <div className="lg:col-span-2">
                <DonutChart
                  data={outletData}
                  title="🏪 New Outlet Distribution (NOO)"
                  height={280}
                  showLegend={true}
                  centerText="211"
                  className="shadow-lg"
                />
              </div>
            </div>

            {/* Additional Insights */}
            <div className="bg-gradient-to-br from-champagne-100 to-champagne-300 dark:from-champagne-800 dark:to-champagne-900 rounded-lg shadow-lg p-4 md:p-6 border border-champagne-300 dark:border-champagne-600">
              <h2 className="text-base md:text-lg font-semibold text-jet-800 dark:text-white mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Key Insights
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/90 dark:bg-dark-surface/80 backdrop-blur-sm rounded-lg p-4 border border-white/60 dark:border-dark-border">
                  <div className="flex items-center mb-2">
                    <Badge variant="success" className="mr-2">+18.2%</Badge>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Sales Growth</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Sales momentum is strong with consistent month-over-month growth
                  </p>
                </div>
                
                <div className="bg-white/90 dark:bg-dark-surface/80 backdrop-blur-sm rounded-lg p-4 border border-white/60 dark:border-dark-border">
                  <div className="flex items-center mb-2">
                    <Badge variant="success" className="mr-2">111.4%</Badge>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Target Exceeded</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Monthly target consistently exceeded for the last 3 months
                  </p>
                </div>
                
                <div className="bg-white/90 dark:bg-dark-surface/80 backdrop-blur-sm rounded-lg p-4 border border-white/60 dark:border-dark-border">
                  <div className="flex items-center mb-2">
                    <Badge variant="info" className="mr-2">211</Badge>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">New Outlets</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Strong outlet expansion primarily in Jakarta and Surabaya regions
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
