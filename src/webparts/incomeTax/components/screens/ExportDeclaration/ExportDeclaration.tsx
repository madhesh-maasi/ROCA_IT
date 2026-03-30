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
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import {
  exportToExcel,
  generateExcelBase64,
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
      // 1. Export to Excel
      const excelData = exportData.map((d) => ({
        "Employee ID": d.EmployeeCode,
        "Employee Name": d.EmployeeName,
        "Email Address": d.Email,
        "Declaration Type": d.DeclarationType,
        "Tax Regime": d.TaxRegime,
      }));

      const fileName = `Declarations_${declarationType}_${selectedYear}`;
      exportToExcel(excelData, fileName);

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
        const base64Data = generateExcelBase64(excelData, fileName);
        if (base64Data && _FinanceApporvers?.length > 0) {
          await sendExportEmail(
            _FinanceApporvers,
            // "Finance Team",
            userDetails?.Title!,
            `${fileName}.xlsx`,
            base64Data,
            selectedYear,
          );
        }
        setShowDownloadPopup(true);
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

      // 3. Refresh
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
          <label className={styles.groupLabel}>Financial Year</label>
          <AppDropdown
            options={yearOptions}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.value as string)}
            className={styles.yearDropdown}
            placeholder="Select Year"
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.groupLabel}>Declaration Type</label>
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

        <div className={styles.filterGroup}>
          <label className={styles.groupLabel}>Tax Regime</label>
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
