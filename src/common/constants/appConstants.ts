import { INavGroup } from "../models";

/**
 * SharePoint List names used across the solution.
 * Centralised here to avoid magic strings in services.
 */
export const NAV_CONFIG: INavGroup[] = [
  {
    key: "itDeclaration",
    label: "IT Declaration",
    icon: "fileEdit",
    items: [
      {
        key: "submittedDeclarations",
        label: "Submitted Declarations",
        icon: "submittedDeclarations",
      },
      { key: "itCalculator", label: "IT Computation", icon: "itCalculator" },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    icon: "administration",
    allowedRoles: ["Admin", "FinanceApprover"],
    items: [
      {
        key: "employeeDeclaration",
        label: "Employee Declarations",
        icon: "employeeDeclaration",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "sectionConfig",
        label: "Section Config",
        icon: "sectionConfig",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "lookupConfig",
        label: "Lookup Config",
        icon: "lookupConfig",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "releaseDeclaration",
        label: "Release Declaration",
        icon: "releaseDeclaration",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "extendSubmission",
        label: "Extend Submission",
        icon: "extendSubmission",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "taxRegimeUpdate",
        label: "Tax Regime Update",
        icon: "taxRegimeUpdate",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "exportDeclaration",
        label: "Export Declaration",
        icon: "exportDeclaration",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "itCalculatorUpload",
        label: "IT Computation Upload",
        icon: "itCalculatorUpload",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "financeApprover",
        label: "Finance Approver",
        icon: "financeApprover",
        allowedRoles: ["Admin", "FinanceApprover"],
      },
    ],
  },
];

export const LIST_NAMES = {
  INCOME_TAX: "IncomeTax",
  EMPLOYEE_MASTER: "EmployeeMaster",
  IT_CALCULATOR: "IT_Calculator",
  SECTION_CONFIG: "IT_SectionConfig",
  LOOKUP_CONFIG: "IT_LookupConfig",
  ERROR_LOG: "IT_ErrorLog",
  PLANNED_DECLARATION: "IT_Planned_Declarations",
  ACTUAL_DECLARATION: "IT_Actual_Declarations",
  IT_LANDLORD_DETAILS: "IT_Planned_Landlord_Details",
  IT_LANDLORD_DETAILS_Actual: "IT_Actual_Landlord_Details",
  IT_LTA: "IT_Planned_LTA",
  IT_LTA_Actual: "IT_Actual_LTA",
  IT_HOUSING_LOAN: "IT_Planned_HousingLoan_Repayment",
  IT_HOUSING_LOAN_Actual: "IT_Actual_HousingLoan_Repayment",
  IT_PREVIOUS_EMPLOYER: "IT_Planned_PreviousEmployer_Details",
  IT_PREVIOUS_EMPLOYER_Actual: "IT_Actual_PreviousEmployer_Details",
  IT_DOCUMENTS: "IT_Documents",
  FINANCE_APPROVER: "IT_FinanceApprover",
  IT_Templates: "IT_Templates",
} as const;

export const SHARED_GROUPS = {
  ADMIN: "Admins",
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
    if ((_siteUrl || "").toLowerCase().includes("rinitdev")) {
      _rocaSiteUrl = "https://rocasanitario.sharepoint.com/sites/RINMASTERDEV";
    } else if ((_siteUrl || "").toLowerCase().includes("rinit")) {
      _rocaSiteUrl = "https://rocasanitario.sharepoint.com/sites/RBPPLWOW";
    }
  }
  return _rocaSiteUrl;
};
