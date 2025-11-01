import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

// Initialize Prisma client
const prisma = new PrismaClient();

// Utility functions for seeding
export const seedUtils = {
  // Generate unique IDs
  generateId: () => uuidv4(),

  // Hash passwords
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  },

  // Generate random date within range
  randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },

  // Generate random future date
  randomFutureDate(daysFromNow: number = 30): Date {
    const now = new Date();
    const future = new Date(now.getTime() + (daysFromNow * 24 * 60 * 60 * 1000));
    return this.randomDate(now, future);
  },

  // Generate random past date
  randomPastDate(daysAgo: number = 30): Date {
    const now = new Date();
    const past = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    return this.randomDate(past, now);
  },

  // Generate random time slot
  randomTimeSlot(): { startTime: string; endTime: string } {
    const startHour = Math.floor(Math.random() * 14) + 6; // 6 AM to 8 PM
    const duration = Math.floor(Math.random() * 3) + 1; // 1-3 hours
    const endHour = Math.min(startHour + duration, 22); // Max 10 PM

    return {
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${endHour.toString().padStart(2, '0')}:00`,
    };
  },

  // Generate random phone number
  randomPhoneNumber(): string {
    return `+${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  },

  // Select random item from array
  randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  },

  // Select random items from array
  randomChoices<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  },

  // Generate random boolean with probability
  randomBool(probability: number = 0.5): boolean {
    return Math.random() < probability;
  },

  // Generate random number in range
  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Generate random float in range
  randomFloat(min: number, max: number, decimals: number = 2): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
  },

  // Generate random coordinates for a city
  generateCityCoordinates(cityName: string): { latitude: number; longitude: number } {
    // This is a simplified approach - in production, you'd use a proper geocoding service
    const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
      'New York': { latitude: 40.7128, longitude: -74.0060 },
      'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
      'Chicago': { latitude: 41.8781, longitude: -87.6298 },
      'Houston': { latitude: 29.7604, longitude: -95.3698 },
      'Phoenix': { latitude: 33.4484, longitude: -112.0740 },
      'Philadelphia': { latitude: 39.9526, longitude: -75.1652 },
      'San Antonio': { latitude: 29.4241, longitude: -98.4936 },
      'San Diego': { latitude: 32.7157, longitude: -117.1611 },
      'Dallas': { latitude: 32.7767, longitude: -96.7970 },
      'San Jose': { latitude: 37.3382, longitude: -121.8863 },
      'London': { latitude: 51.5074, longitude: -0.1278 },
      'Manchester': { latitude: 53.4808, longitude: -2.2426 },
      'Birmingham': { latitude: 52.4862, longitude: -1.8904 },
      'Dubai': { latitude: 25.2048, longitude: 55.2708 },
      'Abu Dhabi': { latitude: 24.4539, longitude: 54.3773 },
      'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
      'Delhi': { latitude: 28.6139, longitude: 77.2090 },
      'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
      'Toronto': { latitude: 43.6532, longitude: -79.3832 },
      'Vancouver': { latitude: 49.2827, longitude: -123.1207 },
    };

    const baseCoords = cityCoordinates[cityName] || { latitude: 40.7128, longitude: -74.0060 };

    // Add small random variation to make venues slightly different
    return {
      latitude: baseCoords.latitude + (Math.random() - 0.5) * 0.1,
      longitude: baseCoords.longitude + (Math.random() - 0.5) * 0.1,
    };
  },

  // Clean database (for testing)
  async cleanDatabase(): Promise<void> {
    // Delete in order to respect foreign key constraints
    // Based on actual tables in the current schema
    await prisma.booking.deleteMany();
    await prisma.matchPerformance.deleteMany();
    await prisma.match.deleteMany();
    await prisma.matchSchedule.deleteMany();
    await prisma.teamStanding.deleteMany();
    await prisma.teamAvailability.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.venueAvailability.deleteMany();
    await prisma.venue.deleteMany();
    await prisma.vendorSettings.deleteMany();
    await prisma.vendorLocation.deleteMany();
    await prisma.teamVendor.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.conflict.deleteMany();
    await prisma.post.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.user.deleteMany();
    await prisma.formatType.deleteMany();
    await prisma.sportType.deleteMany();
  },

  // Get database statistics
  async getStats(): Promise<Record<string, number>> {
    const [
      users,
      vendors,
      venues,
      teams,
      matches,
      bookings,
      sportTypes,
      formatTypes,
      vendorLocations,
      vendorSettings,
      payments,
      posts,
      conflicts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.venue.count(),
      prisma.team.count(),
      prisma.match.count(),
      prisma.booking.count(),
      prisma.sportType.count(),
      prisma.formatType.count(),
      prisma.vendorLocation.count(),
      prisma.vendorSettings.count(),
      prisma.payment.count(),
      prisma.post.count(),
      prisma.conflict.count(),
    ]);

    return {
      users,
      vendors,
      venues,
      teams,
      matches,
      bookings,
      sportTypes,
      formatTypes,
      vendorLocations,
      vendorSettings,
      payments,
      posts,
      conflicts,
    };
  },

  // Close database connection
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  },
};

// Export prisma instance for use in seed files
export { prisma };

// Seed data constants
export const SEED_CONSTANTS = {
  // Default admin credentials
  ADMIN_EMAIL: 'admin@venuesystem.com',
  ADMIN_PASSWORD: 'admin123456',

  // Sample data counts
  USER_COUNT: 50,
  VENDOR_COUNT: 10,
  VENUE_COUNT: 30,
  COURT_COUNT: 100,
  TEAM_COUNT: 20,
  MATCH_COUNT: 50,
  TOURNAMENT_COUNT: 10,
  BOOKING_COUNT: 200,

  // Common sport names
  SPORT_NAMES: [
    'Football', 'Basketball', 'Cricket', 'Tennis', 'Badminton',
    'Volleyball', 'Table Tennis', 'Squash', 'Swimming', 'Golf',
    'Baseball', 'Rugby', 'Hockey', 'Boxing', 'MMA',
  ],

  // Common city names
  CITIES: [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'London', 'Manchester', 'Birmingham', 'Dubai', 'Abu Dhabi',
    'Mumbai', 'Delhi', 'Bangalore', 'Toronto', 'Vancouver',
  ],

  // Common venue features
  VENUE_FEATURES: [
    'Parking', 'Showers', 'Changing Rooms', 'Lockers', 'Cafe',
    'Pro Shop', 'Equipment Rental', 'Lighting', 'Scoreboard', 'Spectator Seating',
    'Climate Control', 'WiFi', 'Accessibility', 'Security', 'First Aid',
  ],

  // Court features
  COURT_FEATURES: [
    'Professional Surface', 'LED Lighting', 'Electronic Scoring', 'Video Recording',
    'Climate Control', 'Sound System', 'Seating Area', 'Equipment Storage',
  ],

  // Team names
  TEAM_NAMES: [
    'Thunder', 'Lightning', 'Warriors', 'Eagles', 'Tigers', 'Lions',
    'Dragons', 'Phoenix', 'Titans', 'Giants', 'Rangers', 'Panthers',
    'Cobras', 'Sharks', 'Wolves', 'Falcons', 'Hawks', 'Vipers',
  ],

  // Tournament names
  TOURNAMENT_PREFIXES: [
    'Championship', 'Cup', 'League', 'Tournament', 'Classic', 'Open',
    'Masters', 'Grand Prix', 'Series', 'Challenge', 'Showdown', 'Clash',
  ],

  // Booking titles
  BOOKING_TITLES: [
    'Practice Session', 'Friendly Match', 'Training', 'Coaching', 'Tryouts',
    'Team Meeting', 'Scrimmage', 'Warm-up', 'Competition', 'Demo',
  ],
};

// Error handling wrapper
export const withErrorHandling = async (operation: () => Promise<any>, errorMessage: string) => {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
};