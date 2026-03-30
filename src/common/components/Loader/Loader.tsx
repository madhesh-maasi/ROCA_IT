import * as React from "react";
import styles from "./Loader.module.scss";

export interface ILoaderProps {
  /** Text to display below the spinner. */
  label?: string;
  /** Whether to show the loader as a full-screen overlay. Defaults to true. */
  fullScreen?: boolean;
}

/**
 * A reusable modern loading indicator with a premium feel.
 */
const Loader: React.FC<ILoaderProps> = ({
  label = "Processing...",
  fullScreen = true,
}) => {
  return (
    <div
      className={`${styles.loaderContainer} ${fullScreen ? styles.fullScreen : ""}`}
    >
      <div className={styles.loaderWrapper}>
        <div className={styles.spinner}>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
        </div>
        {label && <p className={styles.loaderLabel}>{label}</p>}
      </div>
    </div>
  );
};

export default Loader;
