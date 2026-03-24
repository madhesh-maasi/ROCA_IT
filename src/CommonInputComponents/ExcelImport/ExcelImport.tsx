import * as React from "react";
import * as XLSX from "xlsx";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileUploadIcon,
  Alert01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { ActionButton } from "../ActionButton/ActionButton";
import styles from "./ExcelImport.module.scss";

export interface IExcelColumn {
  key: string;
  label: string;
  type?: "string" | "number" | "email";
}

export interface IImportError {
  row: number;
  column?: string;
  message: string;
}

export interface IImportResult {
  validData: any[];
  errors: IImportError[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
}

interface IExcelImportProps {
  columns: IExcelColumn[];
  onImport: (result: IImportResult) => void;
  accept?: string;
  buttonLabel?: string;
  icon?: string;
  iconFlag?: boolean;
}

export const ExcelImport: React.FC<IExcelImportProps> = ({
  columns,
  onImport,
  accept = ".xlsx",
  buttonLabel = "Upload Excel",
  icon,
  iconFlag = true,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = React.useState(false);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws);

        if (jsonData.length === 0) {
          onImport({
            validData: [],
            errors: [{ row: 0, message: "The uploaded file is empty." }],
            summary: { total: 0, valid: 0, invalid: 0, duplicates: 0 },
          });
          setIsParsing(false);
          return;
        }

        // Header Validation
        const firstRow = jsonData[0];
        // const headers = Object.keys(firstRow);
        // const missingColumns = columns
        //   .filter((col) => col.required)
        //   .filter(
        //     (col) => !headers.includes(col.label) && !headers.includes(col.key),
        //   );

        const headers = Object.keys(firstRow).map((h) =>
          h.trim().toLowerCase(),
        );

        const missingColumns = columns.filter(
          (col) =>
            !headers.includes(col.label.toLowerCase()) &&
            !headers.includes(col.key.toLowerCase()),
        );

        if (missingColumns.length > 0) {
          onImport({
            validData: [],
            errors: [
              {
                row: 0,
                message: `Invalid file format. Missing required columns: ${missingColumns.map((c) => c.label).join(", ")}. Please upload the correct format file.`,
              },
            ],
            summary: { total: 0, valid: 0, invalid: 0, duplicates: 0 },
          });
          setIsParsing(false);
          return;
        }

        const validData: any[] = [];
        const errors: IImportError[] = [];
        const seen = new Set<string>();
        let duplicates = 0;

        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // +1 for 0-indexed, +1 for header
          let rowHasError = false;
          const validatedRow: any = {};

          columns.forEach((col) => {
            const value = row[col.label] || row[col.key];

            // Required check
            if (
              // col.required &&
              value === undefined ||
              value === null ||
              String(value).trim() === ""
            ) {
              errors.push({
                row: rowNum,
                column: col.label,
                message: `${col.label} is required.`,
              });
              rowHasError = true;
            }

            // Type check
            if (
              value !== undefined &&
              value !== null &&
              String(value).trim() !== ""
            ) {
              if (col.type === "number" && isNaN(Number(value))) {
                errors.push({
                  row: rowNum,
                  column: col.label,
                  message: `${col.label} must be a number.`,
                });
                rowHasError = true;
              } else if (
                col.type === "email" &&
                !validateEmail(String(value))
              ) {
                errors.push({
                  row: rowNum,
                  column: col.label,
                  message: `${col.label} must be a valid email.`,
                });
                rowHasError = true;
              }
            }

            validatedRow[col.key] = value;
          });

          // Duplicate check (using the first required column or the first column as unique key)
          // const uniqueKeyCol = columns.find((c) => c.required) || columns[0];
          const uniqueKeyCol = columns[0];
          const uniqueValue = String(validatedRow[uniqueKeyCol.key])
            .trim()
            .toLowerCase();
          if (uniqueValue && seen.has(uniqueValue)) {
            errors.push({
              row: rowNum,
              message: `Duplicate entry for ${uniqueKeyCol.label}: ${uniqueValue}`,
            });
            rowHasError = true;
            duplicates++;
          } else if (uniqueValue) {
            seen.add(uniqueValue);
          }

          if (!rowHasError) {
            validData.push(validatedRow);
          }
        });

        onImport({
          validData,
          errors,
          summary: {
            total: jsonData.length,
            valid: validData.length,
            invalid: jsonData.length - validData.length,
            duplicates,
          },
        });
      } catch (err) {
        console.error("Excel parse error:", err);
        onImport({
          validData: [],
          errors: [
            {
              row: 0,
              message:
                "Failed to parse Excel file. Please ensure it is a valid .xlsx file.",
            },
          ],
          summary: { total: 0, valid: 0, invalid: 0, duplicates: 0 },
        });
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      setIsParsing(false);
      onImport({
        validData: [],
        errors: [{ row: 0, message: "Error reading file." }],
        summary: { total: 0, valid: 0, invalid: 0, duplicates: 0 },
      });
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className={styles.excelImport}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: "none" }}
      />
      <ActionButton
        variant="export"
        label={isParsing ? "Parsing..." : buttonLabel}
        icon={iconFlag ? "pi pi-file-excel" : ""}
        disabled={isParsing}
        onClick={() => fileInputRef.current?.click()}
        className={styles.uploadBtn}
      />
    </div>
  );
};
