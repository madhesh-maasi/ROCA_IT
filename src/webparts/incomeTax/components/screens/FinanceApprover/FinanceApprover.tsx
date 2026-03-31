import * as React from "react";
import AppDataTable, {
  IColumnDef,
} from "../../../../../CommonInputComponents/DataTable/DataTable";
import screenStyles from "../screens.module.scss";
import styles from "./FinanceApprover.module.scss";
import {
  ActionButton,
  IconButton,
  StatusPopup,
  Popup,
  SearchInput,
} from "../../../../../CommonInputComponents";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import { AppPeoplePicker } from "../../../../../CommonInputComponents/PeoplePicker";
import { IEmployee } from "../../../../../common/models";
import {
  addItem,
  getAllItems,
  getSP,
  updateItem,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import { useAppSelector } from "../../../../../store/hooks";
import { selectEmployees } from "../../../../../store/slices/employeeSlice";
import { globalSearchFilter } from "../../../../../common/utils/functions";
import Loader from "../../../../../common/components/Loader/Loader";
import { exportToExcel } from "../../../../../common/utils/exportUtils";
import { handleError } from "../../../../../common/utils/errorUtils";
import { ActionPopup } from "../../../../../common/components";

interface IAdminUser {
  Id: number;
  Title: string;
  Email: string;
  EmployeeId?: string;
  UserId: number;
}

const FinanceApprover: React.FC = () => {
  const [search, setSearch] = React.useState("");

  // ─── Site Admin Users ─────────────────────────────────────────────────────
  const [adminUsers, setAdminUsers] = React.useState<IAdminUser[]>([]);
  const masterEmployees = useAppSelector(selectEmployees);

  // ─── Add User Popup ───────────────────────────────────────────────────────
  const [showAddPopup, setShowAddPopup] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<IEmployee[]>(
    [],
  );
  const [isAdding, setIsAdding] = React.useState(false);

  // ─── Delete Confirmation Popup ────────────────────────────────────────────
  const [showDeletePopup, setShowDeletePopup] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<IAdminUser | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false);

  // ─── Toast Ref for notifications ──────────────────────────────────────────
  const toast = React.useRef<PrimeToast>(null);

  // ─── Load finance approvers from list on mount ────────────────────────────

  const init = async (): Promise<void> => {
    try {
      setIsAdding(true);
      const users = await getAllItems(
        LIST_NAMES.FINANCE_APPROVER,
        ["User/Title", "User/EMail"],
        "User",
        "Id",
        false,
        "IsDelete ne 1",
      );

      const mappedUsers = users.map((u: any) => ({
        Id: u.Id,
        Title: u.User.Title, // Support either column if existing
        Email: u.User.EMail,
        EmployeeId: u.EmployeeId,
        UserId: u.UserId,
      }));

      setAdminUsers(mappedUsers);
      setIsAdding(false);
    } catch (err) {
      await handleError(err, "Loading finance approvers list", toast);
    } finally {
      setIsAdding(false);
    }
  };

  React.useEffect(() => {
    void init();
  }, []);

  // ─── Search filter ────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return globalSearchFilter(adminUsers, search);
  }, [adminUsers, search]);

  // ─── Handle "Add" button inside popup ────────────────────────────────────
  const handleAddUser = async (): Promise<void> => {
    if (!selectedEmployee || selectedEmployee.length === 0) {
      showToast(toast, "error", "Validation", "Please select an employee.");
      return;
    }

    const emp = selectedEmployee[0];

    const matchedEmp = masterEmployees.find(
      (e) => e.Email?.toLowerCase() === emp.Email?.toLowerCase(),
    );
    const employeeIdToSave = matchedEmp ? matchedEmp.EmployeeId : "";

    // ─── Duplicate check (local) ───────────────────────────────────────────
    const isDuplicate = adminUsers.some(
      (u) => u.Email?.toLowerCase() === emp.Email?.toLowerCase(),
    );
    if (isDuplicate) {
      showToast(toast, "error", "Validation", "The user already exists", 4000);
      return;
    }

    // Close popup and clear selection immediately
    setShowAddPopup(false);
    setSelectedEmployee([]);
    setIsAdding(true);

    try {
      await addItem(LIST_NAMES.FINANCE_APPROVER, {
        EmployeeId: employeeIdToSave,
        UserId: emp.Id,
      });
      showToast(
        toast,
        "success",
        "Added",
        "Finance approver successfully added",
      );
      await init();
    } catch (err) {
      await handleError(err, "Adding user to list", toast);
    } finally {
      setIsAdding(false);
    }
  };

  // ─── Handle Delete User ─────────────────────────────────────────────────
  const handleDeleteUser = async (): Promise<void> => {
    if (!userToDelete) return;

    // Close popup and clear selection immediately
    setShowDeletePopup(false);
    setUserToDelete(null);
    setIsDeleting(true);

    try {
      await updateItem(LIST_NAMES.FINANCE_APPROVER, userToDelete.Id, {
        IsDelete: true,
      });
      await init();
      showToast(
        toast,
        "success",
        "Deleted",
        "User has been removed successfully.",
      );
    } catch (err) {
      await handleError(err, "Deleting user", toast);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Column definitions ───────────────────────────────────────────────────
  const actionTemplate = (rowData: IAdminUser, index: any) => {
    return index.rowIndex >= 1 ? (
      <IconButton
        variant="delete"
        icon="pi pi-trash"
        title="Delete"
        onClick={() => {
          setUserToDelete(rowData);
          setShowDeletePopup(true);
        }}
      />
    ) : null;
  };

  const COLUMNS: IColumnDef[] = [
    { field: "EmployeeId", header: "Employee ID" },
    { field: "Title", header: "Employee Name" },
    {
      field: "action",
      header: "Action",
      body: actionTemplate,
      sortable: false,
    },
  ];

  return (
    <div className={screenStyles.screen}>
      <StatusPopup
        visible={showDownloadPopup}
        onHide={() => setShowDownloadPopup(false)}
        type="download"
      />
      {(isAdding || isDeleting) && <Loader fullScreen label="Processing..." />}
      <AppToast toastRef={toast} />
      <div className={screenStyles.toolbar} style={{ alignItems: "center" }}>
        <h2 className={screenStyles.pageTitle} style={{ margin: 0 }}>
          Finance Approver
        </h2>
        <div className={screenStyles.spacer} />

        <SearchInput value={search} onChange={(val) => setSearch(val)} />

        <div className={styles.btnGroup}>
          <ActionButton
            variant="export"
            icon="pi pi-download"
            className="primaryBtn"
            onClick={() => {
              const exportData = filtered.map((u) => ({
                "Employee ID": u.EmployeeId || "-",
                "Employee Name": u.Title,
              }));
              if (exportData.length) {
                exportToExcel(exportData, "Finance_Approvers");
                setShowDownloadPopup(true);
                setTimeout(() => {
                  setShowDownloadPopup(false);
                }, 3000);
              } else {
                showToast(
                  toast,
                  "error",
                  "Export",
                  "No data available for export",
                  4000,
                );
              }
            }}
          />

          <ActionButton
            variant="add"
            label="Add New"
            icon="pi pi-plus-circle"
            className="primaryBtn"
            onClick={() => {
              setSelectedEmployee([]);
              setShowAddPopup(true);
            }}
          />
        </div>
      </div>

      {/* ── Data Table ────────────────────────────────────────────────────── */}
      <div className={styles.financeTableContainer}>
        <AppDataTable
          data={filtered}
          columns={COLUMNS}
          globalFilter={search}
          paginator
          rows={10}
          emptyMessage={"No Finance Approvers found."}
        />
      </div>

      <Popup
        visible={showAddPopup}
        onHide={() => setShowAddPopup(false)}
        header="Add Finance Approver"
        width="480px"
        confirmLabel="Submit"
        onConfirm={() => {
          void handleAddUser();
        }}
        closeLabel="Cancel"
      >
        <div className={styles.addPopupContent}>
          <AppPeoplePicker
            titleText="Select Employee"
            source="SiteMembers"
            isRequired
            personSelectionLimit={1}
            selectedUsers={selectedEmployee}
            onChange={(users) => {
              setSelectedEmployee(users as IEmployee[]);
            }}
          />
        </div>
      </Popup>

      <ActionPopup
        visible={showDeletePopup}
        onHide={() => {
          setShowDeletePopup(false);
          setUserToDelete(null);
        }}
        onConfirm={() => {
          void handleDeleteUser();
        }}
        actionType="Delete"
        message={`Are you sure you want to delete\n"${userToDelete?.Title}"?`}
      />
    </div>
  );
};

export default FinanceApprover;
