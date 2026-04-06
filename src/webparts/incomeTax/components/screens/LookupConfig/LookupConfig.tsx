import * as React from "react";
import styles from "./LookupConfig.module.scss";
import {
  SearchInput,
  AppDataTable,
  ActionButton,
  IconButton,
  Popup,
  InputField,
  AppDropdown,
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
} from "../../../../../common/utils/validationUtils";
import { globalSearchFilter } from "../../../../../common/utils/functions";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import Loader from "../../../../../common/components/Loader/Loader";
import { handleError } from "../../../../../common/utils/errorUtils";
import { ActionPopup } from "../../../../../common/components";

interface ILookupData {
  id: number;
  sectionId: string;
  section: string; // mapped from Title or Lookup
  subSection: string; // mapped from SubSection
  types: string; // mapped from Types
  maxAmount: string; // mapped from MaxAmount
}

const LookupConfig: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);
  const [data, setData] = React.useState<ILookupData[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Consolidated UI States
  const [loader, setLoader] = React.useState<boolean>(false);

  // Consolidated Dialog State
  const [dialog, setDialog] = React.useState<{
    type: "ADD" | "EDIT" | "DELETE" | null;
    id: number | null;
  }>({ type: null, id: null });
  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false);

  // Consolidated Form State
  const [formData, setFormData] = React.useState({
    sectionId: "",
    subSection: "",
    types: "",
    maxAmount: "",
  });

  const [sectionOptions, setSectionOptions] = React.useState<
    { label: string; value: number }[]
  >([]);

  const fetchSectionOptions = async () => {
    try {
      const items = await getListItems(LIST_NAMES.SECTION_CONFIG);
      const options = items.map((item) => ({
        label: item.Title || "",
        value: item.Id || 0,
      }));
      setSectionOptions(options);
      return options;
    } catch (error) {
      await handleError(error, "Loading sections for dropdown", toast);
      return [];
    }
  };

  const fetchLookupItems = async (
    options: { label: string; value: number }[],
  ) => {
    setLoader(true);
    try {
      const items = await getListItems(LIST_NAMES.LOOKUP_CONFIG);
      const mapped: ILookupData[] = items.map((item) => {
        const sid = item.SectionId;
        const matched = options.find((o) => o.value === sid);
        return {
          id: item.Id,
          sectionId: sid ? String(sid) : "",
          section: matched ? matched.label : item.Title || "",
          subSection: item.SubSection || "",
          types: item.Types || "",
          maxAmount: item.MaxAmount ? String(item.MaxAmount) : "",
        };
      });
      setData(mapped);
    } catch (error) {
      await handleError(error, "Loading lookup items", toast);
    } finally {
      setLoader(false);
    }
  };

  const init = async (): Promise<void> => {
    const opts = await fetchSectionOptions();
    await fetchLookupItems(opts);
  };

  React.useEffect(() => {
    void init();
  }, []);

  const filteredData = React.useMemo(() => {
    return globalSearchFilter(data, searchTerm);
  }, [data, searchTerm]);

  const handleExport = () => {
    if (filteredData.length === 0) {
      showToast(toast, "warn", "No Data", "No data available to export");
      return;
    }
    exportToExcel(
      filteredData.map(({ section, subSection, types, maxAmount }) => ({
        Sections: section,
        "Sub-Sections": subSection || "-",
        Types: types,
        "Max Amount": maxAmount || "-",
      })),
      "Lookup_Configuration",
    );
    setShowDownloadPopup(true);
    setTimeout(() => {
      setShowDownloadPopup(false);
    }, 3000);
  };

  // ─── Dialog Triggers ────────────────────────────────────────────────────────

  const openAddPopup = () => {
    setFormData({ sectionId: "", subSection: "", types: "", maxAmount: "" });
    setDialog({ type: "ADD", id: null });
  };

  const openEditPopup = (row: ILookupData) => {
    setFormData({
      sectionId: row.sectionId,
      subSection: row.subSection,
      types: row.types,
      maxAmount: row.maxAmount,
    });
    setDialog({ type: "EDIT", id: row.id });
  };

  const openDeleteConfirm = (row: ILookupData) => {
    setDialog({ type: "DELETE", id: row.id });
  };

  // ─── Form Actions ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    // Validate
    const sectionErr = validateField(formData.sectionId, [
      required("Section is required"),
    ]);
    const subSectionErr = ""; // Removed regex validation, filtering handled in onChange
    const typesErr = validateField(formData.types, [
      required("Types is required"),
    ]);
    // const maxAmtErr = validateField(formData.maxAmount, [
    //   required("Max Amount is required"),
    // ]);

    // Validate uniqueness of the combination
    let duplicateErr = "";
    const isDuplicate = data.some((item) => {
      if (dialog.type === "EDIT" && item.id === dialog.id) return false;
      return (
        item.sectionId === formData.sectionId &&
        item.subSection.toLowerCase() ===
          formData.subSection.trim().toLowerCase() &&
        item.types.toLowerCase() === formData.types.trim().toLowerCase()
      );
    });

    if (isDuplicate) {
      duplicateErr =
        "This combination of Section, Sub-Section, and Type already exists.";
    }

    if (
      sectionErr ||
      // subSectionErr ||
      typesErr ||
      // || maxAmtErr
      duplicateErr
    ) {
      const errorMsg =
        duplicateErr ||
        sectionErr ||
        // || subSectionErr
        typesErr;
      //  || maxAmtErr;
      showToast(toast, "warn", "Validation Error", errorMsg);
      return;
    }

    setLoader(true);
    try {
      // const selectedSection = sectionOptions.find(
      //   (o) => o.value === Number(formData.sectionId),
      // );
      const payload = {
        SectionId: Number(formData.sectionId),
        SubSection: formData.subSection.trim(),
        Types: formData.types.trim(),
        MaxAmount: formData.maxAmount.trim(),
      };

      if (dialog.type === "EDIT" && dialog.id) {
        await updateListItem(LIST_NAMES.LOOKUP_CONFIG, dialog.id, payload);
        showToast(toast, "success", "Saved", "Item updated successfully.");
      } else {
        await addListItem(LIST_NAMES.LOOKUP_CONFIG, payload);
        showToast(toast, "success", "Saved", "Item added successfully.");
      }

      setDialog({ type: null, id: null });
      await init();
    } catch (error) {
      await handleError(error, "Saving item", toast);
    } finally {
      setLoader(false);
    }
  };

  const handleDelete = async () => {
    if (!dialog.id) return;

    setLoader(true);
    try {
      await deleteListItem(LIST_NAMES.LOOKUP_CONFIG, dialog.id);
      showToast(toast, "success", "Deleted", "Item deleted successfully.");
      setDialog({ type: null, id: null });
      await init();
    } catch (error) {
      await handleError(error, "Deleting item", toast);
    } finally {
      setLoader(false);
    }
  };

  // ─── Table Columns ──────────────────────────────────────────────────────────

  const actionTemplate = (rowData: ILookupData) => {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
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
    { field: "section", header: "Sections", style: { width: "25%" } },
    {
      field: "subSection",
      header: "Sub-Sections",
      body: (rowData: ILookupData) => {
        return <span>{rowData.subSection || "-"}</span>;
      },
      style: { width: "25%" },
    },
    { field: "types", header: "Types", style: { width: "25%" } },
    {
      field: "maxAmount",
      header: "Max Amount",
      body: (rowData: ILookupData) => {
        return <span>{rowData.maxAmount || "-"}</span>;
      },
      style: { width: "15%" },
    },
    {
      field: "action",
      header: "Action",
      body: actionTemplate,
      sortable: false,
      style: { width: "120px", textAlign: "center" },
    },
  ];

  return (
    <div className={screenStyles.screen}>
      <StatusPopup
        visible={showDownloadPopup}
        onHide={() => setShowDownloadPopup(false)}
        type="download"
      />
      <AppToast toastRef={toast} />
      {loader && <Loader fullScreen label="Loading Configuration..." />}

      <div className={styles.header}>
        <h2>Lookup Configuration</h2>
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
            onClick={handleExport}
            icon="pi pi-download"
          />
          <ActionButton
            variant="add"
            className="primaryBtn"
            icon="pi pi-plus-circle"
            label="Add New"
            onClick={openAddPopup}
          />
        </div>
      </div>

      <AppDataTable
        data={filteredData}
        columns={columns}
        globalFilter={searchTerm}
        paginator={filteredData.length > 0}
        rows={10}
      />

      {/* ── Add / Edit Popup ── */}
      <Popup
        visible={dialog.type === "ADD" || dialog.type === "EDIT"}
        header={dialog.type === "EDIT" ? "Edit Lookup Item" : "Add Lookup Item"}
        onHide={() => setDialog({ type: null, id: null })}
        confirmLabel={dialog.type === "EDIT" ? "Update" : "Add"}
        onConfirm={handleSave}
        iconFlag={false}
        disable={loader}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <AppDropdown
            id="sectionName"
            label="Section"
            placeholder="Select a section..."
            value={formData.sectionId ? Number(formData.sectionId) : ""}
            options={sectionOptions}
            onChange={(e) =>
              setFormData((p) => ({ ...p, sectionId: String(e.value) }))
            }
            required
            className={styles.inputField}
          />
          <InputField
            id="subSection"
            label="Sub-Section"
            placeholder="Enter sub-section"
            // required
            value={formData.subSection}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                subSection: e.target.value.replace(/[^a-zA-Z0-9\s\-().,]/g, ""),
              }))
            }
            className={styles.inputField}
          />
          <InputField
            id="types"
            label="Type"
            placeholder="Enter type"
            required
            value={formData.types}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                types: e.target.value.replace(/[^a-zA-Z0-9\s\-().,]/g, ""),
              }))
            }
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
                maxAmount: e.target.value.replace(/[^0-9]/g, "").slice(0, 7),
              }))
            }
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
        message={`Are you sure you want to delete\n this item?`}
        iconFlag={false}
      />
    </div>
  );
};

export default LookupConfig;
