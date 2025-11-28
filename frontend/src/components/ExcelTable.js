import React, { useRef, useMemo, useEffect } from "react";
import {FaSortNumericUpAlt, FaSortNumericDown, FaSort } from "react-icons/fa";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import "./ExcelTable.css";
import ExcelFilter from "./ExcelFilter";
import LoadingSpinner from "../components/common/LoadingSpinner";

const columnHelper = createColumnHelper();

export default function ExcelTable({
  tableData,
  columnsToShow,
  filterableColumns,
  onRowClick,
  loading,
  uniqueValues,
  filtersState,
  setFiltersState,
  sortConfig = { field: null, direction: null }, 
  setSortConfig = () => {},
  sortable_columns,
  sortToggle,
}) {
  const data = tableData ?? [];

  const HEADER_LABELS = {
    strip_id: "Strip",
    defect_code: "Code",
    afvi_ai_keyin: "AI KeyIn",
    afvi_ai_defect: "AI Defect",
    afvi_ai_gv: "GV",
    afvi_ai_longest: "Longest",
    afvi_clf_defect: "CLF",
    afvi_false_defect: "FALSE",
    ivs_keyin1: "GT",
    image_path: "IMG",
  };

  const columns = useMemo(() => {
    const FIXED_S = ["strip_id",'defect_code', 'ivs_keyin1', 'image_path'];
    const FIXED_L = ['afvi_ai_longest', 'afvi_ai_gv'];

    return columnsToShow.map((key) =>
      columnHelper.accessor(key, {
        id: key,
        header: HEADER_LABELS[key] ?? key.toUpperCase(),
        enableColumnFilter: filterableColumns.includes(key),
        filterFn: basicFilter,
        cell: (info) => info.getValue() ?? "",
        size: FIXED_S.includes(key) ? 75 : FIXED_L.includes(key) ? 86 : undefined,
        enableResizing: true,
        minSize: 70,
      })
    );
  }, [columnsToShow, filterableColumns]);

  function basicFilter(row, columnId, filterValues) {
    if (!Array.isArray(filterValues)) return true;
    if (filterValues.length === 0) return false;

    const rowValue = String(row.getValue(columnId));
    return filterValues.includes(rowValue);
  }

  const table = useReactTable({
    data,
    columns,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),

    enableColumnResizing: true,
    columnResizeMode: "onChange",

    meta: {
      uniqueValues,
      filtersState,
      setFiltersState,
      setSortConfig
    },
  });

  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length ?? data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 8,
  });

  

  useEffect(() => {
    virtualizer.measure();
  }, [
    table.getRowModel().rows.length,
    table.getState().columnSizingInfo,
    table.getState().columnSizing,
  ]);

  if (loading && data.length === 0) {
    return <LoadingSpinner />;
  }

  if (!loading && data.length === 0) {
    return <div className="excel-wrapper empty">No data available</div>;
  }

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows[0]?.start || 0;
  const paddingBottom =
    virtualizer.getTotalSize() -
      (virtualRows[virtualRows.length - 1]?.end || 0) || 0;

  return (
    <div className="excel-table-container">

      <div className="excel-wrapper" ref={parentRef}>
        <table className="excel-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="excel-th" style={{ width: header.getSize() }}>
                    <div className="excel-header-flex">

                      <div className="excel-header-title">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortable_columns.includes(header.id) && (
                            <span
                              className={`sort-icon ${
                                sortConfig.field === header.id ? "active" : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                sortToggle(header.id);
                              }}
                            >
                              {sortConfig.field === header.id
                                ? sortConfig.direction === "asc"
                                  ? <FaSortNumericDown />
                                  : <FaSortNumericUpAlt />
                                : <FaSort />}
                            </span>
                          )}
                      </div>

                      {header.column.columnDef.enableColumnFilter && (
                        <ExcelFilter column={header.column} table={table} />
                      )}

                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          header.getResizeHandler()(e);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          header.getResizeHandler()(e);
                        }}
                        className={`resize-handle ${
                          header.column.getIsResizing() ? "active" : ""
                        }`}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: paddingTop }} />
              </tr>
            )}

            {virtualRows.map((vr) => {
              const row = table.getRowModel().rows[vr.index];

              return (
                <tr key={row.id} className="excel-row">
                  {row.getVisibleCells().map((cell) => {
                    const isFileName = cell.column.id === "image_path";
                    const value = cell.getValue();

                    return (
                      <td
                        key={cell.id}
                        className={`excel-td ${isFileName ? "clickable-file" : ""}`}
                        style={{ width: cell.column.getSize() }}
                        onClick={(e) => {
                          if (isFileName) {
                            e.stopPropagation();
                            onRowClick(row.original);
                          }
                        }}
                      >
                        {isFileName ? (
                          <span className="file-link" style={{ cursor: "pointer" }}>
                            Img
                          </span>
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: paddingBottom }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
