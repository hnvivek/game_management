import { z } from "zod";

// Venue creation schema
export const venueCreateSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  name: z.string().min(1, "Venue name is required").max(200, "Venue name must be less than 200 characters"),
  countryCode: z.string().length(2, "Country code must be exactly 2 characters"),
  city: z.string().min(1, "City is required").max(100, "City must be less than 100 characters"),
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
  timezone: z.string().min(1, "Timezone is required"),
  currencyCode: z.string().length(3, "Currency code must be exactly 3 characters"),
  phone: z.string().regex(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
});

// Venue update schema
export const venueUpdateSchema = venueCreateSchema.partial();

// Court creation schema
export const courtCreateSchema = z.object({
  venueId: z.string().min(1, "Venue ID is required"),
  sportId: z.string().min(1, "Sport is required"),
  formatId: z.string().min(1, "Format is required"),
  courtNumber: z.string().min(1, "Court number is required").max(20, "Court number must be less than 20 characters"),
  pricePerHour: z.number().min(0, "Price per hour cannot be negative"),
  maxPlayers: z.number().int().min(1, "Max players must be at least 1").max(50, "Max players cannot exceed 50"),
  isActive: z.boolean().default(true),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
});

// Court update schema
export const courtUpdateSchema = courtCreateSchema.partial();

// Venue sport settings schema
export const venueSportSettingsSchema = z.object({
  venueId: z.string().min(1, "Venue ID is required"),
  sportId: z.string().min(1, "Sport is required"),
  pricePerHour: z.number().min(0, "Price per hour cannot be negative"),
  maxPlayers: z.number().int().min(1, "Max players must be at least 1").max(50, "Max players cannot exceed 50"),
  facilitiesAvailable: z.array(z.string()).optional(),
  customRules: z.string().max(1000, "Custom rules must be less than 1000 characters").optional(),
  isActive: z.boolean().default(true),
});

// Operating hours schema
export const operatingHoursSchema = z.object({
  venueId: z.string().min(1, "Venue ID is required"),
  dayOfWeek: z.number().int().min(0, "Day of week must be between 0 and 6").max(6, "Day of week must be between 0 and 6"),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
  isOpen: z.boolean().default(true),
  specialNotes: z.string().max(200, "Special notes must be less than 200 characters").optional(),
  effectiveFrom: z.date().default(new Date()),
  effectiveTo: z.date().optional(),
});

// Special hours schema
export const specialHoursSchema = z.object({
  venueId: z.string().min(1, "Venue ID is required"),
  specialDate: z.date(),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)").optional(),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)").optional(),
  isOpen: z.boolean().default(false),
  reason: z.string().max(200, "Reason must be less than 200 characters").optional(),
});

// Booking creation schema
export const bookingCreateSchema = z.object({
  courtId: z.string().min(1, "Court is required"),
  sportId: z.string().min(1, "Sport is required"),
  startTime: z.string().datetime("Invalid date format"),
  endTime: z.string().datetime("Invalid date format"),
  title: z.string().max(200, "Title must be less than 200 characters").optional(),
  maxPlayers: z.number().int().min(1, "Max players must be at least 1").max(50, "Max players cannot exceed 50").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  specialRequests: z.string().max(500, "Special requests must be less than 500 characters").optional(),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
});

// Booking availability check schema
export const bookingAvailabilitySchema = z.object({
  courtId: z.string().min(1, "Court is required"),
  startDate: z.string().datetime("Invalid date format"),
  endDate: z.string().datetime("Invalid date format"),
  sportId: z.string().optional(),
});

// Venue search schema
export const venueSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sportId: z.string().optional(),
  city: z.string().optional(),
  countryCode: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  availableOnly: z.boolean().default(false),
  date: z.string().datetime().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  features: z.array(z.string()).optional(),
});

// Types
export type VenueCreateFormData = z.infer<typeof venueCreateSchema>;
export type VenueUpdateFormData = z.infer<typeof venueUpdateSchema>;
export type CourtCreateFormData = z.infer<typeof courtCreateSchema>;
export type CourtUpdateFormData = z.infer<typeof courtUpdateSchema>;
export type VenueSportSettingsFormData = z.infer<typeof venueSportSettingsSchema>;
export type OperatingHoursFormData = z.infer<typeof operatingHoursSchema>;
export type SpecialHoursFormData = z.infer<typeof specialHoursSchema>;
export type BookingCreateFormData = z.infer<typeof bookingCreateSchema>;
export type BookingAvailabilityFormData = z.infer<typeof bookingAvailabilitySchema>;
export type VenueSearchFormData = z.infer<typeof venueSearchSchema>;