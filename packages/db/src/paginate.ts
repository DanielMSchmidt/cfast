import { and, or, lt, gt, eq } from "drizzle-orm";
import type { Column, SQL } from "drizzle-orm";
import type { CursorParams, OffsetParams } from "./types";

type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

function parseIntParam(raw: string | null, fallback: number): number {
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isNaN(n) ? fallback : n;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function parseCursorParams(
  request: Request,
  options?: PaginationOptions,
): CursorParams {
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limit = clamp(parseIntParam(url.searchParams.get("limit"), defaultLimit), 1, maxLimit);

  return { type: "cursor", cursor, limit };
}

export function parseOffsetParams(
  request: Request,
  options?: PaginationOptions,
): OffsetParams {
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;

  const url = new URL(request.url);
  const page = Math.max(parseIntParam(url.searchParams.get("page"), 1), 1);
  const limit = clamp(parseIntParam(url.searchParams.get("limit"), defaultLimit), 1, maxLimit);

  return { type: "offset", page, limit };
}

export function encodeCursor(values: unknown[]): string {
  return btoa(JSON.stringify({ v: values }));
}

export function decodeCursor(cursor: string | null): unknown[] | null {
  if (cursor === null) return null;
  try {
    const parsed: unknown = JSON.parse(atob(cursor));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "v" in parsed
    ) {
      const record = parsed as Record<string, unknown>;
      if (Array.isArray(record["v"])) {
        return record["v"] as unknown[];
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function buildCursorWhere(
  cursorColumns: Column[],
  cursorValues: unknown[],
  direction: "asc" | "desc" = "desc",
): SQL | undefined {
  const compare = direction === "desc" ? lt : gt;

  if (cursorColumns.length === 1) {
    return compare(cursorColumns[0], cursorValues[0]);
  }

  // Tuple comparison expansion:
  // desc: (col1 < v1) OR (col1 = v1 AND col2 < v2) ...
  // asc:  (col1 > v1) OR (col1 = v1 AND col2 > v2) ...
  const conditions: SQL[] = [];
  for (let i = 0; i < cursorColumns.length; i++) {
    const eqParts: SQL[] = [];
    for (let j = 0; j < i; j++) {
      eqParts.push(eq(cursorColumns[j], cursorValues[j]));
    }
    eqParts.push(compare(cursorColumns[i], cursorValues[i]));
    conditions.push(and(...eqParts)!);
  }

  return or(...conditions);
}
