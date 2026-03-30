import * as React from "react";
import { InputField } from "../../../../../../CommonInputComponents";
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
  readOnly?: boolean;
  mobile: string;
  onMobileChange: (val: string) => void;
}

const BasicInfoStep: React.FC<IBasicInfoStepProps> = ({
  employeeData,
  pan,
  onPanChange,
  readOnly,
  mobile,
  onMobileChange,
}) => {
  return (
    <div>
      <div className={styles.stepHeader}>Basic Information</div>
      <div className={styles.basicInfoGrid}>
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
        {/* <div className={styles.formGroup}>
          <label>Mobile Number</label>
          <div className={styles.readonlyValue}>{employeeData.mobile}</div>
        </div> */}
        <div className={styles.formGroup}>
          <label>
            Mobile Number <span>*</span>
          </label>
          <InputField
            id="basic-info-mobile"
            value={mobile}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onMobileChange(e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder="Enter Mobile Number"
            disabled={readOnly}
          />
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
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
