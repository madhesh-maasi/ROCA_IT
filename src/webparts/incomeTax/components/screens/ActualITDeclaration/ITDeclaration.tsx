import * as React from "react";
import { useNavigate } from "react-router-dom";
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
  downloadAttachmentsAsZip,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import { curFinanicalYear } from "../../../../../common/utils/functions";
import { ActionButton } from "../../../../../CommonInputComponents";
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
import { Toast as PrimeToast } from "primereact/toast";
import { AppToast, showToast } from "../../../../../common/components";
import { useRef } from "react";

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
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserDetails);
  const userRole = useAppSelector((state: any) => state.user.role);
  const employeeMaster = useAppSelector(selectEmployees);

  const [declarationItem, setDeclarationItem] = React.useState<any>(null);
  const [activeStep, setActiveStep] = React.useState("Home");
  const [steps, setSteps] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showRegimePopup, setShowRegimePopup] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);

  // ── Attachment state  key → file metadata array
  const [attachments, setAttachments] = React.useState<Record<string, any[]>>(
    {},
  );

  const isAdmin = userRole === "Admin" || userRole === "FinanceApprover";

  const status = declarationItem?.Status || "Draft";
  const isFormReadOnly =
    (status === "Submitted" || status === "Approved") && !isEditMode;

  // Form States
  const [pan, setPan] = React.useState("");
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
    journeyStartDate: null as Date | null,
    journeyEndDate: null as Date | null,
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
    date: new Date().toLocaleDateString("en-IN"),
  });

  const [commentsHR, setCommentsHR] = React.useState("");
  const [commentsLTA, setCommentsLTA] = React.useState("");
  const [comments80C, setComments80C] = React.useState("");
  const [comments80D, setComments80D] = React.useState("");
  const [commentsPE, setCommentsPE] = React.useState("");
  const [commentsHousingLoan, setCommentsHousingLoan] = React.useState("");

  const [maxAmount80C, setMaxAmount80C] = React.useState<number>(150000);
  const [maxAmount80D, setMaxAmount80D] = React.useState<number>(50000);
  const [modeOfTravelChoices, setModeOfTravelChoices] = React.useState<any[]>(
    [],
  );
  const [classOfTravelChoices, setClassOfTravelChoices] = React.useState<any[]>(
    [],
  );

  const selectedItemFromStore = useAppSelector(selectSelectedItem);

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

  // Reset edit mode when step changes
  React.useEffect(() => {
    setIsEditMode(false);
  }, [activeStep]);

  // Initial Load — clones Planned data into Actual lists on first open (Status=Released)
  React.useEffect(() => {
    const initialize = async () => {
      if (!user?.Email) return;
      setIsLoading(true);

      // ── Load LTA field choices ──────────────────────────────────
      try {
        const [modes, classes] = await Promise.all([
          getFieldChoices(LIST_NAMES.IT_LTA_Actual, "ModeOfTravel"),
          getFieldChoices(LIST_NAMES.IT_LTA_Actual, "ClassOfTravel"),
        ]);
        setModeOfTravelChoices(modes.map((m) => ({ label: m, value: m })));
        setClassOfTravelChoices(classes.map((c) => ({ label: c, value: c })));
      } catch (err) {
        console.error("Error loading choices", err);
      }

      const currentFY = curFinanicalYear;
      const sp = getSP();

      // If Admin navigates from Employee screen, use the selected Item context
      let item: any = selectedItemFromStore
        ? { ...selectedItemFromStore }
        : null;

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

      // ── First-open clone: run only when the item is still in Released status ──
      if (item.Status === "Released") {
        const plannedId: any = (item as any).PlannedDeclarationId || null;

        if (plannedId) {
          try {
            const actualId: number = item.Id;

            // 1. Fetch Planned main item
            const plannedItem = await sp.web.lists
              .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
              .items.getById(plannedId)
              .select("*")();

            const regime: string = plannedItem.TaxRegime || "";

            // 2. Update Actual main item: clone key fields + set TaxRegime + Status=Draft
            await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, actualId, {
              TaxRegime: regime,
              PAN: plannedItem.PAN || "",
              RentDetailsJSON: plannedItem.RentDetailsJSON || null,
              Status: "Draft",
            });

            // Helper: fetch Planned sub-list
            const fetchPlannedSub = (listName: string) =>
              sp.web.lists
                .getByTitle(listName)
                .items.filter(
                  `PlannedDeclarationId eq ${plannedId} and IsDelete ne 1`,
                )();

            // 3a. Clone Landlords
            const landlords: any[] = await fetchPlannedSub(
              LIST_NAMES.IT_LANDLORD_DETAILS,
            );
            if (landlords.length > 0) {
              await addListItemsBatch(
                LIST_NAMES.IT_LANDLORD_DETAILS_Actual,
                landlords.map((l) => ({
                  Title: l.Title,
                  PAN: l.PAN,
                  Address: l.Address,
                  ActualDeclarationId: actualId,
                })),
              );
            }

            // 3b. Clone LTA
            const ltaItems: any[] = await fetchPlannedSub(LIST_NAMES.IT_LTA);
            if (ltaItems.length > 0) {
              await addListItemsBatch(
                LIST_NAMES.IT_LTA_Actual,
                ltaItems.map((l) => ({
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

            // 3c. Clone Section 80C
            const items80C: any[] = await fetchPlannedSub(
              LIST_NAMES.IT_80C_SECTION,
            );
            if (items80C.length > 0) {
              await addListItemsBatch(
                LIST_NAMES.IT_80C_SECTION_Actual,
                items80C.map((i) => ({
                  Title: i.Title,
                  Amount: i.Amount,
                  TypeOfInvestmentId: i.TypeOfInvestmentId,
                  ActualDeclarationId: actualId,
                })),
              );
            }

            // 3d. Clone Section 80D
            const items80D: any[] = await fetchPlannedSub(LIST_NAMES.IT_80);
            if (items80D.length > 0) {
              await addListItemsBatch(
                LIST_NAMES.IT_80_Actual,
                items80D.map((i) => ({
                  Title: i.Title,
                  Amount: i.Amount,
                  TypeOfInvestmentId: i.TypeOfInvestmentId,
                  ActualDeclarationId: actualId,
                })),
              );
            }

            // 3e. Clone Housing Loan
            const housingLoans: any[] = await fetchPlannedSub(
              LIST_NAMES.IT_HOUSING_LOAN,
            );
            if (housingLoans.length > 0) {
              await addListItemsBatch(
                LIST_NAMES.IT_HOUSING_LOAN_Actual,
                housingLoans.map((hl) => ({
                  PropertyType: hl.PropertyType,
                  Interest: hl.Interest,
                  LenderName: hl.LenderName,
                  LenderAddress: hl.LenderAddress,
                  PANofLender: hl.PANofLender,
                  LenderType: hl.LenderType,
                  IsJointlyAvailedPropertyLoan: hl.IsJointlyAvailedPropertyLoan,
                  FinalLettableValue: hl.FinalLettableValue,
                  LetOutInterest: hl.LetOutInterest,
                  OtherDeductions: hl.OtherDeductions,
                  ActualDeclarationId: actualId,
                })),
              );
            }

            // 3f. Clone Previous Employer
            const prevEmployers: any[] = await fetchPlannedSub(
              LIST_NAMES.IT_PREVIOUS_EMPLOYER,
            );
            if (prevEmployers.length > 0) {
              await addListItemsBatch(
                LIST_NAMES.IT_PREVIOUS_EMPLOYER_Actual,
                prevEmployers.map((pe) => ({
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

            // 4. Refresh Actual Declaration after clone
            const refreshed = await sp.web.lists
              .getByTitle(LIST_NAMES.ACTUAL_DECLARATION)
              .items.getById(actualId)
              .select("*")();
            item = { ...refreshed, TaxRegime: regime };
          } catch (cloneErr) {
            console.error(
              "Error cloning Planned data into Actual lists",
              cloneErr,
            );
          }
        }
      }

      setDeclarationItem(item);

      // ── Resolve TaxRegime (may already be on item after clone/update) ──────
      let regime: string = item.TaxRegime || "";

      if (!regime) {
        try {
          const plannedId = (item as any).PlannedDeclarationId;
          if (plannedId) {
            const planned = await sp.web.lists
              .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
              .items.getById(plannedId)
              .select("TaxRegime")();
            regime = planned?.TaxRegime || "";
          }
        } catch (e) {
          console.error(
            "Failed to resolve TaxRegime from Planned Declaration",
            e,
          );
        }
      }

      if (regime) {
        item = { ...item, TaxRegime: regime };
        setDeclarationItem(item);
        await loadDynamicSteps(regime);
        await loadSavedData(item);
        await loadAttachments(item);
      }

      setIsLoading(false);
    };
    void initialize();

    return () => {
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
    setPan(mainItem.PAN || "");
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
        isJointlyAvailed: hl.IsJointlyAvailedPropertyLoan || false,
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

    // Load 80C
    const saved80C = await getRelatedListItems(
      LIST_NAMES.IT_80C_SECTION_Actual,
      mainItem.Id,
      "ActualDeclarationId",
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
    const saved80D = await getRelatedListItems(
      LIST_NAMES.IT_80_Actual,
      mainItem.Id,
      "ActualDeclarationId",
    );
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
      } catch (e) {
        console.error("Error parsing Comments JSON", e);
      }
    }
  };

  // ── Load all existing attachments for the current declaration ──────────────
  const loadAttachments = async (mainItem: any) => {
    if (!mainItem?.Id) return;
    const decId: number = mainItem.Id;

    try {
      // Fetch all non-deleted docs for this declaration in one call
      const allDocs = await getITDocuments(decId);

      const map: Record<string, any[]> = {};

      for (const doc of allDocs) {
        // landlord row
        if (doc.LandLordId != null) {
          const key = `landlord-${landlords.findIndex(
            (ll) => ll.Id === doc.LandLordId,
          )}`;
          if (!map[key]) map[key] = [];
          map[key].push(doc);
        }
        // 80C row
        else if (doc.Section80CId != null) {
          const key = `80c-${doc.Section80CId}`;
          if (!map[key]) map[key] = [];
          map[key].push(doc);
        }
        // 80D row
        else if (doc.Section80DId != null) {
          const key = `80d-${doc.Section80DId}`;
          if (!map[key]) map[key] = [];
          map[key].push(doc);
        }
        // LTA (no row-level lookup)
        else if ((doc.FileRef as string)?.includes("/LTA/")) {
          if (!map["lta"]) map["lta"] = [];
          map["lta"].push(doc);
        }
        // Housing Loan – Self Occupied (sanitizeFolderName turns '/' into '_')
        else if (
          (doc.FileRef as string)?.includes("/Housing_Loan_Repayment_Self/")
        ) {
          if (!map["housing-self"]) map["housing-self"] = [];
          map["housing-self"].push(doc);
        }
        // Housing Loan – Let Out
        else if (
          (doc.FileRef as string)?.includes("/Housing_Loan_Repayment_LetOut/")
        ) {
          if (!map["housing-letout"]) map["housing-letout"] = [];
          map["housing-letout"].push(doc);
        }
        // Previous Employer
        else if (
          (doc.FileRef as string)?.includes("/Previous_Employer_Details/")
        ) {
          if (!map["prev-employer"]) map["prev-employer"] = [];
          map["prev-employer"].push(doc);
        }
      }

      setAttachments(map);
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

    // Determine sectionType and lookup IDs from the key
    let sectionType = "";
    const meta: {
      actualDeclarationId: number;
      landLordId?: number;
      section80CId?: number;
      section80DId?: number;
    } = { actualDeclarationId: decId };

    if (key.startsWith("landlord-")) {
      sectionType = "House Rental";
      const idx = Number(key.replace("landlord-", ""));
      const landlord = landlords.filter((ll) => !ll.isDeleted)[idx];
      if (landlord?.Id) meta.landLordId = landlord.Id;
    } else if (key.startsWith("80c-")) {
      sectionType = "Section 80C Deductions";
      const idStr = key.replace("80c-", "");
      const matched = items80C.find((i) => i.id === idStr);
      if (matched?.Id) meta.section80CId = matched.Id;
    } else if (key.startsWith("80d-")) {
      sectionType = "Section 80 Deductions";
      const idStr = key.replace("80d-", "");
      const matched = items80D.find((i) => i.id === idStr);
      if (matched?.Id) meta.section80DId = matched.Id;
    } else if (key === "lta") {
      sectionType = "LTA";
    } else if (key === "housing-self") {
      sectionType = "Housing_Loan_Repayment_Self";
    } else if (key === "housing-letout") {
      sectionType = "Housing_Loan_Repayment_LetOut";
    } else if (key === "prev-employer") {
      sectionType = "Previous_Employer_Details";
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

  const handleDownloadAll = async () => {
    if (!declarationItem) return;
    try {
      setIsLoading(true);
      const fy = declarationItem.FinancialYear;
      const empCode = matchedEmployee?.EmployeeId || "Unknown";
      await downloadAttachmentsAsZip(declarationItem.Id, fy, empCode);
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

  // ── Soft-delete an attachment (IsDelete = true) ───────────────────────────
  const handleDeleteAttachment = async (key: string, fileId: number) => {
    try {
      setIsLoading(true);
      await updateListItem(LIST_NAMES.IT_DOCUMENTS, fileId, { IsDelete: true });
      showToast(toast, "success", "Removed", "Attachment removed.");
      // Remove from local state immediately
      setAttachments((prev) => ({
        ...prev,
        [key]: (prev[key] || []).filter((f) => f.Id !== fileId),
      }));
    } catch (err) {
      showToast(toast, "error", "Error", "Could not remove attachment.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStep = async (stepToSave?: string) => {
    const step = stepToSave || activeStep;
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
        case "Basic Information":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            PAN: pan,
            ApproverCommentsJson: commentsJSON,
          });
          break;

        case "House Rental":
          const activeLls = landlords.filter((ll) => !ll.isDeleted);
          const isLandlordRequired = rentDetails.some(
            (r) => Number(r.rent) > 8333,
          );
          const hasValidLandlord = activeLls.some(
            (ll) => ll.name && ll.pan && ll.address,
          );
          if (isLandlordRequired && !hasValidLandlord) {
            showToast(
              toast,
              "error",
              "Error",
              "Landlord details are mandatory when the individual monthly rent exceeds Rs 8,333.",
            );
            setIsLoading(false);
          }

          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            RentDetailsJSON: JSON.stringify(rentDetails),
            ApproverCommentsJson: commentsJSON,
          });
          const llsToSave = landlords.filter(
            (ll) => (ll.name && ll.pan && ll.address) || ll.isDeleted,
          );
          await upsertRelatedListBatch(
            LIST_NAMES.IT_LANDLORD_DETAILS_Actual,
            mainId,
            llsToSave,
            (ll) => ({
              Title: ll.name,
              PAN: ll.pan,
              Address: ll.address,
              IsDelete: ll.isDeleted || false,
            }),
            "ActualDeclarationId",
          );
          break;

        case "LTA":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ApproverCommentsJson: commentsJSON,
          });
          await upsertRelatedListBatch(
            LIST_NAMES.IT_LTA_Actual,
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
            "ActualDeclarationId",
          );
          break;

        case "Section 80C Deductions":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ApproverCommentsJson: commentsJSON,
          });
          const itemsToSave80C = items80C.filter(
            (i) => Number(i.declaredAmount) > 0,
          );
          await upsertRelatedListBatch(
            LIST_NAMES.IT_80C_SECTION_Actual,
            mainId,
            itemsToSave80C,
            (i) => ({
              Title: i.title,
              Amount: Number(i.declaredAmount || 0),
              TypeOfInvestmentId: i.id,
            }),
            "ActualDeclarationId",
          );
          break;

        case "Section 80 Deductions":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ApproverCommentsJson: commentsJSON,
          });
          const itemsToSave80D = items80D.filter(
            (i) => Number(i.declaredAmount) > 0,
          );
          await upsertRelatedListBatch(
            LIST_NAMES.IT_80_Actual,
            mainId,
            itemsToSave80D,
            (i) => ({
              Title: i.title,
              Amount: Number(i.declaredAmount || 0),
              TypeOfInvestmentId: i.id,
            }),
            "ActualDeclarationId",
          );
          break;

        case "Housing Loan Repayment":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ApproverCommentsJson: commentsJSON,
          });
          await upsertRelatedListBatch(
            LIST_NAMES.IT_HOUSING_LOAN_Actual,
            mainId,
            [housingLoanData],
            (hl) => ({
              PropertyType: hl.propertyType,
              Interest: hl.interestAmount,
              LenderName: hl.lenderName,
              LenderAddress: hl.lenderAddress,
              PANofLender: hl.lenderPan,
              LenderType: hl.lenderType,
              IsJointlyAvailedPropertyLoan: hl.isJointlyAvailed,
              FinalLettableValue: hl.finalLettableValue,
              LetOutInterest: hl.letOutInterestAmount,
              OtherDeductions: hl.otherDeductionsUs24,
            }),
            "ActualDeclarationId",
          );
          break;

        case "Previous Employer Details":
          await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, mainId, {
            ApproverCommentsJson: commentsJSON,
          });
          const pe = previousEmployerData;
          await upsertRelatedListBatch(
            LIST_NAMES.IT_PREVIOUS_EMPLOYER_Actual,
            mainId,
            [previousEmployerData],
            (pe) => ({
              Title: pe.employerName || "Previous Employer",
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
            "ActualDeclarationId",
          );
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
      });

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
        LIST_NAMES.ACTUAL_DECLARATION,
        declarationItem.Id,
        _res,
      );
      showToast(toast, "success", "Success", `Status updated to ${newStatus}`);
      navigate(-1);
    } catch (error) {
      console.error("Error updating status:", error);
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
            financialYear={declarationItem?.FinancialYear || "2025 - 2026"}
            taxRegime={declarationItem?.RegimeType || "Old Regime"}
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
              mobile: matchedEmployee?.PhoneNo || "-",
            }}
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
            onDeleteLandlord={(idx) => {
              const newLls = [...landlords];
              newLls[idx].isDeleted = true;
              setLandlords(newLls);
            }}
            showApproverComments={isAdmin && status != "Draft"}
            approverComments={commentsHR}
            onCommentChange={setCommentsHR}
            readOnly={readOnly}
            attachments={attachments}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
          />
        );
      case "LTA":
        return (
          <LTAStep
            ltaData={ltaData}
            modeOptions={modeOfTravelChoices}
            classOptions={classOfTravelChoices}
            coTravellers={coTravellers}
            onLtaChange={(field, val) =>
              setLtaData((prev) => ({ ...prev, [field]: val }))
            }
            onCoTravellerChange={(idx, field, val) => {
              const newCo = [...coTravellers];
              newCo[idx] = { ...newCo[idx], [field]: val };
              setCoTravellers(newCo);
            }}
            showApproverComments={isAdmin && status != "Draft"}
            approverComments={commentsLTA}
            onCommentChange={setCommentsLTA}
            readOnly={readOnly}
            attachments={attachments}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
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
            showApproverComments={isAdmin && status != "Draft"}
            approverComments={comments80C}
            onCommentChange={setComments80C}
            readOnly={readOnly}
            attachments={attachments}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
          />
        );
      case "Section 80 Deductions":
        return (
          <Section80DStep
            items={items80D}
            sectionMaxAmount={maxAmount80D}
            showApproverComments={isAdmin && status != "Draft"}
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
            readOnly={readOnly}
            attachments={attachments}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
          />
        );
      case "Housing Loan Repayment":
        return (
          <HousingLoanStep
            data={housingLoanData}
            onChange={(field, val) =>
              setHousingLoanData((prev) => ({ ...prev, [field]: val }))
            }
            showApproverComments={isAdmin && status != "Draft"}
            approverComments={commentsHousingLoan}
            onCommentChange={setCommentsHousingLoan}
            readOnly={readOnly}
            attachments={attachments}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
          />
        );
      case "Previous Employer Details":
        return (
          <PreviousEmployerStep
            data={previousEmployerData}
            onChange={(field, val) =>
              setPreviousEmployerData((prev) => ({ ...prev, [field]: val }))
            }
            showApproverComments={isAdmin && status != "Draft"}
            approverComments={commentsPE}
            onCommentChange={setCommentsPE}
            readOnly={readOnly}
            attachments={attachments}
            onUpload={handleUpload}
            onDeleteAttachment={handleDeleteAttachment}
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
            }}
            declaration={declarationAgreement}
            onDeclarationChange={(field: "agreed" | "place", val: any) =>
              setDeclarationAgreement((prev) => ({ ...prev, [field]: val }))
            }
            onSaveAsDraft={() => console.log("Saving draft...")}
            onSubmit={() => console.log("Submitting...")}
            onDownloadAttachments={isAdmin ? handleDownloadAll : undefined}
            readOnly={readOnly}
            taxRegime={declarationItem?.TaxRegime}
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
      <AppToast toastRef={toast} />

      {/* No TaxRegimePopup for Actual declarations — regime is already set from the Planned flow */}

      <div className={styles.header}>
        <h1>IT Declaration</h1>
        <div className={styles.metaInfo}>
          <div className={styles.infoBox}>
            <label>Declaration Type</label>
            <span>{declarationItem?.DeclarationType || "Actual"}</span>
          </div>
          <div className={styles.infoBox}>
            <label>Financial Year</label>
            <span>{declarationItem?.FinancialYear || curFinanicalYear}</span>
          </div>
        </div>
      </div>

      {!showRegimePopup && steps.length > 0 && (
        <>
          <ITStepper
            steps={steps}
            activeStep={activeStep}
            onStepClick={async (key) => {
              await handleSaveStep();
              setActiveStep(key);
              setIsEditMode(false);
            }}
          />

          <div className={styles.stepContent}>
            <div
              style={{
                pointerEvents:
                  (isFormReadOnly ||
                    (isAdmin && status === "Submitted" && !isEditMode)) &&
                  activeStep !== "Declaration & Summary"
                    ? "none"
                    : "auto",
                opacity:
                  (isFormReadOnly ||
                    (isAdmin && status === "Submitted" && !isEditMode)) &&
                  activeStep !== "Declaration & Summary"
                    ? 0.7
                    : 1,
              }}
            >
              {renderCurrentStep()}
            </div>

            <div className={styles.footerActions}>
              <ActionButton
                variant="collapse"
                label="Cancel"
                onClick={() => navigate(-1)}
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
                    onClick={async () => {
                      const idx = steps.findIndex((s) => s.key === activeStep);
                      if (idx > 0) {
                        await handleSaveStep();
                        setActiveStep(steps[idx - 1].key);
                        setIsEditMode(false);
                      }
                    }}
                    style={{
                      minWidth: "120px",
                      background: "white",
                      color: "#3d4db7",
                      border: "1px solid #3d4db7",
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
                        onClick={() => handleStatusUpdate("Rework")}
                      />
                      <ActionButton
                        variant="approve"
                        label="Approve"
                        onClick={() => handleStatusUpdate("Approved")}
                      />
                    </>
                  )}

                {isAdmin && status === "Approved" && (
                  <ActionButton
                    variant="cancel"
                    label="Cancel"
                    onClick={() => handleStatusUpdate("Draft")}
                  />
                )}

                {isAdmin &&
                  status === "Submitted" &&
                  activeStep !== "Declaration & Summary" &&
                  declarationItem?.TaxRegime == "Old Regime" &&
                  !isEditMode && (
                    <ActionButton
                      variant="continue"
                      label="Edit"
                      icon="pi pi-pencil"
                      onClick={() => setIsEditMode(true)}
                    />
                  )}

                {/* Next Button for Admin (Reviews) */}
                {(isAdmin || status != "Draft" || isEditMode) &&
                  activeStep != "Declaration & Summary" && (
                    <ActionButton
                      variant="continue"
                      label="Next"
                      onClick={async () => {
                        const idx = steps.findIndex(
                          (s) => s.key === activeStep,
                        );
                        if (idx < steps.length - 1) {
                          await handleSaveStep();
                          setActiveStep(steps[idx + 1].key);
                        }
                      }}
                    />
                  )}

                {!isFormReadOnly && (
                  <ActionButton
                    variant="save"
                    className="primaryBtn"
                    label={
                      activeStep === "Declaration & Summary"
                        ? "Submit"
                        : "Save & Continue"
                    }
                    onClick={async () => {
                      const idx = steps.findIndex((s) => s.key === activeStep);
                      if (idx < steps.length - 1) {
                        await handleSaveStep();
                        setActiveStep(steps[idx + 1].key);
                      } else {
                        if (declarationItem) {
                          await updateListItem(
                            LIST_NAMES.ACTUAL_DECLARATION,
                            declarationItem.Id,
                            {
                              Status: "Submitted",
                              IsAcknowledged: declarationAgreement.agreed,
                              Place: declarationAgreement.place,
                              SubmittedDate: new Date().toISOString(),
                            },
                          );
                          showToast(
                            toast,
                            "success",
                            "Success",
                            "Declaration submitted successfully",
                          );
                          navigate(-1);
                        }
                      }
                    }}
                    style={{
                      minWidth: "160px",
                      background: "#3d4db7",
                      color: "white",
                    }}
                    loading={isLoading}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ITDeclaration;
