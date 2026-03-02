import * as React from "react";
import styles from "./ExportDeclaration.module.scss";
import {
  AppDataTable,
  IColumnDef,
  AppDropdown,
  AppRadioButton,
} from "../../../../../components";
import AppToast, {
  showToast,
} from "../../../../../common/components/Toast/Toast";
import { Toast as PrimeToast } from "primereact/toast";

const DUMMY_DATA = [
  {
    id: 1,
    employeeId: "9002094",
    employeeName: "Ponraju E",
    email: "ponraju@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 2,
    employeeId: "4490033",
    employeeName: "Savannah",
    email: "trungkienspktnd@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 3,
    employeeId: "2674004",
    employeeName: "Courtney",
    email: "manhhachkt08@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 4,
    employeeId: "5586125",
    employeeName: "Aubrey",
    email: "thuhang.nute@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 5,
    employeeId: "6515356",
    employeeName: "Serenity",
    email: "ckctm12@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 6,
    employeeId: "4874412",
    employeeName: "Esther",
    email: "tranthuy.nute@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 7,
    employeeId: "4490034",
    employeeName: "Lily",
    email: "binhan628@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 8,
    employeeId: "6535185",
    employeeName: "Kristin",
    email: "trungkienspktnd@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 9,
    employeeId: "5586123",
    employeeName: "Regina",
    email: "tienlapspktnd@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 10,
    employeeId: "4490033",
    employeeName: "Connie",
    email: "thuhang.nute@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 11,
    employeeId: "4874412",
    employeeName: "Arlene",
    email: "vuhaithuongnute@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 12,
    employeeId: "6535186",
    employeeName: "Bessie",
    email: "nvt.isst.nute@gmail.com",
    taxRegime: "Old Regime",
  },
  {
    id: 13,
    employeeId: "2674007",
    employeeName: "Colleen",
    email: "danghoang87hl@gmail.com",
    taxRegime: "Old Regime",
  },
];

const YEAR_OPTIONS = [
  { label: "2024 - 2025", value: "2024-2025" },
  { label: "2025 - 2026", value: "2025-2026" },
];

const ExportDeclaration: React.FC = () => {
  const toast = React.useRef<PrimeToast>(null);

  // States initialized to empty strings so radio buttons are unselected
  const [selectedYear, setSelectedYear] = React.useState<string>("2025-2026");
  const [declarationType, setDeclarationType] = React.useState<string>("");
  const [taxRegime, setTaxRegime] = React.useState<string>("");

  const handleDownload = () => {
    if (!declarationType || !taxRegime) {
      showToast(
        toast,
        "warn",
        "Incomplete",
        "Please select Declaration Type and Tax Regime before exporting.",
      );
      return;
    }
    showToast(
      toast,
      "success",
      "Export Started",
      "Your download will begin shortly.",
    );
    // Data export logic would go here
  };

  const columns: IColumnDef[] = [
    { field: "employeeId", header: "Employee ID", sortable: true },
    { field: "employeeName", header: "Employee Name", sortable: true },
    { field: "email", header: "Email Address", sortable: true },
    { field: "taxRegime", header: "Tax Regime Type", sortable: true },
  ];

  return (
    <div className={styles.screen}>
      <AppToast toastRef={toast} />

      <div className={styles.header}>
        <h2>Export Declaration</h2>
      </div>

      <div className={styles.notePanel}>
        <div className={styles.noteTitle}>Note</div>
        <ul className={styles.noteList}>
          <li>Only Approved declaration is exported.</li>
          <li>One time Export is Allowed.</li>
        </ul>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <AppDropdown
            options={YEAR_OPTIONS}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.value as string)}
            className={styles.yearDropdown}
            placeholder="Select Year"
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.groupLabel}>Declaration Type</label>
          <div className={styles.radioGroup}>
            <AppRadioButton
              name="declarationType"
              value="Planned"
              label="Planned"
              selectedValue={declarationType}
              onChange={setDeclarationType}
            />
            <AppRadioButton
              name="declarationType"
              value="Actual"
              label="Actual"
              selectedValue={declarationType}
              onChange={setDeclarationType}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.groupLabel}>Tax Regime</label>
          <div className={styles.radioGroup}>
            <AppRadioButton
              name="taxRegime"
              value="Old Regime"
              label="Old Regime"
              selectedValue={taxRegime}
              onChange={setTaxRegime}
            />
            <AppRadioButton
              name="taxRegime"
              value="New Regime"
              label="New Regime"
              selectedValue={taxRegime}
              onChange={setTaxRegime}
            />
          </div>
        </div>

        <div className={styles.actionsGroup}>
          <button className={styles.downloadBtn} onClick={handleDownload}>
            Download
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <AppDataTable columns={columns} data={DUMMY_DATA} paginator rows={10} />
      </div>
    </div>
  );
};

export default ExportDeclaration;
