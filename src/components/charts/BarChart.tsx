'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { cn } from '@/lib/utils/format'
import { formatCurrency } from '@/lib/utils/format'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface BarData {
  label: string
  value: number
  color?: string
  target?: number
}

interface BarChartProps {
  data: BarData[]
  title?: string
  height?: number
  showValues?: boolean
  showTargets?: boolean
  className?: string
}

export function BarChart({ 
  data, 
  title, 
  height = 300, 
  showValues = true, 
  showTargets = false,
  className 
}: BarChartProps) {
  
  const colors = [
    'rgba(114, 154, 75, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(147, 51, 234, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(239, 68, 68, 0.8)',
  ]

  const borderColors = [
    'rgba(114, 154, 75, 1)',
    'rgba(59, 130, 246, 1)', 
    'rgba(147, 51, 234, 1)',
    'rgba(249, 115, 22, 1)',
    'rgba(34, 197, 94, 1)',
    'rgba(239, 68, 68, 1)',
  ]

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: 'Actual Sales',
        data: data.map(item => item.value),
        backgroundColor: data.map((_, index) => colors[index % colors.length]),
        borderColor: data.map((_, index) => borderColors[index % borderColors.length]),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      ...(showTargets ? [{
        label: 'Target',
        data: data.map(item => item.target || 0),
        backgroundColor: 'rgba(107, 114, 128, 0.3)',
        borderColor: 'rgba(107, 114, 128, 0.8)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      }] : [])
    ]
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: showValues ? 30 : 10,
        right: 20,
        bottom: 10,
        left: 10
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11,
            weight: 500,
          },
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(114, 154, 75, 0.8)',
        borderWidth: 1,
        cornerRadius: 6,
        padding: 8,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            const label = context.dataset.label
            return `${label}: ${formatCurrency(value)}`
          },
          afterLabel: (context) => {
            if (showTargets && context.datasetIndex === 0) {
              const target = data[context.dataIndex]?.target
              if (target) {
                const achievement = ((context.parsed.y / target) * 100).toFixed(1)
                return `Target: ${achievement}%`
              }
            }
            return ''
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 10,
            weight: 500,
          },
          color: 'rgba(107, 114, 128, 0.7)',
          maxRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.3)',
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 10,
          },
          color: 'rgba(107, 114, 128, 0.7)',
          maxTicksLimit: 5,
          callback: (value) => {
            if (typeof value === 'number' && value > 1000000) {
              return (value / 1000000).toFixed(0) + 'M'
            }
            return (value as number).toLocaleString('id-ID')
          }
        }
      }
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
  }

  return (
    <div className={cn('bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden', className)}>
      {title && (
        <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}
      
      <div className="p-4">
        <div 
          style={{ height: `${height}px` }}
          className="relative w-full"
        >
          <Bar data={chartData} options={options} />
        </div>
        
        {/* Values display outside chart */}
        {showValues && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {data.map((item, index) => {
                const achievement = item.target ? ((item.value / item.target) * 100).toFixed(1) : null
                return (
                  <div key={index} className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </div>
                    <div className="text-asparagus-600 dark:text-asparagus-400 font-semibold">
                      {formatCurrency(item.value)}
                    </div>
                    {showTargets && achievement && (
                      <div className="text-gray-500 dark:text-gray-400">
                        Target: {formatCurrency(item.target || 0)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}