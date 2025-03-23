import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a date with error handling to avoid UI crashes
 * @param date The date to format (can be null)
 * @param fallback The fallback value if date is null or invalid
 * @param options Intl.DateTimeFormatOptions to customize formatting
 * @returns Formatted date string or fallback
 */
export function formatDate(
  date: Date | string | number | null | undefined, 
  fallback = "Not available",
  options?: Intl.DateTimeFormatOptions
): string {
  if (date === null || date === undefined) return fallback;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if valid date
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    
    // Use provided options or defaults
    const formatOptions = options || {
      month: 'short',
      day: 'numeric', 
      year: 'numeric'
    };
    
    // Format the date: e.g., "Jan 15, 2023"
    return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
}

/**
 * Format a date with time
 * @param date The date to format
 * @param fallback The fallback value if date is null or invalid
 * @returns Formatted date and time string or fallback
 */
export function formatDateTime(date: Date | string | number | null | undefined, fallback = "Not available"): string {
  return formatDate(date, fallback, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "yesterday")
 * @param date The date to format
 * @param fallback The fallback value if date is null or invalid
 * @returns Relative time string or fallback
 */
export function formatRelativeTime(date: Date | string | number | null | undefined, fallback = "Not available"): string {
  if (date === null || date === undefined) return fallback;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if valid date
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return formatDate(date, fallback);
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return fallback;
  }
}

/**
 * Safely formats a currency value with error handling
 * @param amount The amount to format
 * @param currency The currency code
 * @param fallback The fallback value if amount is null, undefined, or invalid
 * @returns Formatted currency string or fallback
 */
export function formatCurrency(
  amount: number | null | undefined, 
  currency = 'USD',
  fallback = '$0.00'
): string {
  if (amount === null || amount === undefined) return fallback;
  
  try {
    // Handle NaN and Infinity
    if (!isFinite(amount)) return fallback;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    try {
      // Fallback to simple formatting
      return `$${amount.toFixed(2)}`;
    } catch (e) {
      return fallback;
    }
  }
}

/**
 * Format a number with thousands separators
 * @param num The number to format
 * @param fallback The fallback value if num is null, undefined, or invalid
 * @returns Formatted number string or fallback
 */
export function formatNumber(
  num: number | null | undefined,
  fallback = "0"
): string {
  if (num === null || num === undefined) return fallback;
  
  try {
    // Handle NaN and Infinity
    if (!isFinite(num)) return fallback;
    
    return new Intl.NumberFormat('en-US').format(num);
  } catch (error) {
    console.error("Error formatting number:", error);
    return fallback;
  }
}

/**
 * Safely truncates text to a specified length with an ellipsis
 * @param text The text to truncate
 * @param length Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string | null | undefined, length = 50): string {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

/**
 * Debounce function to limit how often a function can be called
 * @param fn The function to debounce
 * @param ms Milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(context, args), ms);
  };
}

/**
 * Create a throttled function that only invokes the provided function at most once per specified interval
 * @param fn The function to throttle
 * @param ms Milliseconds to wait between invocations
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let lastCall = 0;
  let lastResult: ReturnType<T>;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();
    
    if (now - lastCall >= ms) {
      lastCall = now;
      lastResult = fn.apply(context, args);
    }
    
    return lastResult;
  };
}

/**
 * Cache the results of expensive function calls
 * @param fn The function to memoize
 * @param getKey Function to generate cache key from arguments
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(this: any, ...args: Parameters<T>) {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}
