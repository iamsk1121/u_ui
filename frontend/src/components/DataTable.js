import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import "./DataTable.css";
import { Icons } from "../assets/icons";

const { next: NextIcon, prev: PrevIcon } = Icons;
const columnHelper = createColumnHelper();

const DataTable = ({
  data = [],
  columns = [],
  selectable = false,
  pagination = true,
  pageSizeOptions = [5, 10, 20],
  defaultPageSize = 10,
  selectedIds = [],
  onSelectChange = () => {},
  onRowClick,  
}) => {
  const [selectedRows, setSelectedRows] = useState(selectedIds || []);
  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  useEffect(() => {
  if (!Array.isArray(selectedIds)) return;

  if (JSON.stringify(selectedRows) !== JSON.stringify(selectedIds)) {
    setSelectedRows(selectedIds);
  }
}, [selectedIds]);

  const allColumns = [
    ...(selectable
      ? [
          columnHelper.display({
            id: "select",
            header: ({ table }) => {
              const visibleIds = table.getRowModel().rows.map(
                (r) => r.original.id
              );
              const allVisibleSelected = visibleIds.every((id) =>
                selectedRows.includes(id)
              );

              return (
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newSel = [
                        ...new Set([...selectedRows, ...visibleIds]),
                      ];
                      setSelectedRows(newSel);
                      onSelectChange(newSel);
                    } else {
                      const newSel = selectedRows.filter(
                        (id) => !visibleIds.includes(id)
                      );
                      setSelectedRows(newSel);
                      onSelectChange(newSel);
                    }
                  }}
                />
              );
            },
            cell: ({ row }) => (
              <input
                type="checkbox"
                checked={selectedRows.includes(row.original.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const newSel = checked
                    ? [...selectedRows, row.original.id]
                    : selectedRows.filter((id) => id !== row.original.id);

                  setSelectedRows(newSel);
                  onSelectChange(newSel);
                }}
              />
            ),
          }),
        ]
      : []),
    ...columns,
  ];

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { pagination: paginationState },
    onPaginationChange: setPaginationState,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleRowClickInternal = (row) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className="table-wrapper">
      <div className="table-container">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleRowClickInternal(row)}
                className="clickable-row"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="pagination">
          <div className="page-center">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <PrevIcon />
            </button>

            <span>
              {paginationState.pageIndex + 1} / {table.getPageCount()}
            </span>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <NextIcon />
            </button>
          </div>

          <div className="page-right">
            <select
              value={paginationState.pageSize}
              onChange={(e) =>
                setPaginationState((prev) => ({
                  ...prev,
                  pageSize: Number(e.target.value),
                }))
              }
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
