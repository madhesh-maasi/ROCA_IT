import * as React from "react";
import styles from "./AppHeader.module.scss";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const RocaNewLogo = require("../../../../common/Asset/Images/RocaNewLogo.jpg");

export interface IAppHeaderProps {
  onMenuToggle?: () => void;
  isMobileNavOpen?: boolean;
}

const AppHeader: React.FC<IAppHeaderProps> = ({ onMenuToggle, isMobileNavOpen }) => {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {/* Hamburger — visible only on mobile via CSS */}
        {onMenuToggle && (
          <button
            className={styles.hamburger}
            onClick={onMenuToggle}
            aria-label={isMobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMobileNavOpen}
          >
            {isMobileNavOpen ? (
              // ✕ close icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              // ☰ hamburger icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        )}
        <span className={styles.brandTitle}>IT Declaration System</span>
      </div>
      <div className={styles.logo}>
        <img src={RocaNewLogo} alt="" />
      </div>
    </header>
  );
};

export default AppHeader;
