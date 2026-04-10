import * as React from "react";
import styles from "./TaxRegimeUpdate.module.scss";
import {
  AppDataTable,
  IColumnDef,
  SearchInput,
  ActionButton,
  AppDropdown,
  StatusPopup,
} from "../../../../../CommonInputComponents";
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
import {
  curFinanicalYear,
  getFYOptions,
  globalSearchFilter,
} from "../../../../../common/utils/functions";
import { sendTaxRegimeUpdateEmail } from "../../../../../common/utils/emailService";
import { selectUserDetails } from "../../../../../store/slices/userSlice";
import { useAppSelector } from "../../../../../store/hooks";
import { exportToExcel } from "../../../../../common/utils/exportUtils";
import { ActionPopup, Loader } from "../../../../../common/components";

const REGIME_OPTIONS = [
  { label: "Old Regime", value: "Old Regime" },
  { label: "New Regime", value: "New Regime" },
];

const TaxRegimeUpdate: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);
  const user = useAppSelector(selectUserDetails);

  // States
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [data, setData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Popup States
  const [showPopup, setShowPopup] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<any | null>(
    null,
  );
  const [selectedRegime, setSelectedRegime] = React.useState<string>("");
  // const [showSuccessPopup, setShowSuccessPopup] = React.useState(false);

  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const listName =
        activeIndex === 0
          ? LIST_NAMES.PLANNED_DECLARATION
          : LIST_NAMES.ACTUAL_DECLARATION;

      const items = await getListItems(
        listName,
        `Status eq 'Draft' or Status eq 'Rework' and IsExported ne 1 and FinancialYear eq '${curFinanicalYear}'`,
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
    setData([]); // Clear old data visually
  }, [activeIndex]);

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
      const currentRegime = selectedEmployee.TaxRegime;
      if (currentRegime === selectedRegime) {
        showToast(
          toast,
          "error",
          "Tax Regime Update",
          "Selected tax regime is already active for this employee.",
        );
        return;
      }

      try {
        setIsLoading(true);
        const oldRegime = selectedEmployee.TaxRegime;
        const newRegime = selectedRegime;

        const mainListName =
          activeIndex === 0
            ? LIST_NAMES.PLANNED_DECLARATION
            : LIST_NAMES.ACTUAL_DECLARATION;

        // 1. Update main declaration record
        await updateListItem(mainListName, selectedEmployee.Id, {
          TaxRegime: newRegime,
          PAN: "",
          IsAcknowledged: false,
          Place: "",
          SubmittedDate: null,
          ApproverCommentsJson: "",
          Status: "Draft",
          RentDetailsJSON: "",
          ActiveStep: "",
          SectionDetailsJSON: "",
        });

        // 2. If changing from Old to New, soft-delete child lists
        if (oldRegime === "Old Regime" && newRegime === "New Regime") {
          const childLists =
            activeIndex === 0
              ? [
                  LIST_NAMES.IT_LANDLORD_DETAILS,
                  LIST_NAMES.IT_LTA,
                  LIST_NAMES.IT_HOUSING_LOAN,
                  LIST_NAMES.IT_PREVIOUS_EMPLOYER,
                ]
              : [
                  LIST_NAMES.IT_LANDLORD_DETAILS_Actual,
                  LIST_NAMES.IT_LTA_Actual,
                  LIST_NAMES.IT_HOUSING_LOAN_Actual,
                  LIST_NAMES.IT_PREVIOUS_EMPLOYER_Actual,
                  LIST_NAMES.IT_DOCUMENTS,
                ];

          const lookupCol =
            activeIndex === 0 ? "PlannedDeclarationId" : "ActualDeclarationId";

          for (const listName of childLists) {
            const items = await getListItems(
              listName,
              `${lookupCol} eq ${selectedEmployee.Id}`,
            );
            if (items.length > 0) {
              await updateListItemsBatch(
                listName,
                items.map((i) => ({ id: i.Id, data: { IsDelete: true } })),
              );
            }
          }
        }

        // setShowSuccessPopup(true);
        showToast(
          toast,
          "success",
          "Success",
          "Tax Regime Updated Successfully.",
        );

        // Trigger email notification
        const empEmail = selectedEmployee.EmployeeEmail || "";
        if (empEmail) {
          void sendTaxRegimeUpdateEmail(
            selectedEmployee.EmployeeName,
            selectedEmployee.EmployeeCode,
            empEmail,
            activeIndex === 0 ? "Planned" : "Actual",
            curFinanicalYear,
            user!,
            newRegime,
            selectedEmployee.Title,
          );
        }

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
      sortable: false,
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
    return globalSearchFilter(data, searchTerm);
  }, [searchTerm, data]);

  const handleExport = () => {
    const dataToExport = filteredData.map((emp) => ({
      "Employee ID": emp.EmployeeCode,
      "Employee Name": emp.EmployeeName,
      "Tax Regime Type": emp.TaxRegime,
    }));
    if (dataToExport.length) {
      exportToExcel(dataToExport, "Tax_Regime_Updates");
      setShowDownloadPopup(true);
      setTimeout(() => {
        setShowDownloadPopup(false);
      }, 3000);
    } else {
      showToast(toast, "warn", "No Data", "No records found for export.");
    }
  };

  return (
    <div className={styles.screen}>
      <AppToast toastRef={toast} />
      {isLoading && <Loader fullScreen label="Processing..." />}

      {/* <StatusPopup
        visible={showSuccessPopup}
        onHide={() => {
          setShowSuccessPopup(false);
          void fetchData();
        }}
        type="success"
        description="Action completed successfully."
      /> */}
      <StatusPopup
        visible={showDownloadPopup}
        onHide={() => setShowDownloadPopup(false)}
        type="download"
      />

      <div className={styles.titleBlock}>
        <h2>Tax Regime Update</h2>
      </div>
      <div className={styles.headerToolbar} style={{ margin: 0 }}>
        <div className={styles.tabToggle}>
          {(["Planned", "Actual"] as const).map((tab, index) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeIndex === index ? styles.active : ""}`}
              onClick={() => {
                setActiveIndex(index);
                setSearchTerm("");
              }}
            >
              {tab}
            </button>
          ))}
        </div>

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
            icon="pi pi-download"
            onClick={handleExport}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <AppDataTable
          key={activeIndex}
          columns={columns}
          data={filteredData}
          globalFilter={searchTerm}
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
              <div
                className={styles.employeeDetails}
                style={{ marginBottom: 10 }}
              >
                <span className={styles.detailLabel}>Employee Details</span> -{" "}
                <span className={styles.detailText}>
                  {selectedEmployee.EmployeeName} (
                  {selectedEmployee.EmployeeCode})
                </span>
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 18 }}>
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
function getCurrentFinancialYear() {
  throw new Error("Function not implemented.");
}
