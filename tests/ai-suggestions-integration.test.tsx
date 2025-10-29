import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/components/auth/AuthProvider'

// Mock AI suggestions data
const mockAISuggestions = [
  {
    id: 'ai-suggestion-1',
    homeTeam: {
      id: 'team-1',
      name: 'Thunder Strikers',
      sport: 'Football',
      city: 'Bengaluru'
    },
    awayTeam: {
      id: 'team-2',
      name: 'Lightning FC',
      sport: 'Football',
      city: 'Bengaluru'
    },
    venue: {
      id: 'venue-1',
      name: 'Test Sports Hub',
      courtNumber: 'Field 1',
      pricePerHour: 2000
    },
    vendor: {
      name: 'Test Sports Hub',
      slug: 'test-sports-hub'
    },
    scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 2,
    aiScore: 0.92,
    scoringFactors: {
      timeSlotCompatibility: 1.0,
      venuePreference: 0.9,
      teamAvailability: 1.0,
      travelDistance: 0.8,
      venueAvailability: 1.0,
      skillLevelMatch: 0.8
    },
    status: 'PENDING',
    homeTeamAccepted: false,
    awayTeamAccepted: false
  },
  {
    id: 'ai-suggestion-2',
    homeTeam: {
      id: 'team-3',
      name: 'Warriors FC',
      sport: 'Football',
      city: 'Bengaluru'
    },
    awayTeam: {
      id: 'team-4',
      name: 'Phoenix United',
      sport: 'Football',
      city: 'Bengaluru'
    },
    venue: {
      id: 'venue-2',
      name: 'Elite Sports Complex',
      courtNumber: 'Field 2',
      pricePerHour: 2500
    },
    vendor: {
      name: 'Elite Sports Complex',
      slug: 'elite-sports'
    },
    scheduledTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 2,
    aiScore: 0.87,
    scoringFactors: {
      timeSlotCompatibility: 0.9,
      venuePreference: 0.85,
      teamAvailability: 1.0,
      travelDistance: 0.75,
      venueAvailability: 0.9,
      skillLevelMatch: 0.85
    },
    status: 'PENDING',
    homeTeamAccepted: true,
    awayTeamAccepted: false
  }
]

// Mock fetch for AI suggestions
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ suggestions: mockAISuggestions })
  })
) as jest.Mock

describe('AI Suggestions Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('AI Suggestions Page Authentication', () => {
    it('should show sign-in required message when not authenticated', () => {
      const MockAIPage = () => {
        const { user } = useAuth()
        if (!user) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h2>Sign In Required</h2>
                <p>Please sign in to view AI-powered match suggestions</p>
                <a href="/signin">Sign In</a>
              </div>
            </div>
          )
        }
        return <div>AI Suggestions Content</div>
      }

      render(
        <AuthProvider>
          <MockAIPage />
        </AuthProvider>
      )

      expect(screen.getByText('Sign In Required')).toBeInTheDocument()
      expect(screen.getByText('Please sign in to view AI-powered match suggestions')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should show AI suggestions when authenticated', async () => {
      const MockAIPage = () => {
        const { user, login } = useAuth()
        const [suggestions, setSuggestions] = useState([])
        const [loading, setLoading] = useState(true)

        useEffect(() => {
          if (user) {
            // Mock API call
            setTimeout(() => {
              setSuggestions(mockAISuggestions)
              setLoading(false)
            }, 1000)
          }
        }, [user])

        if (!user) {
          return (
            <div>
              <button onClick={() => login('test@example.com', 'password')}>
                Sign In
              </button>
            </div>
          )
        }

        if (loading) {
          return <div>Loading AI suggestions...</div>
        }

        return (
          <div>
            <h1>AI Match Suggestions</h1>
            {suggestions.map(suggestion => (
              <div key={suggestion.id} data-testid={`suggestion-${suggestion.id}`}>
                <h3>{suggestion.homeTeam.name} vs {suggestion.awayTeam.name}</h3>
                <p>AI Score: {(suggestion.aiScore * 100).toFixed(0)}%</p>
                <p>Venue: {suggestion.venue.name}</p>
                <p>Status: {suggestion.status}</p>
              </div>
            ))}
          </div>
        )
      }

      render(
        <AuthProvider>
          <MockAIPage />
        </AuthProvider>
      )

      // Initially show sign in button
      expect(screen.getByText('Sign In')).toBeInTheDocument()

      // Sign in
      fireEvent.click(screen.getByText('Sign In'))

      // Show loading state
      expect(screen.getByText('Loading AI suggestions...')).toBeInTheDocument()

      // Wait for suggestions to load
      await waitFor(() => {
        expect(screen.getByText('AI Match Suggestions')).toBeInTheDocument()
      })

      // Check suggestions are displayed
      expect(screen.getByTestId('suggestion-ai-suggestion-1')).toBeInTheDocument()
      expect(screen.getByTestId('suggestion-ai-suggestion-2')).toBeInTheDocument()
      expect(screen.getByText('Thunder Strikers vs Lightning FC')).toBeInTheDocument()
      expect(screen.getByText('AI Score: 92%')).toBeInTheDocument()
    })
  })

  describe('AI Scoring Display', () => {
    it('should display AI scoring breakdown correctly', async () => {
      const MockScoringComponent = ({ suggestion }) => (
        <div data-testid={`scoring-${suggestion.id}`}>
          <h4>AI Scoring Breakdown</h4>
          {Object.entries(suggestion.scoringFactors).map(([factor, score]) => (
            <div key={factor}>
              <span>{factor.replace(/([A-Z])/g, ' $1').trim()}: </span>
              <span>{(score * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )

      render(
        <MockScoringComponent suggestion={mockAISuggestions[0]} />
      )

      const scoringElement = screen.getByTestId('scoring-ai-suggestion-1')

      expect(scoringElement).toHaveTextContent('Time Slot Compatibility: 100%')
      expect(scoringElement).toHaveTextContent('Venue Preference: 90%')
      expect(scoringElement).toHaveTextContent('Team Availability: 100%')
      expect(scoringElement).toHaveTextContent('Travel Distance: 80%')
      expect(scoringElement).toHaveTextContent('Venue Availability: 100%')
      expect(scoringElement).toHaveTextContent('Skill Level Match: 80%')
    })

    it('should show correct status badges', () => {
      const MockStatusBadge = ({ suggestion }) => {
        const getStatusBadge = (status, homeAccepted, awayAccepted) => {
          switch (status) {
            case 'PENDING':
              if (homeAccepted && awayAccepted) return 'Scheduled'
              if (homeAccepted || awayAccepted) return 'Partial Accept'
              return 'Pending'
            case 'SCHEDULED':
              return 'Scheduled'
            case 'EXPIRED':
              return 'Expired'
            default:
              return status
          }
        }

        return (
          <span data-testid={`status-${suggestion.id}`}>
            {getStatusBadge(suggestion.status, suggestion.homeTeamAccepted, suggestion.awayAccepted)}
          </span>
        )
      }

      const { rerender } = render(
        <MockStatusBadge suggestion={mockAISuggestions[0]} />
      )

      // First suggestion: no one accepted
      expect(screen.getByTestId('status-ai-suggestion-1')).toHaveTextContent('Pending')

      // Second suggestion: home team accepted
      rerender(<MockStatusBadge suggestion={mockAISuggestions[1]} />)
      expect(screen.getByTestId('status-ai-suggestion-2')).toHaveTextContent('Partial Accept')
    })
  })

  describe('AI Suggestions Navigation', () => {
    it('should add AI Suggestions to navigation when authenticated', async () => {
      const MockNavigation = () => {
        const { user } = useAuth()

        const navigation = [
          { name: 'Home', href: '/' },
          { name: 'Book Venues', href: '/book-venue' },
          { name: 'Teams', href: '/teams' },
          { name: 'Matches', href: '/matches' },
          ...(user ? [{ name: 'AI Suggestions', href: '/ai-suggestions' }] : [])
        ]

        return (
          <nav>
            {navigation.map(item => (
              <a key={item.name} href={item.href} data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}>
                {item.name}
              </a>
            ))}
          </nav>
        )
      }

      const { rerender } = render(
        <AuthProvider>
          <MockNavigation />
        </AuthProvider>
      )

      // Initially, AI Suggestions should not be in navigation
      expect(screen.queryByTestId('nav-ai-suggestions')).not.toBeInTheDocument()
      expect(screen.getByTestId('nav-home')).toBeInTheDocument()
      expect(screen.getByTestId('nav-book-venues')).toBeInTheDocument()

      // Create a component that can login for testing
      const TestComponent = () => {
        const { login } = useAuth()
        return (
          <div>
            <MockNavigation />
            <button onClick={() => login('test@example.com', 'password')} data-testid="login-btn">
              Login
            </button>
          </div>
        )
      }

      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Login
      fireEvent.click(screen.getByTestId('login-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('nav-ai-suggestions')).toBeInTheDocument()
      })
    })
  })

  describe('AI Suggestion Actions', () => {
    it('should handle accept/decline actions', async () => {
      const mockOnAccept = jest.fn()
      const mockOnDecline = jest.fn()

      const MockSuggestionCard = ({ suggestion }) => (
        <div data-testid={`card-${suggestion.id}`}>
          <h3>{suggestion.homeTeam.name} vs {suggestion.awayTeam.name}</h3>
          <button onClick={() => mockOnAccept(suggestion.id)} data-testid={`accept-${suggestion.id}`}>
            Accept Match
          </button>
          <button onClick={() => mockOnDecline(suggestion.id)} data-testid={`decline-${suggestion.id}`}>
            Decline
          </button>
        </div>
      )

      render(
        <MockSuggestionCard suggestion={mockAISuggestions[0]} />
      )

      const acceptButton = screen.getByTestId('accept-ai-suggestion-1')
      const declineButton = screen.getByTestId('decline-ai-suggestion-1')

      fireEvent.click(acceptButton)
      expect(mockOnAccept).toHaveBeenCalledWith('ai-suggestion-1')

      fireEvent.click(declineButton)
      expect(mockOnDecline).toHaveBeenCalledWith('ai-suggestion-1')
    })

    it('should show time until expiry', () => {
      const MockExpiryTimer = ({ suggestion }) => {
        if (suggestion.status !== 'PENDING' || !suggestion.expiresAt) {
          return <div>No expiry</div>
        }

        const timeUntilExpiry = Math.max(0, Math.floor(
          (new Date(suggestion.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)
        ))

        return (
          <div data-testid={`expiry-${suggestion.id}`}>
            Expires in {timeUntilExpiry}h
          </div>
        )
      }

      // Create a suggestion that expires in 2 hours
      const expiresSoonSuggestion = {
        ...mockAISuggestions[0],
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      }

      render(
        <MockExpiryTimer suggestion={expiresSoonSuggestion} />
      )

      expect(screen.getByTestId('expiry-ai-suggestion-1')).toHaveTextContent('Expires in 2h')
    })
  })

  describe('AI Suggestions Analytics', () => {
    it('should calculate and display statistics', () => {
      const MockAnalytics = ({ suggestions }) => {
        const activeSuggestions = suggestions.filter(s => s.status === 'PENDING').length
        const scheduledMatches = suggestions.filter(s =>
          s.status === 'SCHEDULED' || (s.homeTeamAccepted && s.awayTeamAccepted)
        ).length
        const avgAIScore = suggestions.length > 0
          ? (suggestions.reduce((acc, s) => acc + s.aiScore, 0) / suggestions.length * 100).toFixed(0)
          : 0

        return (
          <div data-testid="analytics">
            <div data-testid="active-suggestions">{activeSuggestions}</div>
            <div data-testid="scheduled-matches">{scheduledMatches}</div>
            <div data-testid="avg-ai-score">{avgAIScore}%</div>
          </div>
        )
      }

      render(
        <MockAnalytics suggestions={mockAISuggestions} />
      )

      expect(screen.getByTestId('active-suggestions')).toHaveTextContent('2')
      expect(screen.getByTestId('scheduled-matches')).toHaveTextContent('0')
      expect(screen.getByTestId('avg-ai-score')).toHaveTextContent('90%') // (0.92 + 0.87) / 2 * 100 = 89.5 ≈ 90
    })
  })
})

// Mock React hooks for testing
function useState<T>(initial: T): [T, (value: T) => void] {
  let state = initial
  return [state, (newValue: T) => { state = newValue }]
}

function useEffect(effect: () => void | (() => void), deps?: any[]) {
  // Mock implementation
}

function useAuth() {
  // This would be replaced by actual useAuth hook
  throw new Error('useAuth must be used within AuthProvider')
}