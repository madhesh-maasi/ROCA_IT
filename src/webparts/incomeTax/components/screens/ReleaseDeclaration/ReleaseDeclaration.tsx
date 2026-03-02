import * as React from "react";
import styles from "./ReleaseDeclaration.module.scss";
import {
  AppPeoplePicker,
  AppCalendar,
  ActionButton,
  SearchInput,
  AppDataTable,
  IColumnDef,
  AppRadioButton,
  ExcelImport,
  IImportResult,
  IExcelColumn,
} from "../../../../../components";
import { AppFilePicker } from "../../../../../components/FilePicker/FilePicker";
import { IEmployee } from "../../../../../common/models";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import { useAppSelector } from "../../../../../store/hooks";
import { selectEmployees } from "../../../../../store/slices/employeeSlice";
import {
  getSP,
  addListItem,
  getListItems,
  addListItemsBatch,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import Loader from "../../../../../common/components/Loader/Loader";
import * as XLSX from "xlsx";
import moment from "moment";
import { curFinanicalYear } from "../../../../../common/utils/functions";

interface IReleaseData {
  DeclarationType: string;
  ReleaseType: string;
  SelectedUsers: string[];
  OnOrBefore: Date | null;
}

interface IReleasedItem {
  id: number;
  employeeId: string;
  employeeName: string;
  declarationType: string;
  releasedDate: string;
  status: string;
}

const ReleaseDeclaration: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);
  const employeeMaster: IEmployee[] = useAppSelector(selectEmployees) || [];

  // Form State
  const [formData, setFormData] = React.useState<IReleaseData>({
    DeclarationType: "",
    ReleaseType: "",
    SelectedUsers: [],
    OnOrBefore: null,
  });

  // UI State
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Data State
  const [releasedList, setReleasedList] = React.useState<IReleasedItem[]>([]);
  const [importResult, setImportResult] = React.useState<IImportResult | null>(
    null,
  );

  const excelColumns: IExcelColumn[] = [
    { key: "EmployeeID", label: "Employee ID", required: true },
    { key: "Title", label: "Employee Name", required: true },
  ];

  // ─── Fetch Released Data ──────────────────────────────────────────────────────────

  const fetchReleasedData = async () => {
    try {
      // In this demo, we assume "Status = Draft" items in IncomeTax imply they were just released
      // We'll also fetch items from IncomeTax for this view.
      const items = await getListItems(LIST_NAMES.INCOME_TAX);
      const mapped = items.map((item) => ({
        id: item.Id,
        employeeId: item.EmployeeID || "-", // Adjust based on actual field names
        employeeName: item.Title || "-", // Assuming Title holds Name or similar
        declarationType: item.DeclarationType || "Planned",
        releasedDate: item.Created
          ? new Date(item.Created).toLocaleDateString("en-IN")
          : "",
        status: item.Status || "Draft",
      }));
      setReleasedList(mapped);
    } catch (error) {
      console.error("Error fetching released declarations", error);
      showToast(toast, "error", "Error", "Failed to load released items.");
    }
  };

  React.useEffect(() => {
    void fetchReleasedData();
  }, []);

  // ─── Event Handlers ──────────────────────────────────────────────────────────────

  const handlePeoplePickerChange = (users: any[]) => {
    // AppPeoplePicker returns IEmployee objects
    const logins = users
      .map((u: IEmployee) => u.Email)
      .filter((email): email is string => Boolean(email));
    setFormData((p) => ({ ...p, SelectedUsers: logins }));
  };

  const handleExcelImport = (result: IImportResult) => {
    setImportResult(result);
    if (result.validData.length > 0) {
      const logins = result.validData
        .map((row) => row.EmployeeID)
        .filter((email): email is string => Boolean(email));

      setFormData((p) => ({
        ...p,
        SelectedUsers: Array.from(new Set([...p.SelectedUsers, ...logins])),
      }));
    }

    if (result.errors.length > 0) {
      showToast(
        toast,
        "warn",
        "Validation",
        `Found ${result.errors.length} errors in Excel file.`,
      );
    } else {
      showToast(toast, "success", "Success", "Excel file parsed successfully.");
    }
  };

  const handleRelease = async () => {
    // Basic validation
    if (
      formData.ReleaseType === "Release Selected" &&
      formData.SelectedUsers.length === 0
    ) {
      showToast(
        toast,
        "warn",
        "Validation",
        "Please select employees to release.",
      );
      return;
    }
    if (!formData.OnOrBefore) {
      showToast(
        toast,
        "warn",
        "Validation",
        "Please select an 'On or Before' date.",
      );
      return;
    }

    setIsLoading(true);
    try {
      const sp = getSP();
      let itemsToRelease: any[] = [];
      const targetEmails = formData.SelectedUsers;
      const _financialYear = curFinanicalYear;

      // Duplicate Check: Fetch existing records for current FY
      const existingRecords = await sp.web.lists
        .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
        .items.select("EmployeeCode")
        .filter(`FinancialYear eq '${_financialYear}' and IsDelete eq false`)();

      const existingCodes = new Set(
        existingRecords.map((r: any) => r.EmployeeCode),
      );

      if (formData.ReleaseType === "Release All") {
        itemsToRelease = employeeMaster.map((emp) => ({
          EmployeeName: emp.Title || emp.Name,
          EmployeeCode: emp.EmployeeId,
          FinancialYear: _financialYear,
          Status: "Draft",
          // DeclarationType: formData.DeclarationType,
          DeclarationEndDate: formData.OnOrBefore?.toISOString(),
          IsDelete: false,
        }));
      } else {
        targetEmails.forEach((email: string) => {
          const matchedEmp = employeeMaster.find((e) => e.Email === email);
          itemsToRelease.push({
            EmployeeName: matchedEmp
              ? matchedEmp.Title || matchedEmp.Name
              : email,
            EmployeeCode: matchedEmp ? matchedEmp.EmployeeId : "",
            Status: "Draft",
            FinancialYear: _financialYear,
            // DeclarationType: formData.DeclarationType,
            DeclarationEndDate: formData.OnOrBefore?.toISOString(),
            IsDelete: false,
          });
        });
      }

      // Filter out existing records
      const finalItems = itemsToRelease.filter(
        (item) => item.EmployeeCode && !existingCodes.has(item.EmployeeCode),
      );

      const skippedCount = itemsToRelease.length - finalItems.length;

      if (finalItems.length === 0) {
        showToast(
          toast,
          "warn",
          "Duplicate",
          skippedCount > 0
            ? `Selected employees already have a declaration for FY ${_financialYear}.`
            : "No valid employees to release.",
        );
        setIsLoading(false);
        return;
      }

      await addListItemsBatch(LIST_NAMES.PLANNED_DECLARATION, finalItems);

      showToast(
        toast,
        "success",
        "Success",
        skippedCount > 0
          ? `Released ${finalItems.length} declarations. Skipped ${skippedCount} duplicates.`
          : "Declaration Released successfully.",
      );

      // Reset form
      setFormData({
        DeclarationType: "Planned",
        ReleaseType: "Release Selected",
        SelectedUsers: [],
        OnOrBefore: null,
      });

      // Switch tab and refresh data
      setActiveIndex(1);
      await fetchReleasedData();
    } catch (err) {
      console.error(err);
      showToast(toast, "error", "Error", "Failed to release declarations.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Table Configurations ────────────────────────────────────────────────────────

  const empFilter = searchTerm.toLowerCase();

  // Format the redux state for the DataTable
  const employeeTableData = React.useMemo(() => {
    return employeeMaster
      .map((emp: IEmployee) => ({
        id: emp.Id,
        employeeId: emp.EmployeeId || "N/A",
        employeeName: emp.Name || emp.Title || "N/A",
      }))
      .filter(
        (e) =>
          e.employeeId.toLowerCase().includes(empFilter) ||
          e.employeeName.toLowerCase().includes(empFilter),
      );
  }, [employeeMaster, empFilter]);

  const releasedTableData = React.useMemo(() => {
    return releasedList.filter(
      (r) =>
        r.employeeId.toLowerCase().includes(empFilter) ||
        r.employeeName.toLowerCase().includes(empFilter) ||
        r.status.toLowerCase().includes(empFilter),
    );
  }, [releasedList, empFilter]);

  const empColumns: IColumnDef[] = [
    { field: "employeeId", header: "Employee ID", sortable: true },
    { field: "employeeName", header: "Employee Name", sortable: true },
  ];

  const releasedColumns: IColumnDef[] = [
    { field: "employeeId", header: "Employee ID", sortable: true },
    { field: "employeeName", header: "Employee Name", sortable: true },
    { field: "declarationType", header: "Declaration Type", sortable: true },
    { field: "releasedDate", header: "Released date", sortable: true },
    {
      field: "status",
      header: "Status",
      sortable: true,
      body: (rd: IReleasedItem) => (
        <span
          className={
            rd.status === "Submitted"
              ? styles.statusSubmitted
              : styles.statusDraft
          }
        >
          {rd.status}
        </span>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.screen}>
      <AppToast toastRef={toast} />
      {isLoading && <Loader fullScreen label="Processing Release..." />}

      <div className={styles.header}>
        <h2>Release Declaration</h2>
      </div>

      <div className={styles.formCard}>
        <div className={styles.row}>
          <div className={styles.col}>
            <label>Declaration Type</label>
            <div className={styles.radioGroup}>
              <AppRadioButton
                name="declarationType"
                value="Planned"
                label="Planned"
                selectedValue={formData.DeclarationType}
                onChange={(val) =>
                  setFormData((p) => ({ ...p, DeclarationType: val }))
                }
              />
              <AppRadioButton
                name="declarationType"
                value="Actual"
                label="Actual"
                selectedValue={formData.DeclarationType}
                onChange={(val) =>
                  setFormData((p) => ({ ...p, DeclarationType: val }))
                }
              />
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <label>Release Type </label>
            <div className={styles.radioGroup}>
              <AppRadioButton
                name="releaseType"
                value="Release All"
                label="Release All"
                selectedValue={formData.ReleaseType}
                onChange={(val) => {
                  setImportResult(null);
                  setFormData((p) => ({
                    ...p,
                    ReleaseType: val,
                    SelectedUsers: [],
                  }));
                }}
              />
              <AppRadioButton
                name="releaseType"
                value="Release Selected"
                label="Release Selected"
                selectedValue={formData.ReleaseType}
                onChange={(val) => {
                  setImportResult(null);
                  setFormData((p) => ({
                    ...p,
                    ReleaseType: val,
                    SelectedUsers: [],
                  }));
                }}
              />
              <AppRadioButton
                name="releaseType"
                value="Upload Excel"
                label="Upload Excel"
                selectedValue={formData.ReleaseType}
                onChange={(val) => {
                  setFormData((p) => ({
                    ...p,
                    ReleaseType: val,
                    SelectedUsers: [],
                  }));
                  setImportResult(null);
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles.rowWrapper}>
          {formData.ReleaseType === "Release Selected" && (
            <div className={styles.peoplePickerWrapper}>
              <AppPeoplePicker
                titleText="Choose Employees"
                selectedUsers={employeeMaster.filter(
                  (emp) =>
                    emp.Email && formData.SelectedUsers.includes(emp.Email),
                )}
                onChange={handlePeoplePickerChange}
                personSelectionLimit={100}
                source="EmployeeMaster"
              />
            </div>
          )}
          {formData.ReleaseType === "Upload Excel" && (
            <div className={styles.filePickerWrapper}>
              <ExcelImport
                columns={excelColumns}
                onImport={handleExcelImport}
                buttonLabel="Upload Excel File"
              />
            </div>
          )}
        </div>

        {importResult && importResult.errors.length > 0 && (
          <div className={styles.errorSummary}>
            <h4>Import Errors ({importResult.errors.length})</h4>
            <div className={styles.errorList}>
              {Object.entries(
                importResult.errors.reduce((acc: any, err) => {
                  if (!acc[err.row]) acc[err.row] = [];
                  acc[err.row].push(err.message);
                  return acc;
                }, {}),
              ).map(([row, errorList]: any, i) => (
                <div key={i} className={styles.errorRow}>
                  {row !== "0" && <strong>Row {row}:</strong>}{" "}
                  {errorList.join(", ")}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.row}>
          <div className={`${styles.col} ${styles.calendarCol}`}>
            <AppCalendar
              label="On or Before"
              required
              value={formData.OnOrBefore}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  OnOrBefore: (e.value as Date) || null,
                }))
              }
              showIcon
              minDate={new Date()}
            />
          </div>
        </div>

        <div className={styles.actionsRow}>
          <ActionButton
            variant="add"
            label="Release"
            icon="pi pi-check-square"
            disabled={
              formData.ReleaseType === "Upload Excel" &&
              (importResult === null || importResult.errors.length > 0)
            }
            onClick={() => {
              void handleRelease();
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsCard}>
        <div style={{ padding: "16px", borderBottom: "1px solid #dee2e6" }}>
          <div className={styles.searchToolbar}>
            <div className={styles.tabToggle}>
              <button
                className={`${styles.tabBtn} ${activeIndex === 0 ? styles.active : ""}`}
                onClick={() => setActiveIndex(0)}
              >
                Employee List
              </button>
              <button
                className={`${styles.tabBtn} ${activeIndex === 1 ? styles.active : ""}`}
                onClick={() => setActiveIndex(1)}
              >
                Released List
              </button>
            </div>

            <div className={styles.rightActions}>
              <div>
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search..."
                />
              </div>
              <div className={styles.actions}>
                <ActionButton variant="export" className="secondaryBtn" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.tabContent}>
          {activeIndex === 0 && (
            <AppDataTable
              columns={empColumns}
              data={employeeTableData}
              paginator
              rows={10}
            />
          )}
          {activeIndex === 1 && (
            <AppDataTable
              columns={releasedColumns}
              data={releasedTableData}
              paginator
              rows={10}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReleaseDeclaration;
