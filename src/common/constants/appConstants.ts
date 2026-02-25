/**
 * SharePoint List names used across the solution.
 * Centralised here to avoid magic strings in services.
 */
export const LIST_NAMES = {
    INCOME_TAX: 'IncomeTax',
    // Add more list names as the solution grows:
    // EMPLOYEES: 'Employees',
    // DEPARTMENTS: 'Departments',
} as const;

/**
 * Common date display formats.
 */
export const DATE_FORMATS = {
    SHORT: 'DD/MM/YYYY',
    LONG: 'DD MMM YYYY',
    ISO: 'YYYY-MM-DD',
    DISPLAY_WITH_TIME: 'DD/MM/YYYY hh:mm A',
} as const;

/**
 * Application-wide configuration constants.
 */
export const APP_CONFIG = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    DEBOUNCE_DELAY_MS: 300,
} as const;
