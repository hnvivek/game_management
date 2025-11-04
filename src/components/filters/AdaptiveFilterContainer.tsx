'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Search,
  Filter,
  X,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types for better organization
interface FilterGroup {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  priority: 'primary' | 'secondary' | 'tertiary'
  required?: boolean
}

interface AppliedFilters {
  sport?: string
  date?: string
  duration?: string
  country?: string
  city?: string
  area?: string
  startTime?: string
  endTime?: string
  priceRange?: string
  venue?: string
  format?: string
}

interface AdaptiveFilterContainerProps {
  children: React.ReactNode
  appliedFilters: AppliedFilters
  onClearFilters: () => void
  onFilterChange: (filters: Partial<AppliedFilters>) => void
  loading?: boolean
  resultCount?: number
  showResultsCount?: boolean
}

// Responsive filter groups with research-backed organization
const filterGroups: FilterGroup[] = [
  {
    id: 'primary',
    label: 'What & When',
    icon: Calendar,
    description: 'Sport, date and duration',
    priority: 'primary',
    required: true
  },
  {
    id: 'location',
    label: 'Where',
    icon: MapPin,
    description: 'Location preferences',
    priority: 'primary'
  },
  {
    id: 'time',
    label: 'Time Preferences',
    icon: Clock,
    description: 'Time and availability',
    priority: 'secondary'
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Filter,
    description: 'Price, venue and format',
    priority: 'tertiary'
  }
]

export default function AdaptiveFilterContainer({
  children,
  appliedFilters,
  onClearFilters,
  onFilterChange,
  loading = false,
  resultCount = 0,
  showResultsCount = true
}: AdaptiveFilterContainerProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['primary'])

  // Responsive detection with proper breakpoints
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Count active filters
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length

  // Get filter group for a specific filter key
  const getFilterGroup = (filterKey: keyof AppliedFilters): FilterGroup | undefined => {
    const primaryKeys = ['sport', 'date', 'duration']
    const locationKeys = ['country', 'city', 'area']
    const timeKeys = ['startTime', 'endTime']

    if (primaryKeys.includes(filterKey)) return filterGroups.find(g => g.id === 'primary')
    if (locationKeys.includes(filterKey)) return filterGroups.find(g => g.id === 'location')
    if (timeKeys.includes(filterKey)) return filterGroups.find(g => g.id === 'time')
    return filterGroups.find(g => g.id === 'preferences')
  }

  // Get display name for filter
  const getFilterDisplay = (key: keyof AppliedFilters, value: string): string => {
    // This would be enhanced with actual data lookups
    if (key === 'duration') {
      return `${value} hour${value === '1' ? '' : 's'}`
    }
    if (key === 'priceRange') {
      return value === 'all' ? 'Any price' : value
    }
    if (key === 'startTime' && !appliedFilters.endTime) {
      return `From ${value}`
    }
    if (key === 'endTime' && !appliedFilters.startTime) {
      return `Until ${value}`
    }
    return value
  }

  // Filter content organized by groups
  const FilterContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      "space-y-6",
      mobile ? "px-4 pb-6" : "px-6 pb-6"
    )}>
      {/* Filter Groups with Accordion */}
      <Accordion
        type="multiple"
        value={expandedGroups}
        onValueChange={setExpandedGroups}
        className="space-y-4"
      >
        {filterGroups.map((group) => {
          const Icon = group.icon
          const groupFilters = Object.entries(appliedFilters).filter(([key]) =>
            getFilterGroup(key as keyof AppliedFilters)?.id === group.id
          )

          return (
            <AccordionItem
              key={group.id}
              value={group.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className={cn(
                    "p-2 rounded-lg",
                    group.priority === 'primary' ? "bg-blue-100 text-blue-700" :
                    group.priority === 'secondary' ? "bg-green-100 text-green-700" :
                    "bg-purple-100 text-purple-700"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{group.label}</h3>
                      {group.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                  {groupFilters.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {groupFilters.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Children will render the actual filter inputs */}
                  <div className="text-sm text-muted-foreground">
                    Filter content for {group.label} will go here
                  </div>
                  {/* This is where we'll integrate with existing CollapsibleSearchForm */}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-4 border-t">
        <Button
          onClick={() => setIsFilterOpen(false)}
          className="w-full"
          size={mobile ? "lg" : "default"}
        >
          <Search className="h-4 w-4 mr-2" />
          {loading ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            "Apply Filters"
          )}
        </Button>

        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full"
          disabled={activeFilterCount === 0}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All ({activeFilterCount})
        </Button>
      </div>
    </div>
  )

  // Mobile: Bottom Sheet Pattern
  if (isMobile) {
    return (
      <div className="relative">
        {/* Floating Filter Button */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg lg:hidden"
              size="lg"
            >
              <Filter className="h-6 w-6" />
              {activeFilterCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="h-[85vh] max-h-[85vh]">
            <SheetHeader className="text-left">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter Courts
                  </SheetTitle>
                  <SheetDescription>
                    Find the perfect court for your game
                  </SheetDescription>
                </div>
                <div className="flex items-center gap-2">
                  {showResultsCount && resultCount > 0 && (
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                      {resultCount} results
                    </Badge>
                  )}
                  {activeFilterCount > 0 && (
                    <Badge variant="default">
                      {activeFilterCount} active
                    </Badge>
                  )}
                </div>
              </div>
            </SheetHeader>

            <FilterContent mobile={true} />
          </SheetContent>
        </Sheet>

        {/* Applied Filters Bar */}
        {activeFilterCount > 0 && (
          <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b p-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} applied
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
                className="h-8 px-3"
              >
                Modify
              </Button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(appliedFilters).map(([key, value]) =>
                value && (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="text-xs"
                  >
                    {getFilterDisplay(key as keyof AppliedFilters, value)}
                  </Badge>
                )
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={cn(
          "transition-all duration-300",
          activeFilterCount > 0 ? "mt-24" : "mt-0"
        )}>
          {children}
        </div>
      </div>
    )
  }

  // Tablet & Desktop: Sidebar Pattern
  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className={cn(
        "hidden lg:block",
        isTablet ? "w-80" : "w-96"
      )}>
        <Card className="sticky top-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            {showResultsCount && resultCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {resultCount} courts found
              </p>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <FilterContent mobile={false} />
          </CardContent>
        </Card>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Applied Filters Summary */}
        {activeFilterCount > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">Active Filters:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(appliedFilters).map(([key, value]) =>
                      value && (
                        <Badge
                          key={key}
                          variant="outline"
                          className="text-xs"
                        >
                          {getFilterDisplay(key as keyof AppliedFilters, value)}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-8 px-3"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {children}
      </main>
    </div>
  )
}