import * as React from "react";
import {
  StatusBadge,
  StatusVariant,
} from "../../../../../CommonInputComponents/StatusBadge";
import AppDataTable, {
  IColumnDef,
} from "../../../../../CommonInputComponents/DataTable/DataTable";
import {
  ActionButton,
  AppDropdown,
  IDropdownOption,
  StatusPopup,
} from "../../../../../CommonInputComponents";
import { SearchInput } from "../../../../../CommonInputComponents/SearchInput";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  fetchIncomeTaxItems,
  fetchActualIncomeTaxItems,
  selectIncomeTaxItems,
  selectActualIncomeTaxItems,
  setSelectedItem,
} from "../../../../../store/slices/incomeTaxSlice";
import { useEffect } from "react";
import {
  getListItems,
  getDeclarationPDFUrl,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import {
  curFinanicalYear,
  getFYOptions,
} from "../../../../../common/utils/functions";
import { useNavigate, useLocation } from "react-router-dom";
import { exportToExcel } from "../../../../../common/utils/exportUtils";
import styles from "../screens.module.scss";
import { AppToast, showToast } from "../../../../../common/components";
import { Toast as PrimeToast } from "primereact/toast";

interface IEmployeeRow {
  id: number;
  requestId: string;
  financialYear: string;
  taxRegimeType: string;
  investmentType: string;
  employeeId: string;
  employeeName: string;
  dateOfSubmission: string;
  status: StatusVariant;
  declarationStatus: string;
}

// Remove static FY_OPTIONS

// ─── Column definitions ───────────────────────────────────────────────────────

// Column definitions move inside the component for dynamic rendering

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeDeclarations: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = React.useRef<PrimeToast>(null);
  const items = useAppSelector(selectIncomeTaxItems);
  const actualItems = useAppSelector(selectActualIncomeTaxItems);

  const [activeTab, setActiveTab] = React.useState<"Planned" | "Actual">(
    location.state?.tab || "Planned",
  );
  const [search, setSearch] = React.useState("");
  const [fy, setFy] = React.useState(curFinanicalYear);
  const [selectedRegime, setSelectedRegime] = React.useState("All");
  const [selectedStatus, setSelectedStatus] = React.useState("All");
  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false);

  const fyOptions = React.useMemo(() => {
    const allItems = [...items, ...actualItems];
    return getFYOptions(allItems);
  }, [items, actualItems]);

  useEffect(() => {
    const fetchItems = async () => {
      await dispatch(
        fetchIncomeTaxItems({
          getItems: () => getListItems(LIST_NAMES.PLANNED_DECLARATION),
        }),
      );
    };
    const fetchActualItems = async () => {
      await dispatch(
        fetchActualIncomeTaxItems({
          getItems: () => getListItems(LIST_NAMES.ACTUAL_DECLARATION),
        }),
      );
    };
    void fetchItems();
    void fetchActualItems();
  }, []);

  const tableData: IEmployeeRow[] = React.useMemo(() => {
    const sourceItems = activeTab === "Planned" ? items : actualItems;

    return sourceItems
      .filter((item) => {
        const isSubmitted =
          item.Status === "Submitted" || item.Status === "Approved";
        return isSubmitted;
      })
      .map((item: any) => ({
        id: item.Id,
        requestId: item.Title || `REQ-${item.Id}`,
        financialYear: item.FinancialYear || "",
        taxRegimeType: item.TaxRegime || "-",
        investmentType: item.DeclarationType || "",
        employeeId: item.EmployeeCode || "-",
        employeeName: item.EmployeeName || "-",
        dateOfSubmission: item.SubmittedDate
          ? new Date(item.SubmittedDate).toLocaleDateString("en-IN")
          : "-",
        status: (item.Status || "Submitted").toLowerCase() as StatusVariant,
        declarationStatus: item.DeclarationStatus || "Not Submitted",
      }));
  }, [items, activeTab]);

  const refined = tableData.filter(
    (row) =>
      row.financialYear === fy &&
      (selectedRegime === "All" || row.taxRegimeType === selectedRegime) &&
      (selectedStatus === "All" ||
        row.status.toLowerCase() === selectedStatus.toLowerCase()),
  );

  const statusOptions = React.useMemo(() => {
    const statuses = Array.from(new Set(tableData.map((r) => r.status)))
      .filter(Boolean)
      .sort();
    return [
      { label: "All Status", value: "All" },
      ...statuses.map((s) => ({
        label: s.charAt(0).toUpperCase() + s.slice(1),
        value: s,
      })),
    ];
  }, [tableData]);

  const handleDownloadPDF = async (row: IEmployeeRow) => {
    try {
      const pdfUrl = await getDeclarationPDFUrl(
        row.financialYear,
        row.employeeId,
      );
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("Error fetching PDF URL", error);
      showToast(toast, "error", "Error", "Could not retrieve the PDF file.");
    }
  };

  const columns: IColumnDef[] = React.useMemo(() => {
    const cols: IColumnDef[] = [
      {
        field: "requestId",
        header: "Request ID",
        body: (row: IEmployeeRow) => (
          <span className={styles.reqID}>{row.requestId}</span>
        ),
      },
      { field: "taxRegimeType", header: "Tax Regime Type" },
      { field: "investmentType", header: "Investment Type" },
      { field: "employeeId", header: "Employee ID" },
      { field: "employeeName", header: "Employee Name" },
      { field: "dateOfSubmission", header: "Date of Submission" },
      {
        field: "status",
        header: "Status",
        body: (row: IEmployeeRow) => <StatusBadge status={row.status} />,
      },
    ];

    if (activeTab === "Actual") {
      cols.push({
        field: "declarationStatus",
        header: "Declaration Status",
        body: (row: IEmployeeRow) => (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <StatusBadge
              status={
                row.declarationStatus === "Submitted"
                  ? "submitted"
                  : "not_submitted"
              }
            />
            {row.declarationStatus === "Submitted" && (
              <i
                className="pi pi-download"
                style={{ cursor: "pointer", color: "#307a8a" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadPDF(row);
                }}
              />
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [activeTab]);

  const handleExport = () => {
    const dataToExport = refined.map((row) => ({
      "Request ID": row.requestId,
      "Financial Year": row.financialYear,
      "Tax Regime": row.taxRegimeType,
      "Investment Type": row.investmentType,
      "Employee ID": row.employeeId,
      "Employee Name": row.employeeName,
      "Submission Date": row.dateOfSubmission,
      Status: row.status.toUpperCase(),
    }));

    const fileName = `${activeTab}_Declarations_${fy}`;
    if (dataToExport.length) {
      exportToExcel(dataToExport, fileName);
      setShowDownloadPopup(true);
      setTimeout(() => {
        setShowDownloadPopup(false);
      }, 3000);
    } else {
      showToast(toast, "warn", "No Data", "No records found for export.");
    }
  };

  return (
    <div className={styles.screen}>
      <AppToast toastRef={toast} />
      <StatusPopup
        visible={showDownloadPopup}
        onHide={() => setShowDownloadPopup(false)}
        type="download"
      />
      <h2 className={styles.pageTitle}>Submitted Declarations</h2>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabToggle}>
          {(["Planned", "Actual"] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={styles.rightSide}>
          <SearchInput value={search} onChange={(val) => setSearch(val)} />
          <div className={styles.filters}>
            <div style={{ width: "165px" }}>
              <AppDropdown
                value={selectedRegime}
                onChange={(e) => setSelectedRegime(e.value)}
                options={[
                  { label: "All", value: "All" },
                  { label: "Old Regime", value: "Old Regime" },
                  { label: "New Regime", value: "New Regime" },
                ]}
                placeholder="Tax Regime"
              />
            </div>
            <div style={{ width: "165px" }}>
              <AppDropdown
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.value)}
                options={statusOptions}
                placeholder="Status"
              />
            </div>
            <AppDropdown
              value={fy}
              onChange={(e) => setFy(e.value)}
              options={fyOptions}
            />
          </div>
          <ActionButton
            variant="export"
            icon="pi pi-download"
            label="Export"
            onClick={handleExport}
          />
        </div>
      </div>

      <AppDataTable
        data={refined}
        columns={columns}
        globalFilter={search}
        paginator
        rows={10}
        emptyMessage="No records found."
        cursor={true}
        onRowClick={(e: any) => {
          const rowData = e.data as IEmployeeRow;
          const sourceItems = activeTab === "Planned" ? items : actualItems;
          const originalItem = sourceItems.find(
            (item) => (item.Title || `REQ-${item.Id}`) === rowData.requestId,
          );
          if (originalItem) {
            if (activeTab == "Planned") {
              dispatch(setSelectedItem(originalItem));
              navigate("/itDeclaration", {
                state: { from: "employeeDeclaration", tab: activeTab },
              });
            } else {
              dispatch(setSelectedItem(originalItem));
              navigate("/actualItDeclaration", {
                state: { from: "employeeDeclaration", tab: activeTab },
              });
            }
          }
        }}
      />
    </div>
  );
};

export default EmployeeDeclarations;
