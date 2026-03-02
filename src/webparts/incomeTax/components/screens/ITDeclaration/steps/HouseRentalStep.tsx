import * as React from "react";
import { InputField, AppRadioButton } from "../../../../../../components";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import styles from "../ITDeclaration.module.scss";

interface IRentRow {
  month: string;
  isMetro: boolean;
  city: string;
  rent: string;
}

interface ILandlord {
  name: string;
  pan: string;
  address: string;
}

interface IHouseRentalStepProps {
  rentDetails: IRentRow[];
  landlords: ILandlord[];
  onRentChange: (idx: number, field: keyof IRentRow, val: any) => void;
  onLandlordChange: (idx: number, field: keyof ILandlord, val: string) => void;
  onAddLandlord: () => void;
}

const HouseRentalStep: React.FC<IHouseRentalStepProps> = ({
  rentDetails,
  landlords,
  onRentChange,
  onLandlordChange,
  onAddLandlord,
}) => {
  return (
    <div className={styles.stepContent}>
      <div className={styles.tableContainer}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th>Month</th>
              <th>Metro/Non Metro</th>
              <th>City</th>
              <th>Monthly Rent</th>
            </tr>
          </thead>
          <tbody>
            {rentDetails.map((row, idx) => (
              <tr key={row.month}>
                <td>
                  <div className={styles.readonlyValue}>{row.month}</div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "15px" }}>
                    <AppRadioButton
                      label="Metro"
                      name={`metro-${idx}`}
                      value={true}
                      selectedValue={row.isMetro}
                      onChange={(val: boolean) =>
                        onRentChange(idx, "isMetro", val)
                      }
                    />
                    <AppRadioButton
                      label="Non Metro"
                      name={`metro-${idx}`}
                      value={false}
                      selectedValue={row.isMetro}
                      onChange={(val: boolean) =>
                        onRentChange(idx, "isMetro", val)
                      }
                    />
                  </div>
                </td>
                <td>
                  <InputField
                    id={`city-${idx}`}
                    value={row.city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onRentChange(idx, "city", e.target.value)
                    }
                  />
                </td>
                <td>
                  <InputField
                    id={`rent-${idx}`}
                    value={row.rent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onRentChange(idx, "rent", e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "40px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3>Landlord Deatils</h3>
          <div className={styles.addMoreBtn} onClick={onAddLandlord}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            <span>Add More</span>
          </div>
        </div>

        <div className={styles.noteBox}>
          Note: Landlord Information is Mandatory if the monthly rental exceeds{" "}
          <strong>Rs 8,333</strong>
        </div>

        {landlords.map((ll, idx) => (
          <div
            key={idx}
            style={{
              padding: "20px",
              border: "1px solid #f1f5f9",
              borderRadius: "12px",
              marginBottom: "15px",
            }}
          >
            <div className={styles.stepGrid}>
              <div className={styles.formGroup}>
                <label>Landlord's Name</label>
                <InputField
                  id={`ll-name-${idx}`}
                  value={ll.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onLandlordChange(idx, "name", e.target.value)
                  }
                  placeholder="Enter Name"
                />
              </div>
              <div className={styles.formGroup}>
                <label>PAN of Landlord</label>
                <InputField
                  id={`ll-pan-${idx}`}
                  value={ll.pan}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onLandlordChange(idx, "pan", e.target.value)
                  }
                  placeholder="Enter PAN"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Landlord's Address</label>
                <InputField
                  id={`ll-addr-${idx}`}
                  value={ll.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onLandlordChange(idx, "address", e.target.value)
                  }
                  placeholder="Enter Address"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HouseRentalStep;
