import * as React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AccessDenied.module.scss";
import type { AppRole } from "../../models";

export interface IAccessDeniedProps {
  /** The route key the user attempted to visit. */
  routeKey?: string;
  /** The user's current role. */
  role?: AppRole;
}

/**
 * Displayed whenever a user attempts to access a route they are not
 * permitted to view based on the NAV_CONFIG allowedRoles definition.
 */
const AccessDenied: React.FC<IAccessDeniedProps> = ({ routeKey, role }) => {
  const navigate = useNavigate();
  document.getElementById("sideNav")?.style.setProperty("display", "none");
  document
    .getElementById("mainContent")
    ?.style.setProperty("overflow", "hidden");
  // const handleBack = (): void => {
  //   // Go back in history if possible, otherwise fall back to the root
  //   if (window.history.length > 1) {
  //     navigate(-1);
  //   } else {
  //     navigate("/", { replace: true });
  //   }
  // };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Status badge */}
        <span className={styles.badge}>
          <span className={styles.badgeDot} />
          Access Denied
        </span>

        {/* Lock icon */}
        <div className={styles.iconWrapper}>
          <svg
            className={styles.lockIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className={styles.title}>You don't have permission</h1>

        {/* Body message */}
        <p className={styles.message}>
          This page is restricted and cannot be accessed with your current role
          <br />
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
