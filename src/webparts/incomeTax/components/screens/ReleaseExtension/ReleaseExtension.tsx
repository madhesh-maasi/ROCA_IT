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
import {
  getListItems,
  updateListItemsBatch,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";

interface IReleasedItem {
  Id: number;
  EmployeeCode: string;
  EmployeeName: string;
  DeclarationType: string;
  DeclarationEndDate: string;
  Status: string;
}

// Remove dummy data

const ReleaseExtension: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);

  // UI State
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Form State
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  // Data State
  const [releasedList, setReleasedList] = React.useState<IReleasedItem[]>([]);
  const [selectedEmployees, setSelectedEmployees] = React.useState<
    IReleasedItem[]
  >([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const items = await getListItems(LIST_NAMES.PLANNED_DECLARATION);
      // Filter for active items if necessary, or just all that are not submitted
      const activeItems = items.filter((i) => i.Status !== "Submitted");
      setReleasedList(activeItems);
    } catch (error) {
      console.error("Error fetching data", error);
      showToast(toast, "error", "Error", "Failed to load employee data.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    void fetchData();
  }, []);

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

    setIsLoading(true);
    try {
      const updates = selectedEmployees.map((emp) => ({
        id: emp.Id,
        data: {
          DeclarationEndDate: selectedDate.toISOString(),
        },
      }));

      await updateListItemsBatch(LIST_NAMES.PLANNED_DECLARATION, updates);

      showToast(
        toast,
        "success",
        "Success",
        `Successfully extended declaration for ${selectedEmployees.length} employees to ${selectedDate.toLocaleDateString()}.`,
      );

      // Reset selection and refresh data
      setSelectedEmployees([]);
      setSelectedDate(null);
      await fetchData();
    } catch (error) {
      console.error("Error extending declarations", error);
      showToast(toast, "error", "Error", "Failed to extend declarations.");
    } finally {
      setIsLoading(false);
    }
  };

  // Table Config
  const columns: IColumnDef[] = [
    { field: "EmployeeCode", header: "Employee ID", sortable: true },
    { field: "EmployeeName", header: "Employee Name", sortable: true },
    { field: "DeclarationType", header: "Type", sortable: true },
    {
      field: "DeclarationEndDate",
      header: "Due Date",
      sortable: true,
      body: (rd: IReleasedItem) =>
        rd.DeclarationEndDate
          ? new Date(rd.DeclarationEndDate).toLocaleDateString("en-IN")
          : "-",
    },
    { field: "Status", header: "Status", sortable: true },
  ];

  const filteredData = React.useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return releasedList.filter(
      (emp) =>
        emp.EmployeeCode?.toLowerCase().includes(lowerSearch) ||
        emp.EmployeeName?.toLowerCase().includes(lowerSearch),
    );
  }, [searchTerm, releasedList]);

  return (
    <div className={styles.screen}>
      <AppToast toastRef={toast} />
      {isLoading && <Loader fullScreen label="Extending Release..." />}

      <div className={styles.headerToolbar}>
        <h2>Release Extension</h2>

        <div className={styles.actions}>
          <div>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search..."
            />
          </div>

          <div className={styles.calendarBlock}>
            <AppCalendar
              value={selectedDate}
              onChange={(e) => setSelectedDate((e.value as Date) || undefined)}
              showIcon
              minDate={new Date()}
              placeholder="Select date"
            />
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
          paginator
          rows={15}
          selection={selectedEmployees}
          onSelectionChange={(e) => setSelectedEmployees(e.value)}
        />
      </div>
    </div>
  );
};

export default ReleaseExtension;
