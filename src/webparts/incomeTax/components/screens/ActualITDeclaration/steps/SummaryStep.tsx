import * as React from "react";
import {
  ActionButton,
  InputField,
} from "../../../../../../CommonInputComponents";
import styles from "../ITDeclaration.module.scss";
import RequiredSympol from "../../../../../../common/components/RequiredSympol/RequiredSympol";
import moment from "moment";

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
    houseRental: string;
    housingLoan: string;
  };
  dynamicSections: Record<string, string>;
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
  showApproverComments?: boolean;
  approverComments?: string;
  onCommentChange?: (val: string) => void;
  status?: string;
  employeeDeclarationPath?: boolean;
}

const SummaryStep: React.FC<ISummaryStepProps> = ({
  employeeInfo,
  totals,
  dynamicSections,
  declaration,
  onDeclarationChange,
  onSaveAsDraft,
  onSubmit,
  onDownloadAttachments,
  readOnly,
  taxRegime,
  showApproverComments,
  approverComments,
  onCommentChange,
  status,
  employeeDeclarationPath,
}) => {
  return (
    <div>
      <div className={styles.stepHeader}>Basic Details</div>
      <div className={styles.summaryGrid} style={{ marginBottom: "10px" }}>
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
          <div className={styles.readonlyValue} title={employeeInfo.name}>
            {employeeInfo.name}
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>PAN</label>
          <div className={styles.readonlyValue}>{employeeInfo.pan || "-"}</div>
        </div>
        <div className={styles.formGroup}>
          <label>Date of Joining</label>
          <div className={styles.readonlyValue}>
            {employeeInfo.doj
              ? moment(employeeInfo.doj).format("DD/MM/YYYY")
              : "-"}
          </div>
        </div>
      </div>

      {taxRegime === "Old Regime" && (
        <div>
          <div className={styles.stepHeader}>Overall</div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "24px",
              marginBottom: 10,
            }}
          >
            <label
              style={{ fontWeight: 700, width: "23%", textAlign: "right" }}
            >
              House Rental
            </label>
            <div
              className={styles.readonlyValue}
              style={{ width: "250px", color: "#000" }}
            >
              {totals.houseRental || "-"}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "24px",
              marginBottom: 10,
            }}
          >
            <label
              style={{ fontWeight: 700, width: "23%", textAlign: "right" }}
            >
              LTA
            </label>
            <div
              className={styles.readonlyValue}
              style={{ width: "250px", color: "#000" }}
            >
              {totals.lta || "-"}
            </div>
          </div>

          {Object.entries(dynamicSections).map(([sectionName, total]) => (
            <div
              key={sectionName}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "24px",
                marginBottom: 10,
              }}
            >
              <label
                style={{ fontWeight: 700, width: "23%", textAlign: "right" }}
              >
                {sectionName}
              </label>
              <div
                className={styles.readonlyValue}
                style={{ width: "250px", color: "#000" }}
              >
                {total || "-"}
              </div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "24px",
              marginBottom: 10,
            }}
          >
            <label
              style={{ fontWeight: 700, width: "23%", textAlign: "right" }}
            >
              Housing Loan Repayment
            </label>
            <div
              className={styles.readonlyValue}
              style={{ width: "250px", color: "#000" }}
            >
              {totals.housingLoan || "-"}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <div className={styles.stepHeader}>Declaration</div>
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
            style={{ fontSize: "14px", cursor: "pointer" }}
          >
            Yes, I agree
          </label>
        </div>

        <div className={styles.stepGrid}>
          <div className={styles.formGroup}>
            <label>Place {RequiredSympol()}</label>
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
        {taxRegime === "Old Regime" &&
          onDownloadAttachments &&
          (status === "Submitted" || status === "Approved") &&
          employeeDeclarationPath && (
            <ActionButton
              variant="download"
              label="Download All Attachments"
              onClick={onDownloadAttachments}
            />
          )}
      </div>

      {showApproverComments && onCommentChange && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div className={styles.stepHeader} style={{ marginBottom: 0 }}>
              Approver Comments
            </div>
            {status == "Submitted" && (
              <div
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                Note : Comment is mandatory when selecting rework.
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <textarea
              className={styles.commentArea || ""}
              style={{
                width: "100%",
                height: 80,
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                resize: "none",
                fontSize: "14px",
                pointerEvents: status === "Approved" ? "none" : "auto",
                opacity: status === "Approved" ? 0.7 : 1,
              }}
              placeholder="Enter here"
              value={approverComments}
              disabled={status == "Approved" || status == "Rework"}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryStep;
