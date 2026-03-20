import { Toast as PrimeToast } from "primereact/toast";
import { showToast } from "../components/Toast/Toast";
import { addItem } from "./pnpService";
import { LIST_NAMES } from "../constants/appConstants";

/**
 * Standardized global error handler for the application.
 * Logs the error to a central SharePoint list and optionally displays a Toast notification.
 *
 * @param error - The caught Javascript/PnP error object
 * @param actionName - A human readable description of the context where it failed (e.g. 'Fetching Master Employees')
 * @param toastRef - PrimeReact Toast Reference. If passed, triggers the UI popup.
 */
export const handleError = async (
  error: any,
  actionName: string,
  toastRef?: React.RefObject<PrimeToast>,
): Promise<void> => {
  console.error(`[Error in Action: ${actionName}]`, error);

  // Parse error details
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Display user-friendly UI toast (if ref provided)
  if (toastRef) {
    showToast(
      toastRef,
      "error",
      "Operation Failed",
      `Error during: ${actionName}. Please try again.`,
    );
  }

  // Persist silently into the backend list
  try {
    await addItem(LIST_NAMES.ERROR_LOG, {
      Title: actionName,
      Error: errorMessage,
    });
  } catch (logErr) {
    console.error("Failed to write to ErrorLog SharePoint list.", logErr);
  }
};
