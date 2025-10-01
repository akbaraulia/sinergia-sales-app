'use client'

import React from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { cn } from '@/lib/utils/format'
import { formatCurrency } from '@/lib/utils/format'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DonutData {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutData[]
  title?: string
  height?: number
  showLegend?: boolean
  showValues?: boolean
  centerText?: string
  className?: string
}

export function DonutChart({ 
  data, 
  title, 
  height = 300, 
  showLegend = true,
  showValues = true,
  centerText,
  className 
}: DonutChartProps) {

  const total = data.reduce((sum, item) => sum + item.value, 0)

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color.replace(/0\.\d+\)$/, '1)')),
        borderWidth: 1,
        hoverBorderWidth: 2,
        hoverOffset: 4,
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%', // Increased cutout for more center space
    layout: {
      padding: 10
    },
    interaction: {
      mode: 'point' as const,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11,
            weight: 500,
          },
          color: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') 
            ? '#ffffff' 
            : '#374151', // Fix dark mode legend text
          boxWidth: 10,
          boxHeight: 10,
          generateLabels: (chart) => {
            const data = chart.data
            if (data.labels && data.datasets.length > 0) {
              return data.labels.slice(0, 4).map((label, i) => {
                const dataset = data.datasets[0]
                const value = dataset.data[i] as number
                const percentage = ((value / total) * 100).toFixed(1)
                const backgroundColor = Array.isArray(dataset.backgroundColor) 
                  ? dataset.backgroundColor[i] as string 
                  : dataset.backgroundColor as string
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: backgroundColor,
                  strokeStyle: backgroundColor,
                  lineWidth: 1,
                  hidden: false,
                  index: i,
                  pointStyle: 'circle',
                }
              })
            }
            return []
          },
        },
      },
      tooltip: {
        backgroundColor: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') 
          ? 'rgba(31, 41, 55, 0.95)' 
          : 'rgba(0, 0, 0, 0.9)', // Fix dark mode tooltip background
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(114, 154, 75, 0.8)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 12,
          weight: 600
        },
        bodyFont: {
          size: 11,
          weight: 400
        },
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed
            const percentage = ((value / total) * 100).toFixed(1)
            
            if (typeof value === 'number' && value > 1000000) {
              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
            }
            return `${context.label}: ${value.toLocaleString('id-ID')} (${percentage}%)`
          }
        }
      },
    },
    animation: {
      animateRotate: true,
      animateScale: false,
      duration: 800,
      easing: 'easeInOutQuart',
    },
  }

  return (
    <div className={cn('bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden', className)}>
      {title && (
        <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total: {total > 1000000 ? formatCurrency(total) : total.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div 
          className="relative w-full mx-auto" 
          style={{ height: `${height}px`, maxWidth: `${Math.min(height, 300)}px` }}
        >
          <Doughnut data={chartData} options={options} />
          
          {/* Center text - Fixed overflow */}
          {centerText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-[100px]"> {/* Added max-width constraint */}
                <div className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {centerText}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Achievement
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom values */}
        {showValues && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="space-y-2">
              {data.slice(0, 3).map((item, index) => {
                const percentage = ((item.value / total) * 100).toFixed(1)
                return (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-right flex-shrink-0">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.value > 1000000 
                          ? formatCurrency(item.value) 
                          : item.value.toLocaleString('id-ID')
                        }
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                )
              })}
              
              {data.length > 3 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{data.length - 3} more regions
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}