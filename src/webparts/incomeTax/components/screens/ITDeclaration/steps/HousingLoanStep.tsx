import * as React from "react";
import {
  InputField,
  AppRadioButton,
  AppDropdown,
} from "../../../../../../components";
import styles from "../ITDeclaration.module.scss";

interface IHousingLoanData {
  propertyType: "None" | "Self Occupied" | "Let Out Property";
  interestAmount: string; // Used for Self Occupied
  // Let Out Property Fields
  finalLettableValue: string;
  letOutInterestAmount: string;
  otherDeductionsUs24: string;

  lenderName: string;
  lenderAddress: string;
  lenderPan: string;
  lenderType: string;
  isJointlyAvailed: boolean;
  approverComments: string;
}

interface IHousingLoanStepProps {
  data: IHousingLoanData;
  onChange: (field: keyof IHousingLoanData, val: any) => void;
}

const HousingLoanStep: React.FC<IHousingLoanStepProps> = ({
  data,
  onChange,
}) => {
  const lenderTypeOptions = [
    { label: "Financial Institution", value: "Financial Institution" },
    { label: "Bank", value: "Bank" },
    { label: "Employer", value: "Employer" },
    { label: "Others", value: "Others" },
  ];

  return (
    <div className={styles.stepContent}>
      <div className={styles.formGroup}>
        <label>Type of Property</label>
        <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
          <AppRadioButton
            label="None"
            name="propertyType"
            value="None"
            selectedValue={data.propertyType}
            onChange={(val) => onChange("propertyType", val)}
          />
          <AppRadioButton
            label="Self Occupied"
            name="propertyType"
            value="Self Occupied"
            selectedValue={data.propertyType}
            onChange={(val) => onChange("propertyType", val)}
          />
          <AppRadioButton
            label="Let Out Property"
            name="propertyType"
            value="Let Out Property"
            selectedValue={data.propertyType}
            onChange={(val) => onChange("propertyType", val)}
          />
        </div>
      </div>

      {data.propertyType === "Self Occupied" && (
        <div style={{ marginTop: "30px" }}>
          <h3>Incase of Self Occupied property</h3>
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
                />
                <div
                  className={styles.readonlyValue}
                  style={{
                    color: "#3d4db7",
                    cursor: "pointer",
                    background: "#f5f7ff",
                    minWidth: "120px",
                  }}
                >
                  Document.pdf
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {data.propertyType === "Let Out Property" && (
        <div style={{ marginTop: "30px" }}>
          <h3>Incase of Let Out property</h3>
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
              />
            </div>
          </div>
        </div>
      )}

      {data.propertyType !== "None" && (
        <div style={{ marginTop: "40px" }}>
          <h3>Financial Institution</h3>
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
                placeholder="enter PAN number"
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
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "40px" }}>
        <h3>Others</h3>
        <div className={styles.formGroup} style={{ marginTop: "16px" }}>
          <label>Jointly availed Property Loan</label>
          <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
            <AppRadioButton
              label="Yes"
              name="isJointlyAvailed"
              value={true}
              selectedValue={data.isJointlyAvailed}
              onChange={(val) => onChange("isJointlyAvailed", val)}
            />
            <AppRadioButton
              label="No"
              name="isJointlyAvailed"
              value={false}
              selectedValue={data.isJointlyAvailed}
              onChange={(val) => onChange("isJointlyAvailed", val)}
            />
          </div>
        </div>
        <div
          className={styles.readonlyValue}
          style={{
            color: "#3d4db7",
            cursor: "pointer",
            background: "#f5f7ff",
            width: "fit-content",
            padding: "8px 16px",
            marginTop: "12px",
          }}
        >
          Document.pdf
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <div className={styles.formGroup}>
          <label>Approver Comments</label>
          <textarea
            style={{
              width: "100%",
              height: "100px",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              resize: "none",
              fontSize: "14px",
            }}
            placeholder="Enter here"
            value={data.approverComments}
            onChange={(e) => onChange("approverComments", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default HousingLoanStep;
