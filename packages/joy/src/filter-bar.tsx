import { useCallback, type ReactElement } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router";
import JoyInput from "@mui/joy/Input";
import JoySelect from "@mui/joy/Select";
import JoyOption from "@mui/joy/Option";
import JoyStack from "@mui/joy/Stack";
import type { FilterBarProps, FilterDef } from "@cfast/ui";

/**
 * Joy UI styled FilterBar — URL-synced filter controls.
 */
export function FilterBar({
  filters,
  searchable,
}: FilterBarProps): ReactElement {
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
      params.delete("page");
      params.delete("cursor");
      navigate(`${location.pathname}?${params.toString()}`);
    },
    [searchParams, navigate, location.pathname],
  );

  return (
    <JoyStack direction={"row" as const} spacing={1} flexWrap={"wrap" as const} alignItems="center" sx={{ mb: 2 }}>
      {searchable && searchable.length > 0 ? (
        <JoyInput
          type="search"
          placeholder={`Search ${searchable.join(", ")}...`}
          value={searchParams.get("q") ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateParam("q", e.target.value || null)
          }
          size={"sm" as const}
          sx={{ minWidth: 200 }}
        />
      ) : null}
      {filters.map((filter) => (
        <JoyFilterInput
          key={filter.column}
          filter={filter}
          value={searchParams.get(filter.column) ?? ""}
          onChange={(value: string) => updateParam(filter.column, value || null)}
        />
      ))}
    </JoyStack>
  );
}

function JoyFilterInput({
  filter,
  value,
  onChange,
}: {
  filter: FilterDef;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  const label = filter.label ?? filter.column;

  switch (filter.type) {
    case "select":
    case "boolean":
      return (
        <JoySelect
          value={value || null}
          onChange={(_e: unknown, newValue: unknown) => onChange(newValue ? String(newValue) : "")}
          placeholder={`All ${label}`}
          size={"sm" as const}
          sx={{ minWidth: 140 }}
          slotProps={{ button: { "aria-label": label } }}
        >
          {(filter.options ?? []).map((opt) => (
            <JoyOption key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </JoyOption>
          ))}
        </JoySelect>
      );

    case "text":
    default:
      return (
        <JoyInput
          placeholder={filter.placeholder ?? label}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          size={"sm" as const}
          slotProps={{ input: { "aria-label": label } }}
        />
      );
  }
}
