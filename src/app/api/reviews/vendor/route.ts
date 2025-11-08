import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Validation schema for creating a vendor review
const createVendorReviewSchema = z.object({
  vendorId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  bookingId: z.string().optional(),
  images: z.array(z.string()).optional(),
});

// GET: Fetch vendor reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'APPROVED';
    const sort = searchParams.get('sort') || 'newest';

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      vendorId,
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
      prisma.vendorReview.findMany({
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
      prisma.vendorReview.count({ where }),
    ]);

    // Calculate rating distribution
    const ratingStats = await prisma.vendorReview.groupBy({
      by: ['rating'],
      where: {
        vendorId,
        status: 'APPROVED',
        isPublic: true,
      },
      _count: {
        rating: true,
      },
    });

    // Calculate average rating
    const averageRating = await prisma.vendorReview.aggregate({
      where: {
        vendorId,
        status: 'APPROVED',
        isPublic: true,
      },
      _avg: {
        rating: true,
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
        averageRating: averageRating._avg.rating || 0,
        totalReviews: averageRating._count.rating || 0,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new vendor review
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
    const validatedData = createVendorReviewSchema.parse(body);

    const { vendorId, rating, title, comment, bookingId, images } = validatedData;

    // Check if user has already reviewed this vendor
    const existingReview = await prisma.vendorReview.findFirst({
      where: {
        vendorId,
        reviewerId: decoded.userId,
        bookingId: bookingId || null,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this vendor' },
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
              venue: {
                include: {
                  vendor: true,
                },
              },
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

      if (booking.court.venue.vendor.id !== vendorId) {
        return NextResponse.json(
          { error: 'Booking does not belong to this vendor' },
          { status: 400 }
        );
      }
    }

    // Create the review
    const review = await prisma.vendorReview.create({
      data: {
        vendorId,
        reviewerId: decoded.userId,
        rating,
        title,
        comment,
        bookingId,
        images: images ? JSON.stringify(images) : null,
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

    // Update vendor's rating stats (optional - can be calculated dynamically)
    // This could be handled by a background job or calculated on demand

    return NextResponse.json({
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    console.error('Error creating vendor review:', error);

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