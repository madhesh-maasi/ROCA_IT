import * as React from "react";
import { useEffect, useState, useMemo, useRef } from "react";
import styles from "./ITCalculatorUpload.module.scss";
import {
  AppDataTable,
  IColumnDef,
  SearchInput,
  ActionButton,
  AppDropdown,
  IconButton,
  Popup,
  StatusPopup,
} from "../../../../../CommonInputComponents";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import { AppFilePicker } from "../../../../../CommonInputComponents/FilePicker";
import {
  getLibraryFilesWithMetadata,
  uploadFileWithMetadata,
  deleteItem,
  updateListItem,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants";
import { ActionPopup, Loader } from "../../../../../common/components";
import RequiredSympol from "../../../../../common/components/RequiredSympol/RequiredSympol";
import {
  curFinanicalYear,
  getFYOptions,
  globalSearchFilter,
} from "../../../../../common/utils/functions";

interface ICalculatorFile {
  ID: number;
  FileLeafRef: string; // File name
  FileRef: string; // File URL
  FinanceYear: string;
}

const ITCalculatorUpload: React.FC = () => {
  const toast = useRef<PrimeToast>(null);

  // States
  const [activeTab, setActiveTab] = useState<"current" | "previous">("current");
  const [searchTerm, setSearchTerm] = useState("");
  const [filesData, setFilesData] = useState<ICalculatorFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Upload Popup states
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(curFinanicalYear);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Delete Popup states
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ICalculatorFile | null>(
    null,
  );
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      // Fetch files from IT_Calculator list utilizing the generic PnP helper
      const results = await getLibraryFilesWithMetadata(
        LIST_NAMES.IT_CALCULATOR,
      );
      // Clean up the results
      const mapped = results.map((r: any) => ({
        ID: r.ID,
        FileLeafRef: r.FileLeafRef,
        FileRef: r.FileRef,
        FinanceYear: r.FinanceYear || "",
      }));
      setFilesData(mapped);
    } catch (err) {
      showToast(toast, "error", "Error", "Failed to load calculator files.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    void loadFiles();
  }, []);

  const handleOpenUpload = () => {
    setSelectedYear(curFinanicalYear);
    setSelectedFile(null);
    setShowUploadPopup(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) {
      showToast(toast, "warn", "Validation", "Please select an Excel file");
      return;
    } else if (selectedFile.size > 5 * 1024 * 1024) {
      showToast(
        toast,
        "error",
        "File Too Large",
        "Attachment size must be less than 5MB.",
      );
      return;
    }

    try {
      setIsLoading(true);

      // Find any active files for the same FinanceYear and soft-delete them
      const existingFilesForYear = filesData.filter(
        (f) => f.FinanceYear === selectedYear,
      );
      for (const oldFile of existingFilesForYear) {
        await updateListItem(LIST_NAMES.IT_CALCULATOR, oldFile.ID, {
          IsDelete: true,
        });
      }
      await uploadFileWithMetadata(
        LIST_NAMES.IT_CALCULATOR,
        selectedFile.name,
        selectedFile,
        { FinanceYear: selectedYear, IsDelete: false },
      );

      setShowSuccessPopup(true);
      setShowUploadPopup(false);
      showToast(
        toast,
        "success",
        "Added",
        "IT Computation file successfully added",
      );
      void loadFiles();
    } catch (err) {
      console.error(err);
      showToast(toast, "error", "Error", "Failed to upload file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (
        file.name.endsWith(".xls") ||
        file.name.endsWith(".xlsx") ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setSelectedFile(file);
      } else {
        showToast(
          toast,
          "warn",
          "Invalid File",
          "Please upload an Excel file.",
        );
      }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDeletePrompt = (file: ICalculatorFile) => {
    setFileToDelete(file);
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      setIsLoading(true);
      await deleteItem(LIST_NAMES.IT_CALCULATOR, fileToDelete.ID);
      showToast(toast, "success", "Deleted", "File deleted successfully");
      setShowDeletePopup(false);
      void loadFiles();
    } catch (err) {
      console.error(err);
      showToast(toast, "error", "Error", "Failed to delete file");
    } finally {
      setIsLoading(false);
    }
  };

  // derived data (filter current/previous year roughly)
  // For a truly scalable logic, "current" might map to top 1 year mapping,
  // but let's assume standard literal tab rules for now or simple "search" filter
  const filteredData = useMemo(() => {
    let filtered = filesData;

    // A very rudimentary mock tab logic dividing "latest" and "rest"
    // Typically, sorting by descending Finance Year treats the top index as current.
    const sorted = [...filtered].sort((a, b) =>
      b.FinanceYear.localeCompare(a.FinanceYear),
    );

    if (activeTab === "current") {
      // current is just roughly the max year found.
      if (sorted.length > 0) {
        const maxYear = sorted[0].FinanceYear;
        filtered = sorted.filter((f) => f.FinanceYear === maxYear);
      }
    } else {
      if (sorted.length > 0) {
        const maxYear = sorted[0].FinanceYear;
        filtered = sorted.filter((f) => f.FinanceYear !== maxYear);
      }
    }

    return globalSearchFilter(filtered, searchTerm);
  }, [filesData, searchTerm, activeTab]);

  const columns: IColumnDef[] = [
    { field: "FinanceYear", header: "Financial Year", sortable: true },
    { field: "FileLeafRef", header: "File Name", sortable: true },
    {
      field: "action",
      header: "Action",
      body: (rowData: ICalculatorFile) => (
        <div className={styles.actionCell}>
          <IconButton
            variant="download"
            icon="pi pi-download"
            title="Download"
            onClick={() => {
              window.open(rowData.FileRef, "_blank");
            }}
          />
          {rowData.FinanceYear == curFinanicalYear && (
            <IconButton
              variant="delete"
              icon="pi pi-trash"
              title="Delete"
              onClick={() => {
                handleDeletePrompt(rowData);
              }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.screen}>
      <AppToast toastRef={toast} />
      {isLoading && <Loader fullScreen label="Processing..." />}

      {/* <StatusPopup
        visible={showSuccessPopup}
        onHide={() => {
          setShowSuccessPopup(false);
          void loadFiles();
        }}
        type="success"
        description="Action completed successfully."
      /> */}

      <div className={styles.header}>
        <h2>IT Computation Upload</h2>
      </div>

      <div className={styles.headerToolbar}>
        <div className={styles.tabToggle}>
          <button
            className={`${styles.tabBtn} ${activeTab === "current" ? styles.active : ""}`}
            onClick={() => setActiveTab("current")}
          >
            Current Year
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "previous" ? styles.active : ""}`}
            onClick={() => setActiveTab("previous")}
          >
            Previous Year
          </button>
        </div>

        <div className={styles.actions}>
          <div>
            {activeTab == "previous" && (
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search"
              />
            )}
          </div>
          {activeTab === "current" && (
            <ActionButton
              variant="add"
              label="Add New"
              icon="pi pi-plus-circle"
              onClick={handleOpenUpload}
            />
          )}
        </div>
      </div>

      <div className={styles.tableCard}>
        <AppDataTable
          columns={columns}
          data={filteredData}
          globalFilter={searchTerm}
          paginator={activeTab == "previous"}
          rows={10}
        />
      </div>

      {/* Upload Modal */}
      <ActionPopup
        visible={showUploadPopup}
        onHide={() => setShowUploadPopup(false)}
        onConfirm={handleConfirmUpload}
        actionType="Updated"
        title="Upload IT Calculator"
        confirmLabel={null as any} // Hide default buttons to use custom ones
        cancelLabel={null as any}
        hideIcon={true}
      >
        <div className={styles.uploadForm}>
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
              onChange={onFileChange}
            />

            {!selectedFile ? (
              <>
                <i className={`pi pi-cloud-upload ${styles.uploadIcon}`} />
                <div className={styles.dropText}>
                  Click or drag file to this area to upload
                  <span>(*File size must be 5MB or smaller)</span>
                </div>
                <button type="button" className={styles.browseBtn}>
                  Browse
                </button>
              </>
            ) : (
              <div className={styles.selectedFile}>
                <i className="pi pi-file-excel" />
                <span>{selectedFile.name}</span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <i className="pi pi-times" />
                </button>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowUploadPopup(false)}
            >
              Cancel
            </button>
            <button
              className={styles.confirmBtn}
              onClick={handleConfirmUpload}
              // disabled={!selectedFile || !selectedYear}
            >
              Upload
            </button>
          </div>
        </div>
      </ActionPopup>

      {/* Delete Confirmation Modal */}
      <ActionPopup
        visible={showDeletePopup}
        onHide={() => setShowDeletePopup(false)}
        onConfirm={handleConfirmDelete}
        actionType="Delete"
        title="Delete Computation"
      />
    </div>
  );
};

export default ITCalculatorUpload;
