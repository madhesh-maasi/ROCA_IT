import * as React from "react";
import {
  InputField,
  AppCalendar,
  AppDropdown,
  AppRadioButton,
} from "../../../../../../components";
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
  coTravellers: ICoTraveller[];
  onLtaChange: (field: string, val: any) => void;
  onCoTravellerChange: (
    idx: number,
    field: keyof ICoTraveller,
    val: any,
  ) => void;
}

const LTAStep: React.FC<ILTAStepProps> = ({
  ltaData,
  coTravellers,
  onLtaChange,
  onCoTravellerChange,
}) => {
  const travelModes = [
    { label: "Air", value: "Air" },
    { label: "Rail", value: "Rail" },
    { label: "Road", value: "Road" },
  ];

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepGrid}>
        <div className={styles.formGroup}>
          <label>Exemption Amount</label>
          <InputField
            id="lta-exemption"
            value={ltaData.exemptionAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange("exemptionAmount", e.target.value)
            }
            placeholder="Enter amount"
          />
        </div>
        <div className={styles.formGroup}>
          <AppCalendar
            id="lta-start-date"
            label="Journey Start Date"
            value={ltaData.journeyStartDate}
            onChange={(e: any) => onLtaChange("journeyStartDate", e.value)}
            placeholder="Select"
          />
        </div>
        <div className={styles.formGroup}>
          <AppCalendar
            id="lta-end-date"
            label="Journey End Date"
            value={ltaData.journeyEndDate}
            onChange={(e: any) => onLtaChange("journeyEndDate", e.value)}
            placeholder="Select"
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
          />
        </div>
        <div className={styles.formGroup}>
          <AppDropdown
            id="lta-mode"
            label="Mode of Travel"
            options={travelModes}
            value={ltaData.modeOfTravel}
            onChange={(e: any) => onLtaChange("modeOfTravel", e.value)}
            placeholder="Select"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Class of Travel</label>
          <InputField
            id="lta-class"
            value={ltaData.classOfTravel}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onLtaChange("classOfTravel", e.target.value)
            }
            placeholder="Enter class"
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
                    />
                  </td>
                  <td>
                    <AppCalendar
                      id={`co-dob-${idx}`}
                      value={person.dob}
                      onChange={(e: any) =>
                        onCoTravellerChange(idx, "dob", e.value)
                      }
                      placeholder="Select"
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <AppRadioButton
                        label="Male"
                        name={`gender-${idx}`}
                        value="Male"
                        selectedValue={person.gender}
                        onChange={(val: string) =>
                          onCoTravellerChange(idx, "gender", val)
                        }
                      />
                      <AppRadioButton
                        label="Female"
                        name={`gender-${idx}`}
                        value="Female"
                        selectedValue={person.gender}
                        onChange={(val: string) =>
                          onCoTravellerChange(idx, "gender", val)
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LTAStep;
