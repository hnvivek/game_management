'use client'

import Image, { ImageProps as NextImageProps } from 'next/image'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useResponsiveDesign } from '@/lib/hooks/useResponsiveDesign'

interface OptimizedImageProps extends Omit<NextImageProps, 'onLoad' | 'onError'> {
  /**
   * Different aspect ratios for responsive images
   */
  aspectRatio?: {
    mobile?: number
    tablet?: number
    desktop?: number
    large?: number
  }

  /**
   * Enable lazy loading with intersection observer
   */
  lazyLoad?: boolean

  /**
   * Add loading skeleton
   */
  showSkeleton?: boolean

  /**
   * Enable blur placeholder
   */
  blurPlaceholder?: boolean

  /**
   * Custom blur data URL
   */
  blurDataURL?: string

  /**
   * Enable responsive srcSet
   */
  responsive?: boolean

  /**
   * Priority loading for above-the-fold images
   */
  priority?: boolean

  /**
   * Fallback image source
   */
  fallbackSrc?: string

  /**
   * Custom loading and error handlers
   */
  onLoad?: () => void
  onError?: () => void

  /**
   * Container className for responsive behavior
   */
  containerClassName?: string
}

/**
 * Enhanced Image component with responsive optimization, lazy loading,
 * and performance features built on top of Next.js Image
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  aspectRatio,
  className,
  containerClassName,
  lazyLoad = true,
  showSkeleton = true,
  blurPlaceholder = false,
  blurDataURL,
  responsive = true,
  priority = false,
  fallbackSrc,
  onLoad,
  onError,
  sizes,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(!lazyLoad || priority)
  const { getImageDimensions, deviceType, getPerformanceClasses } = useResponsiveDesign()

  // Calculate responsive dimensions
  const getResponsiveDimensions = useCallback(() => {
    if (!responsive || !width || !height) {
      return { width: width as number, height: height as number }
    }

    const baseWidth = width as number
    const ratio = aspectRatio?.[deviceType] || aspectRatio?.desktop || (height as number) / (width as number)

    return getImageDimensions(baseWidth, ratio)
  }, [width, height, aspectRatio, deviceType, responsive, getImageDimensions])

  const { width: responsiveWidth, height: responsiveHeight, srcSet } = getResponsiveDimensions()

  // Generate responsive sizes attribute
  const generateSizes = useCallback(() => {
    if (sizes) return sizes

    if (responsive) {
      return `
        (max-width: 640px) 100vw,
        (max-width: 768px) 50vw,
        (max-width: 1024px) 33vw,
        (max-width: 1280px) 25vw,
        20vw
      `.replace(/\s+/g, ' ').trim()
    }

    return '100vw'
  }, [sizes, responsive])

  // Intersection observer for lazy loading
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (entry.isIntersecting) {
      setIsInView(true)
    }
  }, [])

  // Set up intersection observer
  useState(() => {
    if (lazyLoad && !priority && typeof window !== 'undefined') {
      const observer = new IntersectionObserver(observerCallback, {
        rootMargin: '50px 0px',
        threshold: 0.1
      })

      const target = document.getElementById(`img-${src}`)
      if (target) {
        observer.observe(target)
      }

      return () => observer.disconnect()
    }
  })

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoad?.()
  }, [onLoad])

  // Handle image error
  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }, [onError])

  // Generate blur placeholder
  const generateBlurDataURL = useCallback(() => {
    if (blurDataURL) return blurDataURL

    if (blurPlaceholder && responsiveWidth && responsiveHeight) {
      // Generate a simple blur placeholder
      return `data:image/svg+xml;base64,${btoa(
        `<svg width="${responsiveWidth}" height="${responsiveHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f3f4f6"/>
          <rect width="100%" height="100%" fill="url(#gradient)"/>
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#e5e7eb"/>
              <stop offset="100%" style="stop-color:#d1d5db"/>
            </linearGradient>
          </defs>
        </svg>`
      )}`
    }

    return undefined
  }, [blurDataURL, blurPlaceholder, responsiveWidth, responsiveHeight])

  // Default fallback image
  const defaultFallbackSrc = 'data:image/svg+xml;base64,' + btoa(
    `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="sans-serif" font-size="14">
        No Image
      </text>
    </svg>`
  )

  const imageSrc = hasError ? (fallbackSrc || defaultFallbackSrc) : src

  return (
    <div
      id={lazyLoad && !priority ? `img-${src}` : undefined}
      className={cn(
        'relative overflow-hidden',
        containerClassName,
        showSkeleton && isLoading && 'bg-gray-100 animate-pulse',
        getPerformanceClasses('containment').layoutPaint
      )}
    >
      {isInView && (
        <Image
          src={imageSrc}
          alt={alt}
          width={responsiveWidth}
          height={responsiveHeight}
          sizes={generateSizes()}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          priority={priority}
          placeholder={blurPlaceholder ? 'blur' : 'empty'}
          blurDataURL={generateBlurDataURL()}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* Loading indicator */}
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Responsive Image component with automatic aspect ratio adjustment
 */
export function ResponsiveImage({
  aspectRatio = {
    mobile: 1,      // Square on mobile
    tablet: 16/9,   // Landscape on tablet
    desktop: 16/9,  // Landscape on desktop
    large: 21/9     // Wide on large screens
  },
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      aspectRatio={aspectRatio}
      responsive={true}
      {...props}
    />
  )
}

/**
 * Avatar component optimized for user profile images
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & {
  size?: number
}) {
  const { getTouchTargetClasses } = useResponsiveDesign()

  return (
    <OptimizedImage
      src={src}
      alt={alt || 'User avatar'}
      width={size}
      height={size}
      className={cn(
        'rounded-full object-cover',
        getTouchTargetClasses('minimum'),
        className
      )}
      aspectRatio={{
        mobile: 1,
        tablet: 1,
        desktop: 1,
        large: 1
      }}
      responsive={false}
      blurPlaceholder={true}
      {...props}
    />
  )
}

/**
 * Hero Image component for above-the-fold content
 */
export function HeroImage({
  className,
  containerClassName,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      className={cn(
        'w-full h-auto object-cover',
        className
      )}
      containerClassName={cn(
        'w-full relative',
        containerClassName
      )}
      priority={true}
      lazyLoad={false}
      responsive={true}
      showSkeleton={false}
      aspectRatio={{
        mobile: 16/9,
        tablet: 21/9,
        desktop: 21/9,
        large: 21/9
      }}
      {...props}
    />
  )
}

export default OptimizedImage