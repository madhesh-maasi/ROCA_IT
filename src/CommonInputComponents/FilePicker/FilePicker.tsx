import * as React from "react";
import { ActionButton } from "../ActionButton";
import { Popup } from "../Popup/Popup";
import styles from "./FilePicker.module.scss";

export interface IFilePickerProps {
  /** Label for the button that opens the file picker. Defaults to 'Upload File'. */
  buttonLabel?: string;
  /** Whether to allow multiple file selection. Defaults to false. */
  multiple?: boolean;
  /** Comma-separated list of allowed file extensions. Defaults to '.pdf, .xls, .xlsx'. */
  accept?: string;
  /** Callback fired when files are confirmed in the popup. */
  onChange: (files: File[]) => void;
  /** Additional CSS classes for the trigger button. */
  className?: string;
}

const AppFilePicker: React.FC<IFilePickerProps> = ({
  buttonLabel = "Upload File",
  multiple = false,
  accept = ".pdf, .xls, .xlsx",
  onChange,
  className,
}) => {
  const [showPopup, setShowPopup] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Parse accepted extensions for validation
  const acceptedExts = accept.split(",").map((ext) => ext.trim().toLowerCase());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    let validFiles: File[] = [];

    // Validate extensions
    for (const file of newFiles) {
      const extMatch = file.name.match(/\.[0-9a-z]+$/i);
      const ext = extMatch ? extMatch[0].toLowerCase() : "";

      if (acceptedExts.includes(ext) || accept === "*") {
        validFiles.push(file);
      } else {
        setError(`Invalid file type: ${file.name}. Allowed: ${accept}`);
        return; // Stop processing on first error
      }
    }

    if (multiple) {
      // Prevent duplicates by name and size for simplicity
      setSelectedFiles((prev) => {
        const uniqueNewFiles = validFiles.filter(
          (nf) =>
            !prev.some((pf) => pf.name === nf.name && pf.size === nf.size),
        );
        return [...prev, ...uniqueNewFiles];
      });
    } else {
      setSelectedFiles([validFiles[0]]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset input so same file can be selected again
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    onChange(selectedFiles);
    closePopup();
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <ActionButton
        variant="upload"
        label={buttonLabel}
        className={className}
        onClick={() => setShowPopup(true)}
      />

      <Popup
        visible={showPopup}
        onHide={closePopup}
        header="Upload Files"
        width="500px"
        confirmLabel="Upload"
        onConfirm={selectedFiles.length > 0 ? handleConfirm : undefined}
      >
        <div className={styles.filePickerContainer}>
          <div className={styles.dropzone} onClick={triggerFileUpload}>
            <div className={styles.iconWrapper}>
              <i className="pi pi-cloud-upload" />
            </div>
            <p className={styles.mainText}>Click to browse or drag and drop</p>
            <p className={styles.subText}>Accepted formats: {accept}</p>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              multiple={multiple}
              accept={accept}
              onChange={handleFileChange}
            />
          </div>

          {error && <div className={styles.errorText}>{error}</div>}

          {selectedFiles.length > 0 && (
            <div className={styles.selectedFilesList}>
              <h4>Selected Files:</h4>
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className={styles.fileItem}>
                  <i className="pi pi-file" />
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileSize}>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <span
                    className={styles.cancelBtn}
                    onClick={() => handleRemoveFile(index)}
                    title="Cancel file selection"
                  >
                    <i className="pi pi-times" /> Cancel
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Popup>
    </>
  );
};

export { AppFilePicker };
export default AppFilePicker;
