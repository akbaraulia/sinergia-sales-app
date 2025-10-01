'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { cn } from '@/lib/utils/format'
import { formatCurrency } from '@/lib/utils/format'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface LineData {
  label: string
  value: number
}

interface LineChartProps {
  data: LineData[]
  title?: string
  height?: number
  showArea?: boolean
  showGrid?: boolean
  color?: string
  className?: string
}

export function LineChart({ 
  data, 
  title, 
  height = 300, 
  showArea = true,
  showGrid = true,
  color = '#729A4B',
  className 
}: LineChartProps) {

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: 'Orders',
        data: data.map(item => item.value),
        borderColor: color,
        backgroundColor: showArea ? `${color}15` : 'transparent',
        borderWidth: 2,
        fill: showArea,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBorderColor: color,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
      }
    ]
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: color,
        borderWidth: 1,
        cornerRadius: 6,
        padding: 8,
        usePointStyle: true,
        callbacks: {
          title: (context) => {
            return context[0]?.label || ''
          },
          label: (context) => {
            const value = context.parsed.y
            return `Orders: ${value.toLocaleString('id-ID')}`
          },
          afterLabel: (context) => {
            const currentIndex = context.dataIndex
            if (currentIndex > 0) {
              const current = data[currentIndex].value
              const previous = data[currentIndex - 1].value
              const change = ((current - previous) / previous * 100).toFixed(1)
              const indicator = current > previous ? '↗️' : current < previous ? '↘️' : '➡️'
              return `${indicator} ${change}% vs prev`
            }
            return ''
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: showGrid,
          color: 'rgba(229, 231, 235, 0.2)',
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 10,
            weight: 500,
          },
          color: 'rgba(107, 114, 128, 0.7)',
          maxRotation: 0,
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: showGrid,
          color: 'rgba(229, 231, 235, 0.2)',
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 10,
          },
          color: 'rgba(107, 114, 128, 0.7)',
          maxTicksLimit: 6,
          callback: (value) => {
            return (value as number).toLocaleString('id-ID')
          }
        }
      }
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
    elements: {
      point: {
        hoverBackgroundColor: color,
        hoverBorderColor: '#fff',
      }
    }
  }

  // Calculate trend
  const trend = data.length > 1 ? 
    data[data.length - 1].value - data[0].value : 0
  const trendPercentage = data.length > 1 && data[0].value !== 0 ? 
    ((trend / data[0].value) * 100).toFixed(1) : '0'
  const isPositive = trend > 0
  const isFlat = Math.abs(trend) < (data[0]?.value * 0.05)

  return (
    <div className={cn('bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden', className)}>
      {title && (
        <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <div className={cn(
              'flex items-center px-2 py-1 rounded-full text-xs font-medium',
              isFlat 
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                : isPositive 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}>
              <span className="mr-1">
                {isFlat ? '➡️' : isPositive ? '↗️' : '↘️'}
              </span>
              {isFlat ? 'Stable' : `${isPositive ? '+' : ''}${trendPercentage}%`}
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div 
          style={{ height: `${height}px` }}
          className="relative w-full"
        >
          <Line data={chartData} options={options} />
        </div>

        {/* Mini stats at bottom */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="text-gray-500 dark:text-gray-400 mb-1">Peak</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {Math.max(...data.map(d => d.value)).toLocaleString('id-ID')}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 mb-1">Low</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {Math.min(...data.map(d => d.value)).toLocaleString('id-ID')}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 mb-1">Avg</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}