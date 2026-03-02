import * as XLSX from "xlsx-js-style";

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
          fgColor: { rgb: "4F46E5" }, // Indigo background
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
