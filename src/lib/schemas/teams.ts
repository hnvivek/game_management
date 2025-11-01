import { z } from "zod";

// Team creation schema
export const teamCreateSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  logoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  sportId: z.string().min(1, "Sport is required"),
  formatId: z.string().min(1, "Format is required"),
  city: z.string().max(100, "City must be less than 100 characters").optional(),
  area: z.string().max(100, "Area must be less than 100 characters").optional(),
  level: z.string().max(50, "Level must be less than 50 characters").optional(),
  maxPlayers: z.number().min(1, "Max players must be at least 1").max(50, "Max players cannot exceed 50"),
  isActive: z.boolean().optional(),
});

// Team update schema
export const teamUpdateSchema = teamCreateSchema.partial();

// Team member addition schema
export const teamMemberAddSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  jerseyNumber: z.number().int().min(1, "Jersey number must be at least 1").max(99, "Jersey number cannot exceed 99").optional(),
  preferredPosition: z.string().max(50, "Position must be less than 50 characters").optional(),
  isActive: z.boolean().optional(),
  canBookMatches: z.boolean().optional(),
  canApproveMatches: z.boolean().optional(),
});

// Team member update schema
export const teamMemberUpdateSchema = teamMemberAddSchema.partial().omit({ teamId: true, userId: true });

// Team invite schema
export const teamInviteSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  inviteType: z.enum(["PLAYER", "COACH", "MANAGER"]).default("PLAYER"),
  defaultRole: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  maxUses: z.number().int().min(1, "Max uses must be at least 1").max(100, "Max uses cannot exceed 100").optional(),
  expiresAt: z.date().optional(),
  autoApprove: z.boolean().default(true),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
});

// Team join via invite schema
export const teamJoinSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
  jerseyNumber: z.number().int().min(1, "Jersey number must be at least 1").max(99, "Jersey number cannot exceed 99").optional(),
  preferredPosition: z.string().max(50, "Position must be less than 50 characters").optional(),
});

// Player skill schema
export const playerSkillSchema = z.object({
  sportId: z.string().min(1, "Sport is required"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  yearsExperience: z.number().int().min(0, "Years of experience cannot be negative").max(50, "Years of experience cannot exceed 50").optional(),
  preferredRole: z.string().max(50, "Preferred role must be less than 50 characters").optional(),
});

// Types
export type TeamCreateFormData = z.infer<typeof teamCreateSchema>;
export type TeamUpdateFormData = z.infer<typeof teamUpdateSchema>;
export type TeamMemberAddFormData = z.infer<typeof teamMemberAddSchema>;
export type TeamMemberUpdateFormData = z.infer<typeof teamMemberUpdateSchema>;
export type TeamInviteFormData = z.infer<typeof teamInviteSchema>;
export type TeamJoinFormData = z.infer<typeof teamJoinSchema>;
export type PlayerSkillFormData = z.infer<typeof playerSkillSchema>;