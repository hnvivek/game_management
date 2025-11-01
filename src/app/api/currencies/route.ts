import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema
const currencyCreateSchema = z.object({
  code: z.string().length(3).toUpperCase(),
  name: z.string().min(1).max(100),
  symbol: z.string().max(10),
  exchangeRate: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/currencies - List all currencies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { symbol: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!includeInactive) {
      where.isActive = isActive !== null ? isActive === 'true' : true;
    }

    const currencies = await prisma.currency.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            countries: true,
            users: true,
            vendors: true,
            venues: true,
          },
        },
      },
    });

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}

// POST /api/currencies - Create new currency
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = currencyCreateSchema.parse(body);

    // Check if currency already exists
    const existingCurrency = await prisma.currency.findUnique({
      where: { code: validatedData.code },
    });

    if (existingCurrency) {
      return NextResponse.json(
        { error: 'Currency with this code already exists' },
        { status: 409 }
      );
    }

    const currency = await prisma.currency.create({
      data: validatedData,
    });

    return NextResponse.json(currency, { status: 201 });
  } catch (error) {
    console.error('Error creating currency:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create currency' },
      { status: 500 }
    );
  }
}