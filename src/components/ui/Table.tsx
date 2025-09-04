import React from 'react'
import { cn } from '@/lib/utils/format'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-gray-200 dark:divide-dark-border', className)}>
        {children}
      </table>
    </div>
  )
}

interface TableHeadProps {
  children: React.ReactNode
  className?: string
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className }) => {
  return (
    <thead className={cn('bg-gray-100 dark:bg-gray-800', className)}>
      {children}
    </thead>
  )
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cn('bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700', className)}>
      {children}
    </tbody>
  )
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className, 
  onClick, 
  hover = true 
}) => {
  return (
    <tr
      className={cn(
        hover && 'hover:bg-gray-50 dark:hover:bg-gray-800',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}


interface TableHeaderProps {
  children: React.ReactNode
  className?: string
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className,
  sortable,
  sortDirection,
  onSort
}) => {
  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider',
        sortable && 'cursor-pointer select-none hover:bg-gray-200 dark:hover:bg-gray-700',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <div className="flex flex-col">
            <svg
              className={cn(
                'h-3 w-3',
                sortDirection === 'asc' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
            </svg>
            <svg
              className={cn(
                'h-3 w-3 -mt-1',
                sortDirection === 'desc' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        )}
      </div>
    </th>
  )
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
  colSpan?: number
}

export const TableCell: React.FC<TableCellProps> = ({ children, className, colSpan }) => {
  return (
    <td
      className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100', className)}
      colSpan={colSpan}
    >
      {children}
    </td>
  )
}

// Data Table with built-in features
interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  className
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc' | null>(null)

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc')
      if (sortDirection === 'desc') {
        setSortColumn(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (aVal === bVal) return 0

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }, [data, sortColumn, sortDirection])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center text-gray-600 dark:text-gray-400">
          <div className="animate-spin h-5 w-5 border-2 border-asparagus border-t-transparent rounded-full mr-3" />
          Loading...
        </div>
      </div>
    )
  }

  return (
    <Table className={className}>
      <TableHead>
        <TableRow hover={false}>
          {columns.map((column) => (
            <TableHeader
              key={String(column.key)}
              sortable={column.sortable}
              sortDirection={sortColumn === column.key ? sortDirection : null}
              onSort={() => column.sortable && handleSort(column.key)}
              className={column.className}
            >
              {column.label}
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {sortedData.length === 0 ? (
          <TableRow hover={false}>
            <TableCell className="text-center text-gray-500 dark:text-gray-400 py-8" colSpan={columns.length}>
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          sortedData.map((row, index) => (
            <TableRow
              key={index}
              onClick={() => onRowClick?.(row)}
              hover={!!onRowClick}
            >
              {columns.map((column) => (
                <TableCell
                  key={String(column.key)}
                  className={column.className}
                >
                  {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
