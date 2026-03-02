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
