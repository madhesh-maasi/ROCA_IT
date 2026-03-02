import * as React from "react";
import {
  StatusBadge,
  StatusVariant,
} from "../../../../../components/StatusBadge";
import AppDataTable, {
  IColumnDef,
} from "../../../../../components/DataTable/DataTable";
import { ActionButton } from "../../../../../components";
import { SearchInput } from "../../../../../components/SearchInput";
import styles from "../screens.module.scss";

// ─── Mock data ────────────────────────────────────────────────────────────────

interface IEmployeeRow {
  requestId: string;
  taxRegimeType: string;
  investmentType: string;
  employeeId: string;
  employeeName: string;
  dateOfSubmission: string;
  status: StatusVariant;
}

const MOCK_DATA: IEmployeeRow[] = [
  {
    requestId: "6960164",
    taxRegimeType: "Old Regime",
    investmentType: "Planned",
    employeeId: "9002094",
    employeeName: "Ponraju E",
    dateOfSubmission: "06/01/2026",
    status: "submitted",
  },
  {
    requestId: "6965487",
    taxRegimeType: "New Regime",
    investmentType: "Planned",
    employeeId: "9002584",
    employeeName: "Ramesh",
    dateOfSubmission: "05/01/2026",
    status: "approved",
  },
  {
    requestId: "8516485",
    taxRegimeType: "Old Regime",
    investmentType: "Planned",
    employeeId: "9001258",
    employeeName: "Madhesh",
    dateOfSubmission: "03/01/2026",
    status: "approved",
  },
];

const FY_OPTIONS = ["2025 – 2026", "2024 – 2025", "2023 – 2024"];

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
  const [activeTab, setActiveTab] = React.useState<"Planned" | "Actual">(
    "Planned",
  );
  const [search, setSearch] = React.useState("");
  const [fy, setFy] = React.useState("2025 – 2026");

  const filtered = MOCK_DATA.filter(
    (row) =>
      search === "" ||
      row.requestId.includes(search) ||
      row.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      row.employeeId.includes(search),
  );

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
        <div className={styles.spacer} />
        <SearchInput value={search} onChange={(val) => setSearch(val)} />
        <select
          className={styles.fySelect}
          value={fy}
          onChange={(e) => setFy(e.target.value)}
        >
          {FY_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <ActionButton variant="export" icon="pi pi-download" label="Export" />
      </div>

      {/* DataTable */}
      <AppDataTable
        data={filtered}
        columns={COLUMNS}
        paginator
        rows={10}
        emptyMessage="No records found."
      />
    </div>
  );
};

export default EmployeeDeclarations;
