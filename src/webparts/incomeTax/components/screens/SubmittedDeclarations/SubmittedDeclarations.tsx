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
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../screens.module.scss";
import {
  curFinanicalYear,
  getFYOptions,
} from "../../../../../common/utils/functions";
import {
  getItemById,
  getListItems,
  getSP,
  updateListItem,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import {
  fetchIncomeTaxItems,
  selectUserDetails,
} from "../../../../../store/slices";
import TaxRegimePopup from "./TaxRegimePopup";
import { useDispatch } from "react-redux";

// ─── Row definition ─────────────────────────────────────────────────────────────

interface ISubmittedRow {
  id: number;
  requestId: string;
  financialYear: string;
  regimeType: string;
  declarationType: string;
  dateOfSubmission: string;
  status: StatusVariant | string;
}

// Remove static FY_OPTIONS

// ─── Columns ────────────────────────────────────────────────────────────────────

const COLUMNS: IColumnDef[] = [
  {
    field: "requestId",
    header: "Request ID",
    body: (row: ISubmittedRow) => (
      <span className={styles.reqID}>{row.requestId}</span>
    ),
  },
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
  id: item.Id,
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
  const location = useLocation();
  const userEmail = useAppSelector(selectUserDetails)?.Email;

  const [activeTab, setActiveTab] = React.useState<"Planned" | "Actual">(
    location.state?.tab || "Planned",
  );
  const [search, setSearch] = React.useState("");
  const [fy, setFy] = React.useState(curFinanicalYear);

  const [plannedRows, setPlannedRows] = React.useState<ISubmittedRow[]>([]);
  const [actualRows, setActualRows] = React.useState<ISubmittedRow[]>([]);

  const fyOptions = React.useMemo(() => {
    return getFYOptions([...plannedRows, ...actualRows]);
  }, [plannedRows, actualRows]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!userEmail) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const sp = getSP();
        const today = new Date().toISOString().split(".")[0] + "Z";
        const emailFilter = `EmployeeEmail eq '${userEmail}' and FinancialYear eq '${fy}' and IsDelete ne 1 and datetime'${today}' lt DeclarationEndDate`;

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

  // Pick the right dataset based on active tab, then apply FY filter
  const tableData = (activeTab === "Planned" ? plannedRows : actualRows).filter(
    (row) => row.financialYear === fy,
  );

  const handleRowClick = (row: any) => {
    if (activeTab === "Planned") {
      navigate("/itDeclaration", {
        state: { from: "submittedDeclarations", tab: activeTab },
      });
    } else {
      navigate("/actualItDeclaration", {
        state: { from: "submittedDeclarations", tab: activeTab },
      });
    }
  };

  return (
    <div className={styles.screen}>
      <h2 className={styles.pageTitle}>Submitted Declaration</h2>

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
          <AppDropdown
            className={styles.fySelect}
            value={fy}
            options={fyOptions}
            onChange={(e) => setFy(e.value)}
          />
          <SearchInput value={search} onChange={(val) => setSearch(val)} />
        </div>
      </div>

      {/* DataTable */}
      <AppDataTable
        data={tableData}
        columns={COLUMNS}
        globalFilter={search}
        emptyMessage={
          isLoading
            ? "Loading..."
            : `No ${activeTab} declarations found for FY ${fy}.`
        }
        onRowClick={(row) => handleRowClick(row)}
      />

      {/* Note */}
      <div className={styles.noteBox}>please click on the request ID</div>
    </div>
  );
};

export default SubmittedDeclarations;
