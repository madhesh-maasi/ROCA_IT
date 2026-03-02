import * as React from "react";
import styles from "./AppHeader.module.scss";

const AppHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandTitle}>IT Declaration System</span>
      </div>
      <div className={styles.logo}>
        <img
          src={require("../../../../common/Asset/Images/RocaNewLogo.jpg")}
          alt=""
        />
      </div>
    </header>
  );
};

export default AppHeader;
