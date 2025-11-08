'use client'

import { lazy, Suspense, ComponentType, ReactNode, useState, useEffect } from 'react'
import { useResponsiveDesign } from '@/hooks/use-responsive-design'

interface LazyComponentProps {
  fallback?: ReactNode
  rootMargin?: string
  threshold?: number
  delay?: number
}

/**
 * Enhanced lazy loading wrapper with responsive fallbacks
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyComponentProps = {}
) {
  const {
    fallback = <LoadingSpinner />,
    rootMargin = '50px',
    threshold = 0.1,
    delay = 0
  } = options

  const LazyComponent = lazy(() =>
    delay > 0
      ? new Promise(resolve => setTimeout(() => resolve(importFunc()), delay))
      : importFunc()
  )

  return function LazyWrapper(props: Parameters<T>[0]) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

/**
 * Intersection Observer based lazy loading component
 */
export function LazyLoad({
  children,
  fallback = <LoadingSpinner />,
  rootMargin = '50px',
  threshold = 0.1,
  className,
  ...props
}: {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  threshold?: number
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const [isInView, setIsInView] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsInView(true)
          setHasLoaded(true)
        }
      },
      { rootMargin, threshold }
    )

    const currentElement = document.getElementById('lazy-load-trigger')
    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => observer.disconnect()
  }, [rootMargin, threshold, hasLoaded])

  return (
    <div
      id="lazy-load-trigger"
      className={className}
      {...props}
    >
      {isInView ? children : fallback}
    </div>
  )
}

/**
 * Responsive lazy loading that adapts to device type
 */
export function ResponsiveLazyLoad({
  children,
  fallback,
  mobileFallback,
  tabletFallback,
  desktopFallback,
  ...props
}: {
  children: ReactNode
  fallback?: ReactNode
  mobileFallback?: ReactNode
  tabletFallback?: ReactNode
  desktopFallback?: ReactNode
} & Parameters<typeof LazyLoad>[0]) {
  const { deviceType } = useResponsiveDesign()

  const getFallback = () => {
    switch (deviceType) {
      case 'mobile':
        return mobileFallback || fallback || <MobileLoadingSpinner />
      case 'tablet':
        return tabletFallback || fallback || <LoadingSpinner />
      case 'desktop':
      case 'large':
        return desktopFallback || fallback || <LoadingSpinner />
      default:
        return fallback || <LoadingSpinner />
    }
  }

  return (
    <LazyLoad fallback={getFallback()} {...props}>
      {children}
    </LazyLoad>
  )
}

/**
 * Progressive loading component for content chunks
 */
export function ProgressiveLoad({
  children,
  priority = 'normal',
  delay = 0,
  ...props
}: {
  children: ReactNode
  priority?: 'high' | 'normal' | 'low'
  delay?: number
} & Parameters<typeof LazyLoad>[0]) {
  const [shouldLoad, setShouldLoad] = useState(priority === 'high')

  useEffect(() => {
    if (priority !== 'high') {
      const timer = setTimeout(() => {
        setShouldLoad(true)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [priority, delay])

  if (!shouldLoad) {
    return <LoadingSkeleton priority={priority} />
  }

  return (
    <LazyLoad
      {...props}
      rootMargin={priority === 'high' ? '200px' : '50px'}
    >
      {children}
    </LazyLoad>
  )
}

/**
 * Loading spinners with responsive sizing
 */
export function LoadingSpinner({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const { getTouchTargetClasses } = useResponsiveDesign()

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  return (
    <div className={cn('flex items-center justify-center p-4', getTouchTargetClasses('minimum'))}>
      <div
        className={cn(
          'border-2 border-gray-300 border-t-primary rounded-full animate-spin',
          sizeClasses[size]
        )}
      />
    </div>
  )
}

export function MobileLoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-3">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

/**
 * Loading skeleton with responsive design
 */
export function LoadingSkeleton({
  lines = 3,
  priority = 'normal',
  className
}: {
  lines?: number
  priority?: 'high' | 'normal' | 'low'
  className?: string
}) {
  const { getSpacingClasses } = useResponsiveDesign()

  const heightClasses = {
    high: 'h-4',
    normal: 'h-4',
    low: 'h-3'
  }

  return (
    <div className={cn('space-y-2 p-4', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'bg-gray-200 rounded animate-pulse',
            heightClasses[priority],
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
          style={{
            animationDelay: `${index * 0.1}s`
          }}
        />
      ))}
    </div>
  )
}

/**
 * Lazy loaded image gallery component
 */
export function LazyImageGallery({
  images,
  imagesPerRow = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  ...props
}: {
  images: Array<{ src: string; alt: string }>
  imagesPerRow?: {
    mobile?: number
    tablet?: number
    desktop?: number
    large?: number
  }
} & Parameters<typeof LazyLoad>[0]) {
  const { deviceType, getCardGridConfig } = useResponsiveDesign()
  const [visibleImages, setVisibleImages] = useState(6) // Start with 6 images

  const imagesToShow = imagesPerRow[deviceType] || imagesPerRow.mobile || 1
  const displayImages = images.slice(0, visibleImages)

  const loadMore = () => {
    setVisibleImages(prev => Math.min(prev + imagesToShow * 2, images.length))
  }

  return (
    <LazyLoad {...props}>
      <div className={getCardGridConfig().columns === 'grid-cols-1' ? 'grid grid-cols-1' :
                   getCardGridConfig().columns === 'grid-cols-2' ? 'grid grid-cols-2' :
                   getCardGridConfig().columns === 'grid-cols-3' ? 'grid grid-cols-3' :
                   'grid grid-cols-4'}>
        {displayImages.map((image, index) => (
          <div
            key={index}
            className={cn(
              'relative overflow-hidden rounded-lg',
              getCardGridConfig().gap,
              getCardGridConfig().padding
            )}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {visibleImages < images.length && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            Load More Images
          </button>
        </div>
      )}
    </LazyLoad>
  )
}

/**
 * Lazy loaded list component with virtualization for large lists
 */
export function LazyList({
  items,
  renderItem,
  itemHeight = 60,
  containerHeight = 400,
  threshold = 5,
  ...props
}: {
  items: any[]
  renderItem: (item: any, index: number) => ReactNode
  itemHeight?: number
  containerHeight?: number
  threshold?: number
} & Parameters<typeof LazyLoad>[0]) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + threshold,
    items.length
  )

  const visibleItems = items.slice(visibleStart, visibleEnd)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <LazyLoad {...props}>
      <div
        ref={setContainerRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: items.length * itemHeight, position: 'relative' }}>
          {visibleItems.map((item, index) => (
            <div
              key={visibleStart + index}
              style={{
                position: 'absolute',
                top: (visibleStart + index) * itemHeight,
                width: '100%',
                height: itemHeight
              }}
            >
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </LazyLoad>
  )
}

/**
 * Utility to create lazy loaded route components
 */
export function createLazyRoute<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  return lazy(() => importFunc())
}

// Utility function to combine with Next.js dynamic imports
export function dynamicLazy<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    ssr?: boolean
    loading?: () => ReactNode
  } = {}
) {
  return lazy(() => importFunc())
}

// Helper function for className merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export default {
  createLazyComponent,
  LazyLoad,
  ResponsiveLazyLoad,
  ProgressiveLoad,
  LoadingSpinner,
  LoadingSkeleton,
  LazyImageGallery,
  LazyList,
  createLazyRoute,
  dynamicLazy
}