export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Parse a date string to YYYY-MM-DD, or null if invalid.
 */
export const toDateKey = (dateStr: string | null | undefined): string | null => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
};

/**
 * Generate all dates between start and end (inclusive).
 * Normalizes start to midnight and end to end-of-day for reliable comparison.
 */
export const dateRange = (start: Date, end: Date): Date[] => {
    const out: Date[] = [];
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    const endD = new Date(end);
    endD.setHours(23, 59, 59, 999);
    while (d <= endD) {
        out.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return out;
};

/**
 * Generate all date strings (YYYY-MM-DD) between start and end (inclusive).
 * Uses dateRange internally: parses strings to Date, then formats output back to strings.
 */
export const dateRangeStrings = (start: string, end: string): string[] => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return [];
    }
    return dateRange(startDate, endDate).map((d) => d.toISOString().slice(0, 10));
};
