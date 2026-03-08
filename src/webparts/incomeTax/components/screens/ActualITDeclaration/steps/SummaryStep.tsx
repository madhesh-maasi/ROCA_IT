import * as React from "react";
import {
  ActionButton,
  InputField,
} from "../../../../../../CommonInputComponents";
import styles from "../ITDeclaration.module.scss";

interface ISummaryStepProps {
  employeeInfo: {
    fy: string;
    code: string;
    name: string;
    pan: string;
    doj: string;
  };
  totals: {
    lta: string;
    section80C: string;
    houseRental: string;
    housingLoan: string;
  };
  declaration: {
    agreed: boolean;
    place: string;
    date: string;
  };
  onDeclarationChange: (field: "agreed" | "place", val: any) => void;
  onSaveAsDraft: () => void;
  onSubmit: () => void;
  onDownloadAttachments?: () => void;
  readOnly?: boolean;
  taxRegime?: string;
}

const SummaryStep: React.FC<ISummaryStepProps> = ({
  employeeInfo,
  totals,
  declaration,
  onDeclarationChange,
  onSaveAsDraft,
  onSubmit,
  onDownloadAttachments,
  readOnly,
  taxRegime,
}) => {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepGrid} style={{ marginBottom: "30px" }}>
        <div className={styles.formGroup}>
          <label>Financial Year</label>
          <div className={styles.readonlyValue}>{employeeInfo.fy}</div>
        </div>
        <div className={styles.formGroup}>
          <label>Employee Code</label>
          <div className={styles.readonlyValue}>{employeeInfo.code}</div>
        </div>
        <div className={styles.formGroup}>
          <label>Employee name</label>
          <div className={styles.readonlyValue}>{employeeInfo.name}</div>
        </div>
        <div className={styles.formGroup}>
          <label>PAN</label>
          <div className={styles.readonlyValue}>{employeeInfo.pan}</div>
        </div>
        <div className={styles.formGroup}>
          <label>Date of Joining</label>
          <div className={styles.readonlyValue}>{employeeInfo.doj}</div>
        </div>
      </div>
      {taxRegime === "Old Regime" && (
        <div
          className={styles.stepGrid}
          style={{ marginBottom: "40px", columnGap: "60px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label style={{ fontWeight: 700 }}>LTA</label>
            <div className={styles.readonlyValue} style={{ minWidth: "200px" }}>
              {totals.lta || "-"}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label style={{ fontWeight: 700 }}>Section 80C Deductions</label>
            <div className={styles.readonlyValue} style={{ minWidth: "200px" }}>
              {totals.section80C}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label style={{ fontWeight: 700 }}>House Rental</label>
            <div className={styles.readonlyValue} style={{ minWidth: "200px" }}>
              {totals.houseRental || "-"}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label style={{ fontWeight: 700 }}>
              Housing Loan Repayment - Self Occupied
            </label>
            <div className={styles.readonlyValue} style={{ minWidth: "200px" }}>
              {totals.housingLoan || "-"}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "40px" }}>
        <h3 style={{ marginBottom: "16px" }}>Declaration</h3>
        <p
          style={{
            fontSize: "14px",
            color: "#334155",
            lineHeight: "1.6",
            marginBottom: "16px",
          }}
        >
          I hereby declare that what is stated above is true and correct. I
          undertake to inform immediately of any change in the above facts. Any
          Income tax liability arising out of wrong declaration will be my
          responsibility.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          <input
            type="checkbox"
            id="agree-declaration"
            checked={declaration.agreed}
            onChange={(e) => onDeclarationChange("agreed", e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
            disabled={readOnly}
          />
          <label
            htmlFor="agree-declaration"
            style={{ fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            Yes, I agree
          </label>
        </div>

        <div
          className={styles.stepGrid}
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <div className={styles.formGroup}>
            <label>Place</label>
            <InputField
              id="decl-place"
              value={declaration.place}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onDeclarationChange("place", e.target.value)
              }
              placeholder="Enter place"
              disabled={readOnly}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Date</label>
            <div className={styles.readonlyValue}>{declaration.date}</div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "30px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {taxRegime === "Old Regime" && onDownloadAttachments && (
          <ActionButton
            variant="download"
            label="Download All Attachments"
            onClick={onDownloadAttachments}
          />
        )}
      </div>
    </div>
  );
};

export default SummaryStep;
