import { theme } from './tokens'

/**
 * Sport color palette - consistent across all views (analytics, calendar, etc.)
 * Uses muted colors from theme for a sophisticated, colorblind-friendly appearance
 * Expanded palette ensures each sport gets a unique color
 */
export const sportColorPalette = theme.colors.charts.sports.muted

/**
 * Sport color mapping cache to ensure uniqueness
 * Maps sport ID/name to a specific color index
 */
const sportColorMap = new Map<string, number>()

/**
 * Create a deterministic hash from a string
 * Used to consistently map sport identifiers to color indices
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Get consistent, unique color for a sport based on its ID or name
 * Uses deterministic assignment to ensure the same sport always gets the same color
 * Handles collisions deterministically using a secondary hash
 * 
 * @param sportId - The ID of the sport (preferred for consistency)
 * @param sportName - Optional name of the sport (fallback if ID not available)
 * @returns Hex color string from the sport color palette
 * 
 * @example
 * ```tsx
 * // Using sport ID (recommended)
 * const color = getSportColor(sport.id)
 * 
 * // Using sport name as fallback
 * const color = getSportColor(undefined, sport.name)
 * ```
 */
export function getSportColor(sportId?: string, sportName?: string): string {
  // Use ID if available, otherwise use name
  const identifier = sportId || sportName || 'unknown'
  
  // Check if we've already assigned a color to this sport
  if (sportColorMap.has(identifier)) {
    const colorIndex = sportColorMap.get(identifier)!
    return sportColorPalette[colorIndex]
  }
  
  // Create a deterministic hash from the identifier
  const primaryHash = hashString(identifier)
  let colorIndex = primaryHash % sportColorPalette.length
  
  // Check for collisions and resolve deterministically
  const usedIndices = new Set(Array.from(sportColorMap.values()))
  if (usedIndices.has(colorIndex)) {
    // Use a secondary hash based on the identifier + a salt
    // This ensures deterministic collision resolution
    let attempt = 1
    while (usedIndices.has(colorIndex) && attempt < sportColorPalette.length) {
      const secondaryHash = hashString(identifier + attempt.toString())
      colorIndex = (primaryHash + secondaryHash * attempt) % sportColorPalette.length
      attempt++
    }
    
    // If still colliding after all attempts, use sequential search as last resort
    // This should rarely happen with 24 colors
    if (usedIndices.has(colorIndex)) {
      for (let i = 0; i < sportColorPalette.length; i++) {
        const nextIndex = (colorIndex + i) % sportColorPalette.length
        if (!usedIndices.has(nextIndex)) {
          colorIndex = nextIndex
          break
        }
      }
    }
  }
  
  // Cache the assignment
  sportColorMap.set(identifier, colorIndex)
  
  return sportColorPalette[colorIndex]
}

/**
 * Reset the sport color mapping cache
 * Useful for testing or when sports are reloaded
 */
export function resetSportColorMap(): void {
  sportColorMap.clear()
}

/**
 * Get all assigned sport colors
 * Useful for debugging or displaying color assignments
 */
export function getAssignedSportColors(): Map<string, string> {
  const assigned = new Map<string, string>()
  sportColorMap.forEach((colorIndex, identifier) => {
    assigned.set(identifier, sportColorPalette[colorIndex])
  })
  return assigned
}

/**
 * Convert hex color to rgba with opacity for background use
 * 
 * @param hex - Hex color string (e.g., '#f39c12')
 * @param opacity - Opacity value between 0 and 1 (default: 0.1)
 * @returns RGBA color string
 * 
 * @example
 * ```tsx
 * const bgColor = hexToRgba('#f39c12', 0.1) // 'rgba(243, 156, 18, 0.1)'
 * ```
 */
export function hexToRgba(hex: string, opacity: number = 0.1): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

