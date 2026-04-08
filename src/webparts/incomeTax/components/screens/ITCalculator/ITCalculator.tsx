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
import { curFinanicalYear } from "../../../../../common/utils/functions";

const ITCalculator: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);

  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const fileUrl = await getLatestFileUrl(
        LIST_NAMES.IT_CALCULATOR,
        curFinanicalYear,
      );

      if (!fileUrl) {
        showToast(toast, "warn", "No Data", "No data available for download");
        return;
      }
      window.open(fileUrl, "_blank");
      showToast(
        toast,
        "success",
        "Downloaded",
        "The latest IT Computation file has been downloaded successfully.",
      );
    } catch (err) {
      await handleError(err, "Downloading IT Computation", toast);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className={screenStyles.screen}>
        <AppToast toastRef={toast} />
        <h2 className={screenStyles.pageTitle}>IT Computation</h2>

        <div className={styles.calculatorCard}>
          <h3 className={styles.reportTitle}>Income Tax Computation</h3>

          <div style={{ display: "flex", gap: "8px" }}>
            <ActionButton
              variant="download"
              className="primaryBtn"
              label="Download"
              onClick={handleDownload}
            />
          </div>
          <div className={styles.excelImageWrapper}>
            <img
              src={`${require("../../../../../common/Asset/Images/xls.png")}`}
              alt=""
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
