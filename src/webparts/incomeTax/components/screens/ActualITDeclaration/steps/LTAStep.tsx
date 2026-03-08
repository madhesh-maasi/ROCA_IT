import * as React from "react";
import {
  InputField,
  AppCalendar,
  AppDropdown,
  AppRadioButton,
} from "../../../../../../CommonInputComponents";
import { AppFilePicker } from "../../../../../../CommonInputComponents/FilePicker";
import styles from "../ITDeclaration.module.scss";

interface ICoTraveller {
  relationship: string;
  name: string;
  dob: Date | null;
  gender: string;
}

interface ILTAStepProps {
  ltaData: {
    exemptionAmount: string;
    journeyStartDate: Date | null;
    journeyEndDate: Date | null;
    journeyStartPlace: string;
    journeyDestination: string;
    modeOfTravel: string;
    classOfTravel: string;
    ticketNumbers: string;
    lastClaimedYear: string;
  };
  modeOptions: any[];
  classOptions: any[];
  coTravellers: ICoTraveller[];
  onLtaChange: (field: string, val: any) => void;
  onCoTravellerChange: (
    idx: number,
    field: keyof ICoTraveller,
    val: any,
  ) => void;
  onCommentChange?: (val: string) => void;
  showApproverComments?: boolean;
  approverComments?: string;
  readOnly?: boolean;
  attachments?: Record<string, any[]>;
  onUpload?: (key: string, file: File) => Promise<void>;
  onDeleteAttachment?: (key: string, fileId: number) => Promise<void>;
}

const UPLOAD_KEY = "lta";

const LTAStep: React.FC<ILTAStepProps> = ({
  ltaData,
  coTravellers,
  modeOptions,
  classOptions,
  onLtaChange,
  onCoTravellerChange,
  showApproverComments,
  approverComments,
  onCommentChange,
  readOnly,
  attachments = {},
  onUpload,
  onDeleteAttachment,
}) => {
  const ltaAttachments = attachments[UPLOAD_KEY] || [];

  const handleFilesPicked = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (onUpload) await onUpload(UPLOAD_KEY, file);
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepGrid}>
        <div className={styles.formGroup}>
          <label>Exemption Amount</label>
          <InputField
            id="lta-exemption"
            value={ltaData.exemptionAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange(
                "exemptionAmount",
                e.target.value.replace(/[^0-9]/g, ""),
              )
            }
            placeholder="Enter amount"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <AppCalendar
            id="lta-start-date"
            label="Journey Start Date"
            value={ltaData.journeyStartDate}
            onChange={(e: any) => onLtaChange("journeyStartDate", e.value)}
            placeholder="Select"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <AppCalendar
            id="lta-end-date"
            label="Journey End Date"
            value={ltaData.journeyEndDate}
            onChange={(e: any) => onLtaChange("journeyEndDate", e.value)}
            placeholder="Select"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Journey Start Place</label>
          <InputField
            id="lta-start-place"
            value={ltaData.journeyStartPlace}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange("journeyStartPlace", e.target.value)
            }
            placeholder="Enter place"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Journey Destination</label>
          <InputField
            id="lta-dest"
            value={ltaData.journeyDestination}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange("journeyDestination", e.target.value)
            }
            placeholder="Enter place"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <AppDropdown
            id="lta-mode"
            label="Mode of Travel"
            options={modeOptions}
            value={ltaData.modeOfTravel}
            onChange={(e: any) => onLtaChange("modeOfTravel", e.value)}
            placeholder="Select"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <AppDropdown
            id="lta-class"
            label="Class of Travel"
            options={classOptions}
            value={ltaData.classOfTravel}
            onChange={(e: any) => onLtaChange("classOfTravel", e.value)}
            placeholder="Select"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Ticket Numbers</label>
          <InputField
            id="lta-tickets"
            value={ltaData.ticketNumbers}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange("ticketNumbers", e.target.value)
            }
            placeholder="Enter numbers"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Year of last LTA Claimed</label>
          <InputField
            id="lta-last-year"
            value={ltaData.lastClaimedYear}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange("lastClaimedYear", e.target.value)
            }
            placeholder="Enter year"
            disabled={readOnly}
          />
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h3>Co-Travellers Details</h3>
        <div className={styles.tableContainer}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Relationship</th>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Gender</th>
              </tr>
            </thead>
            <tbody>
              {coTravellers.map((person, idx) => (
                <tr key={person.relationship}>
                  <td>
                    <div className={styles.readonlyValue}>
                      {person.relationship}
                    </div>
                  </td>
                  <td>
                    <InputField
                      id={`co-name-${idx}`}
                      value={person.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onCoTravellerChange(idx, "name", e.target.value)
                      }
                      disabled={readOnly}
                    />
                  </td>
                  <td>
                    <AppCalendar
                      id={`co-dob-${idx}`}
                      value={new Date(person.dob || "")}
                      onChange={(e: any) =>
                        onCoTravellerChange(idx, "dob", e.value)
                      }
                      placeholder="Select"
                      disabled={readOnly}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {person.relationship !== "Dependent Mother" && (
                        <AppRadioButton
                          label="Male"
                          name={`gender-${idx}`}
                          value="Male"
                          selectedValue={person.gender}
                          onChange={(val: string) =>
                            onCoTravellerChange(idx, "gender", val)
                          }
                          disabled={readOnly}
                        />
                      )}
                      {person.relationship !== "Dependent Mother" &&
                        person.relationship !== "Dependent Father" && (
                          <AppRadioButton
                            label="Female"
                            name={`gender-${idx}`}
                            value="Female"
                            selectedValue={person.gender}
                            onChange={(val: string) =>
                              onCoTravellerChange(idx, "gender", val)
                            }
                            disabled={readOnly}
                          />
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Inline upload row (below co-travellers) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "24px",
        }}
      >
        {!readOnly && onUpload && ltaAttachments.length === 0 && (
          <AppFilePicker
            buttonLabel="Upload PDF"
            accept=".pdf"
            onChange={handleFilesPicked}
          />
        )}

        {ltaAttachments.map((att) => (
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
                onClick={() => onDeleteAttachment(UPLOAD_KEY, att.Id)}
                title="Remove attachment"
              />
            )}
          </div>
        ))}
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

export default LTAStep;
