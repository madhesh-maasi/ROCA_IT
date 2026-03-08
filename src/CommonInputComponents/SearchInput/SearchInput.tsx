import * as React from "react";
import { InputText } from "primereact/inputtext";
import styles from "./SearchInput.module.scss";

export interface ISearchInputProps {
  /** Controlled search value. */
  value: string;
  /** Called on every keystroke. */
  onChange: (value: string) => void;
  /** Placeholder text. Defaults to 'Search'. */
  placeholder?: string;
  /** Additional class for the outer wrapper. */
  className?: string;
  /** Unique id for the input element. */
  id?: string;
}

/**
 * A rounded search input with a leading magnifier icon, built on PrimeReact InputText.
 *
 * @example
 * <SearchInput
 *   value={query}
 *   onChange={(val) => setQuery(val)}
 *   placeholder="Search records..."
 * />
 */
const SearchInput: React.FC<ISearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search",
  className,
  id = "searchInput",
}) => {
  return (
    <div className={`${styles.searchWrapper} ${className || ""}`}>
      <i className={`pi pi-search ${styles.searchIcon}`} />
      <InputText
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className={styles.searchInput}
      />
    </div>
  );
};

export { SearchInput };
export default SearchInput;
