import { z } from "zod";

// Match creation schema
export const matchCreateSchema = z.object({
  homeTeamId: z.string().min(1, "Home team is required"),
  awayTeamId: z.string().optional(),
  sportId: z.string().min(1, "Sport is required"),
  formatId: z.string().min(1, "Format is required"),
  courtId: z.string().min(1, "Court is required"),
  scheduledDate: z.string().datetime("Invalid date format"),
  duration: z.number().int().min(15, "Duration must be at least 15 minutes").max(480, "Duration cannot exceed 8 hours"),
  totalAmount: z.number().min(0, "Total amount cannot be negative"),
  title: z.string().max(200, "Title must be less than 200 characters").optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

// Match update schema
export const matchUpdateSchema = matchCreateSchema.partial();

// Match join schema (for open matches)
export const matchJoinSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  paymentMethod: z.enum(["card", "cash", "wallet", "bank_transfer"]),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

// Match approval schema (for away team)
export const matchApprovalSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  approved: z.boolean(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

// Match result submission schema
export const matchResultSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  homeScore: z.number().int().min(0, "Score cannot be negative"),
  awayScore: z.number().int().min(0, "Score cannot be negative"),
  playerContributions: z.array(z.object({
    playerId: z.string().min(1, "Player ID is required"),
    score: z.number().int().min(0, "Score cannot be negative"),
    notes: z.string().max(200, "Notes must be less than 200 characters").optional(),
  })).optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  photos: z.array(z.string().url()).optional(),
});

// Match confirmation schema (for other team)
export const matchResultConfirmationSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  confirmed: z.boolean(),
  disputedScores: z.object({
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0),
  }).optional(),
  disputeReason: z.string().max(500, "Dispute reason must be less than 500 characters").optional(),
});

// Match search/filter schema
export const matchSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sportId: z.string().optional(),
  status: z.enum(["OPEN", "PENDING_PAYMENT", "PENDING_OPPONENT", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  city: z.string().optional(),
  myTeamsOnly: z.boolean().default(false),
  availableOnly: z.boolean().default(false),
});

// Payment for match schema
export const matchPaymentSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  paymentType: z.enum(["HALF_PAYMENT", "REMAINING_PAYMENT", "FULL_PAYMENT"]),
  paymentMethod: z.enum(["card", "cash", "wallet", "bank_transfer"]),
  amount: z.number().min(0, "Amount cannot be negative"),
  notes: z.string().max(200, "Notes must be less than 200 characters").optional(),
});

// Types
export type MatchCreateFormData = z.infer<typeof matchCreateSchema>;
export type MatchUpdateFormData = z.infer<typeof matchUpdateSchema>;
export type MatchJoinFormData = z.infer<typeof matchJoinSchema>;
export type MatchApprovalFormData = z.infer<typeof matchApprovalSchema>;
export type MatchResultFormData = z.infer<typeof matchResultSchema>;
export type MatchResultConfirmationFormData = z.infer<typeof matchResultConfirmationSchema>;
export type MatchSearchFormData = z.infer<typeof matchSearchSchema>;
export type MatchPaymentFormData = z.infer<typeof matchPaymentSchema>;