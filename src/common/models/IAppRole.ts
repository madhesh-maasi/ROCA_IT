/**
 * Application roles that control which navigation items are visible.
 */
export type AppRole = "Admin" | "FinanceApprover" | "User";

/**
 * A single navigation leaf item.
 */
export interface INavItem {
  key: string;
  label: string;
  icon: string;
  /** Roles that can see this item. If omitted, all roles can see it. */
  allowedRoles?: AppRole[];
}

/**
 * A collapsible navigation group (e.g. "IT Declaration", "Administration").
 */
export interface INavGroup {
  key: string;
  label: string;
  icon: string;
  items: INavItem[];
  /** Roles that can see this group at all. */
  allowedRoles?: AppRole[];
}
