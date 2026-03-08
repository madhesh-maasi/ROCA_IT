import * as React from "react";
import styles from "./TaxRegimeUpdate.module.scss";
import {
  AppDataTable,
  IColumnDef,
  SearchInput,
  ActionButton,
  AppDropdown,
} from "../../../../../CommonInputComponents";
import { ActionPopup } from "../../../../../common/components";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import {
  getListItems,
  updateListItem,
  updateListItemsBatch,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import { exportToExcel } from "../../../../../common/utils/exportUtils";

const REGIME_OPTIONS = [
  { label: "Old Regime", value: "Old Regime" },
  { label: "New Regime", value: "New Regime" },
];

const TaxRegimeUpdate: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);

  // States
  const [searchTerm, setSearchTerm] = React.useState("");
  const [data, setData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Popup States
  const [showPopup, setShowPopup] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<any | null>(
    null,
  );
  const [selectedRegime, setSelectedRegime] = React.useState<string>("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const items = await getListItems(
        LIST_NAMES.PLANNED_DECLARATION,
        `Status eq 'Submitted'`,
      );
      setData(items);
    } catch (err) {
      showToast(toast, "error", "Fetch Failed", "Could not load declarations.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    void fetchData();
  }, []);

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setSelectedRegime(employee.TaxRegime || "Old Regime");
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedEmployee(null);
    setSelectedRegime("");
  };

  const handleUpdate = async () => {
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
      try {
        setIsLoading(true);
        const oldRegime = selectedEmployee.TaxRegime;
        const newRegime = selectedRegime;

        // 1. Update main declaration record
        await updateListItem(
          LIST_NAMES.PLANNED_DECLARATION,
          selectedEmployee.Id,
          {
            TaxRegime: newRegime,
            PAN: "",
            IsAcknowledged: false,
            Place: "",
            SubmittedDate: null,
            ApproverCommentsJson: "",
            Status: "Released",
          },
        );

        // 2. If changing from Old to New, soft-delete child lists
        if (oldRegime === "Old Regime" && newRegime === "New Regime") {
          const childLists = [
            LIST_NAMES.IT_LANDLORD_DETAILS,
            LIST_NAMES.IT_LTA,
            LIST_NAMES.IT_80C_SECTION,
            LIST_NAMES.IT_80,
            LIST_NAMES.IT_HOUSING_LOAN,
            LIST_NAMES.IT_PREVIOUS_EMPLOYER,
          ];

          for (const listName of childLists) {
            const items = await getListItems(
              listName,
              `PlannedDeclarationId eq ${selectedEmployee.Id}`,
            );
            if (items.length > 0) {
              await updateListItemsBatch(
                listName,
                items.map((i) => ({ id: i.Id, data: { IsDelete: true } })),
              );
            }
          }
        }

        showToast(
          toast,
          "success",
          "Updated",
          `Tax regime updated effectively for ${selectedEmployee.EmployeeName || "Employee"}.`,
        );

        await fetchData();
        handleClosePopup();
      } catch (err) {
        console.error(err);
        showToast(toast, "error", "Update Failed", "Could not update regime.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const columns: IColumnDef[] = [
    { field: "EmployeeCode", header: "Employee ID", sortable: true },
    { field: "EmployeeName", header: "Employee Name", sortable: true },
    { field: "TaxRegime", header: "Tax Regime Type", sortable: true },
    {
      field: "action",
      header: "Action",
      body: (rowData: any) => (
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
        (emp.EmployeeCode || "").toLowerCase().includes(lowerSearch) ||
        (emp.EmployeeName || "").toLowerCase().includes(lowerSearch),
    );
  }, [searchTerm, data]);

  const handleExport = () => {
    const dataToExport = filteredData.map((emp) => ({
      "Employee ID": emp.EmployeeCode,
      "Employee Name": emp.EmployeeName,
      "Tax Regime Type": emp.TaxRegime,
    }));
    exportToExcel(dataToExport, "Tax_Regime_Updates");
  };

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
            onClick={handleExport}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <AppDataTable
          columns={columns}
          data={filteredData}
          paginator
          rows={10}
          loading={isLoading}
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
                  {selectedEmployee.EmployeeName} (
                  {selectedEmployee.EmployeeCode})
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
