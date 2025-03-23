import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a date with error handling to avoid UI crashes
 * @param date The date to format (can be null)
 * @param fallback The fallback value if date is null or invalid
 * @returns Formatted date string or fallback
 */
export function formatDate(date: Date | string | number | null | undefined, fallback = "Not available"): string {
  if (!date) return fallback;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if valid date
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    
    // Format the date: e.g., "Jan 15, 2023"
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric', 
      year: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
}

/**
 * Safely formats a currency value with error handling
 * @param amount The amount to format
 * @param currency The currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount === null || amount === undefined) return '$0.00';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Debounce function to limit how often a function can be called
 * @param fn The function to debounce
 * @param ms Milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
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
  
  return function(...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      lastResult = fn(...args);
    }
    return lastResult;
  };
}
