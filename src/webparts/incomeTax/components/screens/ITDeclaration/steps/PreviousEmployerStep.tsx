import * as React from "react";
import {
  InputField,
  AppDropdown,
  AppCalendar,
} from "../../../../../../components";
import styles from "../ITDeclaration.module.scss";

interface IPreviousEmployerData {
  employerName: string;
  employerPan: string;
  employerAddress: string;
  employerTan: string;
  periodFrom: Date | null;
  periodTo: Date | null;
  salaryAfterExemption: string;
  pfContribution: string;
  vpfContribution: string;
  professionalTax: string;
  taxDeductedAtSource: string;
}

interface IPreviousEmployerStepProps {
  data: IPreviousEmployerData;
  onChange: (field: keyof IPreviousEmployerData, val: any) => void;
}

const PreviousEmployerStep: React.FC<IPreviousEmployerStepProps> = ({
  data,
  onChange,
}) => {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepGrid}>
        <div className={styles.formGroup}>
          <label>Name of Employer</label>
          <InputField
            id="pe-name"
            value={data.employerName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("employerName", e.target.value)
            }
            placeholder="Enter name"
          />
        </div>
        <div className={styles.formGroup}>
          <label>PAN of Employer</label>
          <InputField
            id="pe-pan"
            value={data.employerPan}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("employerPan", e.target.value)
            }
            placeholder="Enter PAN number"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Address of Employer</label>
          <InputField
            id="pe-address"
            value={data.employerAddress}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("employerAddress", e.target.value)
            }
            placeholder="Enter address"
          />
        </div>
        <div className={styles.formGroup}>
          <label>TAN of Employer</label>
          <InputField
            id="pe-tan"
            value={data.employerTan}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("employerTan", e.target.value)
            }
            placeholder="Enter TAN number"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Period of Employement From</label>
          <AppCalendar
            value={data.periodFrom}
            onChange={(val: Date) => onChange("periodFrom", val)}
            placeholder="Select"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Period of Employement TO</label>
          <AppCalendar
            value={data.periodTo}
            onChange={(val: Date) => onChange("periodTo", val)}
            placeholder="Select"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Salary after exemption u/s 10</label>
          <InputField
            id="pe-salary"
            value={data.salaryAfterExemption}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("salaryAfterExemption", e.target.value)
            }
            placeholder="Enter"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Provident Fund Contribution</label>
          <InputField
            id="pe-pf"
            value={data.pfContribution}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("pfContribution", e.target.value)
            }
            placeholder="Enter"
          />
        </div>
        <div className={styles.formGroup}>
          <label>VPF, if any</label>
          <InputField
            id="pe-vpf"
            value={data.vpfContribution}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("vpfContribution", e.target.value)
            }
            placeholder="Select"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Professional Tax, if any</label>
          <InputField
            id="pe-pt"
            value={data.professionalTax}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("professionalTax", e.target.value)
            }
            placeholder="Select"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Tax deduted at source</label>
          <InputField
            id="pe-tds"
            value={data.taxDeductedAtSource}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("taxDeductedAtSource", e.target.value)
            }
            placeholder="Enter"
          />
        </div>
      </div>
    </div>
  );
};

export default PreviousEmployerStep;
