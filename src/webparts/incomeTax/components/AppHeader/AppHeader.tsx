import * as React from "react";
import styles from "./AppHeader.module.scss";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const RocaNewLogo = require("../../../../common/Asset/Images/RocaNewLogo.jpg");

const AppHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandTitle}>IT Declaration System</span>
      </div>
      <div className={styles.logo}>
        <img src={RocaNewLogo} alt="" />
      </div>
    </header>
  );
};

export default AppHeader;
