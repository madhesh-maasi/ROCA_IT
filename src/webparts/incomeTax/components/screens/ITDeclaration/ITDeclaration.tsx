import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  selectSelectedItem,
  setSelectedItem,
} from "../../../../../store/slices/incomeTaxSlice";
import { selectEmployees } from "../../../../../store/slices/employeeSlice";
import {
  getListItems,
  getMyPlannedDeclaration,
  getMyActualDeclaration,
  getRelatedListItems,
  getFieldChoices,
  upsertRelatedListBatch,
  updateListItem,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import {
  curFinanicalYear,
  getPreviousFinancialYear,
} from "../../../../../common/utils/functions";
import {
  ActionButton,
  StatusPopup,
  StatusPopupType,
} from "../../../../../CommonInputComponents";
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
import TaxRegimePopup from "../SubmittedDeclarations/TaxRegimePopup";
import styles from "./ITDeclaration.module.scss";
import { Toast as PrimeToast } from "primereact/toast";
import { AppToast, showToast, Loader } from "../../../../../common/components";
import { useRef } from "react";
import { validatePAN } from "../../../../../common/utils/validationUtils";
import {
  sendApprovalEmail,
  sendReworkEmail,
  sendReopenEmail,
} from "../../../../../common/utils/emailService";

// ── Mapping section names to icons ───────────────────────────────
const ICON_MAP: Record<string, any> = {
  Home: Home01Icon,
  "Basic Information": UserAccountIcon,
  "House Rental": Building06Icon,
  LTA: PlaneIcon,
  "Section 80C Deductions": ChartBarLineIcon,
  "Section 80 Deductions": ChartBarLineIcon,
  "Housing Loan Repayment": MoneyReceiveCircleIcon,
  "Previous Employer Details": Building02Icon,
  "Declaration & Summary": CheckmarkBadge01Icon,
};

const ITDeclaration: React.FC = () => {
  const toast = useRef<PrimeToast>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserDetails);
  const userRole = useAppSelector((state: any) => state.user.role);
  const employeeMaster = useAppSelector(selectEmployees);

  const [declarationItem, setDeclarationItem] = React.useState<any>(null);
  const [activeStep, setActiveStep] = React.useState("Home");
  const [steps, setSteps] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showRegimePopup, setShowRegimePopup] = React.useState(false);
  const [isSubmittingRegime, setIsSubmittingRegime] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);

  const matchedEmployee = React.useMemo(() => {
    if (!employeeMaster.length) return null;
    const targetEmail = declarationItem?.EmployeeEmail || user?.Email;
    if (!targetEmail) return null;

    return (
      employeeMaster.find((e) => e.Email === targetEmail) ||
      employeeMaster.find((e) => user && e.EmployeeId === user.LoginName) ||
      null
    );
  }, [user, employeeMaster, declarationItem]);

  const isAdmin = userRole === "FinanceApprover";

  const status = declarationItem?.Status || "Draft";
  const isFormReadOnly =
    (status === "Submitted" || status === "Approved") && !isEditMode;

  // Form States
  const [pan, setPan] = React.useState("");
  const [mobile, setMobile] = React.useState(matchedEmployee?.PhoneNo || "");
  const [rentDetails, setRentDetails] = React.useState<any[]>([
    { month: "April", isMetro: true, city: "", rent: "" },
    { month: "May", isMetro: true, city: "", rent: "" },
    { month: "June", isMetro: true, city: "", rent: "" },
    { month: "July", isMetro: true, city: "", rent: "" },
    { month: "August", isMetro: true, city: "", rent: "" },
    { month: "September", isMetro: true, city: "", rent: "" },
    { month: "October", isMetro: true, city: "", rent: "" },
    { month: "November", isMetro: true, city: "", rent: "" },
    { month: "December", isMetro: true, city: "", rent: "" },
    { month: "January", isMetro: true, city: "", rent: "" },
    { month: "February", isMetro: true, city: "", rent: "" },
    { month: "March", isMetro: true, city: "", rent: "" },
  ]);
  const [landlords, setLandlords] = React.useState<any[]>([
    { name: "", pan: "", address: "" },
  ]);
  const [ltaData, setLtaData] = React.useState({
    exemptionAmount: "",
    journeyStartDate: new Date(),
    journeyEndDate: new Date(),
    journeyStartPlace: "",
    journeyDestination: "",
    modeOfTravel: "",
    classOfTravel: "",
    ticketNumbers: "",
    lastClaimedYear: "",
  });
  const [coTravellers, setCoTravellers] = React.useState<any[]>([
    { relationship: "Spouse", name: "", dob: null, gender: "" },
    { relationship: "Child 1", name: "", dob: null, gender: "" },
    { relationship: "Child 2", name: "", dob: null, gender: "" },
    { relationship: "Dependent Father", name: "", dob: null, gender: "Male" },
    { relationship: "Dependent Mother", name: "", dob: null, gender: "Female" },
  ]);
  const [items80C, setItems80C] = React.useState<any[]>([]);
  const [items80D, setItems80D] = React.useState<any[]>([]);
  const [housingLoanData, setHousingLoanData] = React.useState({
    propertyType: "None" as "None" | "Self Occupied" | "Let Out Property",
    interestAmount: "",
    finalLettableValue: "",
    letOutInterestAmount: "",
    otherDeductionsUs24: "",
    lenderName: "",
    lenderAddress: "",
    lenderPan: "",
    lenderType: "",
    isJointlyAvailed: "",
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
    date: new Date().toLocaleDateString("en-IN"),
  });

  const [commentsHR, setCommentsHR] = React.useState("");
  const [commentsLTA, setCommentsLTA] = React.useState("");
  const [comments80C, setComments80C] = React.useState("");
  const [comments80D, setComments80D] = React.useState("");
  const [commentsPE, setCommentsPE] = React.useState("");
  const [commentsHousingLoan, setCommentsHousingLoan] = React.useState("");
  const [commentsSummary, setCommentsSummary] = React.useState("");
  const [showPopup, setShowPopup] = React.useState<{
    visible: boolean;
    type: StatusPopupType;
    description?: string;
    onConfirm?: () => void;
  }>({ visible: false, type: "success" });

  const [maxAmount80C, setMaxAmount80C] = React.useState<number>(150000);
  const [maxAmount80D, setMaxAmount80D] = React.useState<number>(50000);
  const [modeOfTravelChoices, setModeOfTravelChoices] = React.useState<any[]>(
    [],
  );

  const selectedItemFromStore = useAppSelector(selectSelectedItem);

  // Reset edit mode when step changes
  React.useEffect(() => {
    setIsEditMode(false);
  }, [activeStep]);

  // Initial Load & Regime Check
  React.useEffect(() => {
    const initialize = async () => {
      if (!user?.Email) return;
      setIsLoading(true);

      try {
        const modes = await getFieldChoices(LIST_NAMES.IT_LTA, "ModeOfTravel");
        setModeOfTravelChoices(modes.map((m) => ({ label: m, value: m })));
      } catch (err) {
        console.error("Error loading choices", err);
      }

      const currentFY = curFinanicalYear;
      // If Admin navigates from Employee screen, we use the selected Item context
      let item = selectedItemFromStore ? { ...selectedItemFromStore } : null;

      if (!item) {
        item = await getMyPlannedDeclaration(user.Email, currentFY);
      }
      setDeclarationItem(item);

      const isSubmittingReview =
        item?.Status === "Submitted" || item?.Status === "Approved";

      if (
        !item?.TaxRegime &&
        item?.DeclarationType == "Planned" &&
        !isSubmittingReview
      ) {
        setShowRegimePopup(true);
      } else if (item?.TaxRegime) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await loadDynamicSteps(item.TaxRegime);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await loadSavedData(item);
      }
      setIsLoading(false);
    };
    void initialize();

    return () => {
      // Clear selected item on unmount
      dispatch(setSelectedItem(undefined));
    };
  }, [user, selectedItemFromStore]);

  const loadDynamicSteps = async (regime: string) => {
    try {
      const sections = await getListItems(LIST_NAMES.SECTION_CONFIG);
      const dynamicSteps = sections.map((s: any) => ({
        key: s.Title,
        label: s.Title,
        icon: ICON_MAP[s.Title] || ChartBarLineIcon,
      }));

      if (regime === "New Regime") {
        setSteps([
          { key: "Home", label: "Home", icon: Home01Icon },
          {
            key: "Basic Information",
            label: "Basic Information",
            icon: UserAccountIcon,
          },
          {
            key: "Declaration & Summary",
            label: "Declaration & Summary",
            icon: CheckmarkBadge01Icon,
          },
        ]);
      } else {
        setSteps([
          { key: "Home", label: "Home", icon: Home01Icon },
          {
            key: "Basic Information",
            label: "Basic Information",
            icon: UserAccountIcon,
          },
          { key: "House Rental", label: "House Rental", icon: Building06Icon },
          { key: "LTA", label: "LTA", icon: PlaneIcon },
          ...dynamicSteps
            .filter((s) =>
              [
                "Section 80C Deductions",
                "Section 80 Deductions",
                "Housing Loan Repayment",
              ].includes(s.key),
            )
            .map((s: any) => {
              return {
                key: s.key,
                label: s.key,
                icon:
                  s.key === "Section 80C Deductions" ||
                  s.key === "Section 80 Deductions"
                    ? ChartBarLineIcon
                    : s.key === "Housing Loan Repayment"
                      ? MoneyReceiveCircleIcon
                      : ChartBarLineIcon,
              };
            }),
          // {
          //   key: "Section 80C Deductions",
          //   label: "Section 80C Deductions",
          //   icon: ChartBarLineIcon,
          // },
          // {
          //   key: "Section 80 Deductions",
          //   label: "Section 80 Deductions",
          //   icon: ChartBarLineIcon,
          // },
          // {
          //   key: "Housing Loan Repayment",
          //   label: "Housing Loan Repayment",
          //   icon: MoneyReceiveCircleIcon,
          // },

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

        if (section80C?.MaxAmount)
          setMaxAmount80C(Number(section80C.MaxAmount));
        if (section80D?.MaxAmount)
          setMaxAmount80D(Number(section80D.MaxAmount));

        const cItems = lookupConfig
          .filter((item: any) => item.SectionId === section80C?.Id)
          .map((item: any) => ({
            id: item.Id,
            investmentType: item.Types || item.Title,
            maxAmount: Number(item.MaxAmount) || 0,
            declaredAmount: "",
          }));
        setItems80C(cItems);

        const dItems = lookupConfig
          .filter((item: any) => item.SectionId === section80D?.Id)
          .map((item: any) => ({
            id: item.Id,
            section: item.SubSection || "80D",
            investmentType: item.Types || item.Title,
            maxAmount: Number(item.MaxAmount) || 0,
            declaredAmount: "",
          }));
        setItems80D(dItems);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSavedData = async (mainItem: any) => {
    let panToSet = mainItem.PAN || "";

    // If PAN is empty, try to fetch from previous year
    if (!panToSet && user?.Email) {
      const prevFY = getPreviousFinancialYear(
        mainItem.FinancialYear || curFinanicalYear,
      );
      if (prevFY) {
        // Try Planned if Actual not found/has no PAN
        const prevPlanned = await getMyPlannedDeclaration(user.Email, prevFY);
        if (prevPlanned?.PAN) {
          panToSet = prevPlanned.PAN;
        }
      }
    }

    setPan(panToSet);
    setMobile(mobile);
    setActiveStep(mainItem.ActiveStep || "Home");
    setDeclarationAgreement({
      agreed: mainItem.IsAcknowledged,
      place: mainItem.Place || "",
      date: mainItem.SubmittedDate
        ? new Date(mainItem.SubmittedDate).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN"),
    });
    if (mainItem.RentDetailsJSON) {
      try {
        setRentDetails(JSON.parse(mainItem.RentDetailsJSON));
      } catch (e) {}
    } else {
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
    }

    const relationships = [
      "Spouse",
      "Child 1",
      "Child 2",
      "Dependent Father",
      "Dependent Mother",
    ];
    const defaultCoTravellers = relationships.map((r) => ({
      relationship: r,
      name: "",
      dob: null,
      gender: "",
    }));
    setCoTravellers(defaultCoTravellers);

    // Load Landlords
    const savedLandlords = await getRelatedListItems(
      LIST_NAMES.IT_LANDLORD_DETAILS,
      mainItem.Id,
    );
    if (savedLandlords.length > 0) {
      setLandlords(
        savedLandlords.map((ll) => ({
          Id: ll.Id,
          name: ll.Title,
          pan: ll.PAN,
          address: ll.Address,
        })),
      );
    }

    // Load LTA
    const savedLta = await getRelatedListItems(LIST_NAMES.IT_LTA, mainItem.Id);
    if (savedLta.length > 0) {
      const claim = savedLta[0];
      setLtaData({
        ...ltaData,
        exemptionAmount: claim.ExemptionAmount?.toString() || "",
        journeyStartDate: new Date(claim.JourneyStartDate) || null,
        journeyEndDate: new Date(claim.JourneyEndDate) || null,
        journeyStartPlace: claim.StartPlace || "",
        journeyDestination: claim.Destination || "",
        modeOfTravel: claim.ModeOfTravel || "",
        classOfTravel: claim.ClassOfTravel || "",
        ticketNumbers: claim.TicketNumbers || "",
        lastClaimedYear: claim.LastLTAYear || "",
      });
      if (claim.COTravellerJSON) {
        try {
          setCoTravellers(JSON.parse(claim.COTravellerJSON));
        } catch (e) {}
      }
    }

    // Load Housing Loan
    const savedHL = await getRelatedListItems(
      LIST_NAMES.IT_HOUSING_LOAN,
      mainItem.Id,
    );
    if (savedHL.length > 0) {
      const hl = savedHL[0];
      setHousingLoanData({
        ...housingLoanData,
        propertyType: hl.PropertyType || "None",
        interestAmount: hl.Interest?.toString() || "",
        lenderName: hl.LenderName || "",
        lenderAddress: hl.LenderAddress || "",
        lenderPan: hl.PANofLender || "",
        lenderType: hl.LenderType || "",
        isJointlyAvailed: hl.IsJointlyAvailedPropertyLoan || false,
        finalLettableValue: hl.FinalLettableValue?.toString() || "",
        letOutInterestAmount: hl.LetOutInterest?.toString() || "",
        otherDeductionsUs24: hl.OtherDeductions?.toString() || "",
      });
    }

    // Load Previous Employer Details
    const savedPE = await getRelatedListItems(
      LIST_NAMES.IT_PREVIOUS_EMPLOYER,
      mainItem.Id,
    );
    if (savedPE.length > 0) {
      const pe = savedPE[0];
      setPreviousEmployerData({
        ...previousEmployerData,
        employerName: pe.Title || "",
        employerPan: pe.EmployeePAN || "",
        employerTan: pe.TAN || "",
        employerAddress: pe.Address || "",
        periodFrom: pe.EmploymentFrom || null,
        periodTo: pe.EmploymentTo || null,
        salaryAfterExemption: pe.SalaryAfterExemptionUS10?.toString() || "",
        pfContribution: pe.PFContribution?.toString() || "",
        vpfContribution: pe.VPF?.toString() || "",
        professionalTax: pe.ProfessionalTax?.toString() || "",
        taxDeductedAtSource: pe.TDS?.toString() || "",
      });
    }

    // Load 80C
    const saved80C = await getRelatedListItems(
      LIST_NAMES.IT_80C_SECTION,
      mainItem.Id,
    );
    if (saved80C.length > 0) {
      setItems80C((prev) =>
        prev.map((item) => {
          const match = saved80C.find((s) => s.TypeOfInvestmentId === item.id);
          return match
            ? { ...item, declaredAmount: match.Amount?.toString() || "" }
            : item;
        }),
      );
    }

    // Load 80D
    const saved80D = await getRelatedListItems(LIST_NAMES.IT_80, mainItem.Id);
    if (saved80D.length > 0) {
      setItems80D((prev) =>
        prev.map((item) => {
          const match = saved80D.find((s) => s.TypeOfInvestmentId === item.id);
          return match
            ? { ...item, declaredAmount: match.Amount?.toString() || "" }
            : item;
        }),
      );
    }

    // Load Approver Comments Map
    const commentSource =
      mainItem.ApproverCommentsJson || mainItem.ApproverComment;
    if (commentSource) {
      try {
        const cMap = JSON.parse(commentSource);
        setCommentsHR(cMap.HouseRental || "");
        setCommentsLTA(cMap.LTA || "");
        setComments80C(cMap.Section80C || "");
        setComments80D(cMap.Section80D || "");
        setCommentsPE(cMap.PreviousEmployer || "");
        setCommentsHousingLoan(cMap.HousingLoan || "");
        setCommentsSummary(cMap.Summary || "");
      } catch (e) {
        console.error("Error parsing Comments JSON", e);
      }
    }
  };

  const handleRegimeSubmit = async (regime: string) => {
    if (!declarationItem) return;
    setIsSubmittingRegime(true);
    try {
      await updateListItem(LIST_NAMES.PLANNED_DECLARATION, declarationItem.Id, {
        TaxRegime: regime,
        Status: "Draft",
      });
      setShowRegimePopup(false);
      setDeclarationItem({ ...declarationItem, TaxRegime: regime });
      await loadDynamicSteps(regime);
      void dispatch(
        fetchIncomeTaxItems({ getItems: () => Promise.resolve([]) }),
      );
    } catch (error) {
      console.error("Error updating tax regime", error);
    } finally {
      setIsSubmittingRegime(false);
    }
  };

  const validateStep = async (stepName: string): Promise<boolean> => {
    let _errMsg: string = "";

    switch (stepName) {
      case "Basic Information":
        if (!pan.trim()) {
          _errMsg = "PAN is required";
        } else if (!validatePAN(pan)) {
          _errMsg = "Invalid PAN format";
        }
        break;

      case "House Rental":
        if (declarationItem.TaxRegime === "Old Regime") {
          const activeLls = landlords.filter((ll) => !ll.isDeleted);
          const isLandlordRequired = rentDetails.some(
            (r) => Number(r.rent) > 8333,
          );
          const isLandlordNameAndAdd = rentDetails.some(
            (r) => Number(r.rent) > 0,
          );

          let filledMonthsIdx = rentDetails
            .map((r, i) => (r.isMetro !== "" && r.isMetro !== null ? i : -1))
            .filter((idx) => idx !== -1);

          if (filledMonthsIdx.length > 0) {
            const minIdx = Math.min(...filledMonthsIdx);
            const maxIdx = Math.max(...filledMonthsIdx);

            for (let i = minIdx; i <= maxIdx; i++) {
              if (rentDetails[i].isMetro === "") {
                _errMsg =
                  "Please ensure continuous month entry for House Rent. Intermediate months cannot be left unfilled.";
                break;
              }
              if (!rentDetails[i].city.trim()) {
                _errMsg = `City is required for ${rentDetails[i].month}`;
                break;
              }
              if (!rentDetails[i].rent.trim()) {
                _errMsg = `Rent is required for ${rentDetails[i].month}`;
                break;
              }
            }
          }

          if (!_errMsg) {
            if (
              isLandlordNameAndAdd &&
              (activeLls.some((ll) => !ll.name?.trim()) ||
                activeLls.some((ll) => !ll.address?.trim()))
            ) {
              if (activeLls.some((ll) => !ll.name?.trim())) {
                _errMsg = "Landlord name is required";
              } else if (activeLls.some((ll) => !ll.address?.trim())) {
                _errMsg = "Tenant address is required";
              }
            } else if (
              isLandlordRequired &&
              activeLls.some((ll) => !ll.pan?.trim())
            ) {
              _errMsg = "Landlord PAN is required";
            } else if (
              isLandlordRequired &&
              activeLls.some((r) => !validatePAN(r.pan?.trim()))
            ) {
              _errMsg = "Invalid Landlord PAN format";
            }
          }
        }
        break;

      case "LTA":
        if (
          declarationItem.TaxRegime === "Old Regime" &&
          Number(ltaData.exemptionAmount) > 0 &&
          (!ltaData.journeyStartDate ||
            !ltaData.journeyEndDate ||
            !ltaData.journeyStartPlace ||
            !ltaData.journeyDestination ||
            !ltaData.modeOfTravel ||
            !ltaData.classOfTravel ||
            !ltaData.ticketNumbers ||
            !ltaData.lastClaimedYear)
        ) {
          if (!ltaData.journeyStartDate) {
            _errMsg = "Journey start date is required";
          } else if (!ltaData.journeyEndDate) {
            _errMsg = "Journey end date is required";
          } else if (ltaData.journeyEndDate < ltaData.journeyStartDate) {
            _errMsg =
              "Journey end date should be greater than journey start date";
          } else if (!ltaData.journeyStartPlace.trim()) {
            _errMsg = "Journey start place is required";
          } else if (!ltaData.journeyDestination.trim()) {
            _errMsg = "Journey destination is required";
          } else if (!ltaData.modeOfTravel) {
            _errMsg = "Mode of travel is required";
          } else if (!ltaData.classOfTravel.trim()) {
            _errMsg = "Class of travel is required";
          } else if (!ltaData.ticketNumbers.trim()) {
            _errMsg = "Ticket number is required";
          } else if (!ltaData.lastClaimedYear) {
            _errMsg = "Last claimed year is required";
          }
        }
        break;

      case "Housing Loan Repayment":
        if (
          declarationItem.TaxRegime === "Old Regime" &&
          housingLoanData.propertyType !== "None" &&
          ((housingLoanData.propertyType === "Let Out Property" &&
            !housingLoanData.finalLettableValue) ||
            !housingLoanData.letOutInterestAmount) &&
          //  ||
          // !housingLoanData.otherDeductionsUs24
          (!housingLoanData.interestAmount ||
            !housingLoanData.lenderName ||
            !housingLoanData.lenderAddress ||
            !housingLoanData.lenderType)
        ) {
          if (housingLoanData.propertyType === "Let Out Property") {
            if (!housingLoanData.finalLettableValue) {
              _errMsg = "Final lettable value is required";
            } else if (!housingLoanData.letOutInterestAmount) {
              _errMsg = "Let out interest amount is required";
            }
            // else if (!housingLoanData.otherDeductionsUs24) {
            //   _errMsg = "Other deductions u/s 24 is required";
            // }
          } else if (!housingLoanData.interestAmount) {
            _errMsg = "Interest amount is required";
          } else if (!housingLoanData.lenderName) {
            _errMsg = "Lender name is required";
          } else if (!housingLoanData.lenderAddress) {
            _errMsg = "Lender address is required";
          } else if (!housingLoanData.lenderPan) {
            _errMsg = "Lender PAN is required";
          } else if (!validatePAN(housingLoanData.lenderPan)) {
            _errMsg = "Invalid Lender PAN format";
          } else if (!housingLoanData.lenderType) {
            _errMsg = "Lender type is required";
          }
        }
        break;

      case "Previous Employer Details":
        if (
          previousEmployerData.employerPan?.trim() &&
          !validatePAN(previousEmployerData.employerPan.trim())
        ) {
          _errMsg = "Invalid Previous Employer PAN format";
        }
        break;

      case "Declaration & Summary":
        if (!declarationAgreement.agreed) {
          _errMsg = "Declaration agreement is not agreed";
        } else if (!declarationAgreement.place.trim()) {
          _errMsg = "Place is required";
        }
        break;
    }

    if (_errMsg) {
      showToast(toast, "error", "Error", _errMsg);
      return true;
    }
    return false;
  };

  const validation = async (): Promise<boolean> => {
    // Check all steps for overall submission validation
    const validationSteps = steps.map((s) => s.key);
    for (const step of validationSteps) {
      const isInvalid = await validateStep(step);
      if (isInvalid) return true;
    }
    return false;
  };
  const handleSaveStep = async (nextStep?: string) => {
    const step = activeStep;
    if (!declarationItem) return;

    try {
      setIsLoading(true);
      const mainId = declarationItem.Id;

      const commentsJSON = JSON.stringify({
        HouseRental: commentsHR,
        LTA: commentsLTA,
        Section80C: comments80C,
        Section80D: comments80D,
        PreviousEmployer: commentsPE,
        HousingLoan: commentsHousingLoan,
      });

      switch (step) {
        case "Basic Information": {
          await updateListItem(LIST_NAMES.PLANNED_DECLARATION, mainId, {
            PAN: pan,
            ApproverCommentsJson: commentsJSON,
            MobileNumber: mobile?.toString(),
            ActiveStep: nextStep || activeStep,
          });
          break;
        }
        case "House Rental": {
          await updateListItem(LIST_NAMES.PLANNED_DECLARATION, mainId, {
            RentDetailsJSON: JSON.stringify(rentDetails),
            ApproverCommentsJson: commentsJSON,
            ActiveStep: nextStep || activeStep,
          });
          await upsertRelatedListBatch(
            LIST_NAMES.IT_LANDLORD_DETAILS,
            mainId,
            landlords,
            (ll) => ({
              Title: ll.name,
              PAN: ll.pan,
              Address: ll.address,
              IsDelete: ll.isDeleted || false,
            }),
          );
          break;
        }

        case "LTA": {
          if (ltaData.exemptionAmount.trim()) {
            await updateListItem(LIST_NAMES.PLANNED_DECLARATION, mainId, {
              ApproverCommentsJson: commentsJSON,
              ActiveStep: nextStep || activeStep,
            });
            await upsertRelatedListBatch(
              LIST_NAMES.IT_LTA,
              mainId,
              [ltaData],
              (lta) => ({
                ExemptionAmount: Number(lta.exemptionAmount || 0),
                JourneyStartDate: lta.journeyStartDate,
                JourneyEndDate: lta.journeyEndDate,
                StartPlace: lta.journeyStartPlace,
                Destination: lta.journeyDestination,
                ModeOfTravel: lta.modeOfTravel,
                ClassOfTravel: lta.classOfTravel,
                TicketNumbers: lta.ticketNumbers,
                LastLTAYear: lta.lastClaimedYear,
                COTravellerJSON: JSON.stringify(coTravellers),
              }),
            );
          }
          break;
        }

        case "Section 80C Deductions": {
          await updateListItem(LIST_NAMES.PLANNED_DECLARATION, mainId, {
            ApproverCommentsJson: commentsJSON,
            ActiveStep: nextStep || activeStep,
          });
          const itemsToSave80C = items80C.filter(
            (i) => Number(i.declaredAmount) > 0,
          );
          await upsertRelatedListBatch(
            LIST_NAMES.IT_80C_SECTION,
            mainId,
            itemsToSave80C,
            (i) => ({
              Title: i.title,
              Amount: Number(i.declaredAmount || 0),
              TypeOfInvestmentId: i.id,
            }),
          );
          break;
        }

        case "Section 80 Deductions": {
          await updateListItem(LIST_NAMES.PLANNED_DECLARATION, mainId, {
            ApproverCommentsJson: commentsJSON,
            ActiveStep: nextStep || activeStep,
          });
          const itemsToSave80D = items80D.filter(
            (i) => Number(i.declaredAmount) > 0,
          );
          await upsertRelatedListBatch(
            LIST_NAMES.IT_80,
            mainId,
            itemsToSave80D,
            (i) => ({
              Title: i.title,
              Amount: Number(i.declaredAmount || 0),
              TypeOfInvestmentId: i.id,
            }),
          );
          break;
        }

        case "Housing Loan Repayment":
          await updateListItem(LIST_NAMES.PLANNED_DECLARATION, mainId, {
            ApproverCommentsJson: commentsJSON,
            ActiveStep: nextStep || activeStep,
          });
          await upsertRelatedListBatch(
            LIST_NAMES.IT_HOUSING_LOAN,
            mainId,
            [housingLoanData],
            (hl) => ({
              PropertyType: hl.propertyType,
              Interest: hl.interestAmount,
              LenderName: hl.lenderName,
              LenderAddress: hl.lenderAddress,
              PANofLender: hl.lenderPan,
              LenderType: hl.lenderType,
              IsJointlyAvailedPropertyLoan: hl.isJointlyAvailed || false,
              FinalLettableValue: hl.finalLettableValue,
              LetOutInterest: hl.letOutInterestAmount,
              OtherDeductions: hl.otherDeductionsUs24,
            }),
          );
          break;

        case "Previous Employer Details": {
          await updateListItem(LIST_NAMES.PLANNED_DECLARATION, mainId, {
            ApproverCommentsJson: commentsJSON,
            ActiveStep: nextStep || activeStep,
          });
          const pe = previousEmployerData;
          await upsertRelatedListBatch(
            LIST_NAMES.IT_PREVIOUS_EMPLOYER,
            mainId,
            [previousEmployerData],
            (pe) => ({
              Title: pe.employerName,
              EmployeePAN: pe.employerPan,
              TAN: pe.employerTan,
              EmploymentFrom: pe.periodFrom,
              EmploymentTo: pe.periodTo,
              SalaryAfterExemptionUS10: pe.salaryAfterExemption,
              PFContribution: pe.pfContribution,
              VPF: pe.vpfContribution,
              ProfessionalTax: pe.professionalTax,
              TDS: pe.taxDeductedAtSource,
              Address: pe.employerAddress,
            }),
          );
          break;
        }
        case "Declaration & Summary":
          await updateListItem(LIST_NAMES.PLANNED_DECLARATION, mainId, {
            ApproverCommentsJson: commentsJSON,
            ActiveStep: nextStep || activeStep,
          });
          break;
      }
    } catch (err) {
      console.error("Error saving step", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!declarationItem) return;
    try {
      setIsLoading(true);
      const commentsJSON = JSON.stringify({
        HouseRental: commentsHR,
        LTA: commentsLTA,
        Section80C: comments80C,
        Section80D: comments80D,
        PreviousEmployer: commentsPE,
        HousingLoan: commentsHousingLoan,
        Summary: commentsSummary,
      });

      if (newStatus === "Rework" && !commentsSummary.trim()) {
        showToast(
          toast,
          "error",
          "Error",
          "Approver comment is mandatory for Rework.",
        );
        return;
      }

      let _res: any = {
        Status: newStatus,
        ApproverCommentsJson: commentsJSON,
      };

      if (newStatus == "Rework") {
        _res = {
          ..._res,
          IsAcknowledged: false,
          Place: null,
          SubmittedDate: null,
        };
      }

      await updateListItem(
        LIST_NAMES.PLANNED_DECLARATION,
        declarationItem.Id,
        _res,
      );

      // Send email notification
      const empEmail =
        declarationItem.EmployeeEmail || matchedEmployee?.Email || "";
      const empName =
        declarationItem.EmployeeName ||
        matchedEmployee?.Title ||
        matchedEmployee?.Name ||
        "";
      const empId =
        declarationItem.EmployeeCode || matchedEmployee?.EmployeeId || "";
      const fy = declarationItem.FinancialYear || "";

      if (newStatus === "Approved" && empEmail) {
        void sendApprovalEmail(
          empName,
          empId,
          empEmail,
          "Planned",
          fy,
          user!,
          declarationItem.Title,
        );
      } else if (newStatus === "Rework" && empEmail) {
        void sendReworkEmail(
          empName,
          empId,
          empEmail,
          "Planned",
          fy,
          declarationItem.Title,
          user!,
          commentsSummary,
        );
      } else if (newStatus === "Draft" && empEmail) {
        void sendReopenEmail(
          empName,
          empId,
          empEmail,
          "Planned",
          fy,
          user!,
          declarationItem.Title,
        );
      }

      setShowPopup({
        visible: true,
        type: "success",
        description: `${newStatus == "Draft" ? "Reopened" : newStatus} successfully.`,
      });

      // Wait 3 seconds then navigate back
      setTimeout(() => {
        setShowPopup((prev) => ({ ...prev, visible: false }));
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        handleNavigateBack();
      }, 3000);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateBack = () => {
    const returnUrl = location.state?.from
      ? "/" + location.state.from
      : "/submittedDeclarations";
    navigate(returnUrl, { state: { tab: location.state?.tab } });
  };

  const renderCurrentStep = () => {
    const readOnly =
      isFormReadOnly || (isAdmin && status === "Submitted" && !isEditMode);
    switch (activeStep) {
      case "Home":
        return (
          <HomeStep
            declarationType={declarationItem?.DeclarationType || "-"}
            financialYear={declarationItem?.FinancialYear || "-"}
            taxRegime={declarationItem?.TaxRegime || "-"}
          />
        );
      case "Basic Information":
        return (
          <BasicInfoStep
            employeeData={{
              code: matchedEmployee?.EmployeeId || "N/A",
              name:
                matchedEmployee?.Title ||
                matchedEmployee?.Name ||
                user?.Title ||
                "User",
              location: matchedEmployee?.Location || "-",
              doj: matchedEmployee?.DOJ || "-",
              email: matchedEmployee?.Email || user?.Email || "",
              // mobile: matchedEmployee?.PhoneNo || "-",
              mobile: mobile || "-",
            }}
            mobile={mobile}
            onMobileChange={setMobile}
            pan={pan}
            onPanChange={setPan}
            readOnly={readOnly}
          />
        );
      case "House Rental":
        return (
          <HouseRentalStep
            rentDetails={rentDetails}
            landlords={landlords}
            onRentChange={(idx, field, val) => {
              // if (field === "isMetro" && (val === "" || val === null)) {
              //   const newDetails = rentDetails.map((item, i) => {
              //     if (i >= idx) {
              //       return { ...item, isMetro: "", city: "", rent: "" };
              //     }
              //     return item;
              //   });
              //   setRentDetails(newDetails);
              // }4
              if (field == "isMetro") {
                const newDetails = rentDetails.map((item, i) => {
                  if (i >= idx) {
                    return { ...item, isMetro: val, city: "", rent: "" };
                  }
                  return item;
                });
                setRentDetails(newDetails);
              } else {
                const newDetails = [...rentDetails];
                newDetails[idx] = { ...newDetails[idx], [field]: val };
                setRentDetails(newDetails);
              }
            }}
            onLandlordChange={(idx, field, val) => {
              const newLls = [...landlords];
              newLls[idx] = { ...newLls[idx], [field]: val };
              setLandlords(newLls);
            }}
            onAddLandlord={() =>
              setLandlords([...landlords, { name: "", pan: "", address: "" }])
            }
            onDeleteLandlord={(idx) => {
              const newLls = [...landlords];
              newLls[idx].isDeleted = true;
              setLandlords(newLls);
            }}
            showApproverComments={
              (isAdmin && status == "Submitted") ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={commentsHR}
            onCommentChange={setCommentsHR}
            status={status}
            readOnly={readOnly}
          />
        );
      case "LTA":
        return (
          <LTAStep
            ltaData={ltaData}
            modeOptions={modeOfTravelChoices}
            coTravellers={coTravellers}
            onLtaChange={(field, val) => {
              if (field === "exemptionAmount" && (val === "" || val === "0")) {
                setLtaData({
                  exemptionAmount: val,
                  journeyStartDate: new Date(),
                  journeyEndDate: new Date(),
                  journeyStartPlace: "",
                  journeyDestination: "",
                  modeOfTravel: "",
                  classOfTravel: "",
                  ticketNumbers: "",
                  lastClaimedYear: "",
                });
                setCoTravellers((prev) =>
                  prev.map((ct) => ({
                    ...ct,
                    name: "",
                    dob: null,
                    gender:
                      ct.relationship === "Dependent Father"
                        ? "Male"
                        : ct.relationship === "Dependent Mother"
                          ? "Female"
                          : "",
                  })),
                );
              } else {
                setLtaData((prev) => ({ ...prev, [field]: val }));
              }
            }}
            onCoTravellerChange={(idx, field, val) => {
              const newCo = [...coTravellers];
              newCo[idx] = { ...newCo[idx], [field]: val };
              setCoTravellers(newCo);
            }}
            showApproverComments={
              (isAdmin && status == "Submitted") ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={commentsLTA}
            onCommentChange={setCommentsLTA}
            status={status}
            readOnly={readOnly}
          />
        );
      case "Section 80C Deductions":
        return (
          <Section80CStep
            items={items80C}
            sectionMaxAmount={maxAmount80C}
            onAmountChange={(id, val) => {
              const newItems = [...items80C];
              const idx = newItems.findIndex((i) => i.id === id);
              if (idx > -1) {
                newItems[idx].declaredAmount = val;
                setItems80C(newItems);
              }
            }}
            showApproverComments={
              (isAdmin && status == "Submitted") ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={comments80C}
            onCommentChange={setComments80C}
            status={status}
            readOnly={readOnly}
          />
        );
      case "Section 80 Deductions":
        return (
          <Section80DStep
            items={items80D}
            sectionMaxAmount={maxAmount80D}
            showApproverComments={
              (isAdmin && status == "Submitted") ||
              status == "Approved" ||
              status == "Rework"
            }
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
            status={status}
            readOnly={readOnly}
          />
        );
      case "Housing Loan Repayment":
        return (
          <HousingLoanStep
            data={housingLoanData}
            onChange={(field, val) =>
              setHousingLoanData((prev) => ({ ...prev, [field]: val }))
            }
            showApproverComments={
              (isAdmin && status == "Submitted") ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={commentsHousingLoan}
            onCommentChange={setCommentsHousingLoan}
            status={status}
            readOnly={readOnly}
          />
        );
      case "Previous Employer Details":
        return (
          <PreviousEmployerStep
            data={previousEmployerData}
            onChange={(field, val) =>
              setPreviousEmployerData((prev) => ({ ...prev, [field]: val }))
            }
            showApproverComments={
              (isAdmin && status == "Submitted") ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={commentsPE}
            onCommentChange={setCommentsPE}
            status={status}
            readOnly={readOnly}
          />
        );
      case "Declaration & Summary":
        return (
          <SummaryStep
            employeeInfo={{
              fy: declarationItem?.FinancialYear || "2025 - 2026",
              code: matchedEmployee?.EmployeeId || "N/A",
              name: user?.Title || "User",
              pan: pan,
              doj: matchedEmployee?.DOJ || "-",
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
              section80D: items80D
                .reduce(
                  (acc, curr) => acc + Number(curr.declaredAmount || 0),
                  0,
                )
                .toLocaleString(),
            }}
            declaration={declarationAgreement}
            onDeclarationChange={(field: "agreed" | "place", val: any) =>
              setDeclarationAgreement((prev) => ({ ...prev, [field]: val }))
            }
            onSaveAsDraft={() => console.log("Saving draft...")}
            onSubmit={() => console.log("Submitting...")}
            readOnly={readOnly}
            taxRegime={declarationItem?.TaxRegime}
            showApproverComments={
              (isAdmin && status == "Submitted") ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={commentsSummary}
            onCommentChange={setCommentsSummary}
            status={status}
          />
        );
      default:
        return (
          <div
          // className={styles.stepContent}
          >
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
      <AppToast toastRef={toast} />
      {isLoading && <Loader label="Loading declaration details..." />}

      <StatusPopup
        visible={showPopup.visible}
        onHide={() => {
          setShowPopup({ ...showPopup, visible: false });
          if (
            showPopup.type === "success" ||
            showPopup.type === "download" ||
            showPopup.type === "extend"
          ) {
            handleNavigateBack();
          }
        }}
        type={showPopup.type}
        description={showPopup.description}
        onConfirm={showPopup.onConfirm}
      />

      <TaxRegimePopup
        visible={showRegimePopup}
        onHide={() => {
          setShowRegimePopup(false);
          handleNavigateBack();
        }} // Block closing without selection
        onSubmit={handleRegimeSubmit}
        isLoading={isSubmittingRegime}
      />

      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1>IT Declaration</h1>
          <div className={styles.declarationTag}>
            {declarationItem?.DeclarationType || "Planned"} (
            {declarationItem?.FinancialYear || curFinanicalYear})
          </div>
        </div>

        {!showRegimePopup && steps.length > 0 && (
          <>
            <ITStepper
              steps={steps}
              activeStep={activeStep}
              onStepClick={async (key) => {
                const lastsaveIdx = steps.findIndex(
                  (s) => s.key === declarationItem.ActiveStep,
                );
                const idx = steps.findIndex((s) => s.key === key);
                if (idx > lastsaveIdx) {
                  const isInvalid = await validateStep(activeStep);
                  if (isInvalid) return;
                  await handleSaveStep(key);
                }
                setActiveStep(key);
                setIsEditMode(false);
              }}
            />

            <div>{renderCurrentStep()}</div>
          </>
        )}
      </div>

      {!showRegimePopup && steps.length > 0 && (
        <div className={styles.footerActions}>
          <ActionButton
            variant="cancel"
            label="Cancel"
            icon=""
            onClick={() => {
              const returnUrl = location.state?.from
                ? "/" + location.state.from
                : "/submittedDeclarations";
              navigate(returnUrl, { state: { tab: location.state?.tab } });
            }}
            style={{
              background: "#fff",
              border: "1px solid #94a3b8",
              color: "#94a3b8",
              fontWeight: 500,
              fontSize: "13px",
              padding: "6px 16px",
              boxShadow: "none",
            }}
          />
          <div style={{ display: "flex", gap: "12px" }}>
            {activeStep !== "Home" && (
              <ActionButton
                variant="continue"
                label="Previous"
                onClick={async () => {
                  const idx = steps.findIndex((s) => s.key === activeStep);
                  if (idx > 0) {
                    const prevStep = steps[idx - 1].key;
                    await handleSaveStep(prevStep);
                    setActiveStep(prevStep);
                    setIsEditMode(false);
                  }
                }}
                style={{
                  background: "white",
                  color: "#307a8a",
                  border: "1px solid #307a8a",
                }}
              />
            )}
            {/* Workflow Buttons */}
            {isAdmin &&
              status === "Submitted" &&
              activeStep === "Declaration & Summary" && (
                <>
                  <ActionButton
                    variant="rework"
                    label="Rework"
                    onClick={() => {
                      if (!commentsSummary.trim()) {
                        showToast(
                          toast,
                          "error",
                          "Error",
                          "Approver comment is mandatory for Rework.",
                        );
                        return;
                      }
                      setShowPopup({
                        visible: true,
                        type: "rework",
                        onConfirm: () => handleStatusUpdate("Rework"),
                      });
                    }}
                  />
                  <ActionButton
                    variant="approve"
                    label="Approve"
                    onClick={async () => {
                      const isValid = await validation();
                      if (isValid) return;
                      setShowPopup({
                        visible: true,
                        type: "approve",
                        onConfirm: () => handleStatusUpdate("Approved"),
                      });
                    }}
                  />
                </>
              )}

            {isAdmin &&
              status == "Approved" &&
              activeStep == "Declaration & Summary" &&
              !declarationItem?.IsExported && (
                <ActionButton
                  variant="cancel"
                  label="Reopen"
                  onClick={() => handleStatusUpdate("Draft")}
                />
              )}

            {/* {activeStep === "Declaration & Summary" && (
              <ActionButton
                variant="continue"
                label="Preview Form"
                icon="pi pi-eye"
                onClick={() => setShowPreview(true)}
                style={{
                  background: "white",
                  color: "#307a8a",
                  border: "1px solid #307a8a",
                }}
              />
            )} */}

            {/* Edit Button */}
            {isAdmin &&
              status === "Submitted" &&
              declarationItem?.TaxRegime == "Old Regime" &&
              !isEditMode &&
              activeStep !== "Declaration & Summary" &&
              activeStep !== "Home" && (
                <ActionButton
                  variant="continue"
                  label="Edit"
                  style={{
                    background: "white",
                    color: "#307a8a",
                    border: "1px solid #307a8a",
                  }}
                  onClick={() => setIsEditMode(true)}
                />
              )}

            {/* Next Button for Admin (Reviews) */}
            {(status === "Approved" || status === "Submitted") &&
              activeStep !== "Declaration & Summary" &&
              !isEditMode && (
                <ActionButton
                  variant="continue"
                  label="Next"
                  onClick={async () => {
                    const idx = steps.findIndex((s) => s.key === activeStep);

                    if (idx !== -1 && idx < steps.length - 1) {
                      await handleSaveStep();
                      setActiveStep(steps[idx + 1].key);
                    }
                  }}
                  style={{
                    background: "white",
                    color: "#307a8a",
                    border: "1px solid #307a8a",
                  }}
                />
              )}

            {!isFormReadOnly && activeStep !== "Declaration & Summary" && (
              <ActionButton
                variant="draft"
                className="primaryBtn"
                label={"Draft"}
                onClick={async () => {
                  const idx = steps.findIndex((s) => s.key === activeStep);
                  if (idx < steps.length - 1) {
                    await handleSaveStep();
                    if (userRole == "Admins") {
                      navigate("/employeeDeclaration", {
                        state: { tab: location.state?.tab },
                      });
                    } else {
                      navigate("/submittedDeclarations", {
                        state: { tab: location.state?.tab },
                      });
                    }
                  }
                }}
              />
            )}

            {!isFormReadOnly && (
              <ActionButton
                variant="save"
                label={
                  activeStep === "Declaration & Summary"
                    ? "Submit"
                    : "Save & Continue"
                }
                onClick={async () => {
                  const idx = steps.findIndex((s) => s.key === activeStep);
                  if (idx < steps.length - 1) {
                    const isInvalid = await validateStep(activeStep);
                    if (isInvalid) return;
                    const nextStep = steps[idx + 1].key;
                    await handleSaveStep(nextStep);
                    setActiveStep(nextStep);
                  } else {
                    const isValid = await validation();
                    if (isValid) return;
                    setIsLoading(true);
                    try {
                      if (declarationItem) {
                        await updateListItem(
                          LIST_NAMES.PLANNED_DECLARATION,
                          declarationItem.Id,
                          {
                            Status: "Submitted",
                            IsAcknowledged: declarationAgreement.agreed,
                            Place: declarationAgreement.place,
                            SubmittedDate: new Date().toISOString(),
                            ActiveStep: "",
                          },
                        );
                        setShowPopup({
                          visible: true,
                          type: "success",
                        });

                        // Wait 3 seconds then navigate back
                        setTimeout(() => {
                          setShowPopup((prev) => ({
                            ...prev,
                            visible: false,
                          }));
                          handleNavigateBack();
                        }, 3000);
                      }
                    } catch (error) {
                      console.error("Error submitting declaration", error);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                loading={isLoading}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ITDeclaration;
