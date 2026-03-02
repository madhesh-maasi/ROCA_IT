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

interface ISubmittedRow {
  requestId: string;
  financialYear: string;
  regimeType: string;
  dateOfSubmission: string;
  status: StatusVariant;
}

const MOCK_DATA: ISubmittedRow[] = [
  {
    requestId: "6960164",
    financialYear: "2025 – 2026",
    regimeType: "Old Regime",
    dateOfSubmission: "06/01/2026",
    status: "submitted",
  },
  {
    requestId: "6965487",
    financialYear: "2025 – 2026",
    regimeType: "New Regime",
    dateOfSubmission: "05/01/2026",
    status: "approved",
  },
  {
    requestId: "8516485",
    financialYear: "2025 – 2026",
    regimeType: "Old Regime",
    dateOfSubmission: "03/01/2026",
    status: "approved",
  },
];

const FY_OPTIONS = ["2025 – 2026", "2024 – 2025", "2023 – 2024"];

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: IColumnDef[] = [
  { field: "requestId", header: "Request ID" },
  { field: "financialYear", header: "Financial Year" },
  { field: "regimeType", header: "Regime Type" },
  { field: "dateOfSubmission", header: "Date of Submission" },
  {
    field: "status",
    header: "Status",
    body: (row: ISubmittedRow) => <StatusBadge status={row.status} />,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const SubmittedDeclarations: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<"Planned" | "Actual">(
    "Planned",
  );
  const [search, setSearch] = React.useState("");
  const [fy, setFy] = React.useState("2025 – 2026");

  const filtered = MOCK_DATA.filter(
    (row) =>
      row.financialYear === fy &&
      (search === "" ||
        row.requestId.includes(search) ||
        row.regimeType.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Submitted Declaration</h2>

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
        <select
          className={styles.fySelect}
          value={fy}
          onChange={(e) => setFy(e.target.value)}
        >
          {FY_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <SearchInput value={search} onChange={(val) => setSearch(val)} />
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

export default SubmittedDeclarations;
