import * as React from "react";
import { InputField } from "../../../../../../CommonInputComponents";
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
    <div className={styles.stepContent}>
      <div className={styles.stepGrid}>
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
