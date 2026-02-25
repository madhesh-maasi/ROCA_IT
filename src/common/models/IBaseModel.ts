/**
 * Shared base interface for all SharePoint list items.
 */
export interface IListItem {
    Id: number;
    Title: string;
    Created: string;
    Modified: string;
    AuthorId: number;
    EditorId: number;
}

/**
 * Income Tax specific list item interface.
 * Extend this with your actual list columns.
 */
export interface IIncomeTaxItem extends IListItem {
    // Add your custom fields here, e.g.:
    // EmployeeName?: string;
    // PanNumber?: string;
    // AssessmentYear?: string;
    // TotalIncome?: number;
    // TaxDeducted?: number;
    // Status?: string;
}

/**
 * Generic API response wrapper for typed responses.
 */
export interface IApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

/**
 * Represents the current logged-in user context.
 */
export interface ICurrentUser {
    displayName: string;
    email: string;
    loginName: string;
}
