import * as React from "react";
import { InputField } from "../../../../../../components";
import styles from "../ITDeclaration.module.scss";

interface I80CItem {
  id: number;
  investmentType: string;
  maxAmount: number;
  declaredAmount: string;
}

interface ISection80CStepProps {
  items: I80CItem[];
  onAmountChange: (id: number, val: string) => void;
}

const Section80CStep: React.FC<ISection80CStepProps> = ({
  items,
  onAmountChange,
}) => {
  return (
    <div className={styles.stepContent}>
      <div className={styles.noteBox}>
        Note : Only <strong>Rs 1,50,000</strong> is deductible under this
        section
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th style={{ width: "50%" }}>Type of Investments</th>
              <th>Max Amount</th>
              <th>Amount</th>
              <th>Document</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
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
                    id={`80c-amt-${item.id}`}
                    value={item.declaredAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onAmountChange(item.id, e.target.value)
                    }
                    placeholder="0"
                  />
                </td>
                <td>
                  <div
                    className={styles.readonlyValue}
                    style={{
                      color: "#3d4db7",
                      cursor: "pointer",
                      background: "#f5f7ff",
                    }}
                  >
                    Document.pdf
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Section80CStep;
