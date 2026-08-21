"use client";

import { useMemo, useState } from "react";

export type InteractiveColumn<T> = {
  key: string;
  label: string;
  align?: "left" | "right";
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
};

export function InteractiveTable<T>({
  rows,
  columns,
  searchPlaceholder = "Buscar…",
  searchText,
  rowClassName,
  pageSize = 25,
  onRowClick,
}: {
  rows: T[];
  columns: InteractiveColumn<T>[];
  searchPlaceholder?: string;
  searchText: (row: T) => string;
  rowClassName?: (row: T) => string | undefined;
  pageSize?: number;
  onRowClick?: (row: T) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((row) => searchText(row).toLowerCase().includes(q)) : rows;
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return filtered;
    return [...filtered].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return cmp * sortDir;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((direction) => (direction === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
    setPage(0);
  };

  return (
    <div className="interactive-table">
      <div className="interactive-table-toolbar">
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          aria-label={searchPlaceholder}
        />
        <span className="interactive-table-count">
          {sorted.length} {sorted.length === 1 ? "registro" : "registros"}
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.align === "right" ? "align-right" : undefined}
                  onClick={column.sortValue ? () => toggleSort(column.key) : undefined}
                  style={column.sortValue ? { cursor: "pointer" } : undefined}
                  aria-sort={sortKey === column.key ? (sortDir === 1 ? "ascending" : "descending") : "none"}
                >
                  {column.label}
                  {column.sortValue && sortKey === column.key ? (sortDir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length ? (
              pageRows.map((row, index) => (
                <tr key={index} className={rowClassName?.(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} style={onRowClick ? { cursor: "pointer" } : undefined}>
                  {columns.map((column) => (
                    <td key={column.key} className={column.align === "right" ? "align-right" : undefined}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>Nenhum registro encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="interactive-table-pagination">
          <button className="secondary-button small" disabled={clampedPage === 0} onClick={() => setPage(clampedPage - 1)}>
            Anterior
          </button>
          <span>
            Página {clampedPage + 1} de {pageCount}
          </span>
          <button className="secondary-button small" disabled={clampedPage >= pageCount - 1} onClick={() => setPage(clampedPage + 1)}>
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
