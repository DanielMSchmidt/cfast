import { type ReactElement } from "react";
import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import type { AdminActionResult } from "../types.js";

export function ActionResultDisplay({
  result,
}: {
  result: AdminActionResult | undefined;
}): ReactElement | null {
  if (!result) return null;

  if ("success" in result) {
    return (
      <Chip color="success" variant="soft" sx={{ mb: 2 }}>
        {result.success}
      </Chip>
    );
  }

  if ("error" in result) {
    return (
      <Chip color="danger" variant="soft" sx={{ mb: 2 }}>
        {result.error}
      </Chip>
    );
  }

  if ("fieldErrors" in result) {
    return (
      <Box sx={{ mb: 2 }}>
        {Object.entries(result.fieldErrors).map(([field, error]) => (
          <Chip key={field} color="danger" variant="soft" sx={{ mr: 1, mb: 1 }}>
            {field}: {error}
          </Chip>
        ))}
      </Box>
    );
  }

  return null;
}
