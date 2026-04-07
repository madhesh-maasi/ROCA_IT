import * as React from "react";
import {
  StatusBadge,
  StatusVariant,
} from "../../../../../CommonInputComponents/StatusBadge";
import AppDataTable, {
  IColumnDef,
} from "../../../../../CommonInputComponents/DataTable/DataTable";
import { AppDropdown } from "../../../../../CommonInputComponents";
import { SearchInput } from "../../../../../CommonInputComponents/SearchInput";
import { useAppSelector } from "../../../../../store/hooks";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../screens.module.scss";
import {
  curFinanicalYear,
  getFYOptions,
} from "../../../../../common/utils/functions";
import {
  getMyActualDeclaration,
  getMyPlannedDeclaration,
  getSP,
  updateListItem,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import { selectUserDetails } from "../../../../../store/slices";
import { Loader } from "../../../../../common";
import moment from "moment";
import { AppToast, showToast } from "../../../../../common/components";
import { Toast as PrimeToast } from "primereact/toast";

// ─── Row definition ─────────────────────────────────────────────────────────────

interface ISubmittedRow {
  id: number;
  requestId: string;
  financialYear: string;
  regimeType: string;
  declarationType: string;
  dateOfSubmission: string;
  status: StatusVariant | string;
  declarationEndDate: string;
}

// ─── Columns ────────────────────────────────────────────────────────────────────

const COLUMNS: IColumnDef[] = [
  {
    field: "requestId",
    header: "Request ID",
    body: (row: ISubmittedRow) => (
      <span className={styles.reqID}>{row.requestId}</span>
    ),
    sortable: false,
  },
  { field: "financialYear", header: "Financial Year", sortable: false },
  { field: "regimeType", header: "Regime Type", sortable: false },
  { field: "dateOfSubmission", header: "Date of Submission", sortable: false },
  {
    field: "declarationEndDate",
    header: "Declaration End Date",
    sortable: false,
    body: (row: ISubmittedRow) => (
      <span>{moment(row.declarationEndDate).format("DD/MM/YYYY")}</span>
    ),
  },
  {
    field: "status",
    header: "Status",
    body: (row: ISubmittedRow) => (
      <StatusBadge status={row.status as StatusVariant} />
    ),
    sortable: false,
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
    ? moment(item.SubmittedDate).format("DD/MM/YYYY")
    : "-",
  status: (item.Status || "Draft").toLowerCase(),
  declarationEndDate: item.DeclarationEndDate
    ? new Date(item.DeclarationEndDate).toISOString()
    : "-",
});

// ─── Component ──────────────────────────────────────────────────────────────────

const SubmittedDeclarations: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = useAppSelector(selectUserDetails)?.Email;

  const [activeTab, setActiveTab] = React.useState<"Planned" | "Actual">(() => {
    const queryParams = new URLSearchParams(location.search);
    let tabParam = queryParams.get("tab");

    // If not found in hash-search, check main window search (SPFx/SharePoint often move params here)
    if (!tabParam) {
      const windowParams = new URLSearchParams(window.location.search);
      tabParam = windowParams.get("tab");
    }

    if (tabParam === "Planned" || tabParam === "Actual") {
      return tabParam as "Planned" | "Actual";
    }
    return location.state?.tab || "Planned";
  });
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [fy, setFy] = React.useState(curFinanicalYear);

  const [plannedRows, setPlannedRows] = React.useState<ISubmittedRow[]>([]);
  const [actualRows, setActualRows] = React.useState<ISubmittedRow[]>([]);

  const fyOptions = React.useMemo(() => {
    return getFYOptions([...plannedRows, ...actualRows]);
  }, [plannedRows, actualRows]);

  React.useEffect(() => {
    if (!userEmail) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const sp = getSP();
        const today = new Date().toISOString().split(".")[0] + "Z";
        // const emailFilter = `EmployeeEmail eq '${userEmail}' and FinancialYear eq '${fy}' and IsDelete ne 1 and datetime'${today}' lt DeclarationEndDate`;
        const emailFilter = `EmployeeEmail eq '${userEmail}' and FinancialYear eq '${fy}' and IsDelete ne 1`;

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
        if (actualItems.length > 0) {
          setActiveTab("Actual");
        } else {
          setActiveTab("Planned");
        }
        setPlannedRows(plannedItems.map(mapRow));
        setActualRows(actualItems.map(mapRow));
      } catch (err) {
        console.error("SubmittedDeclarations: fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [userEmail]);

  // Pick the right dataset based on active tab, then apply FY filter
  const tableData = (activeTab === "Planned" ? plannedRows : actualRows).filter(
    (row) => row.financialYear === fy,
  );

  const handleRowClick = async (row: any) => {
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
    <>
      <AppToast toastRef={toast} />
      {loading ? (
        <Loader />
      ) : (
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
              <div className={styles.filters}>
                <AppDropdown
                  className={styles.fySelect}
                  value={fy}
                  options={fyOptions}
                  onChange={(e) => setFy(e.value)}
                />
                {/* <SearchInput value={search} onChange={(val) => setSearch(val)} /> */}
              </div>
            </div>
          </div>

          {/* DataTable */}
          <AppDataTable
            data={tableData}
            columns={COLUMNS}
            globalFilter={search}
            emptyMessage={`No ${activeTab} declarations found for FY ${fy}.`}
            onRowClick={(row: any) => {
              const today = new Date().toISOString().split(".")[0] + "Z";
              if (today > row.data.declarationEndDate) {
                showToast(
                  toast,
                  "error",
                  "Error",
                  "Closed declarations can't be edited",
                );
                return;
              }
              handleRowClick(row);
            }}
          />

          {/* Note */}
          <div className={styles.noteBox}>please click on the request ID</div>
        </div>
      )}
    </>
  );
};

export default SubmittedDeclarations;
