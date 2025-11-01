import { z } from "zod";

// User signup schema
export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  phone: z.string().regex(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  city: z.string().min(1, "City is required").max(100, "City must be less than 100 characters"),
  area: z.string().max(100, "Area must be less than 100 characters").optional(),
  countryCode: z.string().length(2, "Country code must be exactly 2 characters").optional(),
  timezone: z.string().min(1, "Timezone is required").optional(),
  currencyCode: z.string().length(3, "Currency code must be exactly 3 characters").optional(),
  dateFormat: z.enum(["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"]).optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
  language: z.string().length(2, "Language code must be exactly 2 characters").optional(),
});

// User login schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// New password schema
export const newPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional(),
  phone: z.string().regex(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100, "City must be less than 100 characters").optional(),
  area: z.string().max(100, "Area must be less than 100 characters").optional().or(z.literal("")),
  countryCode: z.string().length(2, "Country code must be exactly 2 characters").optional().or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required").optional().or(z.literal("")),
  currencyCode: z.string().length(3, "Currency code must be exactly 3 characters").optional().or(z.literal("")),
  dateFormat: z.enum(["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"]).optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
  language: z.string().length(2, "Language code must be exactly 2 characters").optional().or(z.literal("")),
  profileImage: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Types
export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;