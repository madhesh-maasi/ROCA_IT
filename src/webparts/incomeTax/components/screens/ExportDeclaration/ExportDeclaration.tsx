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
  getSP,
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
import moment from "moment";

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
    const fyStartDate = new Date(`${startYear}-04-01`);
    const defaultBEGDA = `01.04.${startYear}`;

    // Returns the employee's joining date (dd.mm.yyyy) when it falls after
    // the FY start; otherwise returns the FY start date.
    const getEffectiveBEGDA = (employeeCode: string): string => {
      const masterEmp = employeeMaster.find(
        (e) => e.EmployeeId === employeeCode,
      );
      if (masterEmp?.DOJ) {
        const doj = new Date(masterEmp.DOJ);
        if (!isNaN(doj.getTime()) && doj > fyStartDate) {
          const dd = String(doj.getDate()).padStart(2, "0");
          const mm = String(doj.getMonth() + 1).padStart(2, "0");
          const yyyy = doj.getFullYear();
          return `${dd}.${mm}.${yyyy}`;
        }
      }
      return defaultBEGDA;
    };

    const landlordListName =
      declarationType === "Planned"
        ? LIST_NAMES.IT_LANDLORD_DETAILS
        : LIST_NAMES.IT_LANDLORD_DETAILS_Actual;
    const lookupColumn =
      declarationType === "Planned"
        ? "PlannedDeclarationId"
        : "ActualDeclarationId";

    // Month definitions in FY order  (April of startYear → March of endYear)
    const MONTH_ORDER: { month: string; day1: string; dayLast: string }[] = [
      {
        month: "April",
        day1: `01.04.${startYear}`,
        dayLast: `30.04.${startYear}`,
      },
      {
        month: "May",
        day1: `01.05.${startYear}`,
        dayLast: `31.05.${startYear}`,
      },
      {
        month: "June",
        day1: `01.06.${startYear}`,
        dayLast: `30.06.${startYear}`,
      },
      {
        month: "July",
        day1: `01.07.${startYear}`,
        dayLast: `31.07.${startYear}`,
      },
      {
        month: "August",
        day1: `01.08.${startYear}`,
        dayLast: `31.08.${startYear}`,
      },
      {
        month: "September",
        day1: `01.09.${startYear}`,
        dayLast: `30.09.${startYear}`,
      },
      {
        month: "October",
        day1: `01.10.${startYear}`,
        dayLast: `31.10.${startYear}`,
      },
      {
        month: "November",
        day1: `01.11.${startYear}`,
        dayLast: `30.11.${startYear}`,
      },
      {
        month: "December",
        day1: `01.12.${startYear}`,
        dayLast: `31.12.${startYear}`,
      },
      {
        month: "January",
        day1: `01.01.${endYear}`,
        dayLast: `31.01.${endYear}`,
      },
      {
        month: "February",
        day1: `01.02.${endYear}`,
        dayLast: `28.02.${endYear}`,
      },
      { month: "March", day1: `01.03.${endYear}`, dayLast: `31.03.${endYear}` },
    ];

    // Fetch landlords per declaration
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

      // Metro: 1 if any month is metro, else 0
      const metro: number = rentRows.some((r) => r.isMetro === true) ? 1 : 0;

      const declLandlords = landlordsByDecl[idx] || [];
      const landlordList = declLandlords.length > 0 ? declLandlords : [null];

      // Build ordered list of months that have a non-zero rent
      const activeMonths = MONTH_ORDER.map((mo) => {
        const rentRow = rentRows.find((r) => r.month === mo.month);
        const rentAmt = Number(rentRow?.rent) || 0;
        const isMetro = !!rentRow?.isMetro;
        return { ...mo, rentAmt, isMetro };
      }).filter((m) => m.rentAmt > 0);

      if (activeMonths.length === 0) {
        // No rent data — emit one blank row so the declaration is not lost
        rows.push({
          PERNR: decl.EmployeeCode,
          ENDDA: ENDDA,
          BEGDA: getEffectiveBEGDA(decl.EmployeeCode),
          METRO: metro,
          HRTXE: 1,
          RTAMT: 0,
          LDAD1: "",
          LDAD2: "",
          LDAD3: "",
          LDAID: "",
          LDADE: "X",
          LDNAM: "",
        });
        return;
      }

      // --- Group consecutive months that have the same rent amount and metro status ---
      // Each change in rent amount or metro status starts a new group regardless of month continuity.
      const rentGroups: {
        rentAmt: number;
        isMetro: boolean;
        begda: string;
        endda: string;
      }[] = [];
      let groupStart = activeMonths[0];
      let groupRent = activeMonths[0].rentAmt;
      let groupIsMetro = activeMonths[0].isMetro;

      for (let i = 1; i < activeMonths.length; i++) {
        const cur = activeMonths[i];
        if (cur.rentAmt === groupRent && cur.isMetro === groupIsMetro) {
          // Same rent and metro status — extend current group
        } else {
          // Rent or Metro changed — close previous group and start a new one
          rentGroups.push({
            rentAmt: groupRent,
            isMetro: groupIsMetro,
            begda: groupStart.day1,
            endda: activeMonths[i - 1].dayLast,
          });
          groupStart = cur;
          groupRent = cur.rentAmt;
          groupIsMetro = cur.isMetro;
        }
      }
      // Close the last group
      rentGroups.push({
        rentAmt: groupRent,
        isMetro: groupIsMetro,
        begda: groupStart.day1,
        endda: activeMonths[activeMonths.length - 1].dayLast,
      });

      // One Excel row per rent group.
      // Landlord is selected positionally by group index;
      // if there are more groups than landlords, the last landlord repeats.
      rentGroups.forEach((group, groupIdx) => {
        const ll = landlordList[Math.min(groupIdx, landlordList.length - 1)];
        const address: string = ll?.Address || "";
        rows.push({
          PERNR: decl.EmployeeCode,
          // ENDDA: ENDDA,
          ENDDA: group.endda,
          // BEGDA: getEffectiveBEGDA(decl.EmployeeCode),
          BEGDA: group.begda,
          METRO: group.isMetro ? 1 : 0,
          HRTXE: 1,
          RTAMT: group.rentAmt,
          LDAD1: address.substring(0, 40),
          LDAD2: address.substring(40, 80),
          LDAD3: address.substring(80, 120),
          LDAID: ll?.PAN || "",
          LDADE: "X",
          LDNAM: ll?.Title || "",
        });
      });
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
    const fyStartDate = new Date(`${startYear}-04-01`);
    const defaultBEGDA = `01.04.${startYear}`;

    // Returns the employee's joining date (dd.mm.yyyy) when it falls after

    const getEffectiveBEGDA = (employeeCode: string): string => {
      const masterEmp = employeeMaster.find(
        (e) => e.EmployeeId === employeeCode,
      );
      if (masterEmp?.DOJ) {
        const doj = new Date(masterEmp.DOJ);
        if (!isNaN(doj.getTime()) && doj > fyStartDate) {
          const dd = String(doj.getDate()).padStart(2, "0");
          const mm = String(doj.getMonth() + 1).padStart(2, "0");
          const yyyy = doj.getFullYear();
          return `${dd}.${mm}.${yyyy}`;
        }
      }
      return defaultBEGDA;
    };
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
      const ltaList = ltaItems.length > 0 ? ltaItems : [null];
      for (const lta of ltaList) {
        rows.push({
          PERNR: decl.EmployeeCode,
          SUBTY: "LTA",
          OBJPS: "",
          ENDDA,
          BEGDA: getEffectiveBEGDA(decl.EmployeeCode),
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
      "SectionOrder ne null",
      "SectionOrder",
      true,
    );
    // 2. All lookup items
    const lookupItems = await getListItems(
      LIST_NAMES.LOOKUP_CONFIG,
      "",
      "",
      true,
    );

    // 3. For Actual declarations, fetch each corresponding PlannedDeclaration's
    //    SectionDetailsJSON so PCN columns carry planned amounts.
    const plannedSectionJsonMap = new Map<number, string>();
    if (declarationType === "Actual") {
      const sp = getSP();
      await Promise.all(
        exportData.map(async (decl) => {
          const plannedId = (decl as any).PlannedDeclarationId;
          if (!plannedId) return;
          try {
            const plannedItem = await sp.web.lists
              .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
              .items.getById(plannedId)
              .select("SectionDetailsJSON")();
            if (plannedItem?.SectionDetailsJSON) {
              plannedSectionJsonMap.set(
                decl.ID,
                plannedItem.SectionDetailsJSON,
              );
            }
          } catch {
            // ignore individual fetch errors
          }
        }),
      );
    }

    const sheets: { sheetName: string; data: any[] }[] = [];
    for (const section of sectionItems) {
      const sectionTitle: string = section.Title || "";
      // Use Code as the sheet name; fall back to Title when Code is blank so
      // sections without a Code are not silently dropped (e.g. New Regime)
      const rawSheetName: string = section.Code || sectionTitle;
      const sectionCode: string = rawSheetName
        .substring(0, 31) // Excel sheet names max 31 chars
        .replace(/[\\/?*[\]:]/g, "_"); // strip chars invalid in Excel sheet names
      if (!sectionCode) continue;
      // Lookup items belonging to this section
      const sectionLookups = lookupItems.filter(
        (item: any) => item.SectionId === section.Id,
      );
      if (sectionLookups.length === 0) continue;

      if (rawSheetName === "0585") {
        const fyParts = selectedYear.split("-");
        const startYearNum = parseInt(fyParts[0]);
        const fyStartDateStr = `01.04.${startYearNum}`;
        const fyEndDateStr = `31.03.${startYearNum + 1}`;

        // Build a sorted list of (SBS, SBD) pairs from lookup items
        // Each item must have SBS and SBD values
        const sbsLookups = sectionLookups
          .filter((l: any) => l.SBS != null && l.SBD != null)
          .map((l: any) => ({
            ...l,
            sbsVal: Number(l.SBS),
            sbdVal: Number(l.SBD),
          }))
          .sort((a: any, b: any) =>
            a.sbsVal !== b.sbsVal ? a.sbsVal - b.sbsVal : a.sbdVal - b.sbdVal,
          );

        // Determine the max global sequential index (covers all SBS/SBD pairs + gaps)
        // We assign an index per sequential position across the full list including gaps.
        // First, for each SBS group, fill gaps from 1..maxSBD. Track all (sbs, sbd) pairs.
        const sbsGroups = new Map<number, number>(); // sbsVal -> maxSBD
        sbsLookups.forEach((l: any) => {
          const cur = sbsGroups.get(l.sbsVal) || 0;
          if (l.sbdVal > cur) sbsGroups.set(l.sbsVal, l.sbdVal);
        });

        // Build ordered list of all (sbs, sbd) slots including gap-fill, with sequential index
        type SlotType = {
          idx: number;
          sbsVal: number;
          sbdVal: number;
          lookup: any | null; // null = gap
        };
        const allSlots: SlotType[] = [];
        let slotIdx = 1;
        // Sort SBS values ascending
        const sortedSbsVals = Array.from(sbsGroups.keys()).sort(
          (a, b) => a - b,
        );
        for (const sbsVal of sortedSbsVals) {
          const maxSbd = sbsGroups.get(sbsVal) || 0;
          for (let sbdVal = 1; sbdVal <= maxSbd; sbdVal++) {
            const lookup =
              sbsLookups.find(
                (l: any) => l.sbsVal === sbsVal && l.sbdVal === sbdVal,
              ) || null;
            allSlots.push({ idx: slotIdx++, sbsVal, sbdVal, lookup });
          }
        }

        const rows0585: any[] = [];
        for (const decl of exportData) {
          const row: any = {
            PERNR: decl.EmployeeCode,
            BEGDA: fyStartDateStr,
            ENDDA: fyEndDateStr,
            ACOPC: declarationType === "Planned" ? "P" : "A",
          };

          // Parse SectionDetailsJSON to get declared amounts
          let sectionData: any[] = [];
          try {
            const json =
              declarationType === "Actual"
                ? plannedSectionJsonMap.get(decl.ID) || ""
                : (decl as any).SectionDetailsJSON || "";
            if (json) {
              const parsed = JSON.parse(json);
              sectionData = parsed[sectionTitle] || [];
            }
          } catch {
            // ignore
          }

          for (const slot of allSlots) {
            const pad = slot.idx.toString().padStart(2, "0");
            row[`SBS${pad}`] = slot.sbsVal;
            row[`SBD${pad}`] = slot.sbdVal;

            // Use PCN prefix for Planned declarations, ACN for Actual
            const pcnPrefix = declarationType === "Actual" ? "ACN" : "PCN";

            if (slot.lookup) {
              // Find the declared amount for this (SBS, SBD) pair by matching sbs/sbd values
              const match = sectionData.find(
                (item: any) =>
                  (item.sbs === slot.sbsVal.toString() &&
                    item.sbd === slot.sbdVal.toString()) ||
                  slot.lookup?.Types === item.investmentType,
              );
              row[`${pcnPrefix}${pad}`] = match
                ? Number(match.declaredAmount)
                : 0;
            } else {
              // Gap-fill: no lookup entry — amount is 0
              row[`${pcnPrefix}${pad}`] = 0;
            }
          }

          rows0585.push(row);
        }
        sheets.push({ sheetName: sectionCode, data: rows0585 });
        continue;
      }

      if (rawSheetName === "0586") {
        const fyParts = selectedYear.split("-");
        const startYearNum = parseInt(fyParts[0]);
        const fyStartDateStr = `01.04.${startYearNum}`;
        const fyEndDateStr = `31.03.${startYearNum + 1}`;

        const lookupsWithIndex = sectionLookups
          .map((l: any) => {
            const match = (l.Code || "").match(/(\d+)$/);
            return { ...l, index: match ? parseInt(match[0], 10) : 0 };
          })
          .sort((a, b) => a.index - b.index);

        const maxIndex =
          lookupsWithIndex.length > 0
            ? lookupsWithIndex[lookupsWithIndex.length - 1].index
            : 0;

        const rows0586: any[] = [];
        for (const decl of exportData) {
          const row: any = {
            PERNR: decl.EmployeeCode,
            BEGDA: fyStartDateStr,
            ENDDA: fyEndDateStr,
            ACOPC: declarationType === "Planned" ? "P" : "A",
          };

          let sectionData: any[] = [];
          try {
            const json = (decl as any).SectionDetailsJSON || "";
            if (json) {
              const parsed = JSON.parse(json);
              sectionData = parsed[sectionTitle] || [];
            }
          } catch {
            // ignore
          }

          for (let i = 1; i <= maxIndex; i++) {
            // Always insert the ITC column for this index
            const itcCode = `ITC${i.toString().padStart(2, "0")}`;
            row[itcCode] = i;

            // Determine the PIN/AIN column code
            const lookup = lookupsWithIndex.find((l) => l.index === i);
            let targetPinCode = lookup
              ? lookup.Code || ""
              : `PIN${i.toString().padStart(2, "0")}`;

            // If declaration type is Actual, replace the leading 'P' with 'A' (e.g. PIN01 -> AIN01)
            if (declarationType === "Actual") {
              targetPinCode = targetPinCode.replace(/^P/i, "A");
            }

            if (lookup) {
              const match = sectionData.find(
                (item: any) =>
                  item.investmentType === lookup.Types ||
                  item.code === lookup.Code,
              );
              row[targetPinCode] = match
                ? Number(match.declaredAmount) || 0
                : 0;
            } else {
              // If PIN is missing in lookup sequence, add a default column with 0
              row[targetPinCode] = 0;
            }
          }
          rows0586.push(row);
        }
        sheets.push({ sheetName: sectionCode, data: rows0586 });
        continue;
      }

      const pcnRows: any[] = [];
      const acnRows: any[] = [];
      for (const decl of exportData) {
        const pcnRow: any = { PERNR: decl.EmployeeCode };
        const acnRow: any = { PERNR: decl.EmployeeCode };

        // PCN: planned amounts — from PlannedDeclaration (Actual flow) or current declaration (Planned flow)
        let plannedSectionData: any[] = [];
        try {
          const plannedJson =
            declarationType === "Actual"
              ? plannedSectionJsonMap.get(decl.ID) || ""
              : (decl as any).SectionDetailsJSON || "";
          if (plannedJson) {
            const parsed = JSON.parse(plannedJson);
            plannedSectionData = parsed[sectionTitle] || [];
          }
        } catch {
          // ignore parse errors
        }

        // ACN: actual amounts — from ActualDeclaration's SectionDetailsJSON
        let actualSectionData: any[] = [];
        if (declarationType === "Actual") {
          try {
            if ((decl as any).SectionDetailsJSON) {
              const parsed = JSON.parse((decl as any).SectionDetailsJSON);
              actualSectionData = parsed[sectionTitle] || [];
            }
          } catch {
            // ignore parse errors
          }
        }

        for (const lookup of sectionLookups) {
          const lookupCode: string = lookup.Code || "";

          const plannedMatch = plannedSectionData.find(
            (item: any) =>
              item.investmentType === lookup.Types || item.code === lookup.Code,
          );
          pcnRow[lookupCode] = plannedMatch
            ? Number(plannedMatch.declaredAmount) || 0
            : 0;

          if (declarationType === "Actual") {
            const actualMatch = actualSectionData.find(
              (item: any) =>
                item.investmentType === lookup.Types ||
                item.code === lookup.Code,
            );
            acnRow[`${lookupCode.replace("P", "A")}`] = actualMatch
              ? Number(actualMatch.declaredAmount) || 0
              : 0;
          }
        }

        if (declarationType === "Actual") {
          acnRows.push(acnRow);
        } else {
          pcnRows.push(pcnRow);
        }
      }

      if (declarationType === "Actual") {
        sheets.push({ sheetName: sectionCode, data: acnRows });
      } else {
        sheets.push({ sheetName: sectionCode, data: pcnRows });
      }
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
          INT24: hl?.FinalLettableValue
            ? hl?.LetOutInterest
            : (hl?.Interest ?? ""),
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
        "Please select Declaration Type and Tax Regime before exporting",
      );
      return;
    }

    const exportData = declarations.filter(
      (d) =>
        d.DeclarationType === declarationType &&
        (!taxRegime || d.TaxRegime === taxRegime),
    );

    if (exportData.length === 0) {
      showToast(toast, "warn", "No Data", "No new records found for export");
      return;
    }

    setIsLoading(true);
    try {
      const fileName = `Declarations_${declarationType}_${selectedYear}_${taxRegime}_${moment().format("YYYYMMDDHHmmss")}`;
      if (taxRegime === "Old Regime") {
        // Build all Old Regime worksheets in parallel
        const [sheet0581, sheet0582, sheet0584, sectionSheets] =
          await Promise.all([
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

        if (activeTab == "Incremental") {
          // Send email with attachment to the current user
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
            "Mobile Number":
              (d as any).MobileNumber || masterEmp?.PhoneNo || "",
            Location: masterEmp?.Location || "",
            "PAN Number": (d as any).PAN || "",
          };
        });
        const newRegimeSheets = [
          { sheetName: "Basic Info", data: basicInfoSheet },
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
          const base64Data = generateExcelBase64MultiSheet(
            newRegimeSheets,
            fileName,
          );
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

      // 2. Batch Update IsExported Status
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
      setShowDownloadPopup(true);
      setTimeout(() => {
        setShowDownloadPopup(false);
      }, 3000);
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
          key={activeTab}
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
