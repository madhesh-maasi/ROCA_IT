import * as React from "react";
import styles from "./ReleaseExtension.module.scss";
import {
  AppDataTable,
  IColumnDef,
  SearchInput,
  AppCalendar,
  ActionButton,
} from "../../../../../CommonInputComponents";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import Loader from "../../../../../common/components/Loader/Loader";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  fetchEmployeeMaster,
  selectEmployees,
} from "../../../../../store/slices/employeeSlice";
import {
  getListItems,
  updateListItemsBatch,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import {
  curFinanicalYear,
  globalSearchFilter,
} from "../../../../../common/utils/functions";
import { sendExtensionEmail } from "../../../../../common/utils/emailService";
import { selectUserDetails } from "../../../../../store/slices/userSlice";
import moment from "moment";

interface IReleasedItem {
  Id: number;
  EmployeeCode: string;
  EmployeeName: string;
  Email: string;
  Location: string;
  DeclarationType: string;
  DeclarationEndDate: string;
  Status: string;
  Title: string;
}

const ReleaseExtension: React.FC = () => {
  const dispatch = useAppDispatch();
  const toast = React.useRef<PrimeToast>(null);
  const employeeMaster = useAppSelector(selectEmployees);
  const user = useAppSelector(selectUserDetails);

  // UI State
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingLabel, setLoadingLabel] = React.useState("Loading Data...");
  const [searchTerm, setSearchTerm] = React.useState("");

  // Form State
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [rawItems, setRawItems] = React.useState<any[]>([]);
  const [releasedList, setReleasedList] = React.useState<IReleasedItem[]>([]);
  const [selectedEmployees, setSelectedEmployees] = React.useState<
    IReleasedItem[]
  >([]);

  const fetchData = async (label = "Loading Data...") => {
    try {
      setLoadingLabel(label);
      setIsLoading(true);
      const listName =
        activeIndex === 0
          ? LIST_NAMES.PLANNED_DECLARATION
          : LIST_NAMES.ACTUAL_DECLARATION;
      const items = await getListItems(
        listName,
        `FinancialYear eq '${curFinanicalYear}'`,
      );
      setRawItems(items);
    } catch (error) {
      showToast(toast, "error", "Error", "Failed to load employee data");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    void dispatch(fetchEmployeeMaster());
  }, []);

  React.useEffect(() => {
    void fetchData();
    setSelectedEmployees([]); // Clear selection on tab change
  }, [activeIndex]);

  React.useEffect(() => {
    const activeItems = rawItems
      .filter(
        (i) =>
          i.Status == "Draft" || i.Status == "Rework" || i.Status == "Released",
      )
      .map((item: any) => {
        const empMaster = employeeMaster.find(
          (e) => e.EmployeeId === item.EmployeeCode,
        );
        return {
          Id: item.Id,
          EmployeeCode: item.EmployeeCode || "-",
          EmployeeName: item.EmployeeName || "-",
          Email: empMaster?.Email || item.EmployeeEmail || "-",
          Location: empMaster?.Location || "-",
          DeclarationType: item.DeclarationType || "-",
          DeclarationEndDate: item.DeclarationEndDate || "",
          Status: item.Status || "-",
          Title: item.Title || "-",
        };
      });
    setReleasedList(activeItems);
  }, [rawItems, employeeMaster]);

  // Actions
  const handleExtend = async () => {
    if (!selectedDate) {
      showToast(
        toast,
        "warn",
        "Validation",
        "Please select an extension date.",
      );
      return;
    }
    if (selectedEmployees.length === 0) {
      showToast(
        toast,
        "warn",
        "Validation",
        "Please select at least one employee.",
      );
      return;
    }

    setLoadingLabel("Extending Release...");
    setIsLoading(true);
    try {
      const updates = selectedEmployees.map((emp) => ({
        id: emp.Id,
        data: {
          DeclarationEndDate: new Date(
            new Date(selectedDate!).setHours(23, 59, 59, 999),
          ),
        },
      }));

      const listName =
        activeIndex === 0
          ? LIST_NAMES.PLANNED_DECLARATION
          : LIST_NAMES.ACTUAL_DECLARATION;

      await updateListItemsBatch(listName, updates);

      // Trigger email notifications in background
      selectedEmployees.forEach((emp) => {
        if (emp.Email && emp.Email !== "-") {
          void sendExtensionEmail(
            emp.EmployeeName,
            emp.EmployeeCode,
            emp.Email,
            activeIndex === 0 ? "Planned" : "Actual",
            curFinanicalYear,
            user!,
            moment(selectedDate).format("DD/MM/YYYY"),
            emp.Title,
          );
        }
      });

      showToast(
        toast,
        "success",
        "Success",
        `Successfully extended declaration for ${selectedEmployees.length} employees to ${moment(selectedDate).format("DD/MM/YYYY")}.`,
      );

      // Reset selection and refresh data
      setSelectedEmployees([]);
      setSelectedDate(null);
      await fetchData();
    } catch (error) {
      showToast(toast, "error", "Error", "Failed to extend declarations.");
    } finally {
      setIsLoading(false);
    }
  };

  // Table Config
  const columns: IColumnDef[] = [
    { field: "EmployeeCode", header: "Employee ID", sortable: true },
    { field: "EmployeeName", header: "Employee Name", sortable: true },
    { field: "Location", header: "Location", sortable: true },
    // { field: "DeclarationType", header: "Type", sortable: true },
    // {
    //   field: "DeclarationEndDate",
    //   header: "Due Date",
    //   sortable: true,
    //   body: (rd: IReleasedItem) =>
    //     rd.DeclarationEndDate
    //       ? new Date(rd.DeclarationEndDate).toLocaleDateString("en-IN")
    //       : "-",
    // },
    // { field: "Status", header: "Status", sortable: true },
  ];

  const filteredData = React.useMemo(() => {
    return globalSearchFilter(releasedList, searchTerm);
  }, [searchTerm, releasedList]);

  return (
    <div className={styles.screen}>
      <AppToast toastRef={toast} />
      {isLoading && <Loader label={loadingLabel} />}

      <div className={styles.titleBlock}>
        <h2>Release Extension</h2>
      </div>

      <div className={styles.headerToolbar}>
        <div className={styles.tabToggle}>
          {(["Planned", "Actual"] as const).map((tab, index) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeIndex === index ? styles.active : ""}`}
              onClick={() => {
                setActiveIndex(index);
                setSelectedEmployees([]);
                setSearchTerm("");
                setSelectedDate(null);
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          <div>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search..."
            />
          </div>
          <div className={styles.filters}>
            <div className={styles.calendarBlock}>
              <AppCalendar
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate((e.value as Date) || undefined)
                }
                showIcon
                minDate={new Date()}
                placeholder="Select date"
              />
            </div>
          </div>

          <ActionButton
            variant="add" // Reusing standard style, but overriding label
            label="Extend"
            icon="pi pi-clock"
            onClick={() => {
              void handleExtend();
            }}
            disabled={!selectedDate || selectedEmployees.length === 0}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <AppDataTable
          columns={columns}
          data={filteredData}
          globalFilter={searchTerm}
          paginator
          rows={10}
          selection={selectedEmployees}
          onSelectionChange={(e) => setSelectedEmployees(e.value)}
          dataKey="Id"
        />
      </div>
    </div>
  );
};

export default ReleaseExtension;
