import * as React from "react";
import AppDataTable, {
  IColumnDef,
} from "../../../../../CommonInputComponents/DataTable/DataTable";
import screenStyles from "../screens.module.scss";
import styles from "./FinanceApprover.module.scss";
import { ActionButton, IconButton } from "../../../../../CommonInputComponents";
import { SearchInput } from "../../../../../CommonInputComponents/SearchInput";
import ActionPopup from "../../../../../common/components/ActionPopup/ActionPopup";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import { Popup } from "../../../../../CommonInputComponents/Popup";
import { AppPeoplePicker } from "../../../../../CommonInputComponents/PeoplePicker";
import { IEmployee } from "../../../../../common/models";
import {
  getSiteAdminsGroupUsers,
  addUserToGroupById,
  removeUserFromGroupById,
  getSiteOwnersGroup,
} from "../../../../../common/utils/pnpService";
import { useAppSelector } from "../../../../../store/hooks";
import { selectEmployees } from "../../../../../store/slices/employeeSlice";
import Loader from "../../../../../common/components/Loader/Loader";
import { exportToExcel } from "../../../../../common/utils/exportUtils";
import { handleError } from "../../../../../common/utils/errorUtils";

interface IAdminUser {
  Id: number;
  Title: string;
  Email: string;
  LoginName: string;
  EmployeeId?: string;
}

const FinanceApprover: React.FC = () => {
  const [search, setSearch] = React.useState("");

  // ─── Site Admin Users ─────────────────────────────────────────────────────
  const [adminUsers, setAdminUsers] = React.useState<IAdminUser[]>([]);
  const [adminGroupId, setAdminGroupId] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
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

  // ─── Success confirmation popup ───────────────────────────────────────────
  const [showSuccessPopup, setShowSuccessPopup] = React.useState(false);

  // ─── Toast Ref for notifications ──────────────────────────────────────────
  const toast = React.useRef<PrimeToast>(null);

  // ─── Load admin group users on mount ──────────────────────────────────────

  const init = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const [group, users] = await Promise.all([
        getSiteOwnersGroup(),
        getSiteAdminsGroupUsers(),
      ]);

      const mergedUsers = (users as any[]).map((u) => {
        const empMatch = masterEmployees.find(
          (e) => e.Email?.toLowerCase() === u.Email?.toLowerCase(),
        );
        return {
          Id: u.Id,
          Title: u.Title,
          Email: u.Email,
          LoginName: u.LoginName,
          EmployeeId: empMatch?.EmployeeId ?? "N/A",
        };
      });

      setAdminGroupId(group?.Id ?? null);
      setAdminUsers(mergedUsers);
    } catch (err) {
      await handleError(err, "Loading admin group data", toast);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    void init();
  }, [masterEmployees]);

  // ─── Search filter ────────────────────────────────────────────────────────
  const filtered = adminUsers.filter(
    (row) =>
      search === "" ||
      row.Title?.toLowerCase().includes(search.toLowerCase()) ||
      row.Email?.toLowerCase().includes(search.toLowerCase()) ||
      row.EmployeeId?.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Handle "Add" button inside popup ────────────────────────────────────
  const handleAddUser = async (): Promise<void> => {
    if (!selectedEmployee || selectedEmployee.length === 0) {
      showToast(toast, "error", "Validation", "Please select an employee.");
      return;
    }

    const emp = selectedEmployee[0];
    const loginName = emp.Email
      ? `i:0#.f|membership|${emp.Email.toLowerCase()}`
      : "";

    // ─── Duplicate check (local) ───────────────────────────────────────────
    const isDuplicate = adminUsers.some(
      (u) => u.Email?.toLowerCase() === emp.Email?.toLowerCase(),
    );
    if (isDuplicate) {
      showToast(toast, "error", "Validation", `The user already exists`, 4000);
      return;
    }

    if (!adminGroupId) {
      showToast(
        toast,
        "error",
        "Error",
        "Could not determine site admin group. Please try again.",
      );
      return;
    }

    // Close popup and clear selection immediately
    setShowAddPopup(false);
    setSelectedEmployee([]);
    setIsAdding(true);

    try {
      await addUserToGroupById(adminGroupId, loginName);
      await init();
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    } catch (err) {
      await handleError(err, "Adding user to group", toast);
    } finally {
      setIsAdding(false);
    }
  };

  // ─── Handle Delete User ─────────────────────────────────────────────────
  const handleDeleteUser = async (): Promise<void> => {
    if (!userToDelete || !adminGroupId) return;

    const userLoginName = userToDelete.LoginName;

    // Close popup and clear selection immediately
    setShowDeletePopup(false);
    setUserToDelete(null);
    setIsDeleting(true);

    try {
      await removeUserFromGroupById(adminGroupId, userLoginName);
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
  const actionTemplate = (rowData: IAdminUser) => {
    return (
      <IconButton
        variant="delete"
        icon="pi pi-trash"
        title="Delete"
        onClick={() => {
          setUserToDelete(rowData);
          setShowDeletePopup(true);
        }}
      />
    );
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
            icon="pi pi-file-excel"
            className="primaryBtn"
            onClick={() => {
              const exportData = adminUsers.map((u) => ({
                "Employee ID": u.EmployeeId || "-",
                "Employee Name": u.Title,
              }));
              exportToExcel(exportData, "Finance_Approvers");
            }}
          />

          <ActionButton
            variant="add"
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
          paginator
          rows={10}
          emptyMessage={
            isLoading ? "Loading..." : "No Finance Approvers found."
          }
        />
      </div>

      <Popup
        visible={showAddPopup}
        onHide={() => setShowAddPopup(false)}
        header="Add Finance Approver"
        width="480px"
        confirmLabel="Add"
        onConfirm={() => {
          void handleAddUser();
        }}
        closeLabel="Cancel"
      >
        <div className={styles.addPopupContent}>
          <AppPeoplePicker
            titleText="Select Employee"
            source="EmployeeMaster"
            personSelectionLimit={1}
            selectedUsers={selectedEmployee}
            onChange={(users) => {
              setSelectedEmployee(users as IEmployee[]);
            }}
          />
        </div>
      </Popup>

      <ActionPopup
        visible={showSuccessPopup}
        onHide={() => setShowSuccessPopup(false)}
        onConfirm={() => setShowSuccessPopup(false)}
        actionType="Added"
        message={"Finance Approver has been\nadded successfully."}
      />

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
