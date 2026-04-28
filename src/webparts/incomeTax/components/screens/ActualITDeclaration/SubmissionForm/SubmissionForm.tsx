import * as React from "react";
import styles from "./SubmissionForm.module.scss";
import moment from "moment";

// Import Roca logo
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rocaLogo = require("../../../../../../common/Asset/Images/RocaNewLogo.jpg");

export interface IEmployeeInfo {
  employeeCode: string;
  employeeName: string;
  location: string;
  panNumber: string;
  officialEmailId: string;
  mobileNumber: string;
  financialYear: string;
  dateOfJoining: string;
  taxRegime?: string;
}

export interface IDeclarationSummary {
  lta: string | number;
  houseRental: string | number;
  previousEmployerIncome: string | number;
  housingLoanSelfOccupied: string | number;
  housingLoanLetOut: string | number;
  dynamicSections?: Record<string, string | number>;
}

interface ISubmissionFormProps {
  employeeInfo: IEmployeeInfo;
  declarationSummary: IDeclarationSummary;
  isAgreed: boolean;
  onAgreedChange?: (val: boolean) => void;
  submittedPlace: string;
  onPlaceChange?: (val: string) => void;
  submittedUserName: string;
  onUserNameChange?: (val: string) => void;
  submittedDesignation: string;
  onDesignationChange?: (val: string) => void;
  isReadOnly?: boolean;
}

const SubmissionForm: React.FC<ISubmissionFormProps> = ({
  employeeInfo,
  declarationSummary,
  isAgreed,
  onAgreedChange,
  submittedPlace,
  onPlaceChange,
  submittedUserName,
  onUserNameChange,
  submittedDesignation,
  onDesignationChange,
  isReadOnly = false,
}) => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logos}>
          <img src={rocaLogo} alt="Roca Logo" />
        </div>
        <div className={styles.title}>
          <h1>Roca Bathroom Products Private Limited</h1>
          <h2>
            INVESTMENT SUBMISSION FORM FOR THE FINANCIAL YEAR{" "}
            {employeeInfo.financialYear}
          </h2>
        </div>
      </header>

      <section>
        <div className={styles.sectionHeader}>Employee Information:</div>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td className={styles.labelColumn}>EMPLOYEE CODE</td>
              <td className={styles.valueColumn}>
                {employeeInfo.employeeCode}
              </td>
            </tr>
            <tr>
              <td className={styles.labelColumn}>EMPLOYEE NAME</td>
              <td className={styles.valueColumn}>
                {employeeInfo.employeeName}
              </td>
            </tr>
            <tr>
              <td className={styles.labelColumn}>LOCATION</td>
              <td className={styles.valueColumn}>{employeeInfo.location}</td>
            </tr>
            <tr>
              <td className={styles.labelColumn}>PAN NUMBER</td>
              <td className={styles.valueColumn}>{employeeInfo.panNumber}</td>
            </tr>
            <tr>
              <td className={styles.labelColumn}>OFFICIAL EMAIL ID</td>
              <td className={styles.valueColumn}>
                {employeeInfo.officialEmailId}
              </td>
            </tr>
            <tr>
              <td className={styles.labelColumn}>MOBILE NUMBER</td>
              <td className={styles.valueColumn}>
                {employeeInfo.mobileNumber}
              </td>
            </tr>
            <tr>
              <td className={styles.labelColumn}>FINANCIAL YEAR</td>
              <td className={styles.valueColumn}>
                {employeeInfo.financialYear}
              </td>
            </tr>
            <tr>
              <td className={styles.labelColumn}>DATE OF JOINING</td>
              <td className={styles.valueColumn}>
                {employeeInfo.dateOfJoining}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {employeeInfo.taxRegime !== "New Regime" && (
        <section>
          <div className={styles.sectionHeader}>Declaration Summary:</div>
          <table className={styles.table}>
            <tbody>
              <tr>
                <td className={styles.labelColumn}>House Rental</td>
                <td className={styles.valueColumn}>
                  {declarationSummary.houseRental || "-"}
                </td>
              </tr>
              <tr>
                <td className={styles.labelColumn}>LTA</td>
                <td className={styles.valueColumn}>
                  {declarationSummary.lta || "-"}
                </td>
              </tr>

              {declarationSummary.dynamicSections &&
                Object.entries(declarationSummary.dynamicSections).map(
                  ([sectionName, amount]) => (
                    <tr key={sectionName}>
                      <td className={styles.labelColumn}>{sectionName}</td>
                      <td className={styles.valueColumn}>{amount || "-"}</td>
                    </tr>
                  ),
                )}
              <tr>
                <td className={styles.labelColumn}>
                  Housing Loan Interest Repayment - Self Occupied
                </td>
                <td className={styles.valueColumn}>
                  {declarationSummary.housingLoanSelfOccupied || "-"}
                </td>
              </tr>
              <tr>
                <td className={styles.labelColumn}>
                  Housing Loan Interest Repayment - Let Out
                </td>
                <td className={styles.valueColumn}>
                  {declarationSummary.housingLoanLetOut || "-"}
                </td>
              </tr>
              <tr>
                <td className={styles.labelColumn}>Previous Employer Income</td>
                <td className={styles.valueColumn}>
                  {declarationSummary.previousEmployerIncome || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <div className={styles.agreementSection}>
        <label className={styles.checkboxContainer}>
          <input
            type="checkbox"
            checked={isAgreed}
            onChange={(e) => onAgreedChange?.(e.target.checked)}
            disabled={isReadOnly}
          />
          <span className={styles.checkboxLabel}>
            I agree that the above information is true and correct.
          </span>
        </label>
      </div>

      <div className={styles.declarationSection}>
        <div className={styles.declarationTitle}>DECLARATION:</div>
        <div className={styles.declarationText}>
          I hereby declare that what is stated above is true and correct. I
          undertake to inform immediately of any change in the above facts. Any
          Income tax liability arising out of wrong declaration will be my
          responsibility.
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <div className={styles.inputField}>
            <label>Place :</label>
            {isReadOnly ? (
              <span className={styles.staticValue}>{submittedPlace}</span>
            ) : (
              <input
                type="text"
                value={submittedPlace}
                className={styles.signatureInput}
                onChange={(e) => onPlaceChange?.(e.target.value)}
              />
            )}
          </div>
          <div className={styles.date}>
            Date:{" "}
            <span className={styles.signatureLine}>
              {moment().format("DD/MM/YYYY HH:mm")}
            </span>
          </div>
        </div>
        <div className={styles.footerRight}>
          <div className={styles.inputField}>
            <label style={{ width: 86 }}>User Name:</label>
            {isReadOnly ? (
              <span className={styles.staticValue}>{submittedUserName}</span>
            ) : (
              <input
                type="text"
                value={submittedUserName}
                className={styles.signatureInput}
                onChange={(e) => onUserNameChange?.(e.target.value)}
              />
            )}
          </div>
          <div className={styles.inputField}>
            <label>Designation:</label>
            {isReadOnly ? (
              <span className={styles.staticValue}>{submittedDesignation}</span>
            ) : (
              <input
                type="text"
                value={submittedDesignation}
                className={styles.signatureInput}
                onChange={(e) => onDesignationChange?.(e.target.value)}
              />
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SubmissionForm;
