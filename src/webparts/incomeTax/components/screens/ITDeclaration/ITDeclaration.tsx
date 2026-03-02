import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Home01Icon,
  InformationCircleIcon,
  Building06Icon,
  PlaneIcon,
  ChartBarLineIcon,
  CheckmarkBadge01Icon,
  MoneyReceiveCircleIcon,
  UserAccountIcon,
  Building02Icon,
} from "@hugeicons/core-free-icons";
import { useAppSelector, useAppDispatch } from "../../../../../store/hooks";
import { selectUserDetails } from "../../../../../store/slices/userSlice";
import {
  selectIncomeTaxItems,
  fetchIncomeTaxItems,
} from "../../../../../store/slices/incomeTaxSlice";
import { getListItems } from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import { ActionButton } from "../../../../../components";
import ITStepper from "./ITStepper";
import HomeStep from "./steps/HomeStep";
import BasicInfoStep from "./steps/BasicInfoStep";
import HouseRentalStep from "./steps/HouseRentalStep";
import LTAStep from "./steps/LTAStep";
import Section80CStep from "./steps/Section80CStep";
import Section80DStep from "./steps/Section80DStep";
import HousingLoanStep from "./steps/HousingLoanStep";
import PreviousEmployerStep from "./steps/PreviousEmployerStep";
import SummaryStep from "./steps/SummaryStep";
import styles from "./ITDeclaration.module.scss";

// ── Mapping section names to icons ───────────────────────────────
const ICON_MAP: Record<string, any> = {
  Home: Home01Icon, // Keep Home for hardcoded step
  "Basic Information": UserAccountIcon, // Keep Basic Information for hardcoded step from instruction
  "House Rental": Building06Icon,
  LTA: PlaneIcon,
  "Section 80C Deductions": ChartBarLineIcon,
  "Section 80 Deductions": ChartBarLineIcon,
  "Housing Loan Repayment": MoneyReceiveCircleIcon,
  "Previous Employer Details": Building02Icon,
  "Declaration & Summary": CheckmarkBadge01Icon,
};

const ITDeclaration: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUserDetails);
  const itItems = useAppSelector(selectIncomeTaxItems);

  const [activeStep, setActiveStep] = React.useState("Home");
  const [steps, setSteps] = React.useState<any[]>([]);
  const [pan, setPan] = React.useState("");
  const [rentDetails, setRentDetails] = React.useState<any[]>([]);
  const [landlords, setLandlords] = React.useState<any[]>([]);
  const [ltaData, setLtaData] = React.useState({
    exemptionAmount: "",
    journeyStartDate: null,
    journeyEndDate: null,
    journeyStartPlace: "",
    journeyDestination: "",
    modeOfTravel: "",
    classOfTravel: "",
    ticketNumbers: "",
    lastClaimedYear: "",
  });
  const [coTravellers, setCoTravellers] = React.useState<any[]>([]);
  const [items80C, setItems80C] = React.useState<any[]>([]);
  const [items80D, setItems80D] = React.useState<any[]>([]);
  const [housingLoanData, setHousingLoanData] = React.useState({
    propertyType: "None" as const,
    interestAmount: "",
    finalLettableValue: "",
    letOutInterestAmount: "",
    otherDeductionsUs24: "",
    lenderName: "",
    lenderAddress: "",
    lenderPan: "",
    lenderType: "",
    isJointlyAvailed: false,
    approverComments: "",
  });
  const [previousEmployerData, setPreviousEmployerData] = React.useState({
    employerName: "",
    employerPan: "",
    employerAddress: "",
    employerTan: "",
    periodFrom: null,
    periodTo: null,
    salaryAfterExemption: "",
    pfContribution: "",
    vpfContribution: "",
    professionalTax: "",
    taxDeductedAtSource: "",
  });
  const [declarationAgreement, setDeclarationAgreement] = React.useState({
    agreed: false,
    place: "",
    date: new Date().toLocaleDateString("en-GB"),
  });
  const [comments80D, setComments80D] = React.useState("");

  // ── Fetch dynamic sections ──────────────────────────────────────
  React.useEffect(() => {
    const loadSections = async () => {
      try {
        const sections = await getListItems(LIST_NAMES.SECTION_CONFIG);
        const dynamicSteps = sections.map((s: any) => ({
          key: s.Title,
          label: s.Title,
          icon: ICON_MAP[s.Title] || ChartBarLineIcon,
        }));

        setSteps([
          { key: "Home", label: "Home", icon: Home01Icon },
          {
            key: "Basic Information",
            label: "Basic Information",
            icon: UserAccountIcon,
          },
          {
            key: "House Rental",
            label: "House Rental",
            icon: Building06Icon,
          },
          {
            key: "LTA",
            label: "LTA",
            icon: PlaneIcon,
          },
          {
            key: "Section 80C Deductions",
            label: "Section 80C Deductions",
            icon: ChartBarLineIcon,
          },
          {
            key: "Section 80 Deductions",
            label: "Section 80 Deductions",
            icon: ChartBarLineIcon,
          },
          {
            key: "Housing Loan Repayment",
            label: "Housing Loan Repayment",
            icon: MoneyReceiveCircleIcon,
          },
          ...dynamicSteps.filter(
            (s) =>
              ![
                "Section 80C Deductions",
                "Section 80 Deductions",
                "Housing Loan Repayment",
              ].includes(s.key),
          ),
          {
            key: "Previous Employer Details",
            label: "Previous Employer Details",
            icon: Building02Icon,
          },
          {
            key: "Declaration & Summary",
            label: "Declaration & Summary",
            icon: CheckmarkBadge01Icon,
          },
        ]);

        // Load Lookup Config for 80C and 80D
        const lookupConfig = await getListItems(LIST_NAMES.LOOKUP_CONFIG);
        const section80C = sections.find(
          (s: any) => s.Title === "Section 80C Deductions",
        );
        const section80D = sections.find(
          (s: any) => s.Title === "Section 80 Deductions",
        );

        const cItems = lookupConfig
          .filter((item: any) => item.SectionId === section80C?.Id)
          .map((item: any) => ({
            id: item.Id,
            investmentType: item.Types || item.Title, // Matches "Type of Investments" in image
            maxAmount: Number(item.MaxAmount) || 0,
            declaredAmount: "",
          }));
        setItems80C(cItems);

        const dItems = lookupConfig
          .filter((item: any) => item.SectionId === section80D?.Id)
          .map((item: any) => ({
            id: item.Id,
            section: item.SubSection || "80D", // Matches "Section" column in image
            investmentType: item.Types || item.Title, // Matches "Type of Investments" in image
            maxAmount: Number(item.MaxAmount) || 0,
            declaredAmount: "",
          }));
        setItems80D(dItems);
      } catch (error) {
        console.error("Error loading sections", error);
      }
    };

    void loadSections();

    // Initialize data
    const months = [
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "January",
      "February",
      "March",
    ];
    setRentDetails(
      months.map((m) => ({ month: m, isMetro: false, city: "", rent: "" })),
    );
    setLandlords([{ name: "", pan: "", address: "" }]);
    const relationships = [
      "Spouse",
      "Child 1",
      "Child 2",
      "Dependent Father",
      "Dependent Mother",
    ];
    setCoTravellers(
      relationships.map((r) => ({
        relationship: r,
        name: "",
        dob: null,
        gender: "",
      })),
    );
  }, []);

  const draftItem = React.useMemo(() => {
    if (!user || !itItems) return null;
    const userEmail = user.Email || user.LoginName;
    return itItems.find(
      (item: any) =>
        (item.EmployeeID === userEmail || item.Author?.Email === userEmail) &&
        item.Status === "Draft",
    );
  }, [user, itItems]);

  const renderCurrentStep = () => {
    switch (activeStep) {
      case "Home":
        return (
          <HomeStep
            declarationType={draftItem?.DeclarationType || "Planned"}
            financialYear="2025 - 2026"
            taxRegime={draftItem?.RegimeType || "Old Regime"}
          />
        );
      case "Basic Information":
        return (
          <BasicInfoStep
            employeeData={{
              code: "9002094", // Mocked for now, in real apps get from user profile
              name: user?.Title || "User",
              location: "Perundurai",
              doj: "01 Feb 2009",
              email: user?.Email || "",
              mobile: "9876556789",
            }}
            pan={pan}
            onPanChange={setPan}
          />
        );
      case "House Rental":
        return (
          <HouseRentalStep
            rentDetails={rentDetails}
            landlords={landlords}
            onRentChange={(idx, field, val) => {
              const newDetails = [...rentDetails];
              newDetails[idx] = { ...newDetails[idx], [field]: val };
              setRentDetails(newDetails);
            }}
            onLandlordChange={(idx, field, val) => {
              const newLls = [...landlords];
              newLls[idx] = { ...newLls[idx], [field]: val };
              setLandlords(newLls);
            }}
            onAddLandlord={() =>
              setLandlords([...landlords, { name: "", pan: "", address: "" }])
            }
          />
        );
      case "LTA":
        return (
          <LTAStep
            ltaData={ltaData}
            coTravellers={coTravellers}
            onLtaChange={(field, val) =>
              setLtaData((prev) => ({ ...prev, [field]: val }))
            }
            onCoTravellerChange={(idx, field, val) => {
              const newCo = [...coTravellers];
              newCo[idx] = { ...newCo[idx], [field]: val };
              setCoTravellers(newCo);
            }}
          />
        );
      case "Section 80C Deductions":
        return (
          <Section80CStep
            items={items80C}
            onAmountChange={(id, val) => {
              const newItems = [...items80C];
              const idx = newItems.findIndex((i) => i.id === id);
              if (idx > -1) {
                newItems[idx].declaredAmount = val;
                setItems80C(newItems);
              }
            }}
          />
        );
      case "Section 80 Deductions":
        return (
          <Section80DStep
            items={items80D}
            approverComments={comments80D}
            onAmountChange={(id, val) => {
              const newItems = [...items80D];
              const idx = newItems.findIndex((i) => i.id === id);
              if (idx > -1) {
                newItems[idx].declaredAmount = val;
                setItems80D(newItems);
              }
            }}
            onCommentChange={setComments80D}
          />
        );
      case "Housing Loan Repayment":
        return (
          <HousingLoanStep
            data={housingLoanData}
            onChange={(field, val) =>
              setHousingLoanData((prev) => ({ ...prev, [field]: val }))
            }
          />
        );
      case "Previous Employer Details":
        return (
          <PreviousEmployerStep
            data={previousEmployerData}
            onChange={(field, val) =>
              setPreviousEmployerData((prev) => ({ ...prev, [field]: val }))
            }
          />
        );
      case "Declaration & Summary":
        return (
          <SummaryStep
            employeeInfo={{
              fy: "2025 - 2026",
              code: "9002094",
              name: user?.Title || "User",
              pan: pan,
              doj: "01 Feb 2009",
            }}
            totals={{
              lta: ltaData.exemptionAmount || "0",
              section80C: items80C
                .reduce(
                  (acc, curr) => acc + Number(curr.declaredAmount || 0),
                  0,
                )
                .toLocaleString(),
              houseRental: rentDetails
                .reduce((acc, curr) => acc + Number(curr.rent || 0), 0)
                .toLocaleString(),
              housingLoan: (
                Number(housingLoanData.interestAmount || 0) +
                Number(housingLoanData.letOutInterestAmount || 0)
              ).toLocaleString(),
            }}
            declaration={declarationAgreement}
            onDeclarationChange={(field, val) =>
              setDeclarationAgreement((prev) => ({ ...prev, [field]: val }))
            }
            onSaveAsDraft={() => console.log("Saving draft...")}
            onSubmit={() => console.log("Submitting...")}
          />
        );
      default:
        return (
          <div className={styles.stepContent}>
            <h3>{activeStep}</h3>
            <p>
              Form fields for {activeStep} will be dynamically loaded from
              lookup configuration.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>IT Declaration</h1>
        <div className={styles.metaInfo}>
          <div className={styles.infoBox}>
            <label>Declaration Type</label>
            <span>{draftItem?.DeclarationType || "Planned"}</span>
          </div>
          <div className={styles.infoBox}>
            <label>Financial Year</label>
            <span>2025 - 2026</span>
          </div>
        </div>
      </div>

      <ITStepper
        steps={steps}
        activeStep={activeStep}
        onStepClick={setActiveStep}
      />

      <div className={styles.stepContent}>
        {renderCurrentStep()}

        <div className={styles.footerActions}>
          <ActionButton
            variant="collapse"
            label="Cancel"
            onClick={() => navigate("/submittedDeclarations")}
            style={{
              minWidth: "120px",
              background: "white",
              color: "#64748b",
              border: "1px solid #e2e8f0",
            }}
          />
          <div style={{ display: "flex", gap: "12px" }}>
            {activeStep !== "Home" && (
              <ActionButton
                variant="expand"
                label="Previous"
                onClick={() => {
                  const idx = steps.findIndex((s) => s.key === activeStep);
                  if (idx > 0) setActiveStep(steps[idx - 1].key);
                }}
                style={{
                  minWidth: "120px",
                  background: "white",
                  color: "#3d4db7",
                  border: "1px solid #3d4db7",
                }}
              />
            )}
            <ActionButton
              variant="save"
              className="primaryBtn"
              label={
                activeStep === "Declaration & Summary"
                  ? "Submit"
                  : "Save & Continue"
              }
              onClick={() => {
                const idx = steps.findIndex((s) => s.key === activeStep);
                if (idx < steps.length - 1) {
                  setActiveStep(steps[idx + 1].key);
                } else {
                  console.log("Submitting...");
                }
              }}
              style={{
                minWidth: "160px",
                background: "#3d4db7",
                color: "white",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITDeclaration;
