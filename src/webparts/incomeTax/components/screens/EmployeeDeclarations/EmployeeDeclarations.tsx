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
  globalSearchFilter,
} from "../../../../../common/utils/functions";
import { useNavigate, useLocation } from "react-router-dom";
import { exportToExcel } from "../../../../../common/utils/exportUtils";
import styles from "../screens.module.scss";
import { AppToast, showToast, Loader } from "../../../../../common/components";
import { Toast as PrimeToast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { updateListItem } from "../../../../../common/utils/pnpService";
import { sendApprovalEmail } from "../../../../../common/utils/emailService";
import { selectUserDetails } from "../../../../../store/slices/userSlice";
import moment from "moment";

interface IEmployeeRow {
  id: number;
  requestId: string;
  financialYear: string;
  taxRegimeType: string;
  investmentType: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  dateOfSubmission: string;
  status: StatusVariant;
  declarationStatus: string;
  isChecked?: boolean;
}

const EmployeeDeclarations: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = React.useRef<PrimeToast>(null);
  const items = useAppSelector(selectIncomeTaxItems);
  const actualItems = useAppSelector(selectActualIncomeTaxItems);

  const [activeTab, setActiveTab] = React.useState<"Planned" | "Actual">(
    location.state?.tab || "",
  );
  const [search, setSearch] = React.useState("");
  const [fy, setFy] = React.useState(curFinanicalYear);
  const [selectedRegime, setSelectedRegime] = React.useState("All");
  const [selectedStatus, setSelectedStatus] = React.useState("All");
  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<IEmployeeRow[]>([]);
  const selectedRowsRef = React.useRef<IEmployeeRow[]>(selectedRows);
  selectedRowsRef.current = selectedRows;
  const [isProcessing, setIsProcessing] = React.useState(false);
  const currentUser = useAppSelector(selectUserDetails);

  const fyOptions = React.useMemo(() => {
    const allItems = [...items, ...actualItems];
    return getFYOptions(allItems);
  }, [items, actualItems]);

  const init = async (): Promise<void> => {
    setIsProcessing(true);
    const fetchItems = async () => {
      await dispatch(
        fetchIncomeTaxItems({
          getItems: () =>
            getListItems(
              LIST_NAMES.PLANNED_DECLARATION,
              `FinancialYear eq '${curFinanicalYear}'`,
            ),
        }),
      );
    };
    const fetchActualItems = async () => {
      const result = await dispatch(
        fetchActualIncomeTaxItems({
          getItems: () =>
            getListItems(
              LIST_NAMES.ACTUAL_DECLARATION,
              `FinancialYear eq '${curFinanicalYear}'`,
            ),
        }),
      );
      return result;
    };
    void (await fetchItems());
    const actualResult = await fetchActualItems();

    // Set active tab based on fetched actual items, before loader dismisses
    if (!location.state?.tab) {
      const fetchedActualItems = (actualResult as any)?.payload || [];
      if (fetchedActualItems.length > 0) {
        setActiveTab("Actual");
      } else {
        setActiveTab("Planned");
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    setIsProcessing(false);
  };

  useEffect(() => {
    void init();
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
        employeeEmail: item.EmployeeEmail || "",
        dateOfSubmission: item.SubmittedDate
          ? moment(item.SubmittedDate).format("DD/MM/YYYY")
          : "-",
        status: (item.Status || "Submitted").toLowerCase() as StatusVariant,
        declarationStatus: item.DeclarationStatus || "Not Submitted",
        isChecked: false,
      }));
  }, [items, actualItems, activeTab]);

  const refined = tableData.filter(
    (row) =>
      row.financialYear === fy &&
      (selectedRegime === "All" || row.taxRegimeType === selectedRegime) &&
      (selectedStatus === "All" ||
        row.status.toLowerCase() === selectedStatus.toLowerCase()),
  );

  // Map the selection status into the row data to force PrimeReact row re-renders
  const finalData = React.useMemo(() => {
    return refined.map((row) => ({
      ...row,
      isChecked: selectedRows.some((r) => Number(r.id) === Number(row.id)),
    }));
  }, [refined, selectedRows]);

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

  const handleBulkApprove = async () => {
    if (selectedRows.length === 0) return;

    setIsProcessing(true);
    try {
      const listName =
        activeTab === "Planned"
          ? LIST_NAMES.PLANNED_DECLARATION
          : LIST_NAMES.ACTUAL_DECLARATION;

      for (const row of selectedRows) {
        await updateListItem(listName, row.id, { Status: "Approved" });

        if (row.employeeEmail) {
          await sendApprovalEmail(
            row.employeeName,
            row.employeeId,
            row.employeeEmail,
            activeTab,
            row.financialYear,
            currentUser as any,
            row.requestId,
            row.id,
            "ActualApproved",
          );
        }
      }

      showToast(
        toast,
        "success",
        "Success",
        `${selectedRows.length} declarations approved successfully.`,
      );

      // Refresh data
      if (activeTab === "Planned") {
        await dispatch(
          fetchIncomeTaxItems({
            getItems: () =>
              getListItems(
                LIST_NAMES.PLANNED_DECLARATION,
                `FinancialYear eq '${curFinanicalYear}'`,
              ),
          }),
        );
      } else {
        await dispatch(
          fetchActualIncomeTaxItems({
            getItems: () =>
              getListItems(
                LIST_NAMES.ACTUAL_DECLARATION,
                `FinancialYear eq '${curFinanicalYear}'`,
              ),
          }),
        );
      }

      setSelectedRows([]);
    } catch (error) {
      console.error("Error during bulk approval", error);
      showToast(
        toast,
        "error",
        "Error",
        "An error occurred during bulk approval.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Compute selectable rows & "all selected" state fresh every render
  const selectableRows = refined.filter(
    (r) =>
      r.taxRegimeType === "New Regime" && r.status.toLowerCase() !== "approved",
  );

  const isAllSelected =
    selectableRows.length > 0 &&
    selectableRows.every((row) =>
      selectedRows.some((r) => Number(r.id) === Number(row.id)),
    );

  // Compute columns with memoization to ensure re-render when selection changes
  const columns = React.useMemo(() => {
    const cols: IColumnDef[] = [
      {
        field: "selection",
        header: (
          <Checkbox
            checked={isAllSelected}
            disabled={selectableRows.length === 0}
            onChange={(e) => {
              const checked = e.checked === true;
              if (checked) {
                setSelectedRows([...selectableRows]);
              } else {
                setSelectedRows([]);
              }
            }}
          />
        ),
        body: (row: IEmployeeRow) => {
          const isSelectable =
            row.taxRegimeType === "New Regime" &&
            row.status.toLowerCase() == "submitted";

          if (!isSelectable) return null;

          const isChecked = !!row.isChecked;

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                key={isChecked ? `checked_${row.id}` : `unchecked_${row.id}`}
                checked={isChecked}
                onChange={(e) => {
                  if (e.checked) {
                    setSelectedRows((prev) => [...prev, row]);
                  } else {
                    setSelectedRows((prev) =>
                      prev.filter((r) => Number(r.id) !== Number(row.id)),
                    );
                  }
                }}
              />
            </div>
          );
        },
        sortable: false,
        style: { width: "3%" },
      },
      {
        field: "requestId",
        header: "Request ID",
        body: (row: IEmployeeRow) => (
          <span className={styles.reqID}>{row.requestId}</span>
        ),
        style: { width: "15%" },
      },
      {
        field: "taxRegimeType",
        header: "Tax Regime Type",
        style: { width: "11%" },
      },
      { field: "investmentType", header: "Investment Type" },
      { field: "employeeId", header: "Employee ID", style: { width: "10%" } },
      { field: "employeeName", header: "Employee Name" },
      { field: "dateOfSubmission", header: "Date of Submission" },
      {
        field: "status",
        header: "Status",
        body: (row: IEmployeeRow) => <StatusBadge status={row.status} />,
        style: { width: "10%" },
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
                  void handleDownloadPDF(row);
                }}
              />
            )}
          </div>
        ),
      });
    }
    return cols;
  }, [
    selectedRows,
    refined,
    activeTab,
    isAllSelected,
    selectableRows,
    handleDownloadPDF,
  ]);

  const handleExport = () => {
    const searchedData = globalSearchFilter(finalData, search);
    const dataToExport = searchedData.map((row) => ({
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
      showToast(toast, "warn", "No Data", "No data to export.");
    }
  };

  return (
    <div className={styles.screen}>
      <AppToast toastRef={toast} />
      {isProcessing && <Loader />}
      <StatusPopup
        visible={showDownloadPopup}
        onHide={() => setShowDownloadPopup(false)}
        type="download"
      />
      <h2 className={styles.pageTitle}>Employee Declarations</h2>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabToggle}>
          {(["Planned", "Actual"] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setSearch("");
                setSelectedRegime("All");
                setSelectedStatus("All");
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div
        className={styles.rightSide}
        style={{ width: "100%", justifyContent: "flex-end", marginBottom: 10 }}
      >
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
          <div style={{ width: "175px" }}>
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
        {selectedRows.length > 0 && !isProcessing && (
          <ActionButton
            variant="export"
            icon="pi pi-check"
            label={`Approve`}
            onClick={handleBulkApprove}
          />
        )}
      </div>

      <AppDataTable
        data={finalData}
        columns={columns}
        dataKey="id"
        globalFilter={search}
        paginator={finalData.length > 1}
        rows={10}
        emptyMessage="No records found."
        cursor={true}
        onRowClick={(e: any) => {
          // Skip navigation if user clicked on a checkbox
          const target = e.originalEvent?.target as HTMLElement;
          if (
            target?.closest(".p-checkbox") ||
            target?.closest("[data-pc-name='checkbox']")
          ) {
            return;
          }

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
