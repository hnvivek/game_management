// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    ME: "/api/auth/me",
  },
  USERS: {
    LIST: "/api/users",
  },
  TEAMS: {
    LIST: "/api/teams",
    CREATE: "/api/teams",
    GET: (id: string) => `/api/teams/${id}`,
    UPDATE: (id: string) => `/api/teams/${id}`,
    DELETE: (id: string) => `/api/teams/${id}`,
  },
  VENUES: {
    LIST: "/api/venues",
    CREATE: "/api/venues",
    GET: (id: string) => `/api/venues/${id}`,
    UPDATE: (id: string) => `/api/venues/${id}`,
    DELETE: (id: string) => `/api/venues/${id}`,
    AVAILABILITY: "/api/venues/availability",
    COURTS: (id: string) => `/api/venues/${id}/courts`,
  },
  BOOKINGS: {
    LIST: "/api/bookings",
    CREATE: "/api/bookings",
    GET: (id: string) => `/api/bookings/${id}`,
    UPDATE: (id: string) => `/api/bookings/${id}`,
    DELETE: (id: string) => `/api/bookings/${id}`,
  },
  PAYMENTS: {
    LIST: "/api/payments",
    CREATE: "/api/payments",
    GET: (id: string) => `/api/payments/${id}`,
  },
  SPORTS: {
    LIST: "/api/sports",
    OPTIONS: "/api/sports/options",
  },
  COUNTRIES: {
    LIST: "/api/countries",
  },
    DOCS: "/api/docs",
} as const;

// Status Constants
export const BOOKING_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;


export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export const TEAM_ROLE = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

// Time Constants
export const TIME_CONSTANTS = {
  MINUTES_IN_HOUR: 60,
  HOURS_IN_DAY: 24,
  DAYS_IN_WEEK: 7,
  DAYS_IN_MONTH: 30,
  DAYS_IN_YEAR: 365,
  MS_IN_SECOND: 1000,
  MS_IN_MINUTE: 60 * 1000,
  MS_IN_HOUR: 60 * 60 * 1000,
  MS_IN_DAY: 24 * 60 * 60 * 1000,
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Validation Constants
export const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  BIO_MAX_LENGTH: 500,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
  NOTES_MAX_LENGTH: 500,
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
} as const;

// Date Formats
export const DATE_FORMATS = {
  API: "YYYY-MM-DDTHH:mm:ss.sssZ",
  DISPLAY_DATE: "YYYY-MM-DD",
  DISPLAY_DATETIME: "YYYY-MM-DD HH:mm:ss",
  EU_DATE: "DD/MM/YYYY",
  US_DATE: "MM/DD/YYYY",
} as const;

// Currency Constants
export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound" },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee" },
} as const;

// Country Constants
export const COUNTRIES = {
  US: { code: "US", name: "United States", timezone: "America/New_York" },
  GB: { code: "GB", name: "United Kingdom", timezone: "Europe/London" },
  AE: { code: "AE", name: "United Arab Emirates", timezone: "Asia/Dubai" },
  IN: { code: "IN", name: "India", timezone: "Asia/Kolkata" },
} as const;

// Sport Constants
export const SPORTS = {
  FOOTBALL: { id: "football", name: "Football", displayName: "Football", icon: "⚽" },
  BASKETBALL: { id: "basketball", name: "Basketball", displayName: "Basketball", icon: "🏀" },
  CRICKET: { id: "cricket", name: "Cricket", displayName: "Cricket", icon: "🏏" },
  TENNIS: { id: "tennis", name: "Tennis", displayName: "Tennis", icon: "🎾" },
  BADMINTON: { id: "badminton", name: "Badminton", displayName: "Badminton", icon: "🏸" },
  VOLLEYBALL: { id: "volleyball", name: "Volleyball", displayName: "Volleyball", icon: "🏐" },
  TABLE_TENNIS: { id: "table-tennis", name: "Table Tennis", displayName: "Table Tennis", icon: "🏓" },
} as const;

// Format Constants
export const FORMATS = {
  FOOTBALL: {
    "5-A-SIDE": { name: "5-a-side", minPlayers: 5, maxPlayers: 10 },
    "7-A-SIDE": { name: "7-a-side", minPlayers: 7, maxPlayers: 14 },
    "11-A-SIDE": { name: "11-a-side", minPlayers: 11, maxPlayers: 22 },
  },
  BASKETBALL: {
    "3X3": { name: "3x3", minPlayers: 3, maxPlayers: 6 },
    "5X5": { name: "5x5", minPlayers: 5, maxPlayers: 10 },
  },
  CRICKET: {
    "TA10": { name: "Tapeball 10", minPlayers: 10, maxPlayers: 20 },
    "TA20": { name: "Tapeball 20", minPlayers: 20, maxPlayers: 40 },
  },
} as const;

// Payment Method Constants
export const PAYMENT_METHODS = {
  CARD: "card",
  CASH: "cash",
  WALLET: "wallet",
  BANK_TRANSFER: "bank_transfer",
  CRYPTO: "crypto",
} as const;

// Payment Gateway Constants
export const PAYMENT_GATEWAYS = {
  STRIPE: "stripe",
  PAYPAL: "paypal",
  MANUAL: "manual",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "You don't have permission to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Something went wrong. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  UNKNOWN_ERROR: "An unexpected error occurred.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: "Created successfully!",
  UPDATED: "Updated successfully!",
  DELETED: "Deleted successfully!",
  SAVED: "Saved successfully!",
  SENT: "Sent successfully!",
  JOINED: "Joined successfully!",
  LEFT: "Left successfully!",
} as const;

// Theme Constants
export const THEME = {
  COLORS: {
    PRIMARY: "#3B82F6",
    SECONDARY: "#64748B",
    ACCENT: "#F59E0B",
    SUCCESS: "#10B981",
    WARNING: "#F59E0B",
    ERROR: "#EF4444",
    INFO: "#3B82F6",
  },
  BREAKPOINTS: {
    SM: "640px",
    MD: "768px",
    LG: "1024px",
    XL: "1280px",
    "2XL": "1536px",
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth-token",
  USER_PREFERENCES: "user-preferences",
  THEME: "theme",
  LANGUAGE: "language",
  RECENT_SEARCHES: "recent-searches",
} as const;

// Route Constants
export const ROUTES = {
  HOME: "/",
  AUTH: {
    SIGNIN: "/auth/signin",
    SIGNUP: "/auth/signup",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  DASHBOARD: "/dashboard",
  VENUES: {
    LIST: "/venues",
    DETAIL: (id: string) => `/venues/${id}`,
    BOOK: (id: string) => `/venues/${id}/book`,
  },
  TEAMS: {
    LIST: "/teams",
    DETAIL: (id: string) => `/teams/${id}`,
    CREATE: "/teams/create",
    EDIT: (id: string) => `/teams/${id}/edit`,
  },
    PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;