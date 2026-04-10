import * as React from "react";
import {
  InputField,
  AppRadioButton,
  IconButton,
} from "../../../../../../CommonInputComponents";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import styles from "../ITDeclaration.module.scss";
import { panFormatter } from "../../../../../../common/utils/validationUtils";

interface IRentRow {
  month: string;
  isMetro: boolean | null;
  city: string;
  rent: string;
}

interface ILandlord {
  name: string;
  pan: string;
  address: string;
  isDeleted?: boolean;
}

interface IHouseRentalStepProps {
  rentDetails: IRentRow[];
  landlords: ILandlord[];
  onRentChange: (idx: number, field: keyof IRentRow, val: any) => void;
  onLandlordChange: (idx: number, field: keyof ILandlord, val: any) => void;
  onAddLandlord: () => void;
  onDeleteLandlord: (idx: number) => void;
  showApproverComments?: boolean;
  approverComments?: string;
  onCommentChange?: (val: string) => void;
  status?: string;
  readOnly?: boolean;
}

const HouseRentalStep: React.FC<IHouseRentalStepProps> = ({
  rentDetails,
  landlords,
  onRentChange,
  onLandlordChange,
  onAddLandlord,
  onDeleteLandlord,
  showApproverComments,
  approverComments,
  onCommentChange,
  status,
  readOnly,
}) => {
  const activeCount = landlords?.filter((l) => !l.isDeleted).length;

  const landlordPanMandatory = rentDetails?.some((l) => Number(l.rent) > 8333);

  return (
    <div>
      <div className={styles.stepHeader}>House Rental Information</div>
      <div className={styles.tableContainer} style={{ marginTop: "10px" }}>
        <table className={styles.houseRentalTable}>
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Month</th>
              <th style={{ width: "17%" }}>Metro/Non Metro</th>
              <th style={{ width: "20%" }}>City</th>
              <th style={{ width: "20%" }}>Monthly Rent</th>
            </tr>
          </thead>
          <tbody>
            {rentDetails.map((row, idx) => (
              <tr key={row.month}>
                <td style={{ paddingLeft: 0 }}>
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
                      disabled={readOnly}
                    />
                    <AppRadioButton
                      label="Non Metro"
                      name={`metro-${idx}`}
                      value={false}
                      selectedValue={row.isMetro}
                      onChange={(val: boolean) =>
                        onRentChange(idx, "isMetro", val)
                      }
                      disabled={readOnly}
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
                    disabled={readOnly}
                    placeholder="Enter City"
                  />
                </td>
                <td style={{ paddingRight: 0 }}>
                  <InputField
                    id={`rent-${idx}`}
                    value={row.rent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 7);
                      onRentChange(idx, "rent", value);
                    }}
                    disabled={readOnly}
                    placeholder="Enter Rent"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
            Landlord Details
          </h3>
          {!readOnly && (
            <div className={styles.addMoreBtn} onClick={onAddLandlord}>
              <i className="pi pi-plus-circle" style={{ fontSize: "16px" }} />
              <span>Add More</span>
            </div>
          )}
        </div>
        <div className={styles.landlordCard}>
          <div className={styles.noteBox} style={{ marginTop: 0 }}>
            Note: Landlord Information is Mandatory if the monthly rental
            exceeds <strong>Rs 8,333</strong>
          </div>

          {landlords.map((ll, idx) => (
            <div
              key={idx}
              className={styles.landlordGrid}
              style={{ display: ll.isDeleted ? "none" : "" }}
            >
              <div className={styles.formGroup}>
                <label>
                  Landlord's Name <span>*</span>
                </label>
                <InputField
                  id={`ll-name-${idx}`}
                  value={ll.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onLandlordChange(idx, "name", e.target.value)
                  }
                  placeholder="Enter Name"
                  disabled={readOnly}
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  PAN of Landlord {landlordPanMandatory && <span>*</span>}
                </label>
                <InputField
                  id={`ll-pan-${idx}`}
                  value={ll.pan}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onLandlordChange(idx, "pan", panFormatter(e.target.value))
                  }
                  placeholder="Enter PAN"
                  disabled={readOnly}
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Tenant's Address <span>*</span>
                </label>
                <InputField
                  id={`ll-addr-${idx}`}
                  value={ll.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onLandlordChange(idx, "address", e.target.value)
                  }
                  placeholder="Enter Address"
                  disabled={readOnly}
                />
              </div>
              {/* {!readOnly && activeCount > 1 && ( */}
              {!readOnly && (
                <div style={{ paddingBottom: "10px" }}>
                  <IconButton
                    icon="pi pi-trash"
                    style={{
                      color: "#e11d48",
                      cursor: activeCount == 1 ? "not-allowed" : "pointer",
                      fontSize: "16px",
                    }}
                    disabled={activeCount == 1}
                    onClick={() => onDeleteLandlord(idx)}
                  />
                </div>
              )}
            </div>
          ))}
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
                overflowY: "auto",
                fontSize: "14px",
                opacity: status === "Approved" ? 0.8 : 1,
                backgroundColor: "#fff",
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

export default HouseRentalStep;
