import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Validation schema for creating a venue review
const createVenueReviewSchema = z.object({
  venueId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  bookingId: z.string().optional(),
  images: z.array(z.string()).optional(),
  // Specific ratings
  cleanlinessRating: z.number().min(1).max(5).optional(),
  serviceRating: z.number().min(1).max(5).optional(),
  facilitiesRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  locationRating: z.number().min(1).max(5).optional(),
});

// GET: Fetch venue reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'APPROVED';
    const sort = searchParams.get('sort') || 'newest';

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      venueId,
      status: status as any,
      isPublic: true,
    };

    // Build sort clause
    const orderBy: any = {};
    switch (sort) {
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'oldest':
        orderBy.createdAt = 'asc';
        break;
      case 'highest':
        orderBy.rating = 'desc';
        break;
      case 'lowest':
        orderBy.rating = 'asc';
        break;
      case 'helpful':
        orderBy.helpfulCount = 'desc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.venueReview.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          responses: {
            include: {
              responder: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              votes: true,
            },
          },
        },
      }),
      prisma.venueReview.count({ where }),
    ]);

    // Calculate rating distribution
    const ratingStats = await prisma.venueReview.groupBy({
      by: ['rating'],
      where: {
        venueId,
        status: 'APPROVED',
        isPublic: true,
      },
      _count: {
        rating: true,
      },
    });

    // Calculate average rating for specific categories
    const categoryAverages = await prisma.venueReview.aggregate({
      where: {
        venueId,
        status: 'APPROVED',
        isPublic: true,
      },
      _avg: {
        rating: true,
        cleanlinessRating: true,
        serviceRating: true,
        facilitiesRating: true,
        valueRating: true,
        locationRating: true,
      },
      _count: {
        rating: true,
      },
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratingStats.find(stat => stat.rating === rating)?._count.rating || 0,
    }));

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: categoryAverages._avg.rating || 0,
        totalReviews: categoryAverages._count.rating || 0,
        ratingDistribution,
        categoryAverages: {
          cleanliness: categoryAverages._avg.cleanlinessRating || 0,
          service: categoryAverages._avg.serviceRating || 0,
          facilities: categoryAverages._avg.facilitiesRating || 0,
          value: categoryAverages._avg.valueRating || 0,
          location: categoryAverages._avg.locationRating || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching venue reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new venue review
export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createVenueReviewSchema.parse(body);

    const {
      venueId,
      rating,
      title,
      comment,
      bookingId,
      images,
      cleanlinessRating,
      serviceRating,
      facilitiesRating,
      valueRating,
      locationRating,
    } = validatedData;

    // Check if user has already reviewed this venue
    const existingReview = await prisma.venueReview.findFirst({
      where: {
        venueId,
        reviewerId: decoded.userId,
        bookingId: bookingId || null,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this venue' },
        { status: 400 }
      );
    }

    // If bookingId is provided, verify the booking exists and belongs to the user
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          court: {
            include: {
              venue: true,
            },
          },
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      if (booking.userId !== decoded.userId) {
        return NextResponse.json(
          { error: 'You can only review bookings you made' },
          { status: 403 }
        );

      }

      if (booking.court.venueId !== venueId) {
        return NextResponse.json(
          { error: 'Booking does not belong to this venue' },
          { status: 400 }
        );
      }
    }

    // Create the review
    const review = await prisma.venueReview.create({
      data: {
        venueId,
        reviewerId: decoded.userId,
        rating,
        title,
        comment,
        bookingId,
        images: images ? JSON.stringify(images) : null,
        cleanlinessRating,
        serviceRating,
        facilitiesRating,
        valueRating,
        locationRating,
        isVerified: !!bookingId, // Mark as verified if linked to a booking
        status: 'APPROVED', // Auto-approve for now, can be moderated later
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    console.error('Error creating venue review:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}