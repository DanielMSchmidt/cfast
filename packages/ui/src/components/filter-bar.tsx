import { useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router";
import type { FilterBarProps, FilterDef } from "../types.js";

/**
 * URL-synced filter controls for data tables and list views.
 *
 * Each filter serializes its state to URL search params (e.g., `?published=true`).
 * On filter change, React Router navigates with the updated params, resetting
 * pagination to page 1. In the loader, `@cfast/pagination`'s `parseParams()`
 * reads these params and applies them as Drizzle `where` clauses.
 *
 * Supports text, select, boolean, and other filter types via {@link FilterDef}.
 * An optional `searchable` prop adds a full-text search input across specified columns.
 *
 * @param props - See {@link FilterBarProps}.
 *
 * @example
 * ```tsx
 * <FilterBar
 *   filters={[
 *     { column: "published", type: "select", options: [
 *       { label: "Published", value: "true" },
 *       { label: "Draft", value: "false" },
 *     ]},
 *     { column: "createdAt", type: "dateRange" },
 *   ]}
 *   searchable={["title", "content"]}
 * />
 * ```
 */
export function FilterBar({
  filters,
  searchable,
}: FilterBarProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams);
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      // Reset to page 1 on filter change
      params.delete("page");
      params.delete("cursor");
      navigate(`${location.pathname}?${params.toString()}`);
    },
    [searchParams, navigate, location.pathname],
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap" as const,
        alignItems: "center",
        marginBottom: "16px",
      }}
    >
      {searchable && searchable.length > 0 ? (
        <input
          type="search"
          placeholder={`Search ${searchable.join(", ")}...`}
          value={searchParams.get("q") ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateParam("q", e.target.value || null)
          }
          style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: "4px" }}
        />
      ) : null}
      {filters.map((filter) => (
        <FilterInput
          key={filter.column}
          filter={filter}
          value={searchParams.get(filter.column) ?? ""}
          onChange={(value) => updateParam(filter.column, value || null)}
        />
      ))}
    </div>
  );
}

function FilterInput({
  filter,
  value,
  onChange,
}: {
  filter: FilterDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const label = filter.label ?? filter.column;

  switch (filter.type) {
    case "select":
    case "boolean":
      return (
        <select
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          aria-label={label}
        >
          <option value="">{`All ${label}`}</option>
          {(filter.options ?? []).map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "text":
    default:
      return (
        <input
          type="text"
          placeholder={filter.placeholder ?? label}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          aria-label={label}
          style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: "4px" }}
        />
      );
  }
}
