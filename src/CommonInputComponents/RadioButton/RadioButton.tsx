import * as React from "react";
import { RadioButton as PrimeRadioButton } from "primereact/radiobutton";
import styles from "./RadioButton.module.scss";

export interface IAppRadioButtonProps {
  /** The value of the radio button */
  value: any;
  /** The name of the group for the radio button */
  name: string;
  /** Label text for the radio button */
  label: string;
  /** Currently selected value in the group */
  selectedValue: any;
  /** Callback fired when the radio button is selected */
  onChange: (value: any) => void;
  /** Disable the radio button */
  disabled?: boolean;
}

export const AppRadioButton: React.FC<IAppRadioButtonProps> = ({
  value,
  name,
  label,
  selectedValue,
  onChange,
  disabled = false,
}) => {
  const inputId = `radio-${name}-${value}`;

  return (
    <div
      className={`${styles.radioWrapper} ${disabled ? styles.disabled : ""}`}
      onClick={(e) => {
        e.preventDefault(); // Prevent double-firing with the native input
        e.stopPropagation();
        if (!disabled) {
          // If already selected, deselect it
          if (selectedValue == value) {
            onChange(null);
          } else {
            onChange(value);
          }
        }
      }}
    >
      <PrimeRadioButton
        inputId={inputId}
        name={name}
        value={value}
        onChange={() => {}} // We handle the change via the wrapper onClick
        checked={selectedValue == value}
        disabled={disabled}
      />
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
    </div>
  );
};

export default AppRadioButton;
