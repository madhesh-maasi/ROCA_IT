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
  AppDropdown,
  IDropdownOption,
  StatusPopup,
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
  getAllItems,
  getNextSequence,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import Loader from "../../../../../common/components/Loader/Loader";
import { exportToExcel } from "../../../../../common/utils/exportUtils";
import {
  curFinanicalYear,
  getFYOptions,
  globalSearchFilter,
} from "../../../../../common/utils/functions";
import RequiredSympol from "../../../../../common/components/RequiredSympol/RequiredSympol";
import { sendReleaseEmails } from "../../../../../common/utils/emailService";
import { selectUserDetails } from "../../../../../store/slices";
import moment from "moment";

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
  location: string;
  financialYear: string;
}

const ReleaseDeclaration: React.FC = () => {
  const _financialYear = curFinanicalYear;
  const toast = React.useRef<PrimeToast>(null);
  const employeeMaster: IEmployee[] = useAppSelector(selectEmployees) || [];
  const user = useAppSelector(selectUserDetails);

  const [formData, setFormData] = React.useState<IReleaseData>({
    DeclarationType: "",
    ReleaseType: "",
    SelectedUsers: [],
    OnOrBefore: null,
  });

  const [excelEmployees, setExcelEmployees] = React.useState<any[]>([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [releasedList, setReleasedList] = React.useState<IReleasedItem[]>([]);
  const [importResult, setImportResult] = React.useState<IImportResult | null>(
    null,
  );

  const [selectedFY, setSelectedFY] = React.useState(_financialYear);
  const [selectedLocation, setSelectedLocation] = React.useState("All");
  const [selectedType, setSelectedType] = React.useState("All");
  const [selectedStatus, setSelectedStatus] = React.useState("All");
  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false);

  const excelColumns: IExcelColumn[] = [
    { key: "EmployeeID", label: "Employee ID" },
  ];

  const fetchReleasedData = async () => {
    try {
      setIsLoading(true);
      const [planned, actual] = await Promise.all([
        getListItems(
          LIST_NAMES.PLANNED_DECLARATION,
          `FinancialYear eq '${curFinanicalYear}'`,
        ),
        getListItems(
          LIST_NAMES.ACTUAL_DECLARATION,
          `FinancialYear eq '${curFinanicalYear}'`,
        ),
      ]);

      const processRecords = (records: any[], type: string) =>
        records.map((item) => {
          const emp = employeeMaster.find(
            (e) => e.EmployeeId === item.EmployeeCode,
          );
          return {
            employeeId: item.EmployeeCode || "-",
            employeeName: item.EmployeeName || emp?.Title || "-",
            declarationType: type,
            releasedDate: item.Created
              ? moment(item.Created).format("DD/MM/YYYY")
              : "",
            status: (item.Status || "Draft").toLowerCase(),
            location: emp?.Location || "-",
            financialYear: item.FinancialYear || "N/A",
            declarationEndDate: item.DeclarationEndDate
              ? moment(item.DeclarationEndDate).format("DD/MM/YYYY")
              : "-",
          };
        });
      if (actual.length > 0) {
        setReleasedList([...processRecords(actual, "Actual")]);
      } else {
        setReleasedList([...processRecords(planned, "Planned")]);
      }

      // Conditional Default: If current year's actual declaration data > 0, show Actual. Otherwise Planned.
      const currentYearActuals = actual.filter(
        (r) => r.FinancialYear === _financialYear,
      );
      if (currentYearActuals.length > 0) {
        setSelectedType("Actual");
      } else {
        setSelectedType("Planned");
      }
    } catch (error) {
      console.error("Error fetching released declarations", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (employeeMaster.length > 0) {
      void fetchReleasedData();
    }
  }, [employeeMaster]);

  // Force Actual type when previous year is selected
  React.useEffect(() => {
    if (selectedFY !== "All" && selectedFY !== _financialYear) {
      setSelectedType("Actual");
    }
  }, [selectedFY, _financialYear]);

  // ─── Event Handlers ──────────────────────────────────────────────────────────────

  const handlePeoplePickerChange = (users: any[]) => {
    const logins = users
      .map((u: IEmployee) => u.Email)
      .filter((email): email is string => Boolean(email));
    setFormData((p) => ({ ...p, SelectedUsers: logins }));

    if (logins.length > 0) {
      setExcelEmployees([]);
      setImportResult(null);
    }
  };

  const handleExcelImport = (result: IImportResult) => {
    setImportResult(result);
    if (result.validData.length > 0) {
      // Clear people picker when excel is uploaded
      setFormData((p) => ({ ...p, SelectedUsers: [] }));
      setExcelEmployees(result.validData);
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
  const templateDownload = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const items: any = await getAllItems(
        LIST_NAMES.IT_Templates,
        ["FileRef", "FileLeafRef", "Template"],
        undefined, // expand
        "Id", // orderBy
        false, // ascending
        "Template eq 'ReleaseDeclaration'", // filter
      );

      if (items.length > 0) {
        const fileUrl = items[0].FileRef;
        const sp = getSP();
        const file = await sp.web
          .getFileByServerRelativePath(fileUrl)
          .getBlob();

        const url = window.URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = items[0].FileLeafRef;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        showToast(
          toast,
          "success",
          "Success",
          "Template downloaded successfully.",
        );
      } else {
        showToast(
          toast,
          "warn",
          "Not Found",
          "No template found for Release Declaration.",
        );
      }
    } catch (error) {
      console.error("Error downloading template", error);
      showToast(toast, "error", "Error", "Failed to download template.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeEmployee = (empId: string, isExcel: boolean) => {
    if (isExcel) {
      setExcelEmployees((prev) => prev.filter((p) => p.EmployeeID !== empId));
    } else {
      // For people picker, we need to update SelectedUsers in formData
      setFormData((prev) => {
        const matchedEmp = employeeMaster.find((e) => e.EmployeeId === empId);
        if (!matchedEmp || !matchedEmp.Email) return prev;
        return {
          ...prev,
          SelectedUsers: prev.SelectedUsers.filter(
            (email) => email !== matchedEmp.Email,
          ),
        };
      });
    }
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
      formData.SelectedUsers.length === 0 &&
      excelEmployees.length === 0
    ) {
      showToast(
        toast,
        "warn",
        "Validation",
        "Please select employees or upload an excel file to release.",
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
        itemsToRelease = employeeMaster
          .filter((emp: IEmployee) =>
            emp.EmployeeId?.toString().startsWith("9"),
          )
          .map((emp) => ({
            Title: "", // Will be generated before saving
            EmployeeName: emp.Title || emp.Name,
            EmployeeCode: emp.EmployeeId,
            EmployeeEmail: emp.Email,
            FinancialYear: _financialYear,
            Status: "Released",
            DeclarationType: formData.DeclarationType,
            DeclarationEndDate: new Date(
              new Date(formData.OnOrBefore!).setHours(23, 59, 59, 999),
            ),
            IsDelete: false,
          }));
      } else if (formData.ReleaseType === "Release Selected") {
        targetEmails.forEach((email: string) => {
          const matchedEmp = employeeMaster.find((e) => e.Email === email);
          itemsToRelease.push({
            Title: "", // Will be generated before saving
            EmployeeName: matchedEmp
              ? matchedEmp.Title || matchedEmp.Name
              : email,
            EmployeeCode: matchedEmp ? matchedEmp.EmployeeId : "",
            EmployeeEmail: matchedEmp ? matchedEmp.Email : "",
            Status: "Released",
            FinancialYear: _financialYear,
            DeclarationType: formData.DeclarationType,
            DeclarationEndDate: new Date(
              new Date(formData.OnOrBefore!).setHours(23, 59, 59, 999),
            ),
            IsDelete: false,
          });
        });

        excelEmployees
          .filter((emp: IEmployee) =>
            emp.EmployeeId?.toString().startsWith("9"),
          )
          .forEach((row) => {
            const curEmp = employeeMaster.find(
              (emp) => emp.EmployeeId === row.EmployeeID?.toString(),
            );
            itemsToRelease.push({
              Title: "", // Will be generated before saving
              EmployeeName: curEmp ? curEmp.Title || curEmp.Name : row.Title,
              EmployeeCode: curEmp ? curEmp.EmployeeId : row.EmployeeID,
              EmployeeEmail: curEmp ? curEmp.Email : row.Email,
              Status: "Released",
              FinancialYear: _financialYear,
              DeclarationType: formData.DeclarationType,
              DeclarationEndDate: new Date(
                new Date(formData.OnOrBefore!).setHours(23, 59, 59, 999),
              ),
              IsDelete: false,
            });
          });

        // Deduplicate itemsToRelease by EmployeeCode (in case of double selection from PP and Excel)
        const uniqueItems = new Map();
        itemsToRelease.forEach((item) => {
          if (item.EmployeeCode && !uniqueItems.has(item.EmployeeCode)) {
            uniqueItems.set(item.EmployeeCode, item);
          }
        });
        itemsToRelease = Array.from(uniqueItems.values());
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

        // Duplicate Check for Actual Declarations
        const actualCodes = new Set(
          releasedList
            .filter(
              (r) =>
                r.declarationType === "Actual" &&
                r.financialYear === _financialYear,
            )
            .map((r) => r.employeeId),
        );

        const actualFinal = itemsToRelease.filter(
          (item) => item.EmployeeCode && !actualCodes.has(item.EmployeeCode),
        );

        const skippedActualCount = itemsToRelease.length - actualFinal.length;

        if (actualFinal.length === 0) {
          showToast(
            toast,
            "warn",
            "Duplicate",
            `Selected employees already have an Actual declaration for FY ${_financialYear}.`,
          );
          setIsLoading(false);
          return;
        }

        // Attach PlannedDeclarationId (lookup) to each item and write to Actual list
        let nextSeqNum = await getNextSequence(
          LIST_NAMES.ACTUAL_DECLARATION,
          _financialYear,
          "ACT",
        );

        const actualItems = actualFinal.map((item) => {
          nextSeqNum++;
          return {
            ...item,
            Title: `${_financialYear}-ACT-${nextSeqNum.toString().padStart(4, "0")}`,
            PlannedDeclarationId: plannedMap.get(item.EmployeeCode)?.Id || null,
          };
        });

        await addListItemsBatch(LIST_NAMES.ACTUAL_DECLARATION, actualItems);

        showToast(
          toast,
          "success",
          "Success",
          skippedActualCount > 0
            ? `Released ${actualItems.length} Actual declarations. Skipped ${skippedActualCount} duplicates.`
            : `Released ${actualItems.length} Actual Declaration(s) successfully.`,
        );

        // Send release email notifications
        const deadlineStr = formData.OnOrBefore
          ? moment(formData.OnOrBefore).format("DD/MM/YYYY")
          : undefined;
        const emailTargets = actualItems
          .filter((item) => item.EmployeeEmail)
          .map((item) => ({
            email: item.EmployeeEmail as string,
            name: item.EmployeeName || "",
            id: item.EmployeeCode || "",
            reqno: item.Title || "",
          }));
        if (emailTargets.length > 0) {
          void sendReleaseEmails(
            emailTargets,
            "Actual",
            _financialYear,
            user!,
            deadlineStr,
          );
        }

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
      const existingCodes = new Set(
        releasedList
          .filter(
            (r) =>
              r.declarationType === "Planned" &&
              r.financialYear === _financialYear,
          )
          .map((r: any) => r.employeeId),
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

      let currentSeqNum = await getNextSequence(
        LIST_NAMES.PLANNED_DECLARATION,
        _financialYear,
        "PLN",
      );

      const finalWithIds = finalItems.map((item) => {
        currentSeqNum++;
        return {
          ...item,
          Title: `${_financialYear}-PLN-${currentSeqNum.toString().padStart(4, "0")}`,
        };
      });

      await addListItemsBatch(LIST_NAMES.PLANNED_DECLARATION, finalWithIds);

      showToast(
        toast,
        "success",
        "Success",
        skippedCount > 0
          ? `Released ${finalItems.length} declarations. Skipped ${skippedCount} duplicates.`
          : `Successfully released ${finalItems.length} declarations.`,
      );

      // Send release email notifications
      const deadlineStr = formData.OnOrBefore
        ? moment(formData.OnOrBefore).format("DD/MM/YYYY")
        : "";
      const emailTargets = finalWithIds
        .filter((item) => item.EmployeeEmail)
        .map((item) => ({
          email: item.EmployeeEmail as string,
          name: item.EmployeeName || "",
          id: item.EmployeeCode || "",
          reqno: item.Title || "",
        }));
      if (emailTargets.length > 0) {
        void sendReleaseEmails(
          emailTargets,
          "Planned",
          _financialYear,
          user!,
          deadlineStr,
        );
      }

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
    const data = employeeMaster
      .filter((emp: IEmployee) => emp.EmployeeId?.toString().startsWith("9"))
      .map((emp: IEmployee) => ({
        employeeId: emp.EmployeeId || "-",
        employeeName: emp.Name || emp.Title || "-",
        location: emp.Location || "-",
      }));
    return globalSearchFilter(data, searchTerm);
  }, [employeeMaster, searchTerm]);

  const releasedTableData = React.useMemo(() => {
    const filtered = releasedList.filter((r) => {
      const matchesFY = selectedFY === "All" || r.financialYear === selectedFY;
      const matchesLocation =
        selectedLocation === "All" || r.location === selectedLocation;
      const matchesType =
        selectedType === "All" || r.declarationType === selectedType;
      const matchesStatus =
        selectedStatus === "All" ||
        r.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesFY && matchesLocation && matchesType && matchesStatus;
    });

    return globalSearchFilter(filtered, searchTerm);
  }, [
    releasedList,
    searchTerm,
    selectedFY,
    selectedLocation,
    selectedType,
    selectedStatus,
  ]);

  const fyOptions = React.useMemo(() => {
    return [
      { label: "All Years", value: "All" },
      ...getFYOptions(releasedList),
    ];
  }, [releasedList]);

  const locationOptions = React.useMemo(() => {
    const locations = Array.from(
      new Set(releasedList.map((r) => r.location)),
    ).filter((l) => l && l !== "-");
    return [
      { label: "All Locations", value: "All" },
      ...locations.sort().map((l) => ({ label: l, value: l })),
    ];
  }, [releasedList]);

  const typeOptions = React.useMemo(() => {
    // Determine available types for the selected year
    const filteredByYear = releasedList.filter((r) => {
      return selectedFY === "All" || r.financialYear === selectedFY;
    });

    const uniqueTypes = Array.from(
      new Set(filteredByYear.map((r) => r.declarationType)),
    ).filter(Boolean);

    // If only one type exists for a specific year (not "All"), we won't show the dropdown
    if (
      selectedFY !== "All" &&
      selectedFY !== _financialYear &&
      uniqueTypes.length <= 1
    ) {
      return [];
    }

    if (uniqueTypes.length === 0) return [];

    return [
      { label: "All Types", value: "All" },
      ...uniqueTypes.sort().map((t) => ({ label: t, value: t })),
    ];
  }, [releasedList, selectedFY, _financialYear]);

  const statusOptions = React.useMemo(() => {
    // Filter the list by other active filters to show only relevant statuses
    const filteredByOthers = releasedList.filter((r) => {
      const matchesFY = selectedFY === "All" || r.financialYear === selectedFY;
      const matchesType =
        selectedType === "All" || r.declarationType === selectedType;
      // const matchesLocation = selectedLocation === "All" || r.location === selectedLocation;
      return matchesFY && matchesType;
    });

    const statuses = Array.from(new Set(filteredByOthers.map((r) => r.status)))
      .filter(Boolean)
      .sort();
    return [
      { label: "All Status", value: "All" },
      ...statuses.map((s) => ({
        label: s.charAt(0).toUpperCase() + s.slice(1),
        value: s,
      })),
    ];
  }, [releasedList, selectedFY, selectedType]);

  const empColumns: IColumnDef[] = [
    { field: "employeeId", header: "Employee ID", sortable: true },
    { field: "employeeName", header: "Employee Name", sortable: true },
    { field: "location", header: "Location", sortable: true },
  ];

  const releasedColumns: IColumnDef[] = [
    { field: "employeeId", header: "Employee ID", sortable: true },
    { field: "employeeName", header: "Employee Name", sortable: true },
    { field: "location", header: "Location", sortable: true },
    { field: "declarationType", header: "Declaration Type", sortable: true },
    { field: "financialYear", header: "Financial Year", sortable: true },
    {
      field: "declarationEndDate",
      header: "Declaration End Date",
      sortable: true,
    },
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
    const columns = activeIndex === 0 ? empColumns : releasedColumns;
    const fileName = activeIndex === 0 ? "Employee_List" : "Released_List";

    if (dataToExport.length === 0) {
      showToast(toast, "warn", "No Data", "No data to export.");
      return;
    }

    const exportData = dataToExport.map((row: any) => {
      const formattedRow: any = {};
      columns.forEach((col) => {
        if (col.field) {
          const value = row[col.field];
          if (col.field === "status" && typeof value === "string") {
            formattedRow[col.header] =
              value.charAt(0).toUpperCase() + value.slice(1);
          } else {
            formattedRow[col.header] = value;
          }
        }
      });
      return formattedRow;
    });

    exportToExcel(exportData, fileName);
    setShowDownloadPopup(true);
    setTimeout(() => {
      setShowDownloadPopup(false);
    }, 3000);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────────

  return (
    <div>
      <StatusPopup
        visible={showDownloadPopup}
        onHide={() => setShowDownloadPopup(false)}
        type="download"
      />
      <AppToast toastRef={toast} />
      {isLoading && <Loader fullScreen label="Processing Release..." />}

      <div className={styles.header}>
        <h2>Release Declaration</h2>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formRow}>
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
                  if (val && val !== formData.ReleaseType) {
                    setImportResult(null);
                    setFormData((p) => ({
                      ...p,
                      ReleaseType: val,
                      SelectedUsers: [],
                    }));
                    setExcelEmployees([]);
                  } else {
                    setFormData((p) => ({
                      ...p,
                      ReleaseType: "",
                      SelectedUsers: [],
                    }));
                  }
                }}
              />
              <AppRadioButton
                name="releaseType"
                value="Release Selected"
                label="Release Selected"
                selectedValue={formData.ReleaseType}
                onChange={(val) => {
                  if (val && val !== formData.ReleaseType) {
                    setImportResult(null);
                    setFormData((p) => ({
                      ...p,
                      ReleaseType: val,
                      SelectedUsers: [],
                    }));
                    setExcelEmployees([]);
                  } else {
                    setFormData((p) => ({
                      ...p,
                      ReleaseType: "",
                      SelectedUsers: [],
                    }));
                  }
                }}
              />
            </div>
          </div>
        </div>

        {formData.ReleaseType === "Release Selected" && (
          <div className={styles.selectionRow}>
            <div className={styles.col}>
              <label>Choose Employees {RequiredSympol()}</label>
              <div className={styles.selectionControls}>
                <div className={styles.peoplePickerWrapper}>
                  <AppPeoplePicker
                    titleText=""
                    selectedUsers={employeeMaster.filter(
                      (emp) =>
                        emp.Email && formData.SelectedUsers.includes(emp.Email),
                    )}
                    onChange={handlePeoplePickerChange}
                    personSelectionLimit={100}
                    source="EmployeeMaster"
                  />
                </div>
                <div className={styles.uploadWrapper}>
                  <ExcelImport
                    columns={excelColumns}
                    onImport={handleExcelImport}
                    buttonLabel="Upload"
                    icon="pi pi-upload"
                    iconFlag={false}
                  />
                </div>
                <div
                  className={styles.downloadTemplate}
                  onClick={templateDownload}
                >
                  Download template
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.ReleaseType === "Release Selected" && (
          <div className={styles.chipArea}>
            {formData.SelectedUsers.map((email, idx) => {
              const emp = employeeMaster.find((e) => e.Email === email);
              if (!emp) return null;
              return (
                <div key={`pp-${idx}`} className={styles.chip}>
                  <span className={styles.chipLabel}>
                    {emp.Title || emp.Name} ({emp.EmployeeId})
                  </span>
                  <span
                    className={styles.chipRemove}
                    onClick={() => removeEmployee(emp.EmployeeId || "", false)}
                  >
                    ×
                  </span>
                </div>
              );
            })}
            {excelEmployees.map((emp, idx) => (
              <div key={`excel-${idx}`} className={styles.chip}>
                <span className={styles.chipLabel}>
                  {emp.Title} ({emp.EmployeeID})
                </span>
                <span
                  className={styles.chipRemove}
                  onClick={() => removeEmployee(emp.EmployeeID, true)}
                >
                  ×
                </span>
              </div>
            ))}
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

        <div>
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
              placeholder="Select"
              minDate={new Date()}
            />
          </div>
        </div>

        <div className={styles.actionsRow}>
          <ActionButton
            variant="add"
            label="Release"
            icon="pi pi-file-edit"
            disabled={
              formData.ReleaseType === "Release Selected" &&
              formData.SelectedUsers.length === 0 &&
              excelEmployees.length === 0
            }
            onClick={() => {
              void handleRelease();
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsCard}>
        <div style={{ margin: "10px 0px" }}>
          <div className={styles.searchToolbar}>
            <div className={styles.tabToggle}>
              <button
                className={`${styles.tabBtn} ${activeIndex === 0 ? styles.active : ""}`}
                onClick={() => {
                  setSearchTerm("");
                  setSelectedFY(_financialYear);
                  setSelectedStatus("All");
                  setSelectedType("All");
                  setActiveIndex(0);
                }}
              >
                Employee List
              </button>
              <button
                className={`${styles.tabBtn} ${activeIndex === 1 ? styles.active : ""}`}
                onClick={() => {
                  setSearchTerm("");
                  setSelectedFY(_financialYear);
                  setSelectedStatus("All");
                  setSelectedType("All");
                  setActiveIndex(1);
                }}
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
              {activeIndex === 1 && (
                <div className={styles.filters}>
                  <div style={{ width: "136px" }}>
                    <AppDropdown
                      value={selectedFY}
                      options={fyOptions}
                      onChange={(e) => setSelectedFY(e.value)}
                      placeholder="FY"
                    />
                  </div>
                  {/* <div style={{ width: "130px" }}>
                    <AppDropdown
                      value={selectedLocation}
                      options={locationOptions}
                      onChange={(e) => setSelectedLocation(e.value)}
                      placeholder="Location"
                    />
                  </div> */}
                  {/* {typeOptions.length > 0 && (
                    <div style={{ width: "130px" }}>
                      <AppDropdown
                        value={selectedType}
                        options={typeOptions}
                        onChange={(e) => setSelectedType(e.value)}
                        placeholder="Type"
                      />
                    </div>
                  )} */}
                  <div style={{ width: "130px" }}>
                    <AppDropdown
                      value={selectedStatus}
                      options={statusOptions}
                      onChange={(e) => setSelectedStatus(e.value)}
                      // placeholder="Status"
                    />
                  </div>
                </div>
              )}
              <div className={styles.actions}>
                <ActionButton
                  variant="export"
                  className="secondaryBtn"
                  onClick={handleExport}
                  icon="pi pi-download"
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
              globalFilter={searchTerm}
              paginator={empColumns.length > 0}
              rows={10}
            />
          )}
          {activeIndex === 1 && (
            <AppDataTable
              columns={releasedColumns}
              data={releasedTableData}
              globalFilter={searchTerm}
              paginator={releasedColumns.length > 0}
              rows={10}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReleaseDeclaration;
