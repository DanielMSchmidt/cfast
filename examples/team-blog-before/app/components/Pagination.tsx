import { Link } from "react-router";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

function getPageNumbers(current: number, total: number): number[] {
  const maxVisible = 5;
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  const end = Math.min(total, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const separator = baseUrl.includes("?") ? "&" : "?";

  return (
    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
      <Button
        component={Link}
        to={`${baseUrl}${separator}page=${currentPage - 1}`}
        variant="outlined"
        color="neutral"
        size="sm"
        disabled={currentPage <= 1}
      >
        Previous
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          component={Link}
          to={`${baseUrl}${separator}page=${page}`}
          variant={page === currentPage ? "solid" : "outlined"}
          color={page === currentPage ? "primary" : "neutral"}
          size="sm"
        >
          {page}
        </Button>
      ))}

      <Button
        component={Link}
        to={`${baseUrl}${separator}page=${currentPage + 1}`}
        variant="outlined"
        color="neutral"
        size="sm"
        disabled={currentPage >= totalPages}
      >
        Next
      </Button>
    </Stack>
  );
}
