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
  Status?: string;
  EmployeeID?: string;
  RegimeType?: string;
  DeclarationType?: string;
  Author?: {
    Email: string;
    Title: string;
  };
}

/**
 * Employee Master record from the SharePoint list.
 */
export interface IEmployee {
  Id: number;
  Title: string; // Used as Name in SP
  Name?: string;
  PAN?: string;
  EmployeeId?: string;
  DOB?: string;
  PhoneNo?: string;
  Email?: string;
  Department?: string;
  Designation?: string;
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
