// Date formatting utilities
export const formatDate = (
  date: string | Date,
  format: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY" = "YYYY-MM-DD",
  locale: string = "en-US"
): string => {
  const dateObj = new Date(date);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  switch (format) {
    case "DD/MM/YYYY":
      return dateObj.toLocaleDateString("en-GB", options);
    case "MM/DD/YYYY":
      return dateObj.toLocaleDateString("en-US", options);
    case "YYYY-MM-DD":
    default:
      return dateObj.toISOString().split("T")[0];
  }
};

export const formatDateTime = (
  date: string | Date,
  userTimezone?: string,
  userTimeFormat: "12h" | "24h" = "24h",
  userDateFormat?: string
): string => {
  const dateObj = new Date(date);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: userDateFormat === "DD/MM/YYYY" ? "2-digit" : "short",
    day: "2-digit",
    hour: userTimeFormat === "12h" ? "numeric" : "2-digit",
    minute: "2-digit",
    hour12: userTimeFormat === "12h",
    timeZone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return dateObj.toLocaleString("en-US", options);
};

export const formatTime = (
  date: string | Date,
  userTimezone?: string,
  userTimeFormat: "12h" | "24h" = "24h"
): string => {
  const dateObj = new Date(date);

  const options: Intl.DateTimeFormatOptions = {
    hour: userTimeFormat === "12h" ? "numeric" : "2-digit",
    minute: "2-digit",
    hour12: userTimeFormat === "12h",
    timeZone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return dateObj.toLocaleTimeString("en-US", options);
};

// Currency formatting
export const formatCurrency = (
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Number formatting
export const formatNumber = (
  number: number,
  locale: string = "en-US"
): string => {
  return new Intl.NumberFormat(locale).format(number);
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone; // Return original if no format matches
};

// Duration formatting
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

export const formatDurationVerbose = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  } else if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
  }
};

// Relative time formatting
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const dateObj = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateObj);
  }
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Name formatting
export const formatName = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

// Address formatting
export const formatAddress = (address: {
  address?: string;
  city?: string;
  area?: string;
  countryCode?: string;
}): string => {
  const parts = [];

  if (address.address) parts.push(address.address);
  if (address.area) parts.push(address.area);
  if (address.city) parts.push(address.city);
  if (address.countryCode) parts.push(address.countryCode);

  return parts.join(', ');
};

// Score formatting
export const formatScore = (homeScore: number, awayScore: number): string => {
  return `${homeScore} - ${awayScore}`;
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Color utilities
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    // Booking statuses
    PENDING_PAYMENT: "yellow",
    CONFIRMED: "green",
    CANCELLED: "red",
    COMPLETED: "blue",

    // Match statuses
    OPEN: "yellow",
    PENDING_OPPONENT: "orange",
    CONFIRMED: "green",

    // Payment statuses
    PENDING: "yellow",
    PROCESSING: "blue",
    COMPLETED: "green",
    FAILED: "red",
    REFUNDED: "purple",

    // Generic
    ACTIVE: "green",
    INACTIVE: "gray",
  };

  return colors[status] || "gray";
};

// Array utilities
export const groupBy = <T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const group = key(item);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const uniqueBy = <T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): T[] => {
  const seen = new Set<K>();
  return array.filter(item => {
    const value = key(item);
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};