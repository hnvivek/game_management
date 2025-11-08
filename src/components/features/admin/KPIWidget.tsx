'use client'

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface KPIMetric {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down' | 'neutral'
    period: string
  }
  icon?: LucideIcon
  description?: string
  format?: 'currency' | 'number' | 'percentage'
  loading?: boolean
}

interface KPIWidgetProps {
  metric: KPIMetric
  className?: string
  variant?: 'default' | 'compact' | 'large'
}

export function KPIWidget({ metric, className, variant = 'default' }: KPIWidgetProps) {
  const {
    title,
    value,
    change,
    icon: Icon,
    description,
    format = 'number',
    loading = false
  } = metric

  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val)
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      case 'neutral':
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
        return 'text-muted-foreground'
    }
  }

  const getTrendBgColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'down':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'neutral':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    )
  }

  const sizeClasses = {
    default: 'p-6',
    compact: 'p-4',
    large: 'p-8'
  }

  const valueSizeClasses = {
    default: 'text-2xl font-bold',
    compact: 'text-xl font-bold',
    large: 'text-3xl font-bold'
  }

  return (
    <Card className={cn('h-full', sizeClasses[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className={cn('text-foreground', valueSizeClasses[variant])}>
            {formatValue(value)}
          </div>

          {change && (
            <div className="flex items-center space-x-2">
              <div className={cn(
                'flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium',
                getTrendBgColor(change.trend)
              )}>
                {getTrendIcon(change.trend)}
                <span>
                  {Math.abs(change.value).toFixed(1)}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {change.period}
              </span>
            </div>
          )}

          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// KPI Grid Component for displaying multiple widgets
interface KPIGridProps {
  metrics: KPIMetric[]
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function KPIGrid({ metrics, columns = 4, className }: KPIGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {metrics.map((metric, index) => (
        <KPIWidget
          key={index}
          metric={metric}
          variant="default"
        />
      ))}
    </div>
  )
}