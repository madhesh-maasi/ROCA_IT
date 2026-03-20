import * as React from "react";
import { Calendar as PrimeCalendar, CalendarProps } from "primereact/calendar";
import styles from "./Calendar.module.scss";

export interface ICalendarProps extends CalendarProps {
  /** Unique id that links the label element. */
  id?: string;
  /** Label text rendered above the calendar input. */
  label?: string;
  /** Mark the field as required (shows asterisk). */
  required?: boolean;
  /** Validation error message rendered below the input. */
  errorMessage?: string;
  /** Additional class for the outer wrapper div. */
  className?: string;
  onChange?: (e: any) => void;
  disabled?: boolean;
}

/**
 * A labelled, validated date picker built on PrimeReact Calendar.
 * Designed to look exactly like SearchInput.
 */
const AppCalendar: React.FC<ICalendarProps> = ({
  id,
  label,
  required = false,
  errorMessage,
  className,
  onChange,
  disabled,
  ...rest
}) => {
  const hasError = Boolean(errorMessage);
  const calendarRef = React.useRef<any>(null);

  const handleWrapperClick = (): void => {
    // Force open the calendar when the wrapper (input area) is clicked
    if (calendarRef.current && !disabled) {
      calendarRef.current.show();
    }
  };

  return (
    <div className={`${styles.calendarContainer} ${className || ""}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={styles.calendarWrapper} onClick={handleWrapperClick}>
        <i className={`pi pi-calendar ${styles.calendarIcon}`} />
        <PrimeCalendar
          ref={calendarRef}
          {...rest}
          inputId={id}
          showIcon={false} // Use our custom icon on the left
          className={`${styles.calendar} ${hasError ? "p-invalid" : ""}`}
          aria-required={required}
          aria-describedby={hasError ? `${id}-error` : undefined}
          dateFormat="dd/mm/yy"
          showOnFocus={true}
          autoZIndex
          onFocus={(e) => {
            rest.onFocus?.(e);
            if (!disabled) handleWrapperClick();
          }}
          onChange={(e: any) => onChange?.(e)}
          disabled={disabled}
        />
      </div>
      {hasError && (
        <small id={`${id}-error`} className={styles.errorMessage}>
          {errorMessage}
        </small>
      )}
    </div>
  );
};

export { AppCalendar };
export default AppCalendar;
