import * as React from "react";
import { InputField } from "../../../../../../components";
import styles from "../ITDeclaration.module.scss";

interface IBasicInfoStepProps {
  employeeData: {
    code: string;
    name: string;
    location: string;
    doj: string;
    email: string;
    mobile: string;
  };
  pan: string;
  onPanChange: (val: string) => void;
}

const BasicInfoStep: React.FC<IBasicInfoStepProps> = ({
  employeeData,
  pan,
  onPanChange,
}) => {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepGrid}>
        <div className={styles.formGroup}>
          <label>Employee Code</label>
          <div className={styles.readonlyValue}>{employeeData.code}</div>
        </div>
        <div className={styles.formGroup}>
          <label>Employee Name</label>
          <div className={styles.readonlyValue}>{employeeData.name}</div>
        </div>
        <div className={styles.formGroup}>
          <label>Location</label>
          <div className={styles.readonlyValue}>{employeeData.location}</div>
        </div>
        <div className={styles.formGroup}>
          <label>Date of Joining</label>
          <div className={styles.readonlyValue}>{employeeData.doj}</div>
        </div>
        <div className={styles.formGroup}>
          <label>Email ID</label>
          <div className={styles.readonlyValue}>{employeeData.email}</div>
        </div>
        <div className={styles.formGroup}>
          <label>Mobile Number</label>
          <div className={styles.readonlyValue}>{employeeData.mobile}</div>
        </div>
        <div className={styles.formGroup}>
          <label>
            PAN <span>*</span>
          </label>
          <InputField
            id="basic-info-pan"
            value={pan}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onPanChange(e.target.value)
            }
            placeholder="Enter PAN number"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
