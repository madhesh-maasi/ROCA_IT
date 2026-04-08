import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home01Icon,
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
  selectSelectedItem,
  setSelectedItem,
} from "../../../../../store/slices/incomeTaxSlice";
import { selectEmployees } from "../../../../../store/slices/employeeSlice";
import {
  getSP,
  getListItems,
  getRelatedListItems,
  getFieldChoices,
  upsertRelatedListBatch,
  updateListItem,
  addListItemsBatch,
  uploadITDocument,
  getITDocuments,
  addListItem,
  downloadAttachmentsAsZip,
  getAllItems,
  updateListItemsBatch,
  getMyPlannedDeclaration,
  getMyActualDeclaration,
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
import DynamicSectionStep from "../ITDeclaration/steps/DynamicSectionStep";
import HousingLoanStep from "./steps/HousingLoanStep";
import PreviousEmployerStep from "./steps/PreviousEmployerStep";
import SummaryStep from "./steps/SummaryStep";
import styles from "./ITDeclaration.module.scss";
import { Toast as PrimeToast } from "primereact/toast";
import { AppToast, showToast, Loader } from "../../../../../common/components";
import { useRef } from "react";
import { validatePAN } from "../../../../../common/utils/validationUtils";
import TaxRegimePopup from "../SubmittedDeclarations/TaxRegimePopup";
import {
  sendApprovalEmail,
  sendReworkEmail,
  sendReopenEmail,
} from "../../../../../common/utils/emailService";
import moment from "moment";

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
    const targetEmail =
      declarationItem?.EmployeeEmail?.toLowerCase() ||
      user?.Email?.toLowerCase();
    if (!targetEmail) return null;

    return (
      employeeMaster.find((e) => e.Email?.toLowerCase() === targetEmail) || null
    );
  }, [user, employeeMaster, declarationItem]);

  // ── Attachment state removed - now stored in section states

  // const isAdmin = userRole === "Admin" || userRole === "FinanceApprover";
  const isAdmin = userRole === "FinanceApprover";
  const employeeDeclarationPath =
    location.state?.from === "employeeDeclaration";

  const status = declarationItem?.Status || "Draft";
  const isFormReadOnly =
    (status === "Submitted" || status === "Approved") && !isEditMode;

  // Form States
  const [pan, setPan] = React.useState("");
  const [mobile, setMobile] = React.useState(
    declarationItem?.MobileNo || matchedEmployee?.PhoneNo || "",
  );
  const [rentDetails, setRentDetails] = React.useState<any[]>([
    { month: "April", isMetro: null, city: "", rent: "" },
    { month: "May", isMetro: null, city: "", rent: "" },
    { month: "June", isMetro: null, city: "", rent: "" },
    { month: "July", isMetro: null, city: "", rent: "" },
    { month: "August", isMetro: null, city: "", rent: "" },
    { month: "September", isMetro: null, city: "", rent: "" },
    { month: "October", isMetro: null, city: "", rent: "" },
    { month: "November", isMetro: null, city: "", rent: "" },
    { month: "December", isMetro: null, city: "", rent: "" },
    { month: "January", isMetro: null, city: "", rent: "" },
    { month: "February", isMetro: null, city: "", rent: "" },
    { month: "March", isMetro: null, city: "", rent: "" },
  ]);
  const [landlords, setLandlords] = React.useState<any[]>([
    { name: "", pan: "", address: "", attachments: [] },
  ]);
  const [ltaData, setLtaData] = React.useState<any>({
    exemptionAmount: "",
    journeyStartDate: null,
    journeyEndDate: null,
    journeyStartPlace: "",
    journeyDestination: "",
    modeOfTravel: "",
    classOfTravel: "",
    ticketNumbers: "",
    lastClaimedYear: "",
    attachments: [],
  });
  const [coTravellers, setCoTravellers] = React.useState<any[]>([
    { relationship: "Spouse", name: "", dob: null, gender: "" },
    { relationship: "Child 1", name: "", dob: null, gender: "" },
    { relationship: "Child 2", name: "", dob: null, gender: "" },
    { relationship: "Dependent Father", name: "", dob: null, gender: "Male" },
    { relationship: "Dependent Mother", name: "", dob: null, gender: "Female" },
  ]);
  const [dynamicSectionData, setDynamicSectionData] = React.useState<
    Record<string, any[]>
  >({});
  const [dynamicComments, setDynamicComments] = React.useState<
    Record<string, string>
  >({});
  const [sectionMaxAmounts, setSectionMaxAmounts] = React.useState<
    Record<string, number | null>
  >({});
  const [housingLoanData, setHousingLoanData] = React.useState<any>({
    propertyType: "None" as "None" | "Self Occupied" | "Let Out Property",
    interestAmount: "",
    finalLettableValue: "",
    letOutInterestAmount: "",
    otherDeductionsUs24: "",
    lenderName: "",
    lenderAddress: "",
    lenderPan: "",
    lenderType: "",
    isJointlyAvailed: null,
    approverComments: "",
    attachments: [],
    othersAttachments: [],
  });
  const [previousEmployerData, setPreviousEmployerData] = React.useState<any>({
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
    attachments: [],
  });
  const [declarationAgreement, setDeclarationAgreement] = React.useState({
    agreed: false,
    place: "",
    date: moment().format("DD/MM/YYYY"),
  });

  const [commentsHR, setCommentsHR] = React.useState("");
  const [commentsLTA, setCommentsLTA] = React.useState("");
  const [commentsPE, setCommentsPE] = React.useState("");
  const [commentsHousingLoan, setCommentsHousingLoan] = React.useState("");
  const [commentsSummary, setCommentsSummary] = React.useState("");
  const [showPopup, setShowPopup] = React.useState<{
    visible: boolean;
    type: StatusPopupType;
    description?: string;
    onConfirm?: () => void;
  }>({ visible: false, type: "success" });

  const [modeOfTravelChoices, setModeOfTravelChoices] = React.useState<any[]>(
    [],
  );
  const selectedItemFromStore = useAppSelector(selectSelectedItem);

  // Reset edit mode when step changes
  React.useEffect(() => {
    setIsEditMode(false);
  }, [activeStep]);

  React.useEffect(() => {
    const initialize = async () => {
      if (!user?.Email) return;
      setIsLoading(true);

      // ── Load LTA field choices ──────────────────────────────────
      try {
        const [modes] = await Promise.all([
          getFieldChoices(LIST_NAMES.IT_LTA_Actual, "ModeOfTravel"),
        ]);
        setModeOfTravelChoices(modes.map((m) => ({ label: m, value: m })));
      } catch (err) {
        console.error("Error loading choices", err);
      }

      const currentFY = curFinanicalYear;
      const sp = getSP();

      // If Admin navigates from Employee screen, use the selected Item context
      let item: any = selectedItemFromStore
        ? { ...selectedItemFromStore }
        : null;

      const queryParams = new URLSearchParams(location.search);
      const itemIdParam = queryParams.get("itemId");

      if (!item && itemIdParam) {
        try {
          item = await sp.web.lists
            .getByTitle(LIST_NAMES.ACTUAL_DECLARATION)
            .items.getById(parseInt(itemIdParam))
            .select("*")();
        } catch (err) {
          console.error("Error fetching declaration by itemId", err);
        }
      }

      if (!item) {
        // Fetch the user's Actual Declaration for the current FY
        const records = await sp.web.lists
          .getByTitle(LIST_NAMES.ACTUAL_DECLARATION)
          .items.select("*")
          .filter(
            `EmployeeEmail eq '${user.Email}' and FinancialYear eq '${currentFY}' and IsDelete ne 1`,
          )
          .orderBy("Id", false)
          .top(1)();
        item = records[0] || null;
      }

      if (!item) {
        setIsLoading(false);
        return;
      }

      const status = item.Status;
      let regime = item.TaxRegime || "";

      // ── First-open clone logic: run only when the item is in Released status ──
      if (status === "Released") {
        const plannedId: any = (item as any).PlannedDeclarationId || null;

        if (plannedId) {
          try {
            // Attempt to resolve Regime from Planned if not set on Actual
            if (!regime) {
              const plannedItem = await sp.web.lists
                .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
                .items.getById(plannedId)
                .select("TaxRegime")();
              regime = plannedItem?.TaxRegime || "";
            }

            if (regime) {
              // Automatically clone if regime is known from Planned
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              await handleClonePlannedData(item.Id, plannedId, regime);
              // Refresh Actual Declaration after clone
              const refreshed = await sp.web.lists
                .getByTitle(LIST_NAMES.ACTUAL_DECLARATION)
                .items.getById(item.Id)
                .select("*")();
              item = refreshed;
            } else {
              // No regime on Actual OR Planned -> trigger popup
              setShowRegimePopup(true);
              setDeclarationItem(item);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error resolving regime or cloning", e);
            setShowRegimePopup(true);
            setDeclarationItem(item);
            setIsLoading(false);
            return;
          }
        } else {
          if (regime) {
            setDeclarationItem(item);
            setIsLoading(false);
          } else {
            setShowRegimePopup(true);
            setDeclarationItem(item);
            setIsLoading(false);
            return;
          }
        }
      }

      setDeclarationItem(item);

      if (regime) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await loadDynamicSteps(regime, item);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await loadSavedData(item);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await loadAttachments(item);
      }

      setIsLoading(false);
    };
    void initialize();

    return () => {
      dispatch(setSelectedItem(undefined));
    };
  }, [user, selectedItemFromStore]);
  const loadDynamicSteps = async (
    regime: string,
    mainItem?: any,
  ): Promise<{ steps: any[]; sectionData: Record<string, any[]> }> => {
    let computedSteps: any[] = [];
    let computedSectionData: Record<string, any[]> = {};

    try {
      const sectionsRaw = await getListItems(
        LIST_NAMES.SECTION_CONFIG,
        "SectionOrder ne null",
      );
      const sections = [...sectionsRaw].sort(
        (a: any, b: any) => (a.SectionOrder || 0) - (b.SectionOrder || 0),
      );

      if (regime === "New Regime") {
        computedSteps = [
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
        ];
      } else {
        const defaultOldRegimeSteps = [
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
          { key: "LTA", label: "LTA", icon: PlaneIcon },
          ...sections.map((s: any) => ({
            key: s.Title,
            label: s.Title,
            icon: ICON_MAP[s.Title] || ChartBarLineIcon,
            order: s.SectionOrder,
          })),
          {
            key: "Housing Loan Repayment",
            label: "Housing Loan Repayment",
            icon: MoneyReceiveCircleIcon,
          },
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
        ];

        const newMaxAmounts: Record<string, number | null> = {};
        sections.forEach((s: any) => {
          newMaxAmounts[s.Title] = Number(s.MaxAmount) || null;
        });
        setSectionMaxAmounts(newMaxAmounts);

        // If saved SectionDetailsJSON exists, restore section data and steps from it
        if (mainItem?.SectionDetailsJSON) {
          try {
            const savedData = JSON.parse(mainItem.SectionDetailsJSON);

            // Restore steps from stored keys if available, else use defaults
            if (savedData.__steps && Array.isArray(savedData.__steps)) {
              computedSteps = (savedData.__steps as string[]).map(
                (key: string) => ({
                  key,
                  label: key,
                  icon: ICON_MAP[key] || ChartBarLineIcon,
                }),
              );
            } else {
              computedSteps = defaultOldRegimeSteps;
            }

            // Restore section data from JSON (reset attachments for fresh load)
            sections.forEach((s: any) => {
              computedSectionData[s.Title] = (savedData[s.Title] || []).map(
                (item: any) => ({ ...item, attachments: [] }),
              );
            });

            setSteps(computedSteps);
            setDynamicSectionData(computedSectionData);
            return { steps: computedSteps, sectionData: computedSectionData };
          } catch (e) {
            // Fall through to LookupConfig fetch
          }
        }

        // No saved JSON — load initial section data from LookupConfig
        const lookupConfig = await getListItems(
          LIST_NAMES.LOOKUP_CONFIG,
          "",
          "ID",
          true,
        );

        sections.forEach((s: any) => {
          computedSectionData[s.Title] = lookupConfig
            .filter((item: any) => item.SectionId === s.Id)
            .map((item: any) => ({
              id: item.Id,
              section: item.SubSection || "-",
              investmentType: item.Types || item.Title,
              maxAmount: Number(item.MaxAmount) || 0,
              declaredAmount: "",
              attachments: [],
            }));
        });

        computedSteps = defaultOldRegimeSteps;
      }

      setSteps(computedSteps);
      setDynamicSectionData(computedSectionData);
    } catch (err) {
      console.error("Error loading dynamic steps", err);
    }

    return { steps: computedSteps, sectionData: computedSectionData };
  };

  const loadSavedData = async (mainItem: any) => {
    let panToSet = mainItem.PAN || "";

    // If PAN is empty, try to fetch from previous year
    if (!panToSet && user?.Email) {
      const prevFY = getPreviousFinancialYear(
        mainItem.FinancialYear || curFinanicalYear,
      );
      if (prevFY) {
        // Try Actual first
        const prevActual = await getMyActualDeclaration(user.Email, prevFY);
        if (prevActual?.PAN) {
          panToSet = prevActual.PAN;
        }
      }
    }

    setPan(panToSet);
    setMobile(mainItem?.MobileNumber || matchedEmployee?.PhoneNo || "");
    setActiveStep(mainItem.ActiveStep || "Home");
    setDeclarationAgreement({
      agreed: mainItem.IsAcknowledged,
      place: mainItem.Place || "",
      date: mainItem.SubmittedDate
        ? moment(mainItem.SubmittedDate).format("DD/MM/YYYY")
        : moment().format("DD/MM/YYYY"),
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
        months.map((m) => ({ month: m, isMetro: null, city: "", rent: "" })),
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
      LIST_NAMES.IT_LANDLORD_DETAILS_Actual,
      mainItem.Id,
      "ActualDeclarationId",
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
    const savedLta = await getRelatedListItems(
      LIST_NAMES.IT_LTA_Actual,
      mainItem.Id,
      "ActualDeclarationId",
    );
    if (savedLta.length > 0) {
      const claim = savedLta[0];
      setLtaData({
        ...ltaData,
        exemptionAmount: claim.ExemptionAmount?.toString() || "",
        journeyStartDate: claim.JourneyStartDate
          ? new Date(claim.JourneyStartDate)
          : null,
        journeyEndDate: claim.JourneyEndDate
          ? new Date(claim.JourneyEndDate)
          : null,
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
      LIST_NAMES.IT_HOUSING_LOAN_Actual,
      mainItem.Id,
      "ActualDeclarationId",
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
        isJointlyAvailed:
          hl.IsJointlyAvailedPropertyLoan === "Yes" ||
          hl.IsJointlyAvailedPropertyLoan === true
            ? true
            : hl.IsJointlyAvailedPropertyLoan === "No" ||
                hl.IsJointlyAvailedPropertyLoan === false
              ? false
              : null,
        finalLettableValue: hl.FinalLettableValue?.toString() || "",
        letOutInterestAmount: hl.LetOutInterest?.toString() || "",
        otherDeductionsUs24: hl.OtherDeductions?.toString() || "",
      });
    }

    // Load Previous Employer Details
    const savedPE = await getRelatedListItems(
      LIST_NAMES.IT_PREVIOUS_EMPLOYER_Actual,
      mainItem.Id,
      "ActualDeclarationId",
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

    // Load Dynamic Section Data (80C, 80D, and other dynamic sections)
    if (mainItem.SectionDetailsJSON) {
      try {
        const savedSectionData = JSON.parse(mainItem.SectionDetailsJSON);
        setDynamicSectionData((prev) => {
          const merged: Record<string, any[]> = { ...prev };
          Object.keys(savedSectionData)
            .filter((k) => k !== "__steps") // __steps stores step order, not section data
            .forEach((sectionKey) => {
              if (merged[sectionKey]) {
                merged[sectionKey] = merged[sectionKey].map((item: any) => {
                  const match = savedSectionData[sectionKey].find(
                    (s: any) => s.id === item.id,
                  );
                  return match
                    ? { ...item, declaredAmount: match.declaredAmount || "" }
                    : item;
                });
              } else {
                // Section not yet in prev (LookupConfig load pending) —
                // initialize attachments: [] so loadAttachments can populate them
                merged[sectionKey] = savedSectionData[sectionKey].map(
                  (item: any) => ({ ...item, attachments: [] }),
                );
              }
            });
          return merged;
        });
      } catch (e) {
        console.error("Error parsing SectionDetailsJSON", e);
      }
    }

    // Load Approver Comments Map
    const commentSource = mainItem.ApproverCommentsJson;
    if (commentSource) {
      try {
        const cMap = JSON.parse(commentSource);
        setCommentsHR(cMap.HouseRental || "");
        setCommentsLTA(cMap.LTA || "");
        setCommentsPE(cMap.PreviousEmployer || "");
        setCommentsHousingLoan(cMap.HousingLoan || "");
        setCommentsSummary(cMap.Summary || "");
        if (cMap.DynamicComments) {
          setDynamicComments(cMap.DynamicComments);
        } else {
          // Backward compatibility: map old keys to dynamic comment keys
          const legacyDynamic: Record<string, string> = {};
          if (cMap.Section80C)
            legacyDynamic["Section 80C Deductions"] = cMap.Section80C;
          if (cMap.Section80D)
            legacyDynamic["Section 80 Deductions"] = cMap.Section80D;
          setDynamicComments(legacyDynamic);
        }
      } catch (e) {
        console.error("Error parsing Comments JSON", e);
      }
    }
  };

  const loadAttachments = async (mainItem: any) => {
    if (!mainItem?.Id) return;
    const decId: number = mainItem.Id;
    try {
      const allDocs = await getITDocuments(decId);

      // Distribute to Landlords
      setLandlords((prev: any[]) =>
        prev.map((ll) => ({
          ...ll,
          attachments: allDocs.filter((d) => d.LandLordId === ll.Id),
        })),
      );

      // Distribute to LTA
      setLtaData((prev: any) => ({
        ...prev,
        attachments: allDocs.filter((d) =>
          (d.FileRef as string)?.includes("/LTA/"),
        ),
      }));

      // Distribute to Dynamic Sections — match by LookupConfigId stored on each doc
      setDynamicSectionData((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((sectionTitle) => {
          next[sectionTitle] = next[sectionTitle].map((item) => ({
            ...item,
            attachments: allDocs.filter((d) => d.LookupConfigId === item.id),
          }));
        });
        return next;
      });

      // Distribute to Housing Loan
      setHousingLoanData((prev: any) => ({
        ...prev,
        attachments: allDocs.filter(
          (d) =>
            (d.FileRef as string)?.includes("/Housing_Loan_Repayment_Self/") ||
            (d.FileRef as string)?.includes("/Housing_Loan_Repayment_LetOut/"),
        ),
        othersAttachments: allDocs.filter((d) =>
          (d.FileRef as string)?.includes("/Housing_Loan_Repayment_Others/"),
        ),
      }));

      // Distribute to Previous Employer
      setPreviousEmployerData((prev: any) => ({
        ...prev,
        attachments: allDocs.filter((d) =>
          (d.FileRef as string)?.includes("/Previous_Employer_Details/"),
        ),
      }));
    } catch (err) {
      console.error("Error loading attachments", err);
    }
  };

  // ── Upload a file for a given section key ─────────────────────────────────
  const handleUpload = async (key: string, file: File) => {
    if (!declarationItem) return;

    const decId: number = declarationItem.Id;
    const fy: string = declarationItem.FinancialYear || "";
    const empCode: string = matchedEmployee?.EmployeeId || "UNKNOWN";

    if (file.size > 10 * 1024 * 1024) {
      showToast(
        toast,
        "error",
        "File Too Large",
        "Attachment size must be less than 10MB.",
      );
      return;
    }

    let sectionType = "";
    const meta: any = { actualDeclarationId: decId };

    if (key.startsWith("landlord-")) {
      sectionType = "House Rental";
      const idx = Number(key.replace("landlord-", ""));
      let landlord = landlords[idx];

      if (landlord && !landlord.Id) {
        try {
          const newLL = await addListItem(
            LIST_NAMES.IT_LANDLORD_DETAILS_Actual,
            {
              Title: landlord.name,
              PAN: landlord.pan,
              Address: landlord.address,
              ActualDeclarationId: decId,
            },
          );
          const newId = (newLL as any)?.Id || (newLL as any)?.ID;
          if (newId) {
            landlord = { ...landlord, Id: newId };
            setLandlords((prev) =>
              prev.map((l, i) => (i === idx ? { ...l, Id: newId } : l)),
            );
          }
        } catch (saveErr) {
          showToast(
            toast,
            "error",
            "Save Failed",
            "Could not save landlord details.",
          );
          return;
        }
      }
      meta.landLordId = landlord?.Id;
    } else if (key === "lta") {
      sectionType = "LTA";
      meta.ReferenceId = "lta";
    } else if (key === "housing-self") {
      sectionType = "Housing_Loan_Repayment_Self";
      meta.ReferenceId = "housing-self";
    } else if (key === "housing-letout") {
      sectionType = "Housing_Loan_Repayment_LetOut";
      meta.ReferenceId = "housing-letout";
    } else if (key === "housing-others") {
      sectionType = "Housing_Loan_Repayment_Others";
      meta.ReferenceId = "housing-others";
    } else if (key === "prev-employer") {
      sectionType = "Previous_Employer_Details";
      meta.ReferenceId = "prev-employer";
    } else {
      // Dynamic sections — key format: "{sectionTitle}-{item.id}"
      sectionType = activeStep.replace(/\s+/g, "_");
      const lookupConfigId = Number(key.split("-").pop());
      if (!isNaN(lookupConfigId)) {
        meta.lookupConfigId = lookupConfigId;
      }
    }

    try {
      setIsLoading(true);
      await uploadITDocument(fy, empCode, sectionType, file, meta);
      showToast(toast, "success", "Uploaded", "File uploaded successfully.");
      await loadAttachments(declarationItem);
    } catch (err) {
      showToast(toast, "error", "Upload Failed", "Could not upload file.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  type CustomWindow = Window & {
    showSaveFilePicker?: (options?: any) => Promise<any>;
  };

  const customWindow = window as CustomWindow;
  const handleDownloadAll = async () => {
    if (!declarationItem) return;

    let fileHandle: FileSystemFileHandle | null = null;

    try {
      // ✅ MUST be first (user gesture)
      if (customWindow.showSaveFilePicker) {
        fileHandle = await customWindow.showSaveFilePicker({
          suggestedName: `${declarationItem.Title}_${matchedEmployee?.EmployeeId}.zip`,
          types: [
            {
              description: "ZIP Files",
              accept: {
                "application/zip": [".zip"],
              },
            },
          ],
        });
      }
    } catch (err) {
      console.warn("User cancelled file picker");
      return; // stop execution if user cancels
    }

    try {
      setIsLoading(true);

      const fy = declarationItem.FinancialYear;
      const empCode = matchedEmployee?.EmployeeId || "";

      await downloadAttachmentsAsZip(
        declarationItem.Id,
        declarationItem.Title,
        fy,
        empCode,
        fileHandle,
      );

      showToast(
        toast,
        "success",
        "Download Started",
        "Your attachments are being zipped and downloaded.",
      );
    } catch (err) {
      showToast(
        toast,
        "error",
        "Download Failed",
        "Could not download attachments.",
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteAttachment = async (key: string, fileId: number) => {
    try {
      setIsLoading(true);
      await updateListItem(LIST_NAMES.IT_DOCUMENTS, fileId, { IsDelete: true });
      showToast(toast, "success", "Removed", "Attachment removed.");

      if (key.startsWith("landlord-")) {
        const idx = Number(key.replace("landlord-", ""));
        setLandlords((prev) =>
          prev.map((ll, i) =>
            i === idx
              ? {
                  ...ll,
                  attachments: (ll.attachments || []).filter(
                    (f: any) => f.Id !== fileId,
                  ),
                }
              : ll,
          ),
        );
      } else if (key === "lta") {
        setLtaData((prev: any) => ({
          ...prev,
          attachments: (prev.attachments || []).filter(
            (f: any) => f.Id !== fileId,
          ),
        }));
      } else if (key === "housing-self" || key === "housing-letout") {
        setHousingLoanData((prev: any) => ({
          ...prev,
          attachments: (prev.attachments || []).filter(
            (f: any) => f.Id !== fileId,
          ),
        }));
      } else if (key === "housing-others") {
        setHousingLoanData((prev: any) => ({
          ...prev,
          othersAttachments: prev.othersAttachments.filter(
            (f: any) => f.Id !== fileId,
          ),
        }));
      } else if (key === "prev-employer") {
        setPreviousEmployerData((prev: any) => ({
          ...prev,
          attachments: (prev.attachments || []).filter(
            (f: any) => f.Id !== fileId,
          ),
        }));
      } else {
        // Dynamic sections — key is the section title (= activeStep)
        setDynamicSectionData((prev) => {
          const next = { ...prev };
          if (next[key]) {
            next[key] = next[key].map((item) => ({
              ...item,
              attachments: (item.attachments || []).filter(
                (f: any) => (f.Id || f.ID) !== fileId,
              ),
            }));
          }
          return next;
        });
      }
    } catch (err) {
      showToast(toast, "error", "Error", "Could not remove attachment.");
      console.error(err);
    } finally {
      setIsLoading(false);
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

          for (const r of rentDetails) {
            if (
              (r.city.trim() || r.rent.trim()) &&
              (r.isMetro === null || r.isMetro === "")
            ) {
              _errMsg = `Metro/Non-Metro selection is required for ${r.month}`;
              break;
            }
          }
          if (_errMsg) break;

          if (filledMonthsIdx.length > 0) {
            const minIdx = Math.min(...filledMonthsIdx);
            const maxIdx = Math.max(...filledMonthsIdx);

            for (let i = minIdx; i <= maxIdx; i++) {
              if (
                rentDetails[i].isMetro === "" ||
                rentDetails[i].isMetro === null
              ) {
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
              (activeLls.some((ll) => !ll.name) ||
                activeLls.some((ll) => !ll.address))
            ) {
              if (activeLls.some((ll) => !ll.name)) {
                _errMsg = "Landlord name is required";
              } else if (activeLls.some((ll) => !ll.address)) {
                _errMsg = "Tenant address is required";
              }
            } else if (isLandlordRequired && activeLls.some((ll) => !ll.pan)) {
              _errMsg = "Landlord PAN is required";
            } else if (
              isLandlordRequired &&
              activeLls.some((r) => !validatePAN(r.pan?.trim()))
            ) {
              _errMsg = "Invalid Landlord PAN format";
            } else if (
              isLandlordNameAndAdd &&
              (!landlords.length || landlords.every((e) => e.isDeleted))
            ) {
              _errMsg = "Landlord details are required";
            } else if (
              activeLls.some(
                (ll) => !ll.isDeleted && ll.name && !ll.attachments?.length,
              )
            ) {
              _errMsg = "Attachment is mandatory for all active landlords";
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
            (!ltaData.classOfTravel && ltaData.modeOfTravel !== "Others") ||
            (!ltaData.ticketNumbers && ltaData.modeOfTravel !== "Others") ||
            !ltaData.lastClaimedYear ||
            !ltaData.attachments ||
            ltaData.attachments.length === 0)
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
          } else if (
            !ltaData.classOfTravel.trim() &&
            ltaData.modeOfTravel !== "Others"
          ) {
            _errMsg = "Class of travel is required";
          } else if (
            !ltaData.ticketNumbers.trim() &&
            ltaData.modeOfTravel !== "Others"
          ) {
            _errMsg = "Ticket number is required";
          } else if (!ltaData.lastClaimedYear) {
            _errMsg = "Last claimed year is required";
          } else if (!ltaData.attachments || ltaData.attachments.length === 0) {
            _errMsg = "Attachment is mandatory for LTA exemption";
          }
        }
        break;

      case "Housing Loan Repayment":
        if (declarationItem.TaxRegime === "Old Regime") {
          if (
            housingLoanData.propertyType !== "None" &&
            ((housingLoanData.propertyType === "Let Out Property" &&
              !housingLoanData.finalLettableValue) ||
              !housingLoanData.letOutInterestAmount) &&
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

          if (
            !_errMsg &&
            (housingLoanData.propertyType === "Self Occupied" ||
              housingLoanData.propertyType === "Let Out Property") &&
            (!housingLoanData.attachments ||
              housingLoanData.attachments.length === 0)
          ) {
            _errMsg = `Attachment is mandatory for ${housingLoanData.propertyType} Housing Loan`;
          }
          if (
            !_errMsg &&
            housingLoanData.propertyType !== "None" &&
            (housingLoanData.isJointlyAvailed === null ||
              housingLoanData.isJointlyAvailed === "")
          ) {
            _errMsg = "Jointly availed Property Loan selection is required";
          }

          if (
            !_errMsg &&
            housingLoanData.propertyType !== "None" &&
            housingLoanData.isJointlyAvailed === true &&
            (!housingLoanData.othersAttachments ||
              housingLoanData.othersAttachments.length === 0)
          ) {
            _errMsg =
              "Upload PDF is mandatory when Jointly availed Property Loan is Yes";
          }
        }
        break;

      case "Previous Employer Details":
        if (
          previousEmployerData.employerPan &&
          !validatePAN(previousEmployerData.employerPan)
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

      default:
        // Dynamic Sections validation
        if (declarationItem.TaxRegime === "Old Regime") {
          const items = dynamicSectionData[stepName] || [];
          for (const item of items) {
            if (Number(item.declaredAmount) > 0) {
              if (!item.attachments || item.attachments.length === 0) {
                _errMsg = `Attachment is mandatory for ${item.investmentType}`;
                break;
              }
            }
          }
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
    if (!declarationItem) return;
    try {
      setIsLoading(true);
      const mainId = declarationItem.Id;

      const commentsJSON = JSON.stringify({
        HouseRental: commentsHR,
        LTA: commentsLTA,
        DynamicComments: dynamicComments || {},
        PreviousEmployer: commentsPE,
        HousingLoan: commentsHousingLoan,
        Summary: commentsSummary,
      });

      // Common updates for the main record
      const mainUpdate: any = {
        ActiveStep: status === "Draft" ? nextStep || activeStep : activeStep,
        ApproverCommentsJson: commentsJSON,
      };

      // if (status === "Draft") {
      //   const sectionDataToSave: Record<string, any[]> = {};
      //   Object.keys(dynamicSectionData).forEach((sectionKey) => {
      //     sectionDataToSave[sectionKey] = dynamicSectionData[sectionKey].map(
      //       ({ attachments: _a, ...rest }) => rest,
      //     );
      //   });
      //   mainUpdate.SectionDetailsJSON = JSON.stringify({
      //     ...sectionDataToSave,
      //     __steps: steps.map((s) => s.key),
      //   });
      // }

      switch (activeStep) {
        case "Basic Information":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ...mainUpdate,
            PAN: pan,
            MobileNumber: mobile,
          });
          break;

        case "House Rental":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ...mainUpdate,
            RentDetailsJSON: JSON.stringify(rentDetails),
          });
          // Save landlord changes and delete removed landlords + their attachments
          if (landlords.some((ll) => ll.name?.trim())) {
            await upsertRelatedListBatch(
              LIST_NAMES.IT_LANDLORD_DETAILS_Actual,
              mainId,
              landlords.filter((ll) => ll.name?.trim()),
              (ll) => ({
                Title: ll.name,
                PAN: ll.pan,
                Address: ll.address,
                IsDelete: ll.isDeleted || false,
              }),
              "ActualDeclarationId",
            );
          }
          // Delete attachments for landlords that were removed
          for (const ll of landlords.filter((l) => l.isDeleted && l.Id)) {
            const deletedAttachments: any[] = ll.attachments || [];
            for (const att of deletedAttachments) {
              const attId = att.Id || att.ID;
              if (attId) {
                await updateListItem(LIST_NAMES.IT_DOCUMENTS, attId, {
                  IsDelete: true,
                });
              }
            }
          }
          break;

        case "LTA":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ...mainUpdate,
          });
          await upsertRelatedListBatch(
            LIST_NAMES.IT_LTA_Actual,
            mainId,
            [ltaData],
            (lta: any) => ({
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
            "ActualDeclarationId",
          );
          break;

        case "Housing Loan Repayment":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ...mainUpdate,
          });
          await upsertRelatedListBatch(
            LIST_NAMES.IT_HOUSING_LOAN_Actual,
            mainId,
            [housingLoanData],
            (hl: any) => ({
              PropertyType: hl.propertyType,
              Interest: Number(hl.interestAmount || 0),
              LenderName: hl.lenderName,
              LenderAddress: hl.lenderAddress,
              PANofLender: hl.lenderPan,
              LenderType: hl.lenderType,
              IsJointlyAvailedPropertyLoan:
                typeof hl.isJointlyAvailed === "boolean"
                  ? hl.isJointlyAvailed
                  : null,
              FinalLettableValue: Number(hl.finalLettableValue || 0),
              LetOutInterest: Number(hl.letOutInterestAmount || 0),
              OtherDeductions: Number(hl.otherDeductionsUs24 || 0),
            }),
            "ActualDeclarationId",
          );
          break;

        case "Previous Employer Details":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ...mainUpdate,
          });
          if (previousEmployerData.employerName.trim()) {
            await upsertRelatedListBatch(
              LIST_NAMES.IT_PREVIOUS_EMPLOYER_Actual,
              mainId,
              [previousEmployerData],
              (pe: any) => ({
                Title: pe.employerName,
                EmployeePAN: pe.employerPan,
                TAN: pe.employerTan,
                EmploymentFrom: pe.periodFrom,
                EmploymentTo: pe.periodTo,
                SalaryAfterExemptionUS10: Number(pe.salaryAfterExemption || 0),
                PFContribution: Number(pe.pfContribution || 0),
                VPF: Number(pe.vpfContribution || 0),
                ProfessionalTax: Number(pe.professionalTax || 0),
                TDS: Number(pe.taxDeductedAtSource || 0),
                Address: pe.employerAddress,
              }),
              "ActualDeclarationId",
            );
          }
          break;

        case "Declaration & Summary":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ...mainUpdate,
            IsAcknowledged: declarationAgreement.agreed,
            Place: declarationAgreement.place,
          });
          break;

        default:
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ...mainUpdate,
          });
          break;
      }
    } catch (err) {
      console.error("Error saving step", err);
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

  const handleStatusUpdate = async (newStatus: string) => {
    setShowPopup((prev) => ({ ...prev, visible: false }));
    if (!declarationItem) return;
    try {
      setIsLoading(true);
      const commentsJSON = JSON.stringify({
        HouseRental: commentsHR,
        LTA: commentsLTA,
        DynamicComments: dynamicComments || {},
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
        ActiveStep: "",
      };

      if (newStatus == "Rework") {
        _res = {
          ..._res,
          IsAcknowledged: false,
          Place: null,
          SubmittedDate: null,
        };
      } else if (newStatus === "Submitted") {
        _res = {
          ..._res,
          IsAcknowledged: declarationAgreement.agreed,
          Place: declarationAgreement.place,
          SubmittedDate: new Date().toISOString(),
        };
      }

      await updateListItem(
        LIST_NAMES.ACTUAL_DECLARATION,
        declarationItem.Id,
        _res,
      );

      // Reload
      const sp = getSP();
      const refreshed = await sp.web.lists
        .getByTitle(LIST_NAMES.ACTUAL_DECLARATION)
        .items.getById(declarationItem.Id)
        .select("*")();
      setDeclarationItem(refreshed);

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
      const reqNo = declarationItem.Title;

      if (newStatus === "Approved" && empEmail) {
        void sendApprovalEmail(
          empName,
          empId,
          empEmail,
          "Actual",
          fy,
          user!,
          reqNo,
          declarationItem.Id,
          "ActualApproved",
        );
      } else if (newStatus === "Rework" && empEmail) {
        void sendReworkEmail(
          empName,
          empId,
          empEmail,
          "Actual",
          fy,
          reqNo,
          user!,
          commentsSummary,
        );
      } else if (newStatus === "Draft" && empEmail) {
        void sendReopenEmail(
          empName,
          empId,
          empEmail,
          "Actual",
          fy,
          user!,
          reqNo,
        );
      }

      showToast(toast, "success", "Success", `Status updated to ${newStatus}`);

      handleNavigateBack();
    } catch (err) {
      console.error("Error updating status", err);
      showToast(toast, "error", "Error", "Could not update status.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const readOnly =
      isFormReadOnly || (isAdmin && status === "Submitted" && !isEditMode);
    switch (activeStep) {
      case "Home":
        return (
          <HomeStep
            declarationType={declarationItem?.DeclarationType || "Actual"}
            financialYear={declarationItem?.FinancialYear || curFinanicalYear}
            taxRegime={declarationItem?.TaxRegime || "-"}
          />
        );
      case "Basic Information":
        return (
          <BasicInfoStep
            employeeData={{
              code: matchedEmployee?.EmployeeId || "N/A",
              name: matchedEmployee?.Name || "",
              location: matchedEmployee?.Location || "-",
              doj: matchedEmployee?.DOJ
                ? moment(matchedEmployee.DOJ).format("DD/MM/YYYY")
                : "-",
              email: matchedEmployee?.Email || user?.Email || "",
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
              setLandlords([
                ...landlords,
                { name: "", pan: "", address: "", attachments: [] },
              ])
            }
            onDeleteLandlord={(idx) => {
              const newLls = [...landlords];
              if (newLls[idx].Id) {
                newLls[idx].isDeleted = true;
              } else {
                newLls.splice(idx, 1);
              }
              setLandlords(newLls);
            }}
            showApproverComments={
              (isAdmin && status == "Submitted" && employeeDeclarationPath) ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={commentsHR}
            onCommentChange={setCommentsHR}
            status={status}
            readOnly={readOnly}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
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
                setLtaData((prev: any) => ({
                  ...prev,
                  exemptionAmount: val,
                  journeyStartDate: null,
                  journeyEndDate: null,
                  journeyStartPlace: "",
                  journeyDestination: "",
                  modeOfTravel: "",
                  classOfTravel: "",
                  ticketNumbers: "",
                  lastClaimedYear: "",
                  attachments: (prev.attachments || []).map((att: any) => ({
                    ...att,
                    isDeleted: true,
                  })),
                }));
                setCoTravellers((prev: any) =>
                  prev.map((ct: any) => ({
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
                setLtaData((prev: any) => ({ ...prev, [field]: val }));
              }
            }}
            onCoTravellerChange={(idx, field, val) => {
              const newCo = [...coTravellers];
              newCo[idx] = { ...newCo[idx], [field]: val };
              setCoTravellers(newCo);
            }}
            showApproverComments={
              (isAdmin && status == "Submitted" && employeeDeclarationPath) ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={commentsLTA}
            onCommentChange={setCommentsLTA}
            status={status}
            readOnly={readOnly}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
          />
        );
      case "Housing Loan Repayment":
        return (
          <HousingLoanStep
            data={housingLoanData}
            onChange={(field, val) => {
              if (field === "propertyType") {
                setHousingLoanData((prev: any) => ({
                  ...prev,
                  propertyType: val,
                  interestAmount: "",
                  finalLettableValue: "",
                  letOutInterestAmount: "",
                  otherDeductionsUs24: "",
                  lenderName: "",
                  lenderAddress: "",
                  lenderPan: "",
                  lenderType: "",
                  isJointlyAvailed: null,
                }));
              } else {
                setHousingLoanData((prev: any) => ({ ...prev, [field]: val }));
              }
            }}
            showApproverComments={
              (isAdmin && status == "Submitted" && employeeDeclarationPath) ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={commentsHousingLoan}
            onCommentChange={setCommentsHousingLoan}
            status={status}
            readOnly={readOnly}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
            onOthersUpload={handleUpload}
            onOthersDeleteAttachment={handleDeleteAttachment}
          />
        );
      case "Previous Employer Details":
        return (
          <PreviousEmployerStep
            data={previousEmployerData}
            onChange={(field, val) =>
              setPreviousEmployerData((prev: any) => ({
                ...prev,
                [field]: val,
              }))
            }
            showApproverComments={
              (isAdmin && status == "Submitted" && employeeDeclarationPath) ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={commentsPE}
            onCommentChange={setCommentsPE}
            status={status}
            readOnly={readOnly}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
          />
        );
      case "Declaration & Summary": {
        // Calculate dynamic totals from in-memory state
        const dynamicTotals: Record<string, string> = {};
        Object.keys(dynamicSectionData).forEach((section) => {
          const total = dynamicSectionData[section].reduce(
            (acc: number, curr: any) =>
              acc + Number(curr.declaredAmount || 0),
            0,
          );
          dynamicTotals[section] = total.toLocaleString();
        });

        return (
          <SummaryStep
            employeeInfo={{
              fy: declarationItem?.FinancialYear || curFinanicalYear,
              code: matchedEmployee?.EmployeeId || "N/A",
              name: matchedEmployee?.Name || "",
              pan: pan,
              doj: matchedEmployee?.DOJ || "-",
            }}
            totals={{
              lta: ltaData.exemptionAmount || "0",
              houseRental: rentDetails
                .reduce(
                  (acc: number, curr: any) => acc + Number(curr.rent || 0),
                  0,
                )
                .toLocaleString(),
              housingLoan: (
                Number(housingLoanData.interestAmount || 0) +
                Number(housingLoanData.letOutInterestAmount || 0)
              ).toLocaleString(),
            }}
            dynamicSections={dynamicTotals}
            declaration={declarationAgreement}
            onDeclarationChange={(field: "agreed" | "place", val: any) =>
              setDeclarationAgreement((prev) => ({ ...prev, [field]: val }))
            }
            onSaveAsDraft={() => handleSaveStep()}
            onSubmit={() => handleStatusUpdate("Submitted")}
            onDownloadAttachments={isAdmin ? handleDownloadAll : undefined}
            readOnly={readOnly}
            taxRegime={declarationItem?.TaxRegime}
            showApproverComments={
              (isAdmin && status == "Submitted" && employeeDeclarationPath) ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={commentsSummary}
            onCommentChange={setCommentsSummary}
            status={status}
            employeeDeclarationPath={employeeDeclarationPath}
          />
        );
      }
      default:
        // Dynamic Section Step
        return (
          <DynamicSectionStep
            title={activeStep}
            sectionMaxAmount={sectionMaxAmounts[activeStep] || 0}
            items={dynamicSectionData[activeStep] || []}
            onAmountChange={(id: number, val: string) => {
              setDynamicSectionData((prev) => {
                const next = { ...prev };
                next[activeStep] = next[activeStep].map((item) =>
                  item.id === id ? { ...item, declaredAmount: val } : item,
                );
                return next;
              });
            }}
            showApproverComments={
              (isAdmin && status == "Submitted" && employeeDeclarationPath) ||
              status == "Approved" ||
              status == "Rework"
            }
            approverComments={dynamicComments[activeStep] || ""}
            onCommentChange={(val) =>
              setDynamicComments((prev) => ({ ...prev, [activeStep]: val }))
            }
            status={status}
            readOnly={readOnly}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
          />
        );
    }
  };

  const handleClonePlannedData = async (
    actualId: number,
    plannedId: number,
    regime: string,
  ) => {
    const sp = getSP();
    // 1. Fetch Planned main item
    const plannedItem = await sp.web.lists
      .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
      .items.getById(plannedId)
      .select("*")();

    // 2. Clone basic fields
    const mainUpdate: any = {
      TaxRegime: regime,
      PAN: plannedItem.PAN || "",
      RentDetailsJSON: plannedItem.RentDetailsJSON || null,
      Status: "Draft",
      MobileNumber: plannedItem.MobileNumber,
      SectionDetailsJSON: plannedItem.SectionDetailsJSON || null,
    };

    // Helper: fetch Planned sub-list
    const fetchPlannedSub = (listName: string) =>
      sp.web.lists
        .getByTitle(listName)
        .items.filter(
          `PlannedDeclarationId eq ${plannedId} and IsDelete ne 1`,
        )();

    // 3a. Clone Landlords
    const plands: any[] = await fetchPlannedSub(LIST_NAMES.IT_LANDLORD_DETAILS);
    if (plands.length > 0) {
      await addListItemsBatch(
        LIST_NAMES.IT_LANDLORD_DETAILS_Actual,
        plands.map((l) => ({
          Title: l.Title,
          PAN: l.PAN,
          Address: l.Address,
          ActualDeclarationId: actualId,
        })),
      );
    }

    // 3b. Clone LTA
    const pltaItems: any[] = await fetchPlannedSub(LIST_NAMES.IT_LTA);
    if (pltaItems.length > 0) {
      await addListItemsBatch(
        LIST_NAMES.IT_LTA_Actual,
        pltaItems.map((l) => ({
          ExemptionAmount: l.ExemptionAmount,
          JourneyStartDate: l.JourneyStartDate,
          JourneyEndDate: l.JourneyEndDate,
          StartPlace: l.StartPlace,
          Destination: l.Destination,
          ModeOfTravel: l.ModeOfTravel,
          ClassOfTravel: l.ClassOfTravel,
          TicketNumbers: l.TicketNumbers,
          LastLTAYear: l.LastLTAYear,
          COTravellerJSON: l.COTravellerJSON,
          ActualDeclarationId: actualId,
        })),
      );
    }

    // 3c. Build SectionDetailsJSON from Planned lists
    const sectionDetails: Record<string, any[]> = {};

    // If Planned already has SectionDetailsJSON, parse and merge it
    if (plannedItem.SectionDetailsJSON) {
      try {
        const plannedDynamic = JSON.parse(plannedItem.SectionDetailsJSON);
        Object.keys(plannedDynamic).forEach((sec) => {
          sectionDetails[sec] = plannedDynamic[sec];
        });
      } catch (e) {}
    }

    mainUpdate.SectionDetailsJSON = JSON.stringify(sectionDetails);

    // 3d. Clone Housing Loan
    const phousingLoans: any[] = await fetchPlannedSub(
      LIST_NAMES.IT_HOUSING_LOAN,
    );
    if (phousingLoans.length > 0) {
      await addListItemsBatch(
        LIST_NAMES.IT_HOUSING_LOAN_Actual,
        phousingLoans.map((hl) => ({
          PropertyType: hl.PropertyType,
          Interest: hl.Interest,
          LenderName: hl.LenderName,
          LenderAddress: hl.LenderAddress,
          PANofLender: hl.PANofLender,
          LenderType: hl.LenderType,
          IsJointlyAvailedPropertyLoan:
            hl.IsJointlyAvailedPropertyLoan === "Yes" ||
            hl.IsJointlyAvailedPropertyLoan === true
              ? true
              : hl.IsJointlyAvailedPropertyLoan === "No" ||
                  hl.IsJointlyAvailedPropertyLoan === false
                ? false
                : null,
          FinalLettableValue: hl.FinalLettableValue,
          LetOutInterest: hl.LetOutInterest,
          OtherDeductions: hl.OtherDeductions,
          ActualDeclarationId: actualId,
        })),
      );
    }

    // 3e. Clone Previous Employer
    const pprevEmployers: any[] = await fetchPlannedSub(
      LIST_NAMES.IT_PREVIOUS_EMPLOYER,
    );
    if (pprevEmployers.length > 0) {
      await addListItemsBatch(
        LIST_NAMES.IT_PREVIOUS_EMPLOYER_Actual,
        pprevEmployers.map((pe) => ({
          Title: pe.Title,
          EmployeePAN: pe.EmployeePAN,
          TAN: pe.TAN,
          Address: pe.Address,
          EmploymentFrom: pe.EmploymentFrom,
          EmploymentTo: pe.EmploymentTo,
          SalaryAfterExemptionUS10: pe.SalaryAfterExemptionUS10,
          PFContribution: pe.PFContribution,
          VPF: pe.VPF,
          ProfessionalTax: pe.ProfessionalTax,
          TDS: pe.TDS,
          ActualDeclarationId: actualId,
        })),
      );
    }

    // 4. Update the main item with everything
    await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, actualId, mainUpdate);
  };

  const handleRegimeSubmit = async (regime: string) => {
    if (!declarationItem) return;
    setIsSubmittingRegime(true);
    setIsLoading(true);
    try {
      const actualId = declarationItem.Id;
      const plannedId = (declarationItem as any).PlannedDeclarationId;

      if (plannedId) {
        // Clone copies SectionDetailsJSON (incl. __steps) from Planned
        await handleClonePlannedData(actualId, plannedId, regime);
      } else {
        await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, actualId, {
          TaxRegime: regime,
          Status: "Draft",
        });
      }

      setShowRegimePopup(false);

      // Reload
      const sp = getSP();
      const refreshed = await sp.web.lists
        .getByTitle(LIST_NAMES.ACTUAL_DECLARATION)
        .items.getById(actualId)
        .select("*")();

      const item = { ...refreshed, TaxRegime: regime };
      setDeclarationItem(item);

      // Pass item so loadDynamicSteps can restore steps/sections from stored JSON
      const result = await loadDynamicSteps(regime, item);

      // When there is no planned clone, persist initial section data and step order
      if (
        !plannedId &&
        regime !== "New Regime" &&
        Object.keys(result.sectionData).length > 0
      ) {
        const sectionDataToSave: Record<string, any[]> = {};
        Object.keys(result.sectionData).forEach((sectionKey) => {
          sectionDataToSave[sectionKey] = result.sectionData[sectionKey].map(
            ({ attachments: _a, ...rest }) => rest,
          );
        });
        await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, actualId, {
          SectionDetailsJSON: JSON.stringify({
            ...sectionDataToSave,
            __steps: result.steps.map((s) => s.key),
          }),
        });
      }

      await loadSavedData(item);
      await loadAttachments(item);
    } catch (error) {
      console.error("Error updating tax regime", error);
    } finally {
      setIsSubmittingRegime(false);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <AppToast toastRef={toast} />
      {isLoading && <Loader label="Processing..." />}

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
        }}
        onSubmit={handleRegimeSubmit}
        isLoading={isSubmittingRegime}
      />

      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1>IT Declaration</h1>
          <div className={styles.declarationTag}>
            {declarationItem?.DeclarationType || "Actual"} (
            {declarationItem?.FinancialYear || curFinanicalYear})
          </div>
        </div>

        {!showRegimePopup && steps.length > 0 && (
          <>
            <ITStepper
              steps={steps}
              activeStep={activeStep}
              onStepClick={async (key) => {
                // const lastsaveIdx = steps.findIndex(
                //   // (s) => s.key === declarationItem.ActiveStep,
                //   (s) => s.key === activeStep,
                // );
                // const idx = steps.findIndex((s) => s.key === key);
                // if (idx > lastsaveIdx) {
                //   await handleSaveStep(key);
                // }
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
              border: "none",
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
              activeStep === "Declaration & Summary" &&
              location.state?.from === "employeeDeclaration" && (
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
                    onClick={() => {
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
              status === "Approved" &&
              activeStep == "Declaration & Summary" &&
              !declarationItem?.IsExported &&
              declarationItem?.DeclarationStatus == "Not Submitted" && (
                <ActionButton
                  variant="cancel"
                  label="Reopen"
                  onClick={() => handleStatusUpdate("Draft")}
                />
              )}

            {activeStep === "Declaration & Summary" &&
              status === "Approved" &&
              (declarationItem?.DeclarationStatus == "Not Submitted" ||
                !declarationItem?.DeclarationStatus) &&
              declarationItem?.EmployeeEmail.toLowerCase() ==
                user?.Email.toLowerCase() &&
              !employeeDeclarationPath && (
                <ActionButton
                  variant="continue"
                  label="Declaration Form"
                  onClick={() =>
                    navigate(`/declarationForm/${declarationItem.Id}`)
                  }
                  style={{
                    background: "white",
                    color: "#307a8a",
                    border: "1px solid #307a8a",
                  }}
                />
              )}

            {isAdmin &&
              status === "Submitted" &&
              activeStep !== "Declaration & Summary" &&
              !isEditMode &&
              employeeDeclarationPath && (
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
            {(status === "Approved" ||
              status === "Submitted" ||
              (isAdmin && status == "Rework")) &&
              activeStep !== "Declaration & Summary" && (
                <ActionButton
                  variant="continue"
                  label="Next"
                  onClick={async () => {
                    const idx = steps.findIndex((s) => s.key === activeStep);
                    if (idx < steps.length - 1) {
                      const nextStep = steps[idx + 1].key;
                      await handleSaveStep(nextStep);
                      setActiveStep(nextStep);
                    }
                  }}
                  style={{
                    background: "white",
                    color: "#307a8a",
                    border: "1px solid #307a8a",
                  }}
                />
              )}

            {!isFormReadOnly &&
              activeStep !== "Declaration & Summary" &&
              declarationItem.EmployeeEmail.toLowerCase() ==
                user?.Email.toLowerCase() && (
                <ActionButton
                  variant="draft"
                  className="primaryBtn"
                  label={"Draft"}
                  onClick={async () => {
                    const idx = steps.findIndex((s) => s.key === activeStep);
                    if (idx < steps.length - 1) {
                      await handleSaveStep();
                      // if (
                      //   userRole == "Admins" ||
                      //   userRole == "FinanceApprover"
                      // ) {
                      //   navigate("/employeeDeclaration", {
                      //     state: { tab: location.state?.tab },
                      //   });
                      // } else {

                      navigate("/submittedDeclarations", {
                        state: { tab: location.state?.tab },
                      });
                      // }
                    }
                  }}
                />
              )}

            {!isFormReadOnly &&
              declarationItem.EmployeeEmail.toLowerCase() ==
                user?.Email.toLowerCase() && (
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
                      const isInvalid = await validation();
                      if (isInvalid) return;
                      await handleStatusUpdate("Submitted");
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
