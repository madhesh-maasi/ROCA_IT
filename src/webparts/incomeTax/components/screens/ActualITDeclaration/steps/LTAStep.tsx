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
    attachments: any[];
  };
  modeOptions: any[];
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
  status?: string;
  readOnly?: boolean;
  onUpload?: (key: string, file: File) => Promise<void>;
  onDeleteAttachment?: (
    key: string,
    fileId: number,
    silent?: boolean,
  ) => Promise<void>;
}

const UPLOAD_KEY = "lta";

const LTAStep: React.FC<ILTAStepProps> = ({
  ltaData,
  coTravellers,
  modeOptions,
  onLtaChange,
  onCoTravellerChange,
  showApproverComments,
  approverComments,
  onCommentChange,
  status,
  readOnly,
  onUpload,
  onDeleteAttachment,
}) => {
  const ltaAttachments = (ltaData.attachments || []).filter(
    (a: any) => !a.isDeleted,
  );

  const handleFilesPicked = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (onUpload) {
      await onUpload(UPLOAD_KEY, file);
    }
  };

  return (
    <div>
      <div className={styles.stepHeader}>
        Leave and Travel Allowance Details
      </div>
      <div className={styles.basicInfoGrid}>
        <div className={styles.formGroup}>
          <label>Exemption Amount</label>
          <InputField
            id="lta-exemption"
            value={ltaData.exemptionAmount}
            onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
              onLtaChange(
                "exemptionAmount",
                e.target.value.replace(/[^0-9]/g, "").slice(0, 7),
              );
              if (!e.target.value.replace(/[^0-9]/g, "").slice(0, 7)) {
                /*eslint-disable @typescript-eslint/no-unused-expressions*/
                ltaAttachments[0]?.Id &&
                  (await onDeleteAttachment?.(
                    UPLOAD_KEY,
                    ltaAttachments[0]?.Id,
                    true,
                  ));
              }
            }}
            placeholder="Enter amount"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <AppCalendar
            id="lta-start-date"
            label="Journey Start Date"
            value={ltaData.journeyStartDate}
            onChange={(e: any) => {
              onLtaChange("journeyStartDate", e.value);
              onLtaChange("journeyEndDate", null);
            }}
            placeholder="Select"
            disabled={readOnly}
            required={Number(ltaData.exemptionAmount) > 0}
          />
        </div>
        <div className={styles.formGroup}>
          <AppCalendar
            id="lta-end-date"
            label="Journey End Date"
            value={ltaData.journeyEndDate}
            onChange={(e: any) => {
              onLtaChange("journeyEndDate", e.value);
            }}
            placeholder="Select"
            disabled={readOnly || !ltaData.journeyStartDate}
            minDate={
              ltaData.journeyStartDate
                ? new Date(ltaData.journeyStartDate)
                : undefined
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>
            Journey Start Place{" "}
            {Number(ltaData.exemptionAmount) > 0 ? (
              <span style={{ color: "red" }}>*</span>
            ) : null}
          </label>
          <InputField
            id="lta-start-place"
            value={ltaData.journeyStartPlace}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange("journeyStartPlace", e.target.value)
            }
            placeholder="Enter place"
            disabled={readOnly}
            required={Number(ltaData.exemptionAmount) > 0}
          />
        </div>
        <div className={styles.formGroup}>
          <label>
            Journey Destination{" "}
            {Number(ltaData.exemptionAmount) > 0 ? (
              <span style={{ color: "red" }}>*</span>
            ) : null}
          </label>
          <InputField
            id="lta-dest"
            value={ltaData.journeyDestination}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange("journeyDestination", e.target.value)
            }
            placeholder="Enter place"
            disabled={readOnly}
            required={Number(ltaData.exemptionAmount) > 0}
          />
        </div>
        <div className={styles.formGroup}>
          <AppDropdown
            id="lta-mode"
            label="Mode of Travel"
            options={modeOptions}
            value={ltaData.modeOfTravel}
            onChange={(e: any) => {
              onLtaChange("modeOfTravel", e.value);
              onLtaChange("classOfTravel", "");
              onLtaChange("ticketNumbers", "");
            }}
            placeholder="Select"
            disabled={readOnly}
            required={Number(ltaData.exemptionAmount) > 0}
          />
        </div>
        <div className={styles.formGroup}>
          <label>
            Class of Travel{" "}
            {ltaData.modeOfTravel !== "Others" &&
            Number(ltaData.exemptionAmount) > 0 ? (
              <span style={{ color: "red" }}>*</span>
            ) : null}
          </label>
          <InputField
            id="lta-class"
            value={ltaData.classOfTravel}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange("classOfTravel", e.target.value)
            }
            placeholder="Enter class of travel"
            disabled={readOnly}
            required={
              ltaData.modeOfTravel !== "Others" &&
              Number(ltaData.exemptionAmount) > 0
            }
          />
          {/* <AppDropdown
            id="lta-class"
            label="Class of Travel"
            options={classOptions}
            value={ltaData.classOfTravel}
            onChange={(e: any) => onLtaChange("classOfTravel", e.value)}
            placeholder="Select"
            disabled={readOnly}
          /> */}
        </div>
        <div className={styles.formGroup}>
          <label>
            Ticket Numbers{" "}
            {ltaData.modeOfTravel !== "Others" &&
            Number(ltaData.exemptionAmount) > 0 ? (
              <span style={{ color: "red" }}>*</span>
            ) : null}
          </label>
          <InputField
            id="lta-tickets"
            value={ltaData.ticketNumbers}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange("ticketNumbers", e.target.value)
            }
            placeholder="Enter numbers"
            disabled={readOnly}
            required={
              ltaData.modeOfTravel !== "Others" &&
              Number(ltaData.exemptionAmount) > 0
            }
          />
        </div>
        <div className={styles.formGroup}>
          <label>
            Year of last LTA Claimed{" "}
            {Number(ltaData.exemptionAmount) > 0 ? (
              <span style={{ color: "red" }}>*</span>
            ) : null}
          </label>
          <InputField
            id="lta-last-year"
            value={ltaData.lastClaimedYear}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange(
                "lastClaimedYear",
                e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
              )
            }
            placeholder="Enter year"
            disabled={readOnly}
            required={Number(ltaData.exemptionAmount) > 0}
          />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div className={styles.stepHeader}>Co-Travellers Details</div>
        <div className={styles.tableContainer} style={{ marginTop: 10 }}>
          <table className={styles.coTravellerTable}>
            <thead>
              <tr>
                <th style={{ width: "20%" }}>Relationship</th>
                <th style={{ width: "25%" }}>Name</th>
                <th style={{ width: "25%" }}>Date of Birth</th>
                <th style={{ width: "30%" }}>Gender</th>
              </tr>
            </thead>
            <tbody>
              {coTravellers.map((person, idx) => (
                <tr key={person.relationship}>
                  <td
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#374151",
                    }}
                  >
                    {person.relationship}
                  </td>
                  <td>
                    <InputField
                      id={`co-name-${idx}`}
                      value={person.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onCoTravellerChange(idx, "name", e.target.value)
                      }
                      disabled={readOnly}
                      placeholder="Enter Name"
                    />
                  </td>
                  <td>
                    <AppCalendar
                      id={`co-dob-${idx}`}
                      value={person.dob ? new Date(person.dob) : null}
                      onChange={(e: any) =>
                        onCoTravellerChange(idx, "dob", e.value)
                      }
                      placeholder="Select"
                      disabled={readOnly}
                    />
                  </td>
                  <td>
                    <div className={styles.genderGroup}>
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
                      {person.relationship !== "Dependent Father" && (
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
              cursor: "pointer",
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
              onClick={() => {
                window.open(att.FileRef, "_blank", "noopener,noreferrer");
              }}
            />
            <span
              style={{
                color: "#334155",
                textDecoration: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "180px",
              }}
              title={att.FileLeafRef.replace(/\d{14}(\.pdf)$/i, "$1")}
              onClick={() => {
                window.open(att.FileRef, "_blank", "noopener,noreferrer");
              }}
            >
              {att.FileLeafRef.replace(/\d{14}(\.pdf)$/i, "$1")}
            </span>
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
              disabled={status === "Approved" || status == "Rework"}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LTAStep;
