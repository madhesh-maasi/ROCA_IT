import * as React from "react";
import styles from "./ITCalculator.module.scss";
import screenStyles from "../screens.module.scss";
// import { ActionButton } from "../../../../../components";
// import { AppFilePicker } from "../../../../../components/FilePicker";
// import { useAppSelector } from "../../../../../store/hooks";
// import { selectUserRole } from "../../../../../store/slices/userSlice";
// import { uploadFileToLibrary } from "../../../../../common/utils/pnpService";
// import Loader from "../../../../../common/components/Loader/Loader";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";
import { ActionButton } from "../../../../../CommonInputComponents/ActionButton";
import {
  getLatestFileUrl,
  getSP,
} from "../../../../../common/utils/pnpService";
import Loader from "../../../../../common/components/Loader/Loader";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import { handleError } from "../../../../../common/utils/errorUtils";

const ITCalculator: React.FC = () => {
  // const role = useAppSelector(selectUserRole);
  const toast = React.useRef<PrimeToast>(null);
  // const [isUploading, setIsUploading] = React.useState(false);

  // Visible to Admins and Finance Approvers based on requirement
  // const canUpload = role === "FinanceApprover";

  // const handleUploadFiles = async (files: File[]) => {
  //   if (files.length === 0) return;

  //   setIsUploading(true);

  //   const currentYear = moment().format("YY");

  // // Next year last 2 digits
  // const nextYear = moment().add(1, "year").format("YY");

  //   try {
  //     for (const file of files) {
  //       await uploadFileToLibrary(
  //         "Income_Tax_Calculator_for_FY25_26",
  //         file.name,
  //         file,
  //       );
  //     }

  //     showToast(
  //       toast,
  //       "success",
  //       "Files Uploaded",
  //       `Successfully uploaded ${files.length} file(s).`,
  //     );
  //   } catch (error) {
  //     console.error(error);
  //     showToast(
  //       toast,
  //       "error",
  //       "Upload Failed",
  //       "Failed to upload documents. Please try again.",
  //     );
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const fileUrl = await getLatestFileUrl(LIST_NAMES.IT_CALCULATOR);

      if (!fileUrl) {
        showToast(
          toast,
          "error",
          "File Not Found",
          "No files are currently available in the IT_Calculator library.",
        );
        return;
      }
      window.open(fileUrl, "_blank");
      showToast(
        toast,
        "success",
        "Downloaded",
        "The latest IT Calculator file has been downloaded successfully.",
      );
    } catch (err) {
      await handleError(err, "Downloading IT Calculator", toast);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className={screenStyles.screen}>
        <AppToast toastRef={toast} />
        <h2 className={screenStyles.pageTitle}>IT Calculator</h2>

        <div className={styles.calculatorCard}>
          <h3 className={styles.reportTitle}>Income Tax Calculator Report</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            {/* {canUpload && (
              <AppFilePicker
                buttonLabel="Upload Documents"
                multiple={false} // Requirement: Change file, not upload again (single file update intended)
                accept=".xls, .xlsx" // Requirement: Allow only Excel files
                onChange={handleUploadFiles}
              />
            )} */}
            <ActionButton
              variant="download"
              className="primaryBtn"
              label="Download"
              onClick={handleDownload}
            />
          </div>
        </div>
      </div>

      {isDownloading && <Loader fullScreen label="Downloading File..." />}

      {/* {isUploading && <Loader fullScreen label="Uploading Document..." />} */}
    </>
  );
};

export default ITCalculator;
