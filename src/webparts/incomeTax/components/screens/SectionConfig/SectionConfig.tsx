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
  code: string; // mapped from Code
  name: string; // mapped from Title
  maxAmount: string; // mapped from MaxAmount
  order: string; // mapped from SectionOrder
}

const SectionConfig: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);
  const [data, setData] = React.useState<ISectionData[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Consolidated UI States
  const [loader, setLoader] = React.useState<boolean>(false);

  // Consolidated Dialog State
  const [dialog, setDialog] = React.useState<{
    type: "ADD" | "EDIT" | "DELETE" | null;
    id: number | null;
  }>({ type: null, id: null });

  // Consolidated Form State
  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    maxAmount: "",
    order: "",
  });
  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false);

  const fetchSections = async () => {
    setLoader(true);
    try {
      const items = await getListItems(LIST_NAMES.SECTION_CONFIG);
      const mapped: ISectionData[] = items.map((item) => ({
        id: item.Id,
        code: item.Code || "",
        name: item.Title || "",
        maxAmount: item.MaxAmount ? String(item.MaxAmount) : "",
        order: item.SectionOrder ? String(item.SectionOrder) : "",
      }));
      setData(mapped);
    } catch (error) {
      await handleError(error, "Loading sections", toast);
    } finally {
      setLoader(false);
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
    if (filteredData.length === 0) {
      showToast(toast, "warn", "No Data", "No data available to export");
      return;
    }
    exportToExcel(
      filteredData.map(({ code, name, maxAmount, order }) => ({
        Order: order || "-",
        Code: code || "-",
        Sections: name,
        "Max Amount": maxAmount || "-",
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
    setFormData({ code: "", name: "", maxAmount: "", order: "" });
    setDialog({ type: "ADD", id: null });
  };

  const openEditPopup = (row: ISectionData) => {
    setFormData({
      name: row.name,
      code: row.code,
      maxAmount: row.maxAmount,
      order: row.order,
    });
    setDialog({ type: "EDIT", id: row.id });
  };

  const openDeleteConfirm = (row: ISectionData) => {
    setDialog({ type: "DELETE", id: row.id });
  };

  // ─── Form Actions ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    const existingItems = data.filter((item) => item.id !== dialog.id);
    const existingNames = existingItems.map((item) => item.name);
    const existingOrders = existingItems.map((item) => item.order);
    const existingCodes = data
      .filter((item) => item.id !== dialog.id)
      .map((item) => item.code.toLowerCase());
    // Validate
    const codeErr = validateField(formData.code.toLowerCase(), [
      required("Code is required"),
      isUnique(existingCodes, "This code already exists"),
    ]);
    const nameErr = validateField(formData.name, [
      required("Section Name is required"),
      isUnique(existingNames, "This section already exists"),
    ]);
    const amtErr = validateField(formData.maxAmount, [
      required("Max Amount is required"),
    ]);
    const orderErr = validateField(formData.order, [
      required("Order is required"),
      isUnique(existingOrders, "This order already exists"),
    ]);

    if (codeErr || nameErr || orderErr) {
      showToast(
        toast,
        "warn",
        "Validation Error",
        codeErr || nameErr || orderErr || amtErr,
      );
      return;
    }

    setLoader(true);
    try {
      const payload = {
        Code: formData.code.trim(),
        Title: formData.name.trim(),
        MaxAmount: formData.maxAmount.trim(),
        SectionOrder: formData.order ? Number(formData.order) : null,
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
      setLoader(false);
    }
  };

  const handleDelete = async () => {
    if (!dialog.id) return;

    setLoader(true);
    try {
      // Find and delete related lookup items first
      const relatedLookups = await getListItems(
        LIST_NAMES.LOOKUP_CONFIG,
        `SectionId eq ${dialog.id}`,
      );

      for (const lookup of relatedLookups) {
        if (lookup.Id) {
          await deleteListItem(LIST_NAMES.LOOKUP_CONFIG, lookup.Id);
        }
      }

      // Delete the section itself
      await deleteListItem(LIST_NAMES.SECTION_CONFIG, dialog.id);

      showToast(
        toast,
        "success",
        "Deleted",
        "Section and related lookup deleted successfully.",
      );
      setDialog({ type: null, id: null });
      await init();
    } catch (error) {
      await handleError(error, "Deleting section", toast);
    } finally {
      setLoader(false);
    }
  };

  const actionTemplate = (rowData: ISectionData) => {
    return (
      <div className={styles.actionCell}>
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
    { field: "name", header: "Sections", style: { width: "50%" } },
    {
      field: "maxAmount",
      header: "Max Amount",
      body: (rowData: ISectionData) => {
        return <span>{rowData.maxAmount || "-"}</span>;
      },
      style: { width: "25%" },
    },
    { field: "code", header: "Code", style: { width: "15%" } },
    {
      field: "order",
      header: "Order",
      style: { width: "10%" },
      body: (rowData: ISectionData) => {
        return <span>{rowData.order || "-"}</span>;
      },
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
      <AppToast toastRef={toast} />
      <StatusPopup
        visible={showDownloadPopup}
        onHide={() => setShowDownloadPopup(false)}
        type="download"
      />
      {loader && <Loader fullScreen label="Loading..." />}

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
          paginator={filteredData.length > 0}
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
        disable={loader}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <InputField
            id="sectionName"
            label="Section Name"
            placeholder="Enter section name"
            value={formData.name}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                name: e.target.value.replace(/[^a-zA-Z0-9\s-]/g, ""),
              }))
            }
            required
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
          <InputField
            id="code"
            label="Code"
            placeholder="Enter code"
            value={formData.code}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                code: e.target.value,
              }))
            }
            required
            className={styles.inputField}
          />
          <InputField
            id="order"
            label="Order"
            placeholder="Enter order"
            value={formData.order}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                order: e.target.value.replace(/[^0-9]/g, ""),
              }))
            }
            required
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
        message={`Are you sure you want to delete\n the section and its related lookup items?`}
      />
    </div>
  );
};

export default SectionConfig;
