import * as XLSX from "xlsx-js-style";

export interface ISheetData {
  sheetName: string;
  data: any[];
}

/**
 * Builds an XLSX workbook from one or more sheets.
 */
function buildWorkbook(sheets: ISheetData[]): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  for (const { sheetName, data } of sheets) {
    if (!data || data.length === 0) continue;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const columns = Object.keys(data[0]).map((key) => {
      const maxLength = data.reduce((max, row) => {
        const cellValue = row[key] != null ? row[key].toString() : "";
        return Math.max(max, cellValue.length);
      }, key.length);
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet["!cols"] = columns;
    const headerKeys = Object.keys(data[0]);
    for (let i = 0; i < headerKeys.length; i++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: "307a8a" } },
          font: { color: { rgb: "FFFFFF" }, bold: true },
        };
      }
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
  return workbook;
}

/**
 * Export multiple sheets to an Excel (.xlsx) file (download).
 */
export const exportToExcelMultiSheet = (
  sheets: ISheetData[],
  fileName: string,
): void => {
  const workbook = buildWorkbook(sheets);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Generate base64-encoded Excel content from multiple sheets (for email attachment).
 */
export const generateExcelBase64MultiSheet = (
  sheets: ISheetData[],
  fileName: string,
): string => {
  const workbook = buildWorkbook(sheets);
  return XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
};

/**
 * Common utility to export JSON data to an Excel (.xlsx) file.
 *
 * @param data Array of objects representing the rows to be exported.
 * @param fileName The desired filename (without the .xlsx extension).
 */
export const exportToExcel = (data: any[], fileName: string): void => {
  if (!data || data.length === 0) {
    console.warn("No data provided for Excel export.");
    return;
  }

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Convert JSON to a sheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns based on header length and content
  const columns = Object.keys(data[0]).map((key) => {
    // Find the max length between the header and all cell values in this column
    const maxLength = data.reduce((max, row) => {
      const cellValue = row[key] ? row[key].toString() : "";
      return Math.max(max, cellValue.length);
    }, key.length);
    return { wch: Math.min(maxLength + 2, 50) };
  });

  worksheet["!cols"] = columns;

  // Apply styling to headers (row 0)
  const headerKeys = Object.keys(data[0]);
  for (let i = 0; i < headerKeys.length; i++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        fill: {
          fgColor: { rgb: "307a8a" }, // Indigo background
        },
        font: {
          color: { rgb: "FFFFFF" }, // White text
          bold: true,
        },
      };
    }
  }

  // Append sheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Common utility to generate Excel base64 data for as email attachment.
 *
 * @param data Array of objects representing the rows to be exported.
 * @param fileName The desired filename (without the .xlsx extension).
 * @returns The base64-encoded Excel file content.
 */
export const generateExcelBase64 = (data: any[], fileName: string): string => {
  if (!data || data.length === 0) {
    console.warn("No data provided for Excel generation.");
    return "";
  }

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Convert JSON to a sheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns based on header length and content
  const columns = Object.keys(data[0]).map((key) => {
    // Find the max length between the header and all cell values in this column
    const maxLength = data.reduce((max, row) => {
      const cellValue = row[key] ? row[key].toString() : "";
      return Math.max(max, cellValue.length);
    }, key.length);
    return { wch: Math.min(maxLength + 2, 50) };
  });

  worksheet["!cols"] = columns;

  // Apply styling to headers (row 0)
  const headerKeys = Object.keys(data[0]);
  for (let i = 0; i < headerKeys.length; i++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        fill: {
          fgColor: { rgb: "307a8a" }, // Indigo background
        },
        font: {
          color: { rgb: "FFFFFF" }, // White text
          bold: true,
        },
      };
    }
  }

  // Append sheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Write and return base64 content
  return XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
};
