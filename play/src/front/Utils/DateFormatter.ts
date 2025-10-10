/**
 * Formats the current date to YYYYMMDD format
 * @returns Date string in YYYYMMDD format (e.g., "20251019")
 */
export function getCurrentDateYYYYMMDD(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}

/**
 * Formats a specific date to YYYYMMDD format
 * @param date Date object to format
 * @returns Date string in YYYYMMDD format (e.g., "20251019")
 */
export function formatDateYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}
