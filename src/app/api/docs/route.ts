import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const apiDocs = {
    title: "Sports Venue Booking Platform API",
    version: "1.0.0",
    description: "Comprehensive API for sports venue booking, team management, and tournament organization",
    baseUrl,
    endpoints: {
      // Authentication
      auth: {
        login: {
          method: "POST",
          path: "/api/auth/login",
          description: "Authenticate user and get JWT token",
          body: {
            email: "string (email)",
            password: "string (min 8 chars)"
          },
          response: {
            user: "User object (without password)",
            token: "JWT token for authentication"
          }
        },
        logout: {
          method: "POST",
          path: "/api/auth/logout",
          description: "Logout user and clear token",
          response: {
            message: "string"
          }
        },
        me: {
          method: "GET",
          path: "/api/auth/me",
          description: "Get current authenticated user details",
          headers: {
            "Authorization": "Bearer <token>" // or use cookie
          },
          response: {
            user: "Complete user object with relations"
          }
        },
        signup: {
          method: "POST",
          path: "/api/auth/signup",
          description: "Register new user",
          body: {
            email: "string (email)",
            name: "string (2-100 chars)",
            password: "string (min 8 chars)",
            phone: "string (optional)",
            bio: "string (optional)",
            city: "string (optional)",
            area: "string (optional)",
            countryCode: "string (optional)",
            timezone: "string (optional)",
            currencyCode: "string (optional)",
            dateFormat: "string (optional)",
            timeFormat: "string (optional)",
            language: "string (optional)"
          },
          response: {
            user: "User object (without password)"
          }
        }
      },

      // Users
      users: {
        list: {
          method: "GET",
          path: "/api/users",
          description: "List all users with pagination and filtering",
          query: {
            page: "number (default: 1)",
            limit: "number (default: 10)",
            search: "string (search in name, email, city)",
            isActive: "boolean"
          },
          response: {
            users: "Array of User objects",
            pagination: "Pagination metadata"
          }
        },
        get: {
          method: "GET",
          path: "/api/users/[id]",
          description: "Get specific user by ID",
          response: {
            user: "Complete user object with relations"
          }
        },
        create: {
          method: "POST",
          path: "/api/users",
          description: "Create new user",
          body: "Same as signup",
          response: {
            user: "User object (without password)"
          }
        },
        update: {
          method: "PUT",
          path: "/api/users/[id]",
          description: "Update user details",
          body: {
            name: "string (optional)",
            phone: "string (optional)",
            bio: "string (optional)",
            city: "string (optional)",
            area: "string (optional)",
            countryCode: "string (optional)",
            timezone: "string (optional)",
            currencyCode: "string (optional)",
            dateFormat: "string (optional)",
            timeFormat: "string (optional)",
            language: "string (optional)",
            isActive: "boolean (optional)",
            password: "string (optional, for password change)"
          },
          response: {
            user: "Updated user object"
          }
        },
        delete: {
          method: "DELETE",
          path: "/api/users/[id]",
          description: "Deactivate user (soft delete)",
          response: {
            message: "string"
          }
        }
      },

      // Countries & Currencies
      countries: {
        list: {
          method: "GET",
          path: "/api/countries",
          description: "List all countries",
          query: {
            search: "string (search in name, code)",
            isActive: "boolean",
            includeInactive: "boolean"
          },
          response: {
            countries: "Array of Country objects with currency info"
          }
        },
        create: {
          method: "POST",
          path: "/api/countries",
          description: "Create new country",
          body: {
            code: "string (2 chars, uppercase)",
            name: "string (1-100 chars)",
            timezone: "string",
            currencyCode: "string (3 chars, uppercase)",
            isActive: "boolean (optional)"
          },
          response: {
            country: "Country object"
          }
        }
      },

      currencies: {
        list: {
          method: "GET",
          path: "/api/currencies",
          description: "List all currencies",
          query: {
            search: "string (search in name, code, symbol)",
            isActive: "boolean",
            includeInactive: "boolean"
          },
          response: {
            currencies: "Array of Currency objects"
          }
        },
        create: {
          method: "POST",
          path: "/api/currencies",
          description: "Create new currency",
          body: {
            code: "string (3 chars, uppercase)",
            name: "string (1-100 chars)",
            symbol: "string (max 10 chars)",
            exchangeRate: "number (positive, optional)",
            isActive: "boolean (optional)"
          },
          response: {
            currency: "Currency object"
          }
        }
      },

      // Teams
      teams: {
        list: {
          method: "GET",
          path: "/api/teams",
          description: "List all teams with pagination and filtering",
          query: {
            page: "number",
            limit: "number",
            search: "string (search in name, description, city)",
            sportId: "string",
            city: "string",
            isActive: "boolean"
          },
          response: {
            teams: "Array of Team objects with relations",
            pagination: "Pagination metadata"
          }
        },
        create: {
          method: "POST",
          path: "/api/teams",
          description: "Create new team",
          body: {
            name: "string (required)",
            description: "string (optional)",
            logoUrl: "string (URL, optional)",
            sportId: "string (required)",
            formatId: "string (required)",
            city: "string (optional)",
            area: "string (optional)",
            level: "string (optional)",
            maxPlayers: "number (positive, required)",
            isActive: "boolean (optional)"
          },
          response: {
            team: "Team object with sport and format info"
          }
        }
      },

      // Team Memberships
      members: {
        list: {
          method: "GET",
          path: "/api/members",
          description: "List team memberships",
          query: {
            page: "number",
            limit: "number",
            teamId: "string",
            userId: "string",
            role: "string (ADMIN|MEMBER)",
            isActive: "boolean"
          },
          response: {
            members: "Array of TeamMember objects",
            pagination: "Pagination metadata"
          }
        },
        create: {
          method: "POST",
          path: "/api/members",
          description: "Add member to team",
          body: {
            teamId: "string (required)",
            userId: "string (required)",
            role: "string (ADMIN|MEMBER, optional)",
            jerseyNumber: "number (positive, optional)",
            preferredPosition: "string (optional)",
            isActive: "boolean (optional)",
            canBookMatches: "boolean (optional)",
            canApproveMatches: "boolean (optional)"
          },
          response: {
            member: "TeamMember object with team and user info"
          }
        }
      },

      // Matches
      matches: {
        list: {
          method: "GET",
          path: "/api/matches",
          description: "List all matches with comprehensive filtering",
          query: {
            page: "number",
            limit: "number",
            search: "string (search in title, description, team names)",
            sportId: "string",
            status: "string",
            homeTeamId: "string",
            awayTeamId: "string",
            fromDate: "string (ISO datetime)",
            toDate: "string (ISO datetime)"
          },
          response: {
            matches: "Array of Match objects with complete relations",
            pagination: "Pagination metadata"
          }
        },
        create: {
          method: "POST",
          path: "/api/matches",
          description: "Create new match",
          body: {
            homeTeamId: "string (required)",
            awayTeamId: "string (optional, for open matches)",
            sportId: "string (required)",
            formatId: "string (required)",
            courtId: "string (required)",
            scheduledDate: "string (ISO datetime, required)",
            duration: "number (positive, minutes, required)",
            totalAmount: "number (positive, required)",
            title: "string (optional)",
            description: "string (optional)",
            createdBy: "string (required)"
          },
          response: {
            match: "Match object with complete relations"
          }
        }
      },

      // Payments
      payments: {
        list: {
          method: "GET",
          path: "/api/payments",
          description: "List all payments with filtering",
          query: {
            page: "number",
            limit: "number",
            paidBy: "string",
            status: "string",
            paymentGateway: "string",
            currencyCode: "string",
            fromDate: "string (ISO datetime)",
            toDate: "string (ISO datetime)"
          },
          response: {
            payments: "Array of Payment objects with relations",
            pagination: "Pagination metadata"
          }
        },
        create: {
          method: "POST",
          path: "/api/payments",
          description: "Create new payment record",
          body: {
            paidBy: "string (required)",
            amount: "number (positive, required)",
            currencyCode: "string (3 chars, uppercase, required)",
            paymentMethod: "string (optional)",
            paymentGateway: "string (optional)",
            transactionId: "string (optional)",
            gatewayResponse: "string (optional)",
            metadata: "string (optional)"
          },
          response: {
            payment: "Payment object with relations"
          }
        }
      }
    },

    // Common Response Formats
    responseFormats: {
      success: {
        status: 200,
        body: "Data object or array"
      },
      created: {
        status: 201,
        body: "Created object"
      },
      error: {
        status: 400,
        body: {
          error: "string",
          details: "Validation errors (if applicable)"
        }
      },
      unauthorized: {
        status: 401,
        body: {
          error: "string"
        }
      },
      notFound: {
        status: 404,
        body: {
          error: "string"
        }
      },
      conflict: {
        status: 409,
        body: {
          error: "string"
        }
      },
      serverError: {
        status: 500,
        body: {
          error: "string"
        }
      }
    },

    // Authentication
    authentication: {
      type: "JWT Bearer Token",
      header: "Authorization: Bearer <token>",
      cookie: "auth-token (HTTP-only)",
      loginEndpoint: "/api/auth/login",
      logoutEndpoint: "/api/auth/logout",
      meEndpoint: "/api/auth/me"
    },

    // Pagination
    pagination: {
      type: "Offset-based",
      parameters: {
        page: "Page number (default: 1)",
        limit: "Items per page (default: 10, max: 100)"
      },
      response: {
        page: "Current page",
        limit: "Items per page",
        total: "Total items",
        pages: "Total pages"
      }
    }
  };

  return NextResponse.json(apiDocs);
}