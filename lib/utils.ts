// Importing utilities for working with class names
import { clsx, type ClassValue } from "clsx"; // clsx: Conditionally join class names
import { twMerge } from "tailwind-merge"; // twMerge: Resolve conflicting Tailwind CSS classes

/**
 * Combines and merges class names conditionally.
 *
 * @param inputs - An array of class values, including strings and conditional class logic
 * @returns A string of resolved class names
 *
 * Usage:
 * ```javascript
 * const classes = cn("bg-red-500", isActive && "text-white", "px-4");
 * // Output: "bg-red-500 text-white px-4" (if isActive is true)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses and stringifies a server action response.
 *
 * @param response - The server action response object
 * @returns A deep copy of the response object to ensure no mutable references
 *
 * Usage:
 * ```javascript
 * const result = parseServerActionResponse(responseData);
 * ```
 */
export function parseServerActionResponse<T>(response: T) {
  return JSON.parse(JSON.stringify(response));
}

/**
 * Formats a date string into a human-readable format.
 *
 * @param date - A date string (ISO or standard format)
 * @returns A formatted date string in "Month Day, Year" format
 *
 * Usage:
 * ```javascript
 * const formattedDate = formatDate("2023-12-28"); // "December 28, 2023"
 * ```
 */
export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long", // Full month name (e.g., "December")
    day: "numeric", // Day of the month (e.g., "28")
    year: "numeric", // Full year (e.g., "2023")
  });
}

/**
 * Formats a number into a shortened version with suffixes (k for thousands, M for millions).
 *
 * @param number - A number to be formatted
 * @returns A formatted string with suffixes (e.g., 1500 -> "1.5k", 2000000 -> "2M")
 *
 * Usage:
 * ```javascript
 * const formattedNumber = formatNumber(1234567); // "1.2M"
 * const smallNumber = formatNumber(500); // "500"
 * ```
 */
export function formatNumber(number: number) {
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1).replace(/\.0$/, "") + "M"; // Convert to millions
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1).replace(/\.0$/, "") + "k"; // Convert to thousands
  } else {
    return number.toString(); // Return the number as is if below 1000
  }
}
