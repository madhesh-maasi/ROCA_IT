import moment from "moment";

function getCurrentFinancialYear(): string {
  const today = moment();
  const currentYear = today.year();

  // April = month index 3
  const startYear = today.month() >= 3 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;

  return `${startYear}-${endYear}`;
}
export const curFinanicalYear: string = getCurrentFinancialYear();

export function getFYOptions(data: any[] = []): { label: string; value: string }[] {
  const years = new Set<string>();
  
  // Always include the current financial year
  years.add(curFinanicalYear);

  // Extract unique financial years from data
  data.forEach((item) => {
    if (item.FinancialYear) {
      years.add(item.FinancialYear);
    } else if (item.financialYear) {
      years.add(item.financialYear);
    }
  });

  // Convert to sorted array (descending)
  return Array.from(years)
    .sort((a, b) => b.localeCompare(a))
    .map((yr) => ({ label: yr.replace("-", " - "), value: yr }));
}

export function getPreviousFinancialYear(fy: string): string {
  if (!fy || !fy.includes("-")) return "";
  const [startYear, endYear] = fy.split("-").map(Number);
  return `${startYear - 1}-${endYear - 1}`;
}

/**
 * Filters an array of objects based on a global search term across all (or specified) fields.
 */
export function globalSearchFilter<T>(
  data: T[],
  searchTerm: string,
  fields?: (keyof T)[],
): T[] {
  if (!searchTerm || searchTerm.trim() === "") return data;
  const lowerSearch = searchTerm.toLowerCase();

  return data.filter((item) => {
    const keys = fields || (Object.keys(item as any) as (keyof T)[]);
    return keys.some((key) => {
      const value = item[key];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerSearch);
    });
  });
}
