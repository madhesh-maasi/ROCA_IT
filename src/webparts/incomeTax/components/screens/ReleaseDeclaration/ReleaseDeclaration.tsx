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
  StatusBadge,
  StatusVariant,
} from "../../../../../CommonInputComponents";
import { IEmployee } from "../../../../../common/models";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import { useAppSelector } from "../../../../../store/hooks";
import { selectEmployees } from "../../../../../store/slices/employeeSlice";
import {
  getSP,
  getListItems,
  addListItemsBatch,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import Loader from "../../../../../common/components/Loader/Loader";
import { exportToExcel } from "../../../../../common/utils/exportUtils";
import { curFinanicalYear } from "../../../../../common/utils/functions";
import RequiredSympol from "../../../../../common/components/RequiredSympol/RequiredSympol";

interface IReleaseData {
  DeclarationType: string;
  ReleaseType: string;
  SelectedUsers: string[];
  OnOrBefore: Date | null;
}

interface IReleasedItem {
  employeeId: string;
  employeeName: string;
  declarationType: string;
  releasedDate: string;
  status: StatusVariant | string;
}

const ReleaseDeclaration: React.FC = () => {
  const _financialYear = curFinanicalYear;
  const toast = React.useRef<PrimeToast>(null);
  const employeeMaster: IEmployee[] = useAppSelector(selectEmployees) || [];

  // Form State
  const [formData, setFormData] = React.useState<IReleaseData>({
    DeclarationType: "",
    ReleaseType: "",
    SelectedUsers: [],
    OnOrBefore: null,
  });

  const [excelEmployees, setExcelEmployees] = React.useState<any[]>([]);

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
      const items = await getListItems(LIST_NAMES.PLANNED_DECLARATION);
      const mapped = items.map((item) => ({
        employeeId: item.EmployeeCode || "-", // Adjust based on actual field names
        employeeName: item.EmployeeName || "-", // Assuming Title holds Name or similar
        declarationType: item.DeclarationType || "Planned",
        releasedDate: item.Created
          ? new Date(item.Created).toLocaleDateString("en-IN")
          : "",
        status: (item.Status || "Draft").toLowerCase(),
      }));
      setReleasedList(mapped);
    } catch (error) {
      console.error("Error fetching released declarations", error);
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
      setExcelEmployees(result.validData);
    } else {
      setExcelEmployees([]);
    }

    if (result.errors.length > 0) {
      showToast(
        toast,
        "warn",
        "Validation",
        `Found ${result.errors.length} errors in Excel file.`,
      );
    }
  };

  const removeExcelEmployee = (empId: string) => {
    setExcelEmployees((prev) => prev.filter((p) => p.EmployeeID !== empId));
  };

  const handleRelease = async () => {
    // Basic validation
    if (!formData.DeclarationType) {
      showToast(
        toast,
        "warn",
        "Validation",
        "Please select a Declaration Type.",
      );
      return;
    }
    if (!formData.ReleaseType) {
      showToast(toast, "warn", "Validation", "Please select a Release Type.");
      return;
    }
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
    if (
      formData.ReleaseType === "Upload Excel" &&
      excelEmployees.length === 0
    ) {
      showToast(
        toast,
        "warn",
        "Validation",
        "Please upload valid excel data to release.",
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
      const isActual = formData.DeclarationType === "Actual";

      if (formData.ReleaseType === "Release All") {
        itemsToRelease = employeeMaster.map((emp) => ({
          EmployeeName: emp.Title || emp.Name,
          EmployeeCode: emp.EmployeeId,
          EmployeeEmail: emp.Email,
          FinancialYear: _financialYear,
          Status: "Released",
          DeclarationType: formData.DeclarationType,
          DeclarationEndDate: formData.OnOrBefore?.toISOString(),
          IsDelete: false,
        }));
      } else if (formData.ReleaseType === "Release Selected") {
        targetEmails.forEach((email: string) => {
          const matchedEmp = employeeMaster.find((e) => e.Email === email);
          itemsToRelease.push({
            EmployeeName: matchedEmp
              ? matchedEmp.Title || matchedEmp.Name
              : email,
            EmployeeCode: matchedEmp ? matchedEmp.EmployeeId : "",
            EmployeeEmail: matchedEmp ? matchedEmp.Email : "",
            Status: "Released",
            FinancialYear: _financialYear,
            DeclarationType: formData.DeclarationType,
            DeclarationEndDate: formData.OnOrBefore?.toISOString(),
            IsDelete: false,
          });
        });
      } else if (formData.ReleaseType === "Upload Excel") {
        excelEmployees.forEach((row) => {
          itemsToRelease.push({
            EmployeeName: row.Title,
            EmployeeCode: row.EmployeeID.toString(),
            EmployeeEmail: row.Email,
            Status: "Released",
            FinancialYear: _financialYear,
            DeclarationType: formData.DeclarationType,
            DeclarationEndDate: formData.OnOrBefore?.toISOString(),
            IsDelete: false,
          });
        });
      }

      // ─── Actual Declaration: validate approved planned declarations ────────────
      if (isActual) {
        // Fetch all planned declarations for the current FY
        const plannedRecords = await sp.web.lists
          .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
          .items.select("Id", "EmployeeCode", "Status")
          .filter(
            `FinancialYear eq '${_financialYear}' and IsDelete eq false`,
          )();

        // Build a map: EmployeeCode → { Id, Status }
        const plannedMap = new Map<string, { Id: number; Status: string }>();
        plannedRecords.forEach((r: any) => {
          if (r.EmployeeCode) {
            plannedMap.set(r.EmployeeCode, { Id: r.Id, Status: r.Status });
          }
        });

        // Identify employees without an Approved planned declaration
        const notApproved = itemsToRelease.filter((item) => {
          const record = plannedMap.get(item.EmployeeCode);
          return !record || record.Status !== "Approved";
        });

        if (notApproved.length > 0) {
          const names = notApproved
            .map((item) => `${item.EmployeeName} (${item.EmployeeCode})`)
            .join(", ");
          showToast(
            toast,
            "error",
            "Validation Failed",
            `The following employees do not have an Approved Planned Declaration for FY ${_financialYear}: ${names}`,
          );
          setIsLoading(false);
          return;
        }

        // Attach PlannedDeclarationId (lookup) to each item and write to Actual list
        const actualItems = itemsToRelease.map((item) => ({
          ...item,
          PlannedDeclarationId: plannedMap.get(item.EmployeeCode)!.Id,
        }));

        await addListItemsBatch(LIST_NAMES.ACTUAL_DECLARATION, actualItems);

        showToast(
          toast,
          "success",
          "Success",
          `Released ${actualItems.length} Actual Declaration(s) successfully.`,
        );

        // Reset form & refresh
        setFormData({
          DeclarationType: "",
          ReleaseType: "",
          SelectedUsers: [],
          OnOrBefore: null,
        });
        setExcelEmployees([]);
        setActiveIndex(0);
        await fetchReleasedData();
        return;
      }

      // ─── Planned Declaration: existing duplicate-check logic ──────────────────
      const existingRecords = await sp.web.lists
        .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
        .items.select("EmployeeCode")
        .filter(`FinancialYear eq '${_financialYear}' and IsDelete eq false`)();

      const existingCodes = new Set(
        existingRecords.map((r: any) => r.EmployeeCode),
      );

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
        DeclarationType: "",
        ReleaseType: "",
        SelectedUsers: [],
        OnOrBefore: null,
      });
      setExcelEmployees([]);

      // Switch tab and refresh data
      setActiveIndex(0);
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
        <StatusBadge status={rd.status as StatusVariant} />
      ),
    },
  ];

  const handleExport = () => {
    const dataToExport =
      activeIndex === 0 ? employeeTableData : releasedTableData;
    const fileName = activeIndex === 0 ? "Employee_List" : "Released_List";

    exportToExcel(dataToExport, fileName);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────────

  return (
    <div>
      <AppToast toastRef={toast} />
      {isLoading && <Loader fullScreen label="Processing Release..." />}

      <div className={styles.header}>
        <h2>Release Declaration</h2>
      </div>

      <div className={styles.formCard}>
        <div className={styles.row}>
          <div className={styles.col}>
            <label>
              Declaration Type <RequiredSympol />
            </label>
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
            <label>
              Release Type <RequiredSympol />
            </label>
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
                  setExcelEmployees([]);
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
                  setExcelEmployees([]);
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
                  setExcelEmployees([]);
                  setImportResult(null);
                }}
              />
            </div>
          </div>
        </div>

        {formData.ReleaseType && (
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
                {excelEmployees.length > 0 && (
                  <div className={styles.chipArea}>
                    {excelEmployees.map((emp, idx) => (
                      <div key={idx} className={styles.chip}>
                        <span className={styles.chipLabel}>
                          {emp.Title} ({emp.EmployeeID})
                        </span>
                        <span
                          className={styles.chipRemove}
                          onClick={() => removeExcelEmployee(emp.EmployeeID)}
                        >
                          ×
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
              (formData.ReleaseType === "Upload Excel" &&
                excelEmployees.length === 0) ||
              (formData.ReleaseType === "Release Selected" &&
                formData.SelectedUsers.length === 0)
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
                <ActionButton
                  variant="export"
                  className="secondaryBtn"
                  onClick={handleExport}
                />
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
