import {
  IPersonaProps,
  NormalPeoplePicker,
  ValidationState,
} from "@fluentui/react";
import { SPWebPartContext } from "../../webparts/incomeTax/components/IncomeTax";
import { useAppSelector } from "../../store/hooks";
import {
  selectEmployees,
  selectEmployeesLoading,
  selectSiteMembers,
  selectMembersLoading,
} from "../../store/slices/employeeSlice";
import { IEmployee } from "../../common/models";
import styles from "./AppPeoplePicker.module.scss";
import React from "react";
import RequiredSympol from "../../common/components/RequiredSympol/RequiredSympol";

export interface IAppPeoplePickerProps {
  /** The currently selected user(s) */
  selectedUsers?: any[];
  /** Callback when users are selected */
  onChange: (users: any[]) => void;
  /** Label for the picker */
  titleText?: string;
  /** Maximum number of people that can be selected (default 1) */
  personSelectionLimit?: number;
  /** Whether the field is required */
  isRequired?: boolean;
  /** Error message to show */
  errorMessage?: string;
  /** Disables the people picker */
  disabled?: boolean;
  /** Where to fetch users from */
  source?: "SiteMembers" | "EmployeeMaster";
}

/** Convert an IEmployee record to a Fluent UI IPersonaProps (standard fields only) */
const employeeToPersona = (emp: IEmployee): IPersonaProps => {
  const displayName =
    (emp.Name || emp.Title || "").trim() ||
    (emp.Email ? emp.Email.split("@")[0] : "") ||
    `Employee ${emp.Id}`;

  // Include Employee ID and Email in secondary text for better search visibility
  const secondary = [emp.EmployeeId, emp.Email].filter(Boolean).join(" | ");

  return {
    key: String(emp.Id),
    text: displayName,
    secondaryText: secondary,
    showSecondaryText: false, // Show email/id below name
  };
};

export const AppPeoplePicker: React.FC<IAppPeoplePickerProps> = ({
  selectedUsers = [],
  onChange,
  titleText = "Select User",
  personSelectionLimit = 1,
  isRequired = false,
  errorMessage = "",
  disabled = false,
  source = "SiteMembers",
}) => {
  const context = React.useContext(SPWebPartContext);
  const peopleStyles = {
    root: {
      ".ms-BasePicker-text": {
        border: "1px solid #ced4da",
        borderRadius: "8px",
        padding: "2px 4px",
        minHeight: "44px",
        display: "flex",
        alignItems: "center",
        transition:
          "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",

        "::after": {
          display: "none",
        },

        "&:hover": {
          borderColor: "#307a8a",
        },
      },

      ".ms-BasePicker-input": {
        height: "36px",
        padding: "0 12px",
        fontSize: "14px",
        border: "none !important",
        color: "#1e293b",
      },

      ".ms-SelectionZone": {
        width: "100%",
        maxHeight: personSelectionLimit > 1 ? "40px" : "auto",
        overflowY: "auto",
        scrollbarWidth: "thin",
        "::-webkit-scrollbar": {
          width: "6px",
        },
        "::-webkit-scrollbar-thumb": {
          background: "#cbd5e1",
          borderRadius: "10px",
        },
      },

      ".ms-BasePicker-itemsWrapper": {
        padding: "4px",
        gap: "8px",
        display: "flex",
        flexWrap: "wrap",
      },

      ".ms-PickerPersona-container": {
        margin: "2px 0",
        background: "#307a8a !important", // Use brand color
        borderRadius: "100px !important",
        padding: "2px 8px !important",
        height: "32px !important",
        display: "flex",
        alignItems: "center",
        maxWidth: "fit-content", // Allow name to determine width

        ".ms-PickerItem-removeButton": {
          color: "#fff !important",
          margin: "0 2px 0 6px",
          width: "20px",
          height: "20px",
          padding: 0,
          borderRadius: "50%",
          i: {
            fontSize: "10px !important",
          },
        },

        ".ms-Persona": {
          ".ms-Persona-primaryText": {
            color: "#fff !important",
            fontSize: "13px",
            fontWeight: "500",
            padding: "0 4px",
          },
          ".ms-Persona-secondaryText": {
            color: "#e2e8f0 !important", // Lighter color for secondary text
            fontSize: "11px",
            padding: "0 4px",
          },
          ".ms-Persona-tertiaryText": {
            display: "none !important",
          },
        },

        "&.is-selected": {
          background: "#25616e !important", // Darker on select
        },

        ":focus-within": {
          background: "#25616e !important",
        },
      },
    },
  };

  // ── People Data from Redux ────────────────────────────────────────────────
  const employees = useAppSelector(selectEmployees);
  const siteMembers = useAppSelector(selectSiteMembers);
  const isLoadingEmployees = useAppSelector(selectEmployeesLoading);
  const isLoadingMembers = useAppSelector(selectMembersLoading);

  const findEmployee = (email: string) => {
    return employees.find(
      (emp) => emp.Email?.toLowerCase() === email?.toLowerCase(),
    );
  };

  const employeesToSearch: IEmployee[] =
    source === "EmployeeMaster"
      ? employees.filter((emp: IEmployee) =>
          emp.EmployeeId?.toString().startsWith("9"),
        )
      : siteMembers.map((emp: IEmployee) => {
          return {
            ...emp,
            EmployeeId: findEmployee(emp.Email!)?.EmployeeId || "",
          };
        });
  const isLoading =
    source === "EmployeeMaster" ? isLoadingEmployees : isLoadingMembers;

  // Selected personas for the Fluent UI picker
  const [selectedPersonas, setSelectedPersonas] = React.useState<
    IPersonaProps[]
  >([]);
  // Map from persona key → IEmployee for lookups on onChange
  const employeeMapRef = React.useRef<Map<string, IEmployee>>(new Map());

  // Initialise from external selectedUsers prop
  React.useEffect(() => {
    if (selectedUsers.length === 0) {
      setSelectedPersonas([]);
    }
  }, [selectedUsers]);

  if (!context) {
    return <div>Error: WebPart context not provided to PeoplePicker.</div>;
  }

  // ── Fluent UI NormalPeoplePicker ────────────────────────────────────────
  // Build a key → IEmployee map so we can look up on selection change
  employeesToSearch.forEach((emp: IEmployee) => {
    employeeMapRef.current.set(String(emp.Id), emp);
  });

  const onResolveSuggestions = (
    filterText: string,
    currentItems?: IPersonaProps[],
  ): IPersonaProps[] => {
    if (!filterText || isLoading) return [];
    const query = filterText.toLowerCase();
    const currentKeys = (currentItems ?? []).map((p) => p.key);
    return employeesToSearch
      .filter((emp: IEmployee) => {
        const alreadySelected = currentKeys.includes(String(emp.Id));
        const matches =
          (emp.Name || emp.Title)?.toLowerCase().includes(query) ||
          emp.Email?.toLowerCase().includes(query) ||
          (emp.EmployeeId &&
            String(emp.EmployeeId).toLowerCase().includes(query));
        return !alreadySelected && matches;
      })
      .map(employeeToPersona);
  };

  const onEmptyResolveSuggestions = (
    currentItems?: IPersonaProps[],
  ): IPersonaProps[] => {
    const currentKeys = (currentItems ?? []).map((p) => p.key);
    return employeesToSearch
      .filter((emp: IEmployee) => !currentKeys.includes(String(emp.Id)))
      .slice(0, 8)
      .map(employeeToPersona);
  };

  const onSelectionChanged = (items?: IPersonaProps[]): void => {
    const list = items ?? [];
    setSelectedPersonas(list);
    // Look up IEmployee from the ref map; fall back to the persona itself
    const empList = list.map(
      (p) => employeeMapRef.current.get(String(p.key)) ?? p,
    );
    onChange(empList);
  };

  const placeholderText = isLoading ? "Loading users…" : "Search";

  return (
    <div className={styles.peoplePickerWrapper}>
      {titleText && (
        <label className={styles.pickerLabel}>
          {titleText} {isRequired && RequiredSympol()}
        </label>
      )}
      <NormalPeoplePicker
        onResolveSuggestions={onResolveSuggestions}
        // onEmptyResolveSuggestions={onEmptyResolveSuggestions}
        selectedItems={selectedPersonas}
        styles={peopleStyles}
        onChange={onSelectionChanged}
        itemLimit={personSelectionLimit}
        disabled={disabled || isLoading}
        pickerSuggestionsProps={{
          suggestionsHeaderText:
            source === "EmployeeMaster"
              ? "Matching Employees"
              : "Matching Members",
          mostRecentlyUsedHeaderText:
            source === "EmployeeMaster" ? "All Employees" : "All Members",
          noResultsFoundText: isLoading ? "Loading…" : "No user found",
          loadingText: "Loading…",
        }}
        inputProps={{
          placeholder: placeholderText,
          "aria-label": titleText,
        }}
        resolveDelay={200}
        onValidateInput={() => ValidationState.valid}
      />
      {errorMessage && (
        <span className={styles.errorMessage}>{errorMessage}</span>
      )}
    </div>
  );
};

export default AppPeoplePicker;
