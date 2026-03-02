/**
 * SharePoint List names used across the solution.
 * Centralised here to avoid magic strings in services.
 */
export const LIST_NAMES = {
  INCOME_TAX: "IncomeTax",
  EMPLOYEE_MASTER: "EmployeeMaster",
  IT_CALCULATOR: "IT_Calculator",
  SECTION_CONFIG: "IT_SectionConfig",
  LOOKUP_CONFIG: "IT_LookupConfig",
  ERROR_LOG: "IT_ErrorLog",
  PLANNED_DECLARATION: "IT_Planned_Declarations",
} as const;

/**
 * Common date display formats.
 */
export const DATE_FORMATS = {
  SHORT: "DD/MM/YYYY",
  LONG: "DD MMM YYYY",
  ISO: "YYYY-MM-DD",
  DISPLAY_WITH_TIME: "DD/MM/YYYY hh:mm A",
} as const;

/**
 * Application-wide configuration constants.
 */
export const APP_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEBOUNCE_DELAY_MS: 300,
} as const;

/**
 * Get the deployment URL based on the current environment.
 * Re-routes URLs to the appropriate environment host.
 */
export const deploymentConfig = (_siteUrl: string): string => {
  let _rocaSiteUrl: string = "";

  if (window.location.origin == "https://chandrudemo.sharepoint.com") {
    _rocaSiteUrl = "https://chandrudemo.sharepoint.com/sites/Roca";
  } else if (window.location.origin == "https://rocasanitario.sharepoint.com") {
    if ((_siteUrl || "").toLowerCase().includes("rinrfwd")) {
      _rocaSiteUrl = "https://rocasanitario.sharepoint.com/sites/RBPPLWOW";
    } else {
      _rocaSiteUrl = "https://rocasanitario.sharepoint.com/sites/RINMASTERDEV";
    }
  }
  return _rocaSiteUrl;
};
