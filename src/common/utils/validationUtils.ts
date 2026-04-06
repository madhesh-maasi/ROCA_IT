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

export const panFormatter = (pan: string) => {
  let value = pan
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);

  const formatted =
    value.slice(0, 5).replace(/[^A-Z]/g, "") + // first 5 letters
    value.slice(5, 9).replace(/[^0-9]/g, "") + // next 4 digits
    value.slice(9, 10).replace(/[^A-Z]/g, ""); // last letter

  return formatted;
};

export const validatePAN = (pan: string) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan?.toUpperCase());
};

/**
 * Ensures the value matches a given regex pattern.
 */
export const regexMatch = (
  regex: RegExp,
  message: string = "Invalid format",
): IValidationRule => ({
  validate: (val) => {
    if (!val) return true; // Let the required rule handle nulls
    return regex.test(String(val));
  },
  message,
});
