import * as React from "react";
import styles from "./ExportDeclaration.module.scss";
import {
  AppDataTable,
  IColumnDef,
  AppDropdown,
  AppRadioButton,
  ActionButton,
  StatusPopup,
  SearchInput,
} from "../../../../../CommonInputComponents";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import Loader from "../../../../../common/components/Loader/Loader";
import {
  getListItems,
  updateListItemsBatch,
  getAllItems,
  getRelatedListItems,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import {
  exportToExcelMultiSheet,
  generateExcelBase64MultiSheet,
} from "../../../../../common/utils/exportUtils";
import { sendExportEmail } from "../../../../../common/utils/emailService";
import {
  curFinanicalYear,
  getFYOptions,
  globalSearchFilter,
} from "../../../../../common/utils/functions";
import { useAppSelector } from "../../../../../store/hooks";
import { selectUserDetails } from "../../../../../store/slices/userSlice";
import { selectEmployees } from "../../../../../store/slices/employeeSlice";
import RequiredSympol from "../../../../../common/components/RequiredSympol/RequiredSympol";

interface IDeclarationItem {
  ID: number;
  EmployeeCode: string;
  EmployeeName: string;
  Email: string;
  TaxRegime: string;
  FinancialYear: string;
  DeclarationType: string;
  Status: string;
  IsExported?: boolean;
}

// Remove dummy data constants
// Remove static YEAR_OPTIONS

const ExportDeclaration: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);
  const userDetails = useAppSelector(selectUserDetails);
  const employeeMaster = useAppSelector(selectEmployees);

  // States initialized to empty strings so radio buttons are unselected
  const [selectedYear, setSelectedYear] =
    React.useState<string>(curFinanicalYear);
  const [declarationType, setDeclarationType] = React.useState<string>("");
  const [taxRegime, setTaxRegime] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<"Incremental" | "Complete">(
    "Incremental",
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [rawDeclarations, setRawDeclarations] = React.useState<
    IDeclarationItem[]
  >([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false);

  const yearOptions = React.useMemo(() => {
    return getFYOptions(rawDeclarations);
  }, [rawDeclarations]);

  // Reactively map emails from master data
  const declarations = React.useMemo(() => {
    return rawDeclarations.map((item) => {
      const masterEmp = employeeMaster.find(
        (e) => e.EmployeeId === item.EmployeeCode,
      );
      return {
        ...item,
        Email: masterEmp?.Email || item.Email || "-",
      };
    });
  }, [rawDeclarations, employeeMaster]);

  const filteredDeclarations = React.useMemo(() => {
    return globalSearchFilter(declarations, searchTerm);
  }, [declarations, searchTerm]);

  const fetchData = async () => {
    // Initially page show 0 records. once i select the choice then the respective data show in the table.
    if (!declarationType || !taxRegime) {
      setRawDeclarations([]);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Fetch only from the relevant list based on selected Choice, filtering by IsExported
      const listName =
        declarationType === "Planned"
          ? LIST_NAMES.PLANNED_DECLARATION
          : LIST_NAMES.ACTUAL_DECLARATION;

      // Filter: Status='Approved'
      // Incremental: IsExported ne 1
      // Complete: IsExported eq 1
      const isExportedFilter = activeTab === "Incremental" ? "ne 1" : "eq 1";
      const filter = `Status eq 'Approved' and IsExported ${isExportedFilter} and FinancialYear eq '${curFinanicalYear}'`;

      const allDecls: IDeclarationItem[] = await getListItems(listName, filter);

      const filtered = allDecls.filter(
        (item) =>
          item.FinancialYear === selectedYear && item.TaxRegime === taxRegime,
      );
      setRawDeclarations(filtered);
    } catch (err) {
      console.error(err);
      showToast(toast, "error", "Error", "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    void fetchData();
  }, [selectedYear, declarationType, taxRegime, activeTab]);

  const buildOldRegimeSheet0581 = async (
    exportData: IDeclarationItem[],
  ): Promise<any[]> => {
    const fyParts = selectedYear.split("-");
    const startYear = fyParts[0];
    const endYear = fyParts[1];
    const ENDDA = `31.03.${endYear}`;
    const BEGDA = `01.04.${startYear}`;

    const landlordListName =
      declarationType === "Planned"
        ? LIST_NAMES.IT_LANDLORD_DETAILS
        : LIST_NAMES.IT_LANDLORD_DETAILS_Actual;
    const lookupColumn =
      declarationType === "Planned"
        ? "PlannedDeclarationId"
        : "ActualDeclarationId";

    // Fetch landlords per declaration — same pattern used by the declaration screens
    const landlordsByDecl = await Promise.all(
      exportData.map((decl) =>
        getRelatedListItems(landlordListName, decl.ID, lookupColumn),
      ),
    );

    const rows: any[] = [];

    exportData.forEach((decl, idx) => {
      let rentRows: {
        month: string;
        isMetro: boolean | null;
        city: string;
        rent: string;
      }[] = [];
      try {
        if ((decl as any).RentDetailsJSON) {
          rentRows = JSON.parse((decl as any).RentDetailsJSON);
        }
      } catch {
        // ignore parse errors
      }

      // Distinct rent amounts, then sum
      const distinctRents = Array.from(
        new Set(rentRows.map((r) => Number(r.rent) || 0).filter((r) => r > 0)),
      );
      const rtamt = distinctRents.reduce((sum, r) => sum + r, 0);

      // Metro: 1 if any month is metro, else "" (empty cell — avoid "null" text in Excel)
      const metro: number | "" = rentRows.some((r) => r.isMetro === true)
        ? 1
        : "";

      const declLandlords = landlordsByDecl[idx] || [];

      // Always add at least one row per declaration (empty landlord fields if none saved)
      const landlordList = declLandlords.length > 0 ? declLandlords : [null];

      for (const ll of landlordList) {
        const address: string = ll?.Address || "";
        rows.push({
          PERNR: decl.EmployeeCode,
          ENDDA,
          BEGDA,
          METRO: metro,
          HRTXE: 1,
          RTAMT: rtamt,
          LDAD1: address.substring(0, 40),
          LDAD2: address.substring(40, 80),
          LDAD3: address.substring(80, 120),
          LDAID: ll?.PAN || "",
          LDADE: "X",
          LDNAM: ll?.Title || "",
        });
      }
    });

    return rows;
  };

  // Format an ISO date string (or Date) to dd.mm.yyyy; returns "" if falsy
  const formatDateDDMMYYYY = (raw: any): string => {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const buildOldRegimeSheet0582 = async (
    exportData: IDeclarationItem[],
  ): Promise<any[]> => {
    const fyParts = selectedYear.split("-");
    const startYear = fyParts[0];
    const endYear = fyParts[1];
    const ENDDA = `31.03.${endYear}`;
    const BEGDA = `01.04.${startYear}`;

    const ltaListName =
      declarationType === "Planned"
        ? LIST_NAMES.IT_LTA
        : LIST_NAMES.IT_LTA_Actual;
    const lookupColumn =
      declarationType === "Planned"
        ? "PlannedDeclarationId"
        : "ActualDeclarationId";

    // Fetch LTA per declaration (same pattern as declaration screens)
    const ltaByDecl = await Promise.all(
      exportData.map((decl) =>
        getRelatedListItems(ltaListName, decl.ID, lookupColumn),
      ),
    );

    const rows: any[] = [];

    exportData.forEach((decl, idx) => {
      const ltaItems = ltaByDecl[idx] || [];

      // Always add at least one row per declaration (blank LTA fields if none saved)
      const ltaList = ltaItems.length > 0 ? ltaItems : [null];

      for (const lta of ltaList) {
        rows.push({
          PERNR: decl.EmployeeCode,
          SUBTY: "LTA",
          OBJPS: "",
          ENDDA,
          BEGDA,
          AMTEX: lta?.ExemptionAmount ?? "",
          JBGDT: formatDateDDMMYYYY(lta?.JourneyStartDate),
          JENDT: formatDateDDMMYYYY(lta?.JourneyEndDate),
          STPNT: lta?.StartPlace || "",
          DESTN: lta?.Destination || "",
          MTRVL: lta?.ModeOfTravel || "",
          CTRVL: lta?.ClassOfTravel || "",
          TKTNO: lta?.TicketNumbers || "",
          SLFTR: "X",
          CLMCF: "X",
        });
      }
    });

    return rows;
  };

  const buildSectionSheets = async (
    exportData: IDeclarationItem[],
  ): Promise<{ sheetName: string; data: any[] }[]> => {
    // 1. Sections ordered by SectionOrder, only those with SectionOrder set
    const sectionItems = await getListItems(
      LIST_NAMES.SECTION_CONFIG,
      'SectionOrder ne null',
      'SectionOrder',
      true,
    );

    // 2. All lookup items
    const lookupItems = await getListItems(LIST_NAMES.LOOKUP_CONFIG);

    const sheets: { sheetName: string; data: any[] }[] = [];

    for (const section of sectionItems) {
      const sectionCode: string = section.Code || '';
      const sectionTitle: string = section.Title || '';

      if (!sectionCode) continue;

      // Lookup items belonging to this section
      const sectionLookups = lookupItems.filter(
        (item: any) => item.SectionId === section.Id,
      );

      if (sectionLookups.length === 0) continue;

      const pcnRows: any[] = [];
      const acnRows: any[] = [];

      for (const decl of exportData) {
        const pcnRow: any = { PERNR: decl.EmployeeCode };
        const acnRow: any = { PERNR: decl.EmployeeCode };

        let sectionData: any[] = [];
        try {
          if ((decl as any).SectionDetailsJSON) {
            const parsed = JSON.parse((decl as any).SectionDetailsJSON);
            sectionData = parsed[sectionTitle] || [];
          }
        } catch {
          // ignore parse errors
        }

        for (const lookup of sectionLookups) {
          const lookupCode: string = lookup.Code || '';
          const matchedItem = sectionData.find(
            (item: any) => item.investmentType === lookup.Types,
          );
          const amount = matchedItem
            ? Number(matchedItem.declaredAmount) || 0
            : 0;

          pcnRow[`PCN${lookupCode}`] = amount;
          acnRow[`ACN${lookupCode}`] = amount;
        }

        pcnRows.push(pcnRow);
        acnRows.push(acnRow);
      }

      sheets.push({ sheetName: sectionCode, data: pcnRows });
      sheets.push({ sheetName: sectionCode + 'a', data: acnRows });
    }

    return sheets;
  };

  const buildOldRegimeSheet0584 = async (
    exportData: IDeclarationItem[],
  ): Promise<any[]> => {
    const hlListName =
      declarationType === "Planned"
        ? LIST_NAMES.IT_HOUSING_LOAN
        : LIST_NAMES.IT_HOUSING_LOAN_Actual;
    const lookupColumn =
      declarationType === "Planned"
        ? "PlannedDeclarationId"
        : "ActualDeclarationId";

    // Fetch housing loan per declaration
    const hlByDecl = await Promise.all(
      exportData.map((decl) =>
        getRelatedListItems(hlListName, decl.ID, lookupColumn),
      ),
    );

    const rows: any[] = [];

    exportData.forEach((decl, idx) => {
      const hlItems = hlByDecl[idx] || [];

      // Always add at least one row per declaration (blank HL fields if none saved)
      const hlList = hlItems.length > 0 ? hlItems : [null];

      for (const hl of hlList) {
        const address: string = hl?.LenderAddress || "";
        rows.push({
          PERNR: decl.EmployeeCode,
          SUBTY: "0001",
          LETVL: hl?.FinalLettableValue ?? "",
          INT24: hl?.Interest ?? "",
          OTH24: 0,
          LLMIT: 0,
          LENAM: hl?.LenderName || "",
          LEAD1: address.substring(0, 40),
          LEAD2: address.substring(40, 80),
          LEAD3: address.substring(80, 120),
          LEPAN: hl?.PANofLender || "",
          LETYP: hl?.LenderType || "",
        });
      }
    });

    return rows;
  };

  const handleDownload = async () => {
    if (!declarationType || !taxRegime) {
      showToast(
        toast,
        "warn",
        "Incomplete",
        "Please select Declaration Type and Tax Regime before exporting.",
      );
      return;
    }

    const exportData = declarations.filter(
      (d) =>
        d.DeclarationType === declarationType &&
        (!taxRegime || d.TaxRegime === taxRegime),
    );

    if (exportData.length === 0) {
      showToast(toast, "warn", "No Data", "No new records found for export.");
      return;
    }

    setIsLoading(true);
    try {
      const fileName = `Declarations_${declarationType}_${selectedYear}`;

      if (taxRegime === "Old Regime") {
        // Build all Old Regime worksheets in parallel
        const [sheet0581, sheet0582, sheet0584, sectionSheets] = await Promise.all([
          buildOldRegimeSheet0581(exportData),
          buildOldRegimeSheet0582(exportData),
          buildOldRegimeSheet0584(exportData),
          buildSectionSheets(exportData),
        ]);

        const sheets = [
          { sheetName: "0581", data: sheet0581 },
          { sheetName: "0582", data: sheet0582 },
          { sheetName: "0584", data: sheet0584 },
          ...sectionSheets,
        ];

        exportToExcelMultiSheet(sheets, fileName);

        if (activeTab === "Incremental") {
          let _FinanceApporvers: any[] = await getAllItems(
            LIST_NAMES.FINANCE_APPROVER,
            ["User/EMail"],
            "User",
            "Id",
            false,
            "IsDelete ne 1",
          );
          _FinanceApporvers = _FinanceApporvers
            .map((item) => item?.User?.EMail)
            .filter((email) => !!email);
          const base64Data = generateExcelBase64MultiSheet(sheets, fileName);
          if (base64Data && userDetails?.Email) {
            await sendExportEmail(
              userDetails.Email,
              declarationType as "Planned" | "Actual",
              userDetails?.Title || "",
              `${fileName}.xlsx`,
              base64Data,
              selectedYear,
              _FinanceApporvers.filter(
                (email) =>
                  email.toLowerCase() !== userDetails.Email.toLowerCase(),
              ),
            );
          }
          setShowDownloadPopup(true);
        }
      } else {
        // New Regime: "Basic Info" sheet
        const basicInfoSheet = exportData.map((d) => {
          const masterEmp = employeeMaster.find(
            (e) => e.EmployeeId === d.EmployeeCode,
          );
          return {
            "Employee Code": d.EmployeeCode,
            "Employee Name": d.EmployeeName,
            "Financial Year": d.FinancialYear,
            "Declaration Type": d.DeclarationType,
            "Mobile Number": (d as any).MobileNumber || masterEmp?.PhoneNo || "",
            Location: masterEmp?.Location || "",
            "PAN Number": (d as any).PAN || "",
          };
        });

        const sectionSheets = await buildSectionSheets(exportData);
        const newRegimeSheets = [
          { sheetName: "Basic Info", data: basicInfoSheet },
          ...sectionSheets,
        ];
        exportToExcelMultiSheet(newRegimeSheets, fileName);

        if (activeTab === "Incremental") {
          let _FinanceApporvers: any[] = await getAllItems(
            LIST_NAMES.FINANCE_APPROVER,
            ["User/EMail"],
            "User",
            "Id",
            false,
            "IsDelete ne 1",
          );
          _FinanceApporvers = _FinanceApporvers
            .map((item) => item?.User?.EMail)
            .filter((email) => !!email);
          const base64Data = generateExcelBase64MultiSheet(newRegimeSheets, fileName);
          if (base64Data && userDetails?.Email) {
            await sendExportEmail(
              userDetails.Email,
              declarationType as "Planned" | "Actual",
              userDetails?.Title || "",
              `${fileName}.xlsx`,
              base64Data,
              selectedYear,
              _FinanceApporvers.filter(
                (email) =>
                  email.toLowerCase() !== userDetails.Email.toLowerCase(),
              ),
            );
          }
          setShowDownloadPopup(true);
        }
      }

      // Batch-mark IsExported
      const listName =
        declarationType === "Planned"
          ? LIST_NAMES.PLANNED_DECLARATION
          : LIST_NAMES.ACTUAL_DECLARATION;
      const updates = exportData.map((d) => ({
        id: d.ID,
        data: { IsExported: true },
      }));
      await updateListItemsBatch(listName, updates);
      setTimeout(() => {
        setShowDownloadPopup(false);
      }, 3000);

      await fetchData();
    } catch (err) {
      console.error(err);
      showToast(toast, "error", "Error", "Export failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const columns: IColumnDef[] = [
    {
      field: "EmployeeCode",
      header: "Employee ID",
      sortable: true,
    },
    {
      field: "EmployeeName",
      header: "Employee Name",
      sortable: true,
    },
    { field: "Email", header: "Email Address", sortable: true },
    {
      field: "TaxRegime",
      header: "Tax Regime Type",
      sortable: true,
    },
  ];

  return (
    <div className={styles.screen}>
      <StatusPopup
        visible={showDownloadPopup}
        onHide={() => setShowDownloadPopup(false)}
        type="download"
      />
      <AppToast toastRef={toast} />
      {isLoading && <Loader fullScreen label="Processing Export..." />}

      <div className={styles.header}>
        <h2>Export Declaration</h2>
      </div>

      <div className={styles.notePanel}>
        <div className={styles.noteTitle}>Note</div>
        <ul className={styles.noteList}>
          <li>Only Approved declaration is exported.</li>
          <li>One time Export is Allowed.</li>
        </ul>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label className={styles.groupLabel} style={{ fontSize: "14px" }}>
            Financial Year
          </label>
          <AppDropdown
            options={yearOptions}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.value as string)}
            className={styles.yearDropdown}
            placeholder="Select Year"
          />
        </div>

        <div className={styles.filterGroup} style={{ gap: 14 }}>
          <label className={styles.groupLabel} style={{ fontSize: "14px" }}>
            Declaration Type {RequiredSympol()}
          </label>
          <div className={styles.radioGroup}>
            <AppRadioButton
              name="declarationType"
              value="Planned"
              label="Planned"
              selectedValue={declarationType}
              onChange={setDeclarationType}
            />
            <AppRadioButton
              name="declarationType"
              value="Actual"
              label="Actual"
              selectedValue={declarationType}
              onChange={setDeclarationType}
            />
          </div>
        </div>

        <div className={styles.filterGroup} style={{ gap: 14 }}>
          <label className={styles.groupLabel} style={{ fontSize: "14px" }}>
            Tax Regime {RequiredSympol()}
          </label>
          <div className={styles.radioGroup}>
            <AppRadioButton
              name="taxRegime"
              value="Old Regime"
              label="Old Regime"
              selectedValue={taxRegime}
              onChange={setTaxRegime}
            />
            <AppRadioButton
              name="taxRegime"
              value="New Regime"
              label="New Regime"
              selectedValue={taxRegime}
              onChange={setTaxRegime}
            />
          </div>
        </div>

        <div className={styles.actionsGroup}>
          <ActionButton
            variant="download"
            label="Download"
            onClick={() => {
              void handleDownload();
            }}
            disabled={declarations.length === 0}
          />
        </div>
      </div>

      <div className={styles.tabToggle}>
        <button
          className={`${styles.tabBtn} ${activeTab === "Incremental" ? styles.active : ""}`}
          onClick={() => setActiveTab("Incremental")}
        >
          Incremental Export
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "Complete" ? styles.active : ""}`}
          onClick={() => setActiveTab("Complete")}
        >
          Complete Export
        </button>
      </div>

      <div className={styles.tableCard}>
        <AppDataTable
          columns={columns}
          data={filteredDeclarations}
          globalFilter={searchTerm}
          paginator
          rows={10}
        />
      </div>
    </div>
  );
};

export default ExportDeclaration;
