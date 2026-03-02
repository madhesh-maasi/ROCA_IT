import * as React from "react";
import {
  DataTable as PrimeDataTable,
  DataTableValueArray,
} from "primereact/datatable";
import { Column, ColumnProps } from "primereact/column";
import styles from "./DataTable.module.scss";

export interface IColumnDef extends ColumnProps {
  /** Maps to the data object key to display. */
  field: string;
  /** Column header label. */
  header: string;
}

export interface IDataTableProps {
  /** Array of row data objects. */
  data: DataTableValueArray;
  /** Column definitions. */
  columns: IColumnDef[];
  /** Show a loading overlay skeleton. */
  loading?: boolean;
  /** Message shown when `data` is empty. */
  emptyMessage?: string;
  /** Enable pagination. */
  paginator?: boolean;
  /** Number of rows per page (default 10). */
  rows?: number;
  /** Selection value (array for multiple). */
  selection?: any;
  /** Callback on selection change. */
  onSelectionChange?: (e: { value: any }) => void;
  /** Additional class for the outer wrapper div. */
  className?: string;
}

/**
 * A feature-ready data table built on PrimeReact DataTable.
 * Supports pagination, loading state, and empty state out of the box.
 *
 * @example
 * const columns: IColumnDef[] = [
 *   { field: 'name', header: 'Name' },
 *   { field: 'pan', header: 'PAN' },
 * ];
 *
 * <AppDataTable
 *   data={employees}
 *   columns={columns}
 *   loading={isLoading}
 *   paginator
 *   rows={10}
 *   emptyMessage="No records found."
 * />
 */
const AppDataTable: React.FC<IDataTableProps> = ({
  data,
  columns,
  loading = false,
  emptyMessage = "No records found.",
  paginator = false,
  rows = 10,
  selection,
  onSelectionChange,
  className,
}) => {
  return (
    <div className={`${styles.dataTableContainer} ${className || ""}`}>
      <PrimeDataTable
        value={data}
        loading={loading}
        emptyMessage={emptyMessage}
        paginator={paginator}
        rows={rows}
        paginatorTemplate="CurrentPageReport PrevPageLink PageLinks NextPageLink"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        stripedRows={false}
        showGridlines={false}
        responsiveLayout="scroll"
        selection={selection}
        onSelectionChange={onSelectionChange}
        className={styles.dataTable}
      >
        {onSelectionChange && (
          <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        )}
        {columns.map(({ field, header, ...colProps }) => (
          <Column
            key={field}
            field={field}
            header={header}
            sortable
            {...colProps}
          />
        ))}
      </PrimeDataTable>
    </div>
  );
};

export { AppDataTable };
export default AppDataTable;
