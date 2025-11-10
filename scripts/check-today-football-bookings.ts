import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTodayFootballBookings() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('🔍 Checking bookings for football courts TODAY...\n');
  console.log(`Date range: ${today.toISOString()} to ${tomorrow.toISOString()}\n`);

  // Get football sport ID
  const footballSport = await prisma.sportType.findUnique({
    where: { name: 'football' }
  });

  if (!footballSport) {
    console.log('❌ Football sport not found');
    await prisma.$disconnect();
    return;
  }

  // Find all football courts
  const footballCourts = await prisma.court.findMany({
    where: {
      sportId: footballSport.id,
      isActive: true
    },
    include: {
      venue: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      { venue: { name: 'asc' } },
      { courtNumber: 'asc' }
    ]
  });

  console.log(`📋 Found ${footballCourts.length} football court(s):\n`);
  footballCourts.forEach((court, idx) => {
    console.log(`${idx + 1}. ${court.name} (${court.courtNumber}) - ${court.venue.name}`);
  });
  console.log('');

  // Get bookings for today for each football court
  for (const court of footballCourts) {
    const bookings = await prisma.booking.findMany({
      where: {
        courtId: court.id,
        startTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    if (bookings.length > 0) {
      console.log(`\n⚽ ${court.name} (${court.courtNumber}) - ${court.venue.name}:`);
      console.log(`   ${bookings.length} booking(s) today:\n`);
      bookings.forEach((booking) => {
        const startTime = new Date(booking.startTime);
        const endTime = new Date(booking.endTime);
        const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')} - ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
        console.log(`   • ${timeStr} | ${booking.status} | ${booking.user.name} | ₹${Number(booking.totalAmount).toFixed(2)}`);
      });
    } else {
      console.log(`\n⚽ ${court.name} (${court.courtNumber}) - ${court.venue.name}:`);
      console.log(`   No bookings today`);
    }
  }

  // Summary
  const allTodayBookings = await prisma.booking.findMany({
    where: {
      court: {
        sportId: footballSport.id
      },
      startTime: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  console.log(`\n\n📊 Summary:`);
  console.log(`   Total football court bookings today: ${allTodayBookings.length}`);
  console.log(`   Across ${footballCourts.length} football court(s)`);

  await prisma.$disconnect();
}

checkTodayFootballBookings().catch(console.error);

