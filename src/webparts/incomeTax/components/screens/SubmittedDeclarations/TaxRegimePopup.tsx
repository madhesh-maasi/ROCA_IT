import * as React from "react";
import { Popup, AppDropdown, ActionButton } from "../../../../../components";
import styles from "./TaxRegimePopup.module.scss";

export interface ITaxRegimePopupProps {
  visible: boolean;
  onHide: () => void;
  onSubmit: (regime: string) => void;
  isLoading?: boolean;
}

const REGIME_OPTIONS = [
  { label: "Old Regime", value: "Old Regime" },
  { label: "New Regime", value: "New Regime" },
];

const TaxRegimePopup: React.FC<ITaxRegimePopupProps> = ({
  visible,
  onHide,
  onSubmit,
  isLoading,
}) => {
  const [selectedRegime, setSelectedRegime] = React.useState<string>("");

  const handleSubmit = () => {
    if (selectedRegime) {
      onSubmit(selectedRegime);
    }
  };

  const footer = (
    <div className={styles.footer}>
      <ActionButton
        variant="cancel"
        label="Cancel"
        onClick={onHide}
        disabled={isLoading}
      />
      <ActionButton
        variant="approve"
        label="Submit"
        onClick={handleSubmit}
        disabled={!selectedRegime || isLoading}
        loading={isLoading}
      />
    </div>
  );

  return (
    <Popup
      visible={visible}
      onHide={onHide}
      header="Tax Regime"
      footer={footer}
      width="450px"
    >
      <div className={styles.container}>
        <div className={styles.noteBox}>
          <span className={styles.noteHeader}>Note</span>
          <ul className={styles.noteList}>
            <li>
              As per the notification from government please select your tax
              regime
            </li>
            <li>Once selected cannot be changed for this financial year</li>
          </ul>
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>
            Tax Regime Type <span className={styles.required}>*</span>
          </label>
          <AppDropdown
            value={selectedRegime}
            options={REGIME_OPTIONS}
            onChange={(e) => setSelectedRegime(e.value)}
            placeholder="Select"
            className={styles.dropdown}
          />
        </div>
      </div>
    </Popup>
  );
};

export default TaxRegimePopup;
