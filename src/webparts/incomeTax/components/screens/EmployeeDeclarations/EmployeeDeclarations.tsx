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
import { getListItems } from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import { curFinanicalYear } from "../../../../../common/utils/functions";
import { useNavigate } from "react-router-dom";
import { exportToExcel } from "../../../../../common/utils/exportUtils";
import styles from "../screens.module.scss";

// ─── Mock data ────────────────────────────────────────────────────────────────

interface IEmployeeRow {
  requestId: string;
  financialYear: string;
  taxRegimeType: string;
  investmentType: string;
  employeeId: string;
  employeeName: string;
  dateOfSubmission: string;
  status: StatusVariant;
}

const FY_OPTIONS: IDropdownOption[] = [
  curFinanicalYear,
  ...(() => {
    const start = parseInt(curFinanicalYear.split("-")[0]);
    return [`${start - 1}-${start}`, `${start - 2}-${start - 1}`];
  })(),
].map((yr) => ({ label: yr, value: yr }));

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: IColumnDef[] = [
  { field: "requestId", header: "Request ID" },
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

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeDeclarations: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const items = useAppSelector(selectIncomeTaxItems);
  const actualItems = useAppSelector(selectActualIncomeTaxItems);

  const [activeTab, setActiveTab] = React.useState<"Planned" | "Actual">(
    "Planned",
  );
  const [search, setSearch] = React.useState("");
  const [fy, setFy] = React.useState(curFinanicalYear);

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
      }));
  }, [items, activeTab]);

  const refined = tableData.filter(
    (row) =>
      row.financialYear === fy &&
      (search === "" ||
        row.requestId.toLowerCase().includes(search.toLowerCase()) ||
        row.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        row.employeeId.toLowerCase().includes(search.toLowerCase())),
  );

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
    exportToExcel(dataToExport, fileName);
  };

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Submitted Declarations</h2>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabGroup}>
          {(["Planned", "Actual"] as const).map((tab) => (
            <ActionButton
              variant="tab"
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab)}
              label={tab}
            />
          ))}
        </div>
        <div className={styles.rightSide}>
          <SearchInput value={search} onChange={(val) => setSearch(val)} />
          <AppDropdown
            value={fy}
            onChange={(e) => setFy(e.target.value)}
            options={FY_OPTIONS}
          />
          <ActionButton
            variant="export"
            icon="pi pi-download"
            label="Export"
            onClick={handleExport}
          />
        </div>
      </div>

      {/* DataTable */}
      <AppDataTable
        data={refined}
        columns={COLUMNS}
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
              navigate("/itDeclaration");
            } else {
              dispatch(setSelectedItem(originalItem));
              navigate("/actualItDeclaration");
            }
          }
        }}
      />
    </div>
  );
};

export default EmployeeDeclarations;
