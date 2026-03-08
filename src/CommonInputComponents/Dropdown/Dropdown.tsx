import * as React from "react";
import { Dropdown as PrimeDropdown, DropdownProps } from "primereact/dropdown";
import styles from "./Dropdown.module.scss";

export interface IDropdownOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  Id?: number;
}

export interface IDropdownProps extends Omit<DropdownProps, "options"> {
  /** Unique id that links the label element. */
  id?: string;
  /** Label text rendered above the dropdown. */
  label?: string;
  /** Mark the field as required (shows asterisk). */
  required?: boolean;
  /** Validation error message rendered below the dropdown. */
  errorMessage?: string;
  /** The list of selectable options. */
  options: IDropdownOption[];
  /** Additional class for the outer wrapper div. */
  className?: string;
}

/**
 * A labelled, validated dropdown built on PrimeReact Dropdown.
 *
 * @example
 * <AppDropdown
 *   id="assessYear"
 *   label="Assessment Year"
 *   required
 *   options={yearOptions}
 *   value={year}
 *   onChange={(e) => setYear(e.value)}
 *   errorMessage={errors.year}
 * />
 */
const AppDropdown: React.FC<IDropdownProps> = ({
  id,
  label,
  required = false,
  errorMessage,
  options,
  className,
  ...rest
}) => {
  const hasError = Boolean(errorMessage);

  return (
    <div className={`${styles.dropdownContainer} ${className || ""}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <PrimeDropdown
        inputId={id}
        options={options}
        className={`${styles.dropdown} ${hasError ? "p-invalid" : ""}`}
        panelClassName="roca-dropdown-panel"
        aria-required={required}
        aria-describedby={hasError ? `${id}-error` : undefined}
        {...rest}
      />
      {hasError && (
        <small id={`${id}-error`} className={styles.errorMessage}>
          {errorMessage}
        </small>
      )}
    </div>
  );
};

export { AppDropdown };
export default AppDropdown;
