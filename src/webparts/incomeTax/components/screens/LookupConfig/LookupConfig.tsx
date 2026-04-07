import * as React from "react";
import * as XLSX from "xlsx";
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
  getAllItems,
  getSP,
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

  // Import Popup State
  const [showImportPopup, setShowImportPopup] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  // ─── Template Download ──────────────────────────────────────────────────────

  const templateDownload = async (): Promise<void> => {
    try {
      setLoader(true);
      const items: any = await getAllItems(
        LIST_NAMES.IT_Templates,
        ["FileRef", "FileLeafRef", "Template"],
        undefined,
        "Id",
        false,
        "Template eq 'LookupConfig'",
      );

      if (items.length > 0) {
        const fileUrl = items[0].FileRef;
        const sp = getSP();
        const file = await sp.web
          .getFileByServerRelativePath(fileUrl)
          .getBlob();
        const url = window.URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = items[0].FileLeafRef;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        showToast(
          toast,
          "success",
          "Success",
          "Template downloaded successfully.",
        );
      } else {
        showToast(
          toast,
          "warn",
          "Not Found",
          "No template found for Lookup Config.",
        );
      }
    } catch (error) {
      console.error("Error downloading template", error);
      showToast(toast, "error", "Error", "Failed to download template.");
    } finally {
      setLoader(false);
    }
  };

  // ─── Import Drag & Drop Handlers ────────────────────────────────────────────

  const isValidExcelFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    return (
      name.endsWith(".xls") ||
      name.endsWith(".xlsx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (isValidExcelFile(file)) {
        setImportFile(file);
      } else {
        showToast(
          toast,
          "warn",
          "Invalid File",
          "Please upload an Excel (.xlsx/.xls) file.",
        );
      }
    }
  };

  const onImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isValidExcelFile(file)) {
        setImportFile(file);
      } else {
        showToast(
          toast,
          "warn",
          "Invalid File",
          "Please upload an Excel (.xlsx/.xls) file.",
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  // ─── Import Confirm Handler ──────────────────────────────────────────────────

  const REQUIRED_IMPORT_COLS = [
    "sections",
    "sub-sections",
    "types",
    "max amount",
  ];

  const handleConfirmImport = async () => {
    if (!importFile) {
      showToast(
        toast,
        "warn",
        "Validation",
        "Please select an Excel file to upload.",
      );
      return;
    }

    setLoader(true);
    try {
      // 1. Parse the Excel file
      const buffer = await importFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(ws);

      if (jsonData.length === 0) {
        showToast(
          toast,
          "warn",
          "Empty File",
          "The uploaded file has no data rows.",
        );
        setLoader(false);
        return;
      }

      // 2. Validate columns (case-insensitive)
      const fileHeaders = Object.keys(jsonData[0]).map((h) =>
        h.trim().toLowerCase(),
      );
      const missingCols = REQUIRED_IMPORT_COLS.filter(
        (c) => !fileHeaders.includes(c),
      );
      if (missingCols.length > 0) {
        showToast(
          toast,
          "error",
          "Invalid Format",
          `Missing required columns: ${missingCols.join(", ")}. Please use the correct template.`,
        );
        setLoader(false);
        return;
      }

      // 3. Helper: get value regardless of exact casing
      const getCol = (row: any, colName: string): string => {
        const key = Object.keys(row).find(
          (k) => k.trim().toLowerCase() === colName,
        );
        return key ? String(row[key] ?? "").trim() : "";
      };

      // 4. Validate each row and map to payload
      interface IImportRow {
        sectionId: number;
        subSection: string;
        types: string;
        maxAmount: string;
        rowNum: number;
      }

      const validRows: IImportRow[] = [];
      const rowErrors: string[] = [];

      // Use the already-loaded sectionOptions for lookup validation
      const currentSectionOptions = sectionOptions;

      jsonData.forEach((row, idx) => {
        const rowNum = idx + 2; // +1 for 0-index, +1 for header
        const sectionLabel = getCol(row, "sections");
        const subSection = getCol(row, "sub-sections");
        const types = getCol(row, "types");
        const maxAmount = getCol(row, "max amount");

        if (!sectionLabel) {
          rowErrors.push(`Row ${rowNum}: Sections is required.`);
          return;
        }
        if (!types) {
          rowErrors.push(`Row ${rowNum}: Types is required.`);
          return;
        }

        // Validate Sections value against Section Config options
        const matched = currentSectionOptions.find(
          (o) => o.label.toLowerCase() === sectionLabel.toLowerCase(),
        );
        if (!matched) {
          rowErrors.push(
            `Row ${rowNum}: Section "${sectionLabel}" not found in Section Config.`,
          );
          return;
        }

        validRows.push({
          sectionId: matched.value,
          subSection,
          types,
          maxAmount,
          rowNum,
        });
      });

      if (rowErrors.length > 0 && validRows.length === 0) {
        showToast(
          toast,
          "error",
          "Validation Failed",
          `${rowErrors.length} error(s) found. No records imported. First error: ${rowErrors[0]}`,
        );
        setLoader(false);
        return;
      }

      if (rowErrors.length > 0) {
        showToast(
          toast,
          "warn",
          "Partial Validation",
          `${rowErrors.length} row(s) skipped. First: ${rowErrors[0]}`,
        );
      }

      // 5. Upsert each valid row
      let addedCount = 0;
      let updatedCount = 0;

      for (const row of validRows) {
        const existingItem = data.find(
          (item) =>
            Number(item.sectionId) === row.sectionId &&
            item.subSection.trim().toLowerCase() ===
              row.subSection.toLowerCase() &&
            item.types.trim().toLowerCase() === row.types.toLowerCase(),
        );

        const payload = {
          SectionId: row.sectionId,
          SubSection: row.subSection,
          Types: row.types,
          MaxAmount: row.maxAmount,
        };

        if (existingItem) {
          await updateListItem(
            LIST_NAMES.LOOKUP_CONFIG,
            existingItem.id,
            payload,
          );
          updatedCount++;
        } else {
          await addListItem(LIST_NAMES.LOOKUP_CONFIG, payload);
          addedCount++;
        }
      }

      // 6. Success feedback & refresh
      const summary: string[] = [];
      if (addedCount > 0) summary.push(`${addedCount} added`);
      if (updatedCount > 0) summary.push(`${updatedCount} updated`);
      showToast(
        toast,
        "success",
        "Import Successful",
        summary.join(", ") + " successfully.",
      );

      setShowImportPopup(false);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await init();
    } catch (error) {
      await handleError(error, "Importing lookup config", toast);
    } finally {
      setLoader(false);
    }
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
            variant="import"
            className="secondaryBtn"
            onClick={() => {
              setImportFile(null);
              setShowImportPopup(true);
            }}
            icon="pi pi-upload"
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

      {/* ── Import Upload Popup ── */}
      <ActionPopup
        visible={showImportPopup}
        onHide={() => {
          setShowImportPopup(false);
          setImportFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        onConfirm={handleConfirmImport}
        actionType="Updated"
        title="Import Lookup Config"
        confirmLabel={null as any}
        cancelLabel={null as any}
        hideIcon={true}
      >
        <div className={styles.uploadForm}>
          {/* Drop Zone */}
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dragActive : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".xls,.xlsx"
              onChange={onImportFileChange}
            />
            {!importFile ? (
              <>
                <i className={`pi pi-cloud-upload ${styles.uploadIcon}`} />
                <div className={styles.dropText}>
                  Click or drag file to this area to upload
                  <span>(*Only .xls / .xlsx files are supported)</span>
                </div>
                <button type="button" className={styles.browseBtn}>
                  Browse
                </button>
              </>
            ) : (
              <div className={styles.selectedFile}>
                <i className="pi pi-file-excel" />
                <span>{importFile.name}</span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <i className="pi pi-times" />
                </button>
              </div>
            )}
          </div>

          {/* Download Template */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              className={styles.downloadTemplateBtn}
              onClick={(e) => {
                e.stopPropagation();
                void templateDownload();
              }}
            >
              <i className="pi pi-download" />
              Download Template
            </button>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              className={styles.cancelBtn}
              onClick={() => {
                setShowImportPopup(false);
                setImportFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Cancel
            </button>
            <button
              className={styles.confirmBtn}
              onClick={() => void handleConfirmImport()}
            >
              Upload
            </button>
          </div>
        </div>
      </ActionPopup>
    </div>
  );
};

export default LookupConfig;
