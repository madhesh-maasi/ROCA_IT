/**
 * Generic validation rules and utility functions.
 */

export interface IValidationRule<T = string> {
  validate: (value: T) => boolean;
  message: string;
}

/**
 * Ensures the value is not empty (null, undefined, or empty string/whitespace).
 */
export const required = (
  message: string = "This field is required",
): IValidationRule => ({
  validate: (val) =>
    val !== null && val !== undefined && String(val).trim() !== "",
  message,
});

/**
 * Ensures the value is unique within an existing array of values.
 * Performs a case-insensitive string comparison by default.
 */
export const isUnique = (
  existingValues: string[],
  message: string = "This value already exists",
): IValidationRule => ({
  validate: (val) => {
    if (!val) return true; // Let the required rule handle nulls
    const target = String(val).trim().toLowerCase();
    return !existingValues.some(
      (ex) => String(ex).trim().toLowerCase() === target,
    );
  },
  message,
});

/**
 * Master validation runner.
 * @param value The value to test
 * @param rules Array of validation rules to apply
 * @returns An error message string if validation fails, or an empty string if valid.
 */
export const validateField = (value: any, rules: IValidationRule[]): string => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return "";
};
