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
  // Resolve display name: try Name first (normalised), then Title, then email prefix
  const displayName =
    (emp.Name || emp.Title || "").trim() ||
    (emp.Email ? emp.Email.split("@")[0] : "") ||
    `Employee ${emp.Id}`;

  return {
    key: String(emp.Id),
    text: displayName,
    secondaryText: emp.Email ?? "",
    tertiaryText: emp.EmployeeId ?? "",
    showSecondaryText: true,
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

  // ── People Data from Redux ────────────────────────────────────────────────
  const employees = useAppSelector(selectEmployees);
  const siteMembers = useAppSelector(selectSiteMembers);
  const isLoadingEmployees = useAppSelector(selectEmployeesLoading);
  const isLoadingMembers = useAppSelector(selectMembersLoading);

  const employeesToSearch: IEmployee[] =
    source === "EmployeeMaster" ? employees : siteMembers;
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
          (emp.EmployeeId && emp.EmployeeId.toLowerCase().includes(query));
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

  const placeholderText = isLoading
    ? "Loading users…"
    : source === "EmployeeMaster"
      ? "Search employee"
      : "Search site members";

  return (
    <div className={styles.peoplePickerWrapper}>
      {titleText && <label className={styles.pickerLabel}>{titleText}</label>}
      <NormalPeoplePicker
        onResolveSuggestions={onResolveSuggestions}
        onEmptyResolveSuggestions={onEmptyResolveSuggestions}
        selectedItems={selectedPersonas}
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
