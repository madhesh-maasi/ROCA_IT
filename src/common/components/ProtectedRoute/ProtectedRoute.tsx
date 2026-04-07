import * as React from "react";
import { AccessDenied } from "../AccessDenied";
import { useRouteAccess } from "../../hooks/useRouteAccess";
import type { AppRole } from "../../models";

export interface IProtectedRouteProps {
  /** The current user's role — passed down from Dashboard. */
  role: AppRole;
  /** The screen to render if access is granted. */
  children: React.ReactNode;
}

/**
 * Wraps a route's element inside a React Router <Route>.
 * Checks NAV_CONFIG allowedRoles for the current hash route and either
 * renders children normally or shows the AccessDenied screen.
 *
 * Usage inside Dashboard.tsx:
 *
 *   <Route
 *     path="/financeApprover"
 *     element={
 *       <ProtectedRoute role={role}>
 *         <FinanceApprover />
 *       </ProtectedRoute>
 *     }
 *   />
 */
const ProtectedRoute: React.FC<IProtectedRouteProps> = ({ role, children }) => {
  const { hasAccess, routeKey } = useRouteAccess(role);

  if (!hasAccess) {
    return <AccessDenied routeKey={routeKey} role={role} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
