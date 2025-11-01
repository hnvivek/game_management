import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sports Management API',
      version: '1.0.0',
      description: 'API documentation for the Sports Management System - AI-powered match suggestions, team management, venue booking, and more',
      contact: {
        name: 'API Support',
        email: 'support@sportsmanagement.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server (alternative port)'
      }
    ],
    components: {
      schemas: {
        Team: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique team identifier'
            },
            name: {
              type: 'string',
              description: 'Team name'
            },
            city: {
              type: 'string',
              description: 'Team city'
            },
            area: {
              type: 'string',
              description: 'Team area/locality'
            },
            sportId: {
              type: 'string',
              description: 'Sport identifier'
            },
            logoUrl: {
              type: 'string',
              nullable: true,
              description: 'Team logo URL'
            },
            sport: {
              $ref: '#/components/schemas/Sport'
            },
            _count: {
              type: 'object',
              properties: {
                members: {
                  type: 'integer',
                  description: 'Number of team members'
                }
              }
            }
          }
        },
        Sport: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Sport identifier',
              example: 'cmhct91st0000tzwgks7lp3y6'
            },
            name: {
              type: 'string',
              description: 'Sport name (e.g., soccer, cricket)',
              example: 'soccer'
            },
            displayName: {
              type: 'string',
              description: 'Display name for the sport',
              example: 'Soccer'
            },
            icon: {
              type: 'string',
              description: 'Sport icon/emoji',
              example: '⚽'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the sport is currently active',
              example: true
            },
            formats: {
              type: 'array',
              description: 'Available formats for this sport',
              items: {
                $ref: '#/components/schemas/Format'
              }
            }
          }
        },
        Format: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Format identifier',
              example: 'cmhct91t40007tzwgzk1jhqd7'
            },
            name: {
              type: 'string',
              description: 'Format name',
              example: '5-a-side'
            },
            displayName: {
              type: 'string',
              description: 'Display name for the format',
              example: '5-a-side'
            },
            minPlayers: {
              type: 'integer',
              description: 'Minimum players per team',
              example: 5
            },
            maxPlayers: {
              type: 'integer',
              description: 'Maximum players per team',
              example: 10
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the format is currently active',
              example: true
            }
          }
        },
        Venue: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Venue identifier'
            },
            name: {
              type: 'string',
              description: 'Venue name'
            },
            courtNumber: {
              type: 'string',
              description: 'Court/field number'
            },
            pricePerHour: {
              type: 'number',
              format: 'float',
              description: 'Price per hour in local currency'
            }
          }
        },
        Vendor: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Vendor name'
            },
            slug: {
              type: 'string',
              description: 'Vendor slug for URL'
            }
          }
        },
        ScoringFactors: {
          type: 'object',
          properties: {
            timePreference: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Time preference score (0-1)'
            },
            costPreference: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Cost preference score (0-1)'
            },
            formatMatch: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Format compatibility score (0-1) - exact format matches required'
            },
            venueQuality: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Venue quality score (0-1)'
            },
            teamAvailability: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Team availability score (0-1)'
            }
          }
        },
        AISuggestion: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique suggestion identifier'
            },
            homeTeam: {
              $ref: '#/components/schemas/TeamInfo'
            },
            awayTeam: {
              $ref: '#/components/schemas/TeamInfo'
            },
            venue: {
              $ref: '#/components/schemas/Venue'
            },
            vendor: {
              $ref: '#/components/schemas/Vendor'
            },
            scheduledTime: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled match time (ISO 8601)'
            },
            duration: {
              type: 'number',
              description: 'Match duration in hours'
            },
            aiScore: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Overall AI confidence score (0-1)'
            },
            scoringFactors: {
              $ref: '#/components/schemas/ScoringFactors'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'SCHEDULED', 'EXPIRED'],
              description: 'Suggestion status'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Suggestion expiry time (ISO 8601)'
            },
            homeTeamAccepted: {
              type: 'boolean',
              description: 'Whether home team has accepted'
            },
            awayTeamAccepted: {
              type: 'boolean',
              description: 'Whether away team has accepted'
            },
            originalMatchId: {
              type: 'string',
              nullable: true,
              description: 'Original match ID (for real matches)'
            }
          }
        },
        TeamInfo: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Team identifier'
            },
            name: {
              type: 'string',
              description: 'Team name'
            },
            sport: {
              type: 'string',
              description: 'Sport name'
            },
            city: {
              type: 'string',
              description: 'Team city'
            }
          }
        },
        AISuggestionsResponse: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AISuggestion'
              },
              description: 'Array of AI-generated match suggestions'
            },
            count: {
              type: 'integer',
              description: 'Total number of suggestions'
            },
            userTeams: {
              type: 'integer',
              description: 'Number of user teams'
            },
            userTeamIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'User team IDs'
            },
            message: {
              type: 'string',
              description: 'Response message'
            }
          }
        },
        SuggestionActionRequest: {
          type: 'object',
          required: ['suggestionId', 'action'],
          properties: {
            suggestionId: {
              type: 'string',
              description: 'Suggestion identifier'
            },
            action: {
              type: 'string',
              enum: ['accept', 'decline'],
              description: 'Action to perform on suggestion'
            }
          }
        },
        SuggestionActionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the action was successful'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            action: {
              type: 'string',
              description: 'Action performed'
            },
            suggestionId: {
              type: 'string',
              description: 'Suggestion ID'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'string',
              description: 'Detailed error information'
            }
          }
        },
        SportOption: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Sport identifier'
            },
            name: {
              type: 'string',
              description: 'Sport name'
            },
            displayName: {
              type: 'string',
              description: 'Display name for the sport'
            }
          }
        },
        Match: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Match identifier'
            },
            homeTeamId: {
              type: 'string',
              description: 'Home team ID'
            },
            awayTeamId: {
              type: 'string',
              nullable: true,
              description: 'Away team ID'
            },
            venueId: {
              type: 'string',
              description: 'Venue ID'
            },
            status: {
              type: 'string',
              enum: ['OPEN', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
              description: 'Match status'
            },
            scheduledTime: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled match time'
            },
            duration: {
              type: 'number',
              description: 'Match duration in hours'
            },
            homeTeam: {
              $ref: '#/components/schemas/Team'
            },
            awayTeam: {
              $ref: '#/components/schemas/Team'
            },
            venue: {
              $ref: '#/components/schemas/Venue'
            }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Booking identifier'
            },
            venueId: {
              type: 'string',
              description: 'Venue ID'
            },
            customerId: {
              type: 'string',
              description: 'Customer ID'
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              description: 'Booking start time'
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              description: 'Booking end time'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
              description: 'Booking status'
            },
            bookingType: {
              type: 'string',
              description: 'Booking type'
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              description: 'Total price'
            },
            venue: {
              $ref: '#/components/schemas/Venue'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'AI Suggestions',
        description: 'AI-powered match suggestion endpoints'
      },
      {
        name: 'Teams',
        description: 'Team management endpoints'
      },
      {
        name: 'Venues',
        description: 'Venue booking and management endpoints'
      },
      {
        name: 'Matches',
        description: 'Match management endpoints'
      },
      {
        name: 'Bookings',
        description: 'Booking management endpoints'
      },
      {
        name: 'Sports',
        description: 'Sports and sports type endpoints'
      },
      {
        name: 'Vendors',
        description: 'Vendor management endpoints'
      },
      {
        name: 'System',
        description: 'System health and utility endpoints'
      },
      {
        name: 'Documentation',
        description: 'API documentation endpoints'
      }
    ]
  },
  apis: [
    './src/app/api/**/*.ts',
    './src/app/api/**/*.tsx',
    './src/app/api/**/*.js',
    './src/app/api/**/*.jsx'
  ]
}

export const specs = swaggerJsdoc(options)