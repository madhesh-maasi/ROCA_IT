import * as React from "react";
import { TextField, ITextFieldProps } from "@fluentui/react/lib/TextField";
import { Dropdown, IDropdownProps } from "@fluentui/react/lib/Dropdown";
import { DatePicker, IDatePickerProps } from "@fluentui/react/lib/DatePicker";
import styles from "./FormField.module.scss";

export type FormFieldType = "text" | "dropdown" | "datepicker";

export interface IFormFieldProps {
  /** The type of form control to render. */
  fieldType: FormFieldType;
  /** Field label text. */
  label: string;
  /** Whether this field is required. */
  required?: boolean;
  /** Validation error message to show below the field. */
  errorMessage?: string;
  /** Props passed through to the underlying Fluent UI TextField. */
  textFieldProps?: Partial<ITextFieldProps>;
  /** Props passed through to the underlying Fluent UI Dropdown. */
  dropdownProps?: Partial<IDropdownProps>;
  /** Props passed through to the underlying Fluent UI DatePicker. */
  datePickerProps?: Partial<IDatePickerProps>;
}

/**
 * A reusable, composed form field that renders a label + input + validation message.
 * Supports text input, dropdown, and date picker variants via the `fieldType` prop.
 *
 * @example
 * <FormField
 *   fieldType="text"
 *   label="Employee Name"
 *   required
 *   textFieldProps={{ value: name, onChange: (e, val) => setName(val || '') }}
 * />
 *
 * @example
 * <FormField
 *   fieldType="dropdown"
 *   label="Assessment Year"
 *   dropdownProps={{ options: yearOptions, selectedKey: year, onChange: handleYearChange }}
 * />
 */
const FormField: React.FC<IFormFieldProps> = ({
  fieldType,
  label,
  required = false,
  errorMessage,
  textFieldProps,
  dropdownProps,
  datePickerProps,
}) => {
  const renderField = (): React.ReactNode => {
    switch (fieldType) {
      case "text":
        return (
          <TextField
            label={label}
            required={required}
            errorMessage={errorMessage}
            {...textFieldProps}
          />
        );
      case "dropdown":
        return (
          <Dropdown
            options={[]}
            label={label}
            required={required}
            errorMessage={errorMessage}
            {...dropdownProps}
          />
        );
      case "datepicker":
        return (
          <DatePicker
            label={label}
            isRequired={required}
            {...datePickerProps}
          />
        );
      default:
        return null;
    }
  };

  return <div className={styles.formFieldContainer}>{renderField()}</div>;
};

export default FormField;
