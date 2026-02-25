/**
 * Formats a date string to a short locale display format (DD/MM/YYYY).
 * @param dateString - An ISO date string or any Date-parsable string.
 * @returns Formatted date string, or empty string if input is invalid.
 */
export const formatShortDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return '';
    }
};

/**
 * Formats a date string to a long display format (e.g., "25 Feb 2026").
 * @param dateString - An ISO date string or any Date-parsable string.
 * @returns Formatted date string, or empty string if input is invalid.
 */
export const formatLongDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '';
    }
};

/**
 * Formats a number as Indian currency (₹).
 * @param value - The numeric value.
 * @returns Formatted currency string (e.g., "₹1,00,000.00").
 */
export const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(value);
};

/**
 * Generates a unique ID string (useful for keys, temp IDs).
 * @returns A unique string identifier.
 */
export const generateUniqueId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
