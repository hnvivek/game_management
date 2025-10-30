import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Calculate AI score based on 5 key factors (simplified approach)
function calculateAIScore(userTeam: any, opponentTeam: any, matchTime: Date, venuePrice: number) {
  const factors = {
    timePreference: 0,      // 30% weight - based on time of day
    costPreference: 0,      // 25% weight - based on venue price
    skillMatch: 0,          // 20% weight - based on sport compatibility
    venueQuality: 0,        // 15% weight - based on venue rating
    teamAvailability: 0     // 10% weight - based on team availability
  }

  // Time preference (higher score for evening/weekend slots)
  const hour = matchTime.getHours()
  const dayOfWeek = matchTime.getDay()

  if (hour >= 18 && hour <= 21) {
    factors.timePreference = 0.90 // Prime evening time
  } else if (hour >= 10 && hour <= 12) {
    factors.timePreference = 0.75 // Morning time
  } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
    factors.timePreference = 0.85 // Weekend bonus
  } else {
    factors.timePreference = 0.60 // Less preferred time
  }

  // Cost preference (lower price = higher score)
  if (venuePrice <= 1500) {
    factors.costPreference = 0.95 // Very affordable
  } else if (venuePrice <= 2000) {
    factors.costPreference = 0.80 // Affordable
  } else if (venuePrice <= 2500) {
    factors.costPreference = 0.65 // Moderate
  } else {
    factors.costPreference = 0.50 // Expensive
  }

  // Skill match (same sport = perfect match)
  factors.skillMatch = 1.0 // Always perfect since we filter by same sport

  // Venue quality (mock: based on price as proxy for quality)
  if (venuePrice >= 2000) {
    factors.venueQuality = 0.90 // High quality venue
  } else if (venuePrice >= 1500) {
    factors.venueQuality = 0.80 // Good quality
  } else {
    factors.venueQuality = 0.70 // Standard quality
  }

  // Team availability (mock: assume high availability)
  factors.teamAvailability = 0.90

  return factors
}

// Calculate weighted AI score
function calculateOverallScore(factors: any) {
  const weights = {
    timePreference: 0.30,
    costPreference: 0.25,
    skillMatch: 0.20,
    venueQuality: 0.15,
    teamAvailability: 0.10
  }

  return Object.entries(weights).reduce((total, [factor, weight]) => {
    return total + (factors[factor] * weight)
  }, 0)
}

// GET /api/ai-suggestions - Generate AI match suggestions for the logged-in user
export async function GET(request: NextRequest) {
  try {
    // Get user from session (for now, we'll use the test user we created)
    // In real implementation, this would come from authentication middleware
    const mockUser = {
      id: 'cmhcjjblf0000tz071eyoq2hi',
      email: 'testuser@example.com'
    }

    // Get user's teams
    const userTeams = await db.team.findMany({
      where: {
        members: {
          some: {
            userId: mockUser.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        city: true,
        area: true,
        sportId: true,
        logoUrl: true,
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        _count: {
          select: { members: true }
        }
      }
    })

    if (userTeams.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: 'No teams found for user'
      })
    }

    // Get open matches looking for opponents (real bookings)
    const openMatches = await db.match.findMany({
      where: {
        status: 'OPEN',
        awayTeamId: null
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            city: true,
            area: true,
            logoUrl: true,
            sport: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        },
        booking: {
          select: {
            startTime: true,
            endTime: true,
            venue: {
              select: {
                id: true,
                courtNumber: true,
                pricePerHour: true,
                vendor: {
                  select: {
                    name: true,
                    slug: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { booking: { startTime: 'asc' } }
      ]
    })

    // Get other teams (potential opponents) that match user's sports
    const userSportIds = userTeams.map(t => t.sportId).filter(id => id !== undefined)
    const otherTeams = await db.team.findMany({
      where: {
        id: { notIn: userTeams.map(t => t.id) },
        sportId: { in: userSportIds }
      },
      select: {
        id: true,
        name: true,
        city: true,
        area: true,
        logoUrl: true,
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    })

    // Generate AI suggestions combining real open matches and generated suggestions
    const suggestions = []

  
    // PRIORITY 1: Real open matches with existing bookings
    for (const openMatch of openMatches) {
      // Skip if it's user's own team's match
      if (userTeams.some(ut => ut.id === openMatch.homeTeam.id)) continue

      // Check if user's team plays the same sport
      const matchingUserTeams = userTeams.filter(userTeam =>
        userTeam.sport.id === openMatch.homeTeam.sport.id
      )

      if (matchingUserTeams.length === 0) continue

      const userTeam = matchingUserTeams[0]

      if (!openMatch.booking) continue // Skip matches without bookings

      // Calculate AI score for this real match
      const scoringFactors = calculateAIScore(
        userTeam,
        openMatch.homeTeam,
        openMatch.booking.startTime,
        openMatch.booking.venue.pricePerHour || 2000
      )
      const aiScore = calculateOverallScore(scoringFactors)

      suggestions.push({
        id: `real-match-${openMatch.id}-${userTeam.id}`,
        homeTeam: {
          id: openMatch.homeTeam.id,
          name: openMatch.homeTeam.name,
          sport: openMatch.homeTeam.sport.displayName || openMatch.homeTeam.sport.name,
          city: openMatch.homeTeam.city
        },
        awayTeam: {
          id: userTeam.id,
          name: userTeam.name,
          sport: userTeam.sport.displayName || userTeam.sport.name,
          city: userTeam.city
        },
        venue: {
          id: openMatch.booking.venue.id,
          name: openMatch.booking.venue.vendor?.name || 'Sports Venue',
          courtNumber: openMatch.booking.venue.courtNumber,
          pricePerHour: openMatch.booking.venue.pricePerHour
        },
        vendor: {
          name: openMatch.booking.venue.vendor?.name || 'Sports Venue',
          slug: openMatch.booking.venue.vendor?.slug || 'venue'
        },
        scheduledTime: openMatch.booking.startTime.toISOString(),
        duration: (openMatch.booking.endTime.getTime() - openMatch.booking.startTime.getTime()) / (1000 * 60 * 60),
        aiScore: Math.round(aiScore * 100) / 100,
        scoringFactors: scoringFactors,
        status: 'PENDING',
        expiresAt: new Date(openMatch.booking.startTime.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        homeTeamAccepted: false,
        awayTeamAccepted: false,
        originalMatchId: openMatch.id // Link to real match for easy acceptance
      })
    }

    // PRIORITY 2: Generated suggestions for teams without open matches
    for (const userTeam of userTeams) {
      // Skip if user already has real match suggestions
      if (suggestions.some(s => s.awayTeam.id === userTeam.id)) continue

      // Find potential opponents (same sport)
      const potentialOpponents = otherTeams.filter(team =>
        team.sport.id === userTeam.sport.id
      )

  
      if (potentialOpponents.length === 0) continue

      // Generate a few suggested matches
      const suggestedTimeSlots = [
        { hours: 72, label: '3 Days Later' },
        { hours: 120, label: '5 Days Later' }
      ]

      const suggestedVenues = [
        { name: '3Lok Sports Hub', price: 2000, quality: 'High' },
        { name: 'Urban Sports Complex', price: 1500, quality: 'Good' }
      ]

      let suggestionCount = 0
      const maxGeneratedSuggestions = 2 // Limit generated suggestions

      for (const timeSlot of suggestedTimeSlots) {
        if (suggestionCount >= maxGeneratedSuggestions) break

        const matchTime = new Date(Date.now() + timeSlot.hours * 60 * 60 * 1000)
        const opponent = potentialOpponents[0] // Use first available opponent
        const venue = suggestedVenues[suggestionCount % suggestedVenues.length]

        // Calculate AI score
        const scoringFactors = calculateAIScore(userTeam, opponent, matchTime, venue.price)
        const aiScore = calculateOverallScore(scoringFactors)

        suggestions.push({
          id: `suggested-match-${userTeam.id}-${opponent.id}-${timeSlot.hours}`,
          homeTeam: {
            id: userTeam.id,
            name: userTeam.name,
            sport: userTeam.sport.displayName || userTeam.sport.name,
            city: userTeam.city
          },
          awayTeam: {
            id: opponent.id,
            name: opponent.name,
            sport: opponent.sport.displayName || opponent.sport.name,
            city: opponent.city
          },
          venue: {
            id: `suggested-venue-${suggestionCount}`,
            name: venue.name,
            courtNumber: 'Field 1',
            pricePerHour: venue.price
          },
          vendor: {
            name: venue.name,
            slug: venue.name.toLowerCase().replace(/\s+/g, '-')
          },
          scheduledTime: matchTime.toISOString(),
          duration: 2,
          aiScore: Math.round(aiScore * 100) / 100,
          scoringFactors: scoringFactors,
          status: 'PENDING',
          expiresAt: new Date(matchTime.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours before
          homeTeamAccepted: false,
          awayTeamAccepted: false
        })

        suggestionCount++
      }
    }

    // Sort by AI score (highest first)
    suggestions.sort((a, b) => b.aiScore - a.aiScore)

    return NextResponse.json({
      suggestions: suggestions,
      count: suggestions.length,
      userTeams: userTeams.length,
      userTeamIds: userTeams.map(t => t.id),
      message: 'Demo AI suggestions generated successfully'
    })

  } catch (error) {
    console.error('Error generating AI suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/ai-suggestions - Accept or decline an AI suggestion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { suggestionId, action } = body

    if (!suggestionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: suggestionId, action' },
        { status: 400 }
      )
    }

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json(
        { error: 'Action must be "accept" or "decline"' },
        { status: 400 }
      )
    }

    // For demo purposes, just return success
    // In real implementation, this would update the database

    if (action === 'accept') {
      return NextResponse.json({
        success: true,
        message: 'Match accepted successfully',
        action: 'accepted',
        suggestionId
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Match declined',
        action: 'declined',
        suggestionId
      })
    }

  } catch (error) {
    console.error('Error processing AI suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to process suggestion', details: error.message },
      { status: 500 }
    )
  }
}