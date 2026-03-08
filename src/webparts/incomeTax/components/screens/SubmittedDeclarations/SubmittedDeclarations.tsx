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
import { useAppSelector } from "../../../../../store/hooks";
import { useNavigate } from "react-router-dom";
import styles from "../screens.module.scss";
import { curFinanicalYear } from "../../../../../common/utils/functions";
import { getSP } from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import { selectUserDetails } from "../../../../../store/slices";

// ─── Row definition ─────────────────────────────────────────────────────────────

interface ISubmittedRow {
  requestId: string;
  financialYear: string;
  regimeType: string;
  declarationType: string;
  dateOfSubmission: string;
  status: StatusVariant | string;
}

const getPastFYOptions = () => {
  const current = curFinanicalYear;
  const start = parseInt(current.split("-")[0]);
  return [
    `${start}-${start + 1}`,
    `${start - 1}-${start}`,
    `${start - 2}-${start - 1}`,
    `${start - 3}-${start - 2}`,
  ];
};

const FY_OPTIONS: IDropdownOption[] = getPastFYOptions().map((yr) => ({
  label: yr,
  value: yr,
}));

// ─── Columns ────────────────────────────────────────────────────────────────────

const COLUMNS: IColumnDef[] = [
  { field: "requestId", header: "Request ID" },
  { field: "financialYear", header: "Financial Year" },
  { field: "regimeType", header: "Regime Type" },
  { field: "dateOfSubmission", header: "Date of Submission" },
  {
    field: "status",
    header: "Status",
    body: (row: ISubmittedRow) => (
      <StatusBadge status={row.status as StatusVariant} />
    ),
  },
];

// ─── Map a raw SP item to ISubmittedRow ─────────────────────────────────────────

const mapRow = (item: any): ISubmittedRow => ({
  requestId: item.Title || `REQ-${item.Id}`,
  financialYear: item.FinancialYear || "",
  regimeType: item.TaxRegime || "-",
  declarationType: item.DeclarationType || "",
  dateOfSubmission: item.SubmittedDate
    ? new Date(item.SubmittedDate).toLocaleDateString("en-IN")
    : item.Modified
      ? new Date(item.Modified).toLocaleDateString("en-IN")
      : "-",
  status: (item.Status || "Draft").toLowerCase(),
});

// ─── Component ──────────────────────────────────────────────────────────────────

const SubmittedDeclarations: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = useAppSelector(selectUserDetails)?.Email;

  const [activeTab, setActiveTab] = React.useState<"Planned" | "Actual">(
    "Planned",
  );
  const [search, setSearch] = React.useState("");
  const [fy, setFy] = React.useState(curFinanicalYear);

  const [plannedRows, setPlannedRows] = React.useState<ISubmittedRow[]>([]);
  const [actualRows, setActualRows] = React.useState<ISubmittedRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch both lists once on mount (or when userEmail is ready)
  React.useEffect(() => {
    if (!userEmail) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const sp = getSP();
        const emailFilter = `EmployeeEmail eq '${userEmail}' and IsDelete ne 1`;

        const [plannedItems, actualItems] = await Promise.all([
          sp.web.lists
            .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
            .items.filter(emailFilter)
            .orderBy("Id", false)
            .top(5000)(),
          sp.web.lists
            .getByTitle(LIST_NAMES.ACTUAL_DECLARATION)
            .items.filter(emailFilter)
            .orderBy("Id", false)
            .top(5000)(),
        ]);

        setPlannedRows(plannedItems.map(mapRow));
        setActualRows(actualItems.map(mapRow));
      } catch (err) {
        console.error("SubmittedDeclarations: fetch error", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [userEmail]);

  // Pick the right dataset based on active tab, then apply FY + search filters
  const tableData = (activeTab === "Planned" ? plannedRows : actualRows).filter(
    (row) =>
      row.financialYear === fy &&
      (search === "" ||
        row.requestId.toLowerCase().includes(search.toLowerCase()) ||
        row.regimeType.toLowerCase().includes(search.toLowerCase()) ||
        row.status.toString().toLowerCase().includes(search.toLowerCase())),
  );

  const handleRowClick = () => {
    if (activeTab === "Planned") {
      navigate("/itDeclaration");
    } else {
      navigate("/actualItDeclaration");
    }
  };

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
        <div className={styles.rightSide}>
          <AppDropdown
            className={styles.fySelect}
            value={fy}
            options={FY_OPTIONS}
            onChange={(e) => setFy(e.value)}
          />
          <SearchInput value={search} onChange={(val) => setSearch(val)} />
        </div>
      </div>

      {/* DataTable */}
      <AppDataTable
        data={tableData}
        columns={COLUMNS}
        paginator
        rows={10}
        emptyMessage={
          isLoading
            ? "Loading..."
            : `No ${activeTab} declarations found for FY ${fy}.`
        }
        onRowClick={handleRowClick}
      />
    </div>
  );
};

export default SubmittedDeclarations;
