import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Validation schema for voting on a review
const voteSchema = z.object({
  reviewId: z.string(),
  reviewType: z.enum(['VENDOR_REVIEW', 'VENUE_REVIEW']),
  isHelpful: z.boolean(),
});

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
    const { reviewId, reviewType, isHelpful } = voteSchema.parse(body);

    // Check if user has already voted on this review
    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        reviewId_reviewType_userId: {
          reviewId,
          reviewType,
          userId: decoded.userId,
        },
      },
    });

    if (existingVote) {
      // Update existing vote
      await prisma.reviewVote.update({
        where: {
          reviewId_reviewType_userId: {
            reviewId,
            reviewType,
            userId: decoded.userId,
          },
        },
        data: {
          isHelpful,
        },
      });
    } else {
      // Create new vote
      await prisma.reviewVote.create({
        data: {
          reviewId,
          reviewType,
          isHelpful,
          userId: decoded.userId,
          // Set dynamic foreign key based on review type
          ...(reviewType === 'VENDOR_REVIEW' && { vendorReviewId: reviewId }),
          ...(reviewType === 'VENUE_REVIEW' && { venueReviewId: reviewId }),
        },
      });
    }

    // Recalculate helpful count for the review
    const votes = await prisma.reviewVote.groupBy({
      by: ['isHelpful'],
      where: {
        reviewId,
        reviewType,
      },
      _count: {
        isHelpful: true,
      },
    });

    const helpfulCount = votes.find(v => v.isHelpful)?._count.isHelpful || 0;
    const totalVotes = votes.reduce((sum, v) => sum + v._count.isHelpful, 0);

    // Update the review's vote counts
    if (reviewType === 'VENDOR_REVIEW') {
      await prisma.vendorReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount,
          totalVotes,
        },
      });
    } else {
      await prisma.venueReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount,
          totalVotes,
        },
      });
    }

    return NextResponse.json({
      message: 'Vote recorded successfully',
      helpfulCount,
      totalVotes,
      userVote: isHelpful,
    });
  } catch (error) {
    console.error('Error voting on review:', error);

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

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const reviewType = searchParams.get('reviewType');

    if (!reviewId || !reviewType) {
      return NextResponse.json(
        { error: 'Review ID and review type are required' },
        { status: 400 }
      );
    }

    if (!['VENDOR_REVIEW', 'VENUE_REVIEW'].includes(reviewType)) {
      return NextResponse.json(
        { error: 'Invalid review type' },
        { status: 400 }
      );
    }

    // Delete the vote
    await prisma.reviewVote.delete({
      where: {
        reviewId_reviewType_userId: {
          reviewId,
          reviewType: reviewType as any,
          userId: decoded.userId,
        },
      },
    });

    // Recalculate helpful count for the review
    const votes = await prisma.reviewVote.groupBy({
      by: ['isHelpful'],
      where: {
        reviewId,
        reviewType: reviewType as any,
      },
      _count: {
        isHelpful: true,
      },
    });

    const helpfulCount = votes.find(v => v.isHelpful)?._count.isHelpful || 0;
    const totalVotes = votes.reduce((sum, v) => sum + v._count.isHelpful, 0);

    // Update the review's vote counts
    if (reviewType === 'VENDOR_REVIEW') {
      await prisma.vendorReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount,
          totalVotes,
        },
      });
    } else {
      await prisma.venueReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount,
          totalVotes,
        },
      });
    }

    return NextResponse.json({
      message: 'Vote removed successfully',
      helpfulCount,
      totalVotes,
    });
  } catch (error) {
    console.error('Error removing vote on review:', error);

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