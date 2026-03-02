import * as React from "react";
import styles from "./ReleaseExtension.module.scss";
import {
  AppDataTable,
  IColumnDef,
  SearchInput,
  AppCalendar,
  ActionButton,
} from "../../../../../components";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import Loader from "../../../../../common/components/Loader/Loader";

// Using a temporary interface and mock data as per user request
interface ITempEmployee {
  id: number;
  employeeId: string;
  employeeName: string;
}

const DUMMY_DATA: ITempEmployee[] = [
  { id: 1, employeeId: "9002094", employeeName: "Ponraju E" },
  { id: 2, employeeId: "4874413", employeeName: "Dwight" },
  { id: 3, employeeId: "5586126", employeeName: "Cameron" },
  { id: 4, employeeId: "6515357", employeeName: "Bruce" },
  { id: 5, employeeId: "2674003", employeeName: "Mitchell" },
  { id: 6, employeeId: "2674002", employeeName: "Gregory" },
  { id: 7, employeeId: "6515356", employeeName: "Jorge" },
  { id: 8, employeeId: "4874416", employeeName: "Jacob" },
  { id: 9, employeeId: "6535188", employeeName: "Calvin" },
  { id: 10, employeeId: "5586129", employeeName: "Harold" },
];

const ReleaseExtension: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);

  // UI State
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Form State
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedEmployees, setSelectedEmployees] = React.useState<
    ITempEmployee[]
  >([]);

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
      // Simulate API call for extending release logic
      await new Promise((resolve) => setTimeout(resolve, 1500));

      showToast(
        toast,
        "success",
        "Success",
        `Successfully extended declaration for ${selectedEmployees.length} employees to ${selectedDate.toLocaleDateString()}.`,
      );

      // Reset selection
      setSelectedEmployees([]);
      setSelectedDate(null);
    } catch (error) {
      console.error("Error extending declarations", error);
      showToast(toast, "error", "Error", "Failed to extend declarations.");
    } finally {
      setIsLoading(false);
    }
  };

  // Table Config
  const columns: IColumnDef[] = [
    { field: "employeeId", header: "Employee ID", sortable: true },
    { field: "employeeName", header: "Employee Name", sortable: true },
  ];

  const filteredData = React.useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return DUMMY_DATA.filter(
      (emp) =>
        emp.employeeId.toLowerCase().includes(lowerSearch) ||
        emp.employeeName.toLowerCase().includes(lowerSearch),
    );
  }, [searchTerm]);

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
