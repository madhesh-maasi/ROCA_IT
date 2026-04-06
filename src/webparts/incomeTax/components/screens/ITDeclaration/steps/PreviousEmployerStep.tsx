import * as React from "react";
import {
  InputField,
  AppCalendar,
} from "../../../../../../CommonInputComponents";
import styles from "../ITDeclaration.module.scss";
import { panFormatter } from "../../../../../../common/utils/validationUtils";

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
  showApproverComments?: boolean;
  approverComments?: string;
  onCommentChange?: (val: string) => void;
  status?: string;
  readOnly?: boolean;
}

const PreviousEmployerStep: React.FC<IPreviousEmployerStepProps> = ({
  data,
  onChange,
  showApproverComments,
  approverComments,
  onCommentChange,
  status,
  readOnly,
}) => {
  return (
    <div>
      <div className={styles.stepHeader}>Previous Employer Details</div>
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
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>PAN of Employer</label>
          <InputField
            id="pe-pan"
            value={data.employerPan}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("employerPan", panFormatter(e.target.value))
            }
            placeholder="Enter PAN number"
            disabled={readOnly}
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
            disabled={readOnly}
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
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Period of Employement From</label>
          <AppCalendar
            value={data.periodFrom ? new Date(data.periodFrom) : null}
            onChange={(e: any) => onChange("periodFrom", e.value)}
            placeholder="Select"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Period of Employement TO</label>
          <AppCalendar
            value={data.periodTo ? new Date(data.periodTo) : null}
            onChange={(e: any) => onChange("periodTo", e.value)}
            placeholder="Select"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Salary after exemption u/s 10</label>
          <InputField
            id="pe-salary"
            value={data.salaryAfterExemption}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(
                "salaryAfterExemption",
                e.target.value.replace(/[^0-9]/g, ""),
              )
            }
            placeholder="Enter"
            disabled={readOnly}
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
            disabled={readOnly}
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
            disabled={readOnly}
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
            disabled={readOnly}
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
            disabled={readOnly}
          />
        </div>
      </div>

      {showApproverComments && onCommentChange && (
        <div style={{ marginTop: 10 }}>
          <div className={styles.formGroup}>
            <div className={styles.stepHeader}>Approver Comments</div>
            <textarea
              className={styles.commentArea || ""}
              style={{
                width: "100%",
                height: 80,
                padding: "16px",
                borderRadius: "12px",
                resize: "none",
                fontSize: "14px",
                pointerEvents: status === "Approved" ? "none" : "auto",
                opacity: status === "Approved" ? 0.8 : 1,
                backgroundColor: "#fff",
              }}
              placeholder="Enter here"
              value={approverComments}
              disabled={status === "Approved" || status == "Rework"}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousEmployerStep;
