import * as React from "react";
import { InputText, InputTextProps } from "primereact/inputtext";
import styles from "./InputField.module.scss";

export interface IInputFieldProps extends Omit<InputTextProps, "id"> {
  /** Unique id for the input (links label via htmlFor). */
  id: string;
  /** Label text rendered above the input. */
  label?: string;
  /** Mark the field as required (shows asterisk). */
  required?: boolean;
  /** Validation error message rendered below the input. */
  errorMessage?: string;
  /** Additional class for the outer wrapper div. */
  className?: string;
}

/**
 * A labelled, validated text input built on PrimeReact InputText.
 *
 * @example
 * <InputField
 *   id="empName"
 *   label="Employee Name"
 *   required
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 *   errorMessage={errors.name}
 * />
 */
const InputField: React.FC<IInputFieldProps> = ({
  id,
  label,
  required = false,
  errorMessage,
  className,
  ...rest
}) => {
  const hasError = Boolean(errorMessage);

  return (
    <div className={`${styles.inputFieldContainer} ${className || ""}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <InputText
        id={id}
        className={`${styles.inputText} ${hasError ? "p-invalid" : ""}`}
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

export { InputField };
export default InputField;
