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
  readOnly?: boolean;
}

const Section80DStep: React.FC<ISection80DStepProps> = ({
  items,
  sectionMaxAmount,
  showApproverComments,
  approverComments,
  onAmountChange,
  onCommentChange,
  readOnly,
}) => {
  return (
    <div className={styles.stepContent}>
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
                      background: "transparent",
                      border: "none",
                      padding: 0,
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
        <div style={{ marginTop: "30px" }}>
          <div className={styles.formGroup}>
            <label>Approver Comments</label>
            <textarea
              className={styles.commentArea || ""}
              style={{
                width: "100%",
                height: "100px",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                resize: "none",
                fontSize: "14px",
                pointerEvents: "auto",
                opacity: 1,
              }}
              disabled={readOnly}
              placeholder="Enter here"
              value={approverComments}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Section80DStep;
