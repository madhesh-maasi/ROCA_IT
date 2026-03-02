import * as React from "react";
import styles from "./TaxRegimeUpdate.module.scss";
import {
  AppDataTable,
  IColumnDef,
  SearchInput,
  ActionButton,
  AppDropdown,
} from "../../../../../components";
import { ActionPopup } from "../../../../../common/components";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";

interface ITempEmployee {
  id: number;
  employeeId: string;
  employeeName: string;
  taxRegime: string;
}

const DUMMY_DATA: ITempEmployee[] = [
  {
    id: 1,
    employeeId: "9002094",
    employeeName: "Ponraju E",
    taxRegime: "Old Regime",
  },
  {
    id: 2,
    employeeId: "9002087",
    employeeName: "Madhesh",
    taxRegime: "Old Regime",
  },
  {
    id: 3,
    employeeId: "9002055",
    employeeName: "Ramesh",
    taxRegime: "New Regime",
  },
];

const REGIME_OPTIONS = [
  { label: "Old Regime", value: "Old Regime" },
  { label: "New Regime", value: "New Regime" },
];

const TaxRegimeUpdate: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);

  // States
  const [searchTerm, setSearchTerm] = React.useState("");
  const [data, setData] = React.useState<ITempEmployee[]>(DUMMY_DATA);

  // Popup States
  const [showPopup, setShowPopup] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    React.useState<ITempEmployee | null>(null);
  const [selectedRegime, setSelectedRegime] = React.useState<string>("");

  const handleEdit = (employee: ITempEmployee) => {
    setSelectedEmployee(employee);
    setSelectedRegime(employee.taxRegime);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedEmployee(null);
    setSelectedRegime("");
  };

  const handleUpdate = () => {
    if (!selectedRegime) {
      showToast(
        toast,
        "warn",
        "Validation",
        "Please select a tax regime Type.",
      );
      return;
    }

    if (selectedEmployee) {
      // Update local state
      setData((prev) =>
        prev.map((emp) =>
          emp.id === selectedEmployee.id
            ? { ...emp, taxRegime: selectedRegime }
            : emp,
        ),
      );
      showToast(
        toast,
        "success",
        "Updated",
        `Tax regime updated for ${selectedEmployee.employeeName}.`,
      );
      handleClosePopup();
    }
  };

  const columns: IColumnDef[] = [
    { field: "employeeId", header: "Employee ID", sortable: true },
    { field: "employeeName", header: "Employee Name", sortable: true },
    { field: "taxRegime", header: "Tax Regime Type", sortable: true },
    {
      field: "action",
      header: "Action",
      body: (rowData: ITempEmployee) => (
        <button
          className={styles.editBtn}
          title="Edit Tax Regime"
          onClick={() => handleEdit(rowData)}
        >
          <i className="pi pi-pencil" />
        </button>
      ),
    },
  ];

  const filteredData = React.useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(
      (emp) =>
        emp.employeeId.toLowerCase().includes(lowerSearch) ||
        emp.employeeName.toLowerCase().includes(lowerSearch),
    );
  }, [searchTerm, data]);

  return (
    <div className={styles.screen}>
      <AppToast toastRef={toast} />

      <div className={styles.headerToolbar}>
        <h2>Tax Regime Update</h2>

        <div className={styles.actions}>
          <div className={styles.searchBlock}>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search..."
            />
          </div>
          <ActionButton
            variant="download"
            label="Export"
            icon="pi pi-file-export"
            onClick={() => {
              showToast(toast, "info", "Export", "Exporting data...");
            }}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <AppDataTable
          columns={columns}
          data={filteredData}
          paginator
          rows={10}
        />
      </div>

      <ActionPopup
        visible={showPopup}
        onHide={handleClosePopup}
        onConfirm={handleUpdate}
        actionType="Updated"
        title="Update Tax Regime"
        cancelLabel="Cancel"
        confirmLabel="Update"
        hideIcon={true}
      >
        <div className={styles.popupInner}>
          {selectedEmployee && (
            <>
              <div className={styles.employeeDetails}>
                <span className={styles.detailLabel}>Employee Details</span> -{" "}
                <span className={styles.detailText}>
                  {selectedEmployee.employeeName}
                  {selectedEmployee.employeeId}
                </span>
              </div>

              <div className={styles.formGroup}>
                <AppDropdown
                  id="taxRegimeType"
                  label="Tax Regime Type"
                  required
                  options={REGIME_OPTIONS}
                  value={selectedRegime}
                  onChange={(e) => setSelectedRegime(e.value as string)}
                  placeholder="Select Regime"
                />
              </div>
            </>
          )}
        </div>
      </ActionPopup>
    </div>
  );
};

export default TaxRegimeUpdate;
