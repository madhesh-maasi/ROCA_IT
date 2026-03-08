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
  readOnly?: boolean;
  attachments?: Record<string, any[]>;
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
  readOnly,
  attachments = {},
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
                  />
                </td>
                <td>
                  <InputField
                    id={`rent-${idx}`}
                    value={row.rent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onRentChange(idx, "rent", e.target.value)
                    }
                    disabled={readOnly}
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
          <h3>Landlord Details</h3>
          {!readOnly && (
            <div
              className={styles.addMoreBtn}
              onClick={onAddLandlord}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <i className="pi pi-plus" style={{ fontSize: "14px" }} />
              <span>Add More</span>
            </div>
          )}
        </div>

        <div className={styles.noteBox}>
          Note: Landlord Information is Mandatory if the monthly rental exceeds{" "}
          <strong>Rs 8,333</strong>
        </div>

        {activeLandlordsWithIdx.map(({ ll, idx }) => {
          const uploadKey = `landlord-${idx}`;
          const rowAttachments = attachments[uploadKey] || [];

          return (
            <div
              key={idx}
              style={{
                padding: "20px",
                border: "1px solid #f1f5f9",
                borderRadius: "12px",
                marginBottom: "15px",
              }}
            >
              <div className={styles.stepGrid} style={{ alignItems: "center" }}>
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
                  <div>
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
                {!readOnly && onUpload && rowAttachments.length === 0 && (
                  <AppFilePicker
                    buttonLabel="Upload PDF"
                    accept=".pdf"
                    onChange={(files) => handleFilesPicked(uploadKey, files)}
                  />
                )}

                {rowAttachments.map((att) => (
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

export default HouseRentalStep;
