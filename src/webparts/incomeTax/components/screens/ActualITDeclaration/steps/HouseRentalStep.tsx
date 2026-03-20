import * as React from "react";
import {
  InputField,
  AppRadioButton,
} from "../../../../../../CommonInputComponents";
import { AppFilePicker } from "../../../../../../CommonInputComponents/FilePicker";
import styles from "../ITDeclaration.module.scss";

interface IRentRow {
  month: string;
  isMetro: boolean;
  city: string;
  rent: string;
}

interface ILandlord {
  Id?: number;
  name: string;
  pan: string;
  address: string;
  isDeleted?: boolean;
  attachments?: any[];
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
  onUpload?: (key: string, file: File) => Promise<void>;
  onDeleteAttachment?: (key: string, fileId: number) => Promise<void>;
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
  onUpload,
  onDeleteAttachment,
}) => {
  const activeLandlordsWithIdx = landlords
    .map((ll, idx) => ({ ll, idx }))
    .filter(({ ll }) => !ll.isDeleted);

  const handleFilesPicked = async (key: string, files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (onUpload) await onUpload(key, file);
  };

  return (
    <div>
      <div className={styles.stepHeader}>House Rental Information</div>
      <div className={styles.tableContainer} style={{ marginTop: "10px" }}>
        <table className={styles.houseRentalTable}>
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Month</th>
              <th style={{ width: "25%" }}>Metro/Non Metro</th>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onRentChange(
                        idx,
                        "rent",
                        e.target.value.replace(/[^0-9]/g, ""),
                      )
                    }
                    disabled={readOnly}
                    placeholder="Enter Rent"
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

        {activeLandlordsWithIdx.map(({ ll, idx }) => {
          const uploadKey = `landlord-${idx}`;

          return (
            <div key={idx} className={styles.landlordCard}>
              <div className={styles.noteBox} style={{ marginTop: 0 }}>
                Note: Landlord Information is Mandatory if the monthly rental
                exceeds <strong>Rs 8,333</strong>
              </div>
              <div className={styles.landlordGrid}>
                <div className={styles.formGroup}>
                  <label>Landlord's Name</label>
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
                  <label>PAN of Landlord</label>
                  <InputField
                    id={`ll-pan-${idx}`}
                    value={ll.pan}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onLandlordChange(idx, "pan", e.target.value)
                    }
                    placeholder="Enter PAN"
                    disabled={readOnly}
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
                    disabled={readOnly}
                  />
                </div>
                {!readOnly && (
                  <div style={{ paddingBottom: "10px" }}>
                    <i
                      className="pi pi-trash"
                      style={{
                        color: "#e11d48",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                      onClick={() => onDeleteLandlord(idx)}
                    />
                  </div>
                )}
              </div>

              {/* ── Inline upload row ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >
                {!readOnly && onUpload && ll.attachments?.length === 0 && (
                  <AppFilePicker
                    buttonLabel="Upload PDF"
                    accept=".pdf"
                    onChange={(files) => handleFilesPicked(uploadKey, files)}
                  />
                )}

                {ll.attachments?.map((att: any) => (
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
                        onClick={() => onDeleteAttachment(uploadKey, att.Id)}
                        title="Remove attachment"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showApproverComments && onCommentChange && (
        <div style={{ marginTop: 10 }}>
          <div className={styles.formGroup}>
            <div className={styles.stepHeader}>Approver Comments</div>
            <textarea
              className={styles.commentArea || ""}
              style={{
                width: "100%",
                height: "100px",
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

export default HouseRentalStep;
