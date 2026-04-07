import { useLocation } from "react-router-dom";
import { NAV_CONFIG } from "../constants/appConstants";
import type { AppRole, INavItem, INavGroup } from "../models";

/**
 * Builds a flat lookup map from every group and item in NAV_CONFIG so we can
 * look up any route key in O(1).
 *
 * All keys are stored in lowercase so that hash-based navigation is
 * case-insensitive (e.g. #sectionConfig, #sectionconfig, and #SECTIONCONFIG
 * all resolve to the same entry).
 *
 * The map includes:
 *  - top-level group entries  (e.g. "administration")
 *  - leaf item entries        (e.g. "financeapprover", "sectionconfig")
 *
 * If an item has its own allowedRoles those take precedence; otherwise the
 * parent group's allowedRoles are used (so admin-only groups protect all
 * their children by default).
 */
function buildFlatNavMap(): Record<string, AppRole[] | undefined> {
  const map: Record<string, AppRole[] | undefined> = {};

  NAV_CONFIG.forEach((group: INavGroup) => {
    // Register the group key itself (lowercased for case-insensitive lookup)
    map[group.key.toLowerCase()] = group.allowedRoles;

    group.items.forEach((item: INavItem) => {
      const key = item.key.toLowerCase();
      if (item.allowedRoles !== undefined) {
        // Item has its own explicit restriction
        map[key] = item.allowedRoles;
      } else if (group.allowedRoles !== undefined) {
        // Inherit the parent group restriction
        map[key] = group.allowedRoles;
      } else {
        // Fully public
        map[key] = undefined;
      }
    });
  });

  return map;
}

// Build once at module load time — NAV_CONFIG is a static constant
const FLAT_NAV_MAP = buildFlatNavMap();

export interface IUseRouteAccessResult {
  /** Whether the current user role is permitted to view the active route. */
  hasAccess: boolean;
  /** The route key extracted from the current path. */
  routeKey: string;
  /** The resolved allowedRoles for this route, if any. */
  allowedRoles: AppRole[] | undefined;
}

/**
 * Reads the current hash route (via react-router-dom's useLocation) and
 * checks it against NAV_CONFIG allowedRoles.
 *
 * Returns true (open access) if:
 *  - The route is not found in NAV_CONFIG, OR
 *  - The route has no allowedRoles defined.
 *
 * Returns false if the route has allowedRoles and the user's role is NOT in
 * that list.
 */
export function useRouteAccess(role: AppRole): IUseRouteAccessResult {
  const location = useLocation();

  // pathname from HashRouter looks like "/financeApprover", "/SECTIONCONFIG", etc.
  // Preserve original casing for display in AccessDenied, but normalise to
  // lowercase before map lookup so the check is case-insensitive.
  const routeKey = location.pathname.replace(/^\//, "") || "";
  const routeKeyLower = routeKey.toLowerCase();

  const allowedRoles = FLAT_NAV_MAP[routeKeyLower];

  const hasAccess =
    allowedRoles === undefined || allowedRoles.includes(role);

  return { hasAccess, routeKey, allowedRoles };
}
