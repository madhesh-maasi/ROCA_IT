import * as React from "react";
import { InputField } from "../../../../../../CommonInputComponents";
import styles from "../ITDeclaration.module.scss";

interface I80DItem {
  id: number;
  section: string;
  investmentType: string;
  maxAmount: number;
  declaredAmount: string;
}

interface ISection80DStepProps {
  items: I80DItem[];
  sectionMaxAmount: number;
  showApproverComments?: boolean;
  approverComments: string;
  onAmountChange: (id: number, val: string) => void;
  onCommentChange: (val: string) => void;
  status?: string;
  readOnly?: boolean;
}

const Section80DStep: React.FC<ISection80DStepProps> = ({
  items,
  sectionMaxAmount,
  showApproverComments,
  approverComments,
  onAmountChange,
  onCommentChange,
  status,
  readOnly,
}) => {
  return (
    <div>
      <div className={styles.stepHeader}>Section 80D Deductions</div>
      <div className={styles.noteBox}>
        Note : Only{" "}
        <strong>Rs {sectionMaxAmount?.toLocaleString() || "50,000"}</strong> is
        deductible under this section
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th>Section</th>
              <th style={{ width: "40%" }}>Type of Investments</th>
              <th>Max Amount</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div
                    className={styles.readonlyValue}
                    style={{ background: "#f8fafc" }}
                  >
                    {item.section}
                  </div>
                </td>
                <td>
                  <div
                    className={styles.readonlyValue}
                    style={{
                      border: "none",
                    }}
                  >
                    {item.investmentType}
                  </div>
                </td>
                <td>
                  <div className={styles.readonlyValue}>
                    {item.maxAmount.toLocaleString()}
                  </div>
                </td>
                <td>
                  <InputField
                    id={`80d-amt-${item.id}`}
                    value={item.declaredAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onAmountChange(
                        item.id,
                        e.target.value.replace(/[^0-9]/g, ""),
                      )
                    }
                    placeholder="0"
                    disabled={readOnly}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              disabled={status === "Approved"}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Section80DStep;
