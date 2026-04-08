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
  header: any;
}

export interface IDataTableProps {
  /** Array of row data objects. */
  data: DataTableValueArray;
  /** Column definitions. */
  columns: IColumnDef[];
  /** Global search filter string. */
  globalFilter?: string | null;
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
  /** Callback fired when a row is clicked */
  onRowClick?: (e: { data: any; originalEvent: React.MouseEvent }) => void;
  cursor?: boolean;
  dataKey?: string;
}

/**
 * A feature-ready data table built on PrimeReact DataTable.
 * Supports pagination, loading state, and empty state out of the box.
 */
const AppDataTable: React.FC<IDataTableProps> = ({
  data,
  columns,
  globalFilter,
  loading = false,
  emptyMessage = "No records found.",
  paginator = false,
  rows = 10,
  selection,
  onSelectionChange,
  className,
  onRowClick,
  cursor = false,
  dataKey,
}) => {
  // Extract all searchable fields for global filtering
  const globalFilterFields = React.useMemo(() => {
    return columns.map((col) => col.field);
  }, [columns]);

  return (
    <div className={`${styles.dataTableContainer} ${className || ""}`}>
      <PrimeDataTable
        value={data}
        dataKey={dataKey || "id"}
        loading={loading}
        emptyMessage={emptyMessage}
        paginator={paginator}
        rows={rows}
        paginatorTemplate="CurrentPageReport PrevPageLink PageLinks NextPageLink"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        // stripedRows={false}
        // showGridlines={false}
        // responsiveLayout="scroll"
        selection={selection}
        onSelectionChange={onSelectionChange}
        onRowClick={onRowClick}
        globalFilter={globalFilter}
        globalFilterFields={globalFilterFields}
        className={`${styles.dataTable} ${cursor ? styles.cursor : ""}`}
        tableStyle={{ width: "100%", tableLayout: "fixed" }}
      >
        {onSelectionChange && (
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            style={{ width: "3rem" }}
          />
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
