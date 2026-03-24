import * as React from "react";
import {
  InputField,
  AppRadioButton,
  AppDropdown,
} from "../../../../../../CommonInputComponents";
import { AppFilePicker } from "../../../../../../CommonInputComponents/FilePicker";
import styles from "../ITDeclaration.module.scss";

interface IHousingLoanData {
  propertyType: "None" | "Self Occupied" | "Let Out Property";
  interestAmount: string;
  finalLettableValue: string;
  letOutInterestAmount: string;
  otherDeductionsUs24: string;
  lenderName: string;
  lenderAddress: string;
  lenderPan: string;
  lenderType: string;
  isJointlyAvailed: boolean;
  attachments?: any[];
}

interface IHousingLoanStepProps {
  data: IHousingLoanData;
  onChange: (field: keyof IHousingLoanData, val: any) => void;
  showApproverComments?: boolean;
  approverComments?: string;
  onCommentChange?: (val: string) => void;
  status?: string;
  readOnly?: boolean;
  onUpload?: (key: string, file: File) => Promise<void>;
  onDeleteAttachment?: (key: string, fileId: number) => Promise<void>;
}

const UPLOAD_KEY_SELF = "housing-self";
const UPLOAD_KEY_LETOUT = "housing-letout";

const HousingLoanStep: React.FC<IHousingLoanStepProps> = ({
  data,
  onChange,
  showApproverComments,
  approverComments,
  onCommentChange,
  status,
  readOnly,
  onUpload,
  onDeleteAttachment,
}) => {
  const lenderTypeOptions = [
    { label: "Financial Institution", value: "Financial Institution" },
    { label: "Bank", value: "Bank" },
    { label: "Employer", value: "Employer" },
    { label: "Others", value: "Others" },
  ];

  /** Single inline row: [AppFilePicker] [📄 filename.pdf 🗑] ... */
  const renderUploadRow = (key: string) => {
    const files = data.attachments || [];
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "10px",
        }}
      >
        {!readOnly && onUpload && files.length === 0 && (
          <AppFilePicker
            buttonLabel="Upload PDF"
            accept=".pdf"
            onChange={(selectedFiles) => {
              const file = selectedFiles[0];
              if (file && onUpload) void onUpload(key, file);
            }}
          />
        )}
        {files.map((att) => (
          <div
            key={att.Id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              color: "#475569",
              maxWidth: "260px",
            }}
          >
            <i
              className="pi pi-file-pdf"
              style={{ color: "#e11d48", fontSize: "12px" }}
            />
            <a
              href={att.FileRef}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#334155",
                textDecoration: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "180px",
              }}
              title={att.FileLeafRef}
            >
              {att.FileLeafRef.replace(/_\d{14}(\.pdf)$/i, "$1")}
            </a>
            {!readOnly && onDeleteAttachment && (
              <i
                className="pi pi-trash"
                style={{
                  color: "#e11d48",
                  cursor: "pointer",
                  fontSize: "11px",
                  flexShrink: 0,
                }}
                onClick={() => onDeleteAttachment(key, att.Id)}
                title="Remove attachment"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className={styles.stepHeader}>Type of Property</div>
      <div className={styles.formGroup}>
        <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
          <AppRadioButton
            label="None"
            name="propertyType"
            value="None"
            selectedValue={data.propertyType}
            onChange={(val) => onChange("propertyType", val)}
            disabled={readOnly}
          />
          <AppRadioButton
            label="Self Occupied"
            name="propertyType"
            value="Self Occupied"
            selectedValue={data.propertyType}
            onChange={(val) => onChange("propertyType", val)}
            disabled={readOnly}
          />
          <AppRadioButton
            label="Let Out Property"
            name="propertyType"
            value="Let Out Property"
            selectedValue={data.propertyType}
            onChange={(val) => onChange("propertyType", val)}
            disabled={readOnly}
          />
        </div>
      </div>
      {data.propertyType === "Self Occupied" && (
        <div style={{ marginTop: 10 }}>
          <div className={styles.stepHeader}>
            Incase of Self Occupied property
          </div>
          <div className={styles.stepGrid} style={{ marginTop: "16px" }}>
            <div className={styles.formGroup}>
              <label>Interest of Housing Loan</label>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <InputField
                  id="hl-interest"
                  value={data.interestAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange("interestAmount", e.target.value)
                  }
                  placeholder="10,000"
                  style={{ flex: 1 }}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
          {/* Upload below Self Occupied section */}
          {renderUploadRow(UPLOAD_KEY_SELF)}
        </div>
      )}

      {data.propertyType === "Let Out Property" && (
        <div style={{ marginTop: 10 }}>
          <div className={styles.stepHeader}>Incase of Let Out property</div>
          <div className={styles.stepGrid} style={{ marginTop: "16px" }}>
            <div className={styles.formGroup}>
              <label>Final Lettable Value</label>
              <InputField
                id="hl-let-out-val"
                value={data.finalLettableValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange("finalLettableValue", e.target.value)
                }
                placeholder="Enter value"
                disabled={readOnly}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Interest of Housing Loan</label>
              <InputField
                id="hl-let-out-interest"
                value={data.letOutInterestAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange("letOutInterestAmount", e.target.value)
                }
                placeholder="Enter amount"
                disabled={readOnly}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Other Deductions u/s 24</label>
              <InputField
                id="hl-other-deductions"
                value={data.otherDeductionsUs24}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange("otherDeductionsUs24", e.target.value)
                }
                placeholder="Enter amount"
                disabled={readOnly}
              />
            </div>
          </div>
          {/* Upload below Let Out Property section */}
          {renderUploadRow(UPLOAD_KEY_LETOUT)}
        </div>
      )}
      {data.propertyType !== "None" && (
        <div style={{ marginTop: 10 }}>
          <div className={styles.stepHeader}>Financial Institution</div>
          <div className={styles.stepGrid} style={{ marginTop: "16px" }}>
            <div className={styles.formGroup}>
              <label>Lender's name</label>
              <InputField
                id="hl-lender-name"
                value={data.lenderName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange("lenderName", e.target.value)
                }
                placeholder="Enter name"
                disabled={readOnly}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Lender's Address</label>
              <InputField
                id="hl-lender-addr"
                value={data.lenderAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange("lenderAddress", e.target.value)
                }
                placeholder="Enter address"
                disabled={readOnly}
              />
            </div>
            <div className={styles.formGroup}>
              <label>PAN of Lender</label>
              <InputField
                id="hl-lender-pan"
                value={data.lenderPan}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange("lenderPan", e.target.value)
                }
                placeholder="Enter PAN number"
                disabled={readOnly}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Lender's Type</label>
              <AppDropdown
                id="hl-lender-type"
                value={data.lenderType}
                options={lenderTypeOptions}
                onChange={(e: any) => onChange("lenderType", e.value)}
                placeholder="Select"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      )}

      {data.propertyType !== "None" && (
        <div style={{ marginTop: 10 }}>
          <div className={styles.stepHeader}>Others</div>
          <div className={styles.formGroup} style={{ marginTop: "16px" }}>
            <label>Jointly availed Property Loan</label>
            <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
              <AppRadioButton
                label="Yes"
                name="isJointlyAvailed"
                value={true}
                selectedValue={data.isJointlyAvailed}
                onChange={(val) => onChange("isJointlyAvailed", val)}
                disabled={readOnly}
              />
              <AppRadioButton
                label="No"
                name="isJointlyAvailed"
                value={false}
                selectedValue={data.isJointlyAvailed}
                onChange={(val) => onChange("isJointlyAvailed", val)}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      )}
      {showApproverComments && onCommentChange && (
        <div style={{ marginTop: 10 }}>
          <div className={styles.formGroup}>
            <div className={styles.stepHeader}>Approver Comments</div>
            <textarea
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
              disabled={status === "Approved"}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HousingLoanStep;
