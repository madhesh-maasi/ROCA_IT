import * as React from "react";
import styles from "../ITDeclaration.module.scss";

interface IHomeStepProps {
  declarationType: string;
  financialYear: string;
  taxRegime: string;
}

const HomeStep: React.FC<IHomeStepProps> = ({
  declarationType,
  financialYear,
  taxRegime,
}) => {
  return (
    <div>
      <div className={styles.stepHeader}>IT Details</div>
      <div className={styles.homeGrid}>
        <div className={styles.formGroup}>
          <label>Declaration Type</label>
          <div className={styles.readonlyValue}>
            {declarationType || "Planned"}
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Financial Year</label>
          <div className={styles.readonlyValue}>
            {financialYear || "2025 - 2026"}
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Tax Regime</label>
          <div className={styles.readonlyValue}>
            {taxRegime || "Old Regime"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeStep;
