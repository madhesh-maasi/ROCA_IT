import * as React from "react";
import styles from "./SectionConfig.module.scss";
import {
  SearchInput,
  AppDataTable,
  ActionButton,
  IconButton,
  Popup,
  InputField,
  StatusPopup,
} from "../../../../../CommonInputComponents";
import { IColumnDef } from "../../../../../CommonInputComponents/DataTable/DataTable";
import screenStyles from "../screens.module.scss";
import { exportToExcel } from "../../../../../common/utils/exportUtils";
import {
  getListItems,
  addListItem,
  updateListItem,
  deleteListItem,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import {
  validateField,
  required,
  isUnique,
} from "../../../../../common/utils/validationUtils";
import { globalSearchFilter } from "../../../../../common/utils/functions";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import Loader from "../../../../../common/components/Loader/Loader";
import { handleError } from "../../../../../common/utils/errorUtils";
import { ActionPopup } from "../../../../../common/components";

interface ISectionData {
  id: number;
  name: string; // mapped from Title
  maxAmount: string; // mapped from MaxAmount
}

const SectionConfig: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);
  const [data, setData] = React.useState<ISectionData[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Consolidated UI States
  const [uiState, setUiState] = React.useState({
    isLoading: true,
    isSaving: false,
  });

  // Consolidated Dialog State
  const [dialog, setDialog] = React.useState<{
    type: "ADD" | "EDIT" | "DELETE" | null;
    id: number | null;
  }>({ type: null, id: null });

  // Consolidated Form State
  const [formData, setFormData] = React.useState({ name: "", maxAmount: "" });
  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false);

  const fetchSections = async () => {
    setUiState((p) => ({ ...p, isLoading: true }));
    try {
      const items = await getListItems(LIST_NAMES.SECTION_CONFIG);
      const mapped: ISectionData[] = items.map((item) => ({
        id: item.Id,
        name: item.Title || "",
        maxAmount: item.MaxAmount ? String(item.MaxAmount) : "",
      }));
      setData(mapped);
    } catch (error) {
      await handleError(error, "Loading sections", toast);
    } finally {
      setUiState((p) => ({ ...p, isLoading: false }));
    }
  };

  const init = async (): Promise<void> => {
    await fetchSections();
  };

  React.useEffect(() => {
    void init();
  }, []);

  const filteredData = React.useMemo(() => {
    return globalSearchFilter(data, searchTerm);
  }, [data, searchTerm]);

  const handleExport = () => {
    exportToExcel(
      filteredData.map(({ name, maxAmount }) => ({
        Sections: name,
        "Max Amount": maxAmount,
      })),
      "Section_Configuration",
    );
    setShowDownloadPopup(true);
    setTimeout(() => {
      setShowDownloadPopup(false);
    }, 3000);
  };

  // ─── Dialog Triggers ────────────────────────────────────────────────────────

  const openAddPopup = () => {
    setFormData({ name: "", maxAmount: "" });
    setDialog({ type: "ADD", id: null });
  };

  const openEditPopup = (row: ISectionData) => {
    setFormData({ name: row.name, maxAmount: row.maxAmount });
    setDialog({ type: "EDIT", id: row.id });
  };

  const openDeleteConfirm = (row: ISectionData) => {
    setDialog({ type: "DELETE", id: row.id });
  };

  // ─── Form Actions ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    // Collect existing names for uniqueness check (exclude current if editing)
    const existingNames = data
      .filter((item) => item.id !== dialog.id)
      .map((item) => item.name);

    // Validate
    const nameErr = validateField(formData.name, [
      required("Section Name is required"),
      isUnique(existingNames, "This section already exists"),
    ]);
    const amtErr = validateField(formData.maxAmount, [
      required("Max Amount is required"),
    ]);

    if (nameErr || amtErr) {
      showToast(toast, "warn", "Validation Error", nameErr || amtErr);
      return;
    }

    setUiState((p) => ({ ...p, isSaving: true }));
    try {
      const payload = {
        Title: formData.name.trim(),
        MaxAmount: formData.maxAmount.trim(),
      };

      if (dialog.type === "EDIT" && dialog.id) {
        await updateListItem(LIST_NAMES.SECTION_CONFIG, dialog.id, payload);
        showToast(toast, "success", "Saved", "Section updated successfully.");
      } else {
        await addListItem(LIST_NAMES.SECTION_CONFIG, payload);
        showToast(toast, "success", "Saved", "Section added successfully.");
      }

      setDialog({ type: null, id: null });
      await init();
    } catch (error) {
      await handleError(error, "Saving section", toast);
    } finally {
      setUiState((p) => ({ ...p, isSaving: false }));
    }
  };

  const handleDelete = async () => {
    if (!dialog.id) return;

    setUiState((p) => ({ ...p, isSaving: true }));
    try {
      await deleteListItem(LIST_NAMES.SECTION_CONFIG, dialog.id);
      showToast(toast, "success", "Deleted", "Section deleted successfully.");
      setDialog({ type: null, id: null });
      await init();
    } catch (error) {
      await handleError(error, "Deleting section", toast);
    } finally {
      setUiState((p) => ({ ...p, isSaving: false }));
    }
  };

  const actionTemplate = (rowData: ISectionData) => {
    return (
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <IconButton
          variant="edit"
          icon="pi pi-pencil"
          title="Edit"
          onClick={() => openEditPopup(rowData)}
        />
        <IconButton
          variant="delete"
          icon="pi pi-trash"
          title="Delete"
          onClick={() => openDeleteConfirm(rowData)}
        />
      </div>
    );
  };

  const columns: IColumnDef[] = [
    { field: "name", header: "Sections" },
    { field: "maxAmount", header: "Max Amount" },
    {
      field: "action",
      header: "Action",
      body: actionTemplate,
      sortable: false,
      style: { width: "120px" },
    },
  ];

  return (
    <div className={screenStyles.screen}>
      <AppToast toastRef={toast} />
      <StatusPopup
        visible={showDownloadPopup}
        onHide={() => setShowDownloadPopup(false)}
        type="download"
      />
      {uiState.isLoading && <Loader fullScreen label="Loading Sections..." />}

      <div className={styles.header}>
        <h2>Section Configuration</h2>
        <div className={styles.toolbar}>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search"
            className={styles.searchInput}
          />
          <ActionButton
            variant="export"
            className="secondaryBtn"
            icon="pi pi-download"
            onClick={handleExport}
          />
          {/* <ActionButton
            variant="import"
            className="secondaryBtn"
            onClick={() => console.log("Import clicked")}
          /> */}
          <ActionButton
            variant="add"
            className="primaryBtn"
            icon="pi pi-plus-circle"
            onClick={openAddPopup}
            label="Add New"
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <AppDataTable
          data={filteredData}
          columns={columns}
          globalFilter={searchTerm}
          paginator={true}
          rows={10}
        />
      </div>

      {/* ── Add / Edit Popup ── */}
      <Popup
        visible={dialog.type === "ADD" || dialog.type === "EDIT"}
        header={dialog.type === "EDIT" ? "Edit Section" : "Add Section"}
        onHide={() => setDialog({ type: null, id: null })}
        confirmLabel={dialog.type === "EDIT" ? "Update" : "Add"}
        onConfirm={handleSave}
        iconFlag={false}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <InputField
            id="sectionName"
            label="Section Name"
            placeholder="Enter section name"
            value={formData.name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, name: e.target.value }))
            }
            required
            disabled={uiState.isSaving}
            className={styles.inputField}
          />
          <InputField
            id="maxAmount"
            label="Max Amount"
            placeholder="Enter max amount"
            value={formData.maxAmount}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                maxAmount: e.target.value.replace(/[^0-9]/g, ""),
              }))
            }
            required
            disabled={uiState.isSaving}
            className={styles.inputField}
          />
        </div>
      </Popup>

      <ActionPopup
        visible={dialog.type === "DELETE"}
        onHide={() => {
          setDialog({ type: null, id: null });
        }}
        onConfirm={() => {
          void handleDelete();
        }}
        actionType="Delete"
        message={`Are you sure you want to delete\n the section?`}
      />
    </div>
  );
};

export default SectionConfig;
