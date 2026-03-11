import { and, or, lt, eq } from "drizzle-orm";
import type { Column, SQL } from "drizzle-orm";
import type { CursorParams, OffsetParams } from "./types";

type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

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
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? clamp(Number(limitParam), 1, maxLimit) : defaultLimit;

  return { type: "cursor", cursor, limit };
}

export function parseOffsetParams(
  request: Request,
  options?: PaginationOptions,
): OffsetParams {
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;

  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");

  const page = pageParam ? Math.max(Number(pageParam), 1) : 1;
  const limit = limitParam ? clamp(Number(limitParam), 1, maxLimit) : defaultLimit;

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
): SQL | undefined {
  if (cursorColumns.length === 1) {
    return lt(cursorColumns[0], cursorValues[0]);
  }

  // Tuple comparison expansion:
  // (col1 < v1) OR (col1 = v1 AND col2 < v2) OR (col1 = v1 AND col2 = v2 AND col3 < v3) ...
  const conditions: SQL[] = [];
  for (let i = 0; i < cursorColumns.length; i++) {
    const eqParts: SQL[] = [];
    for (let j = 0; j < i; j++) {
      eqParts.push(eq(cursorColumns[j], cursorValues[j]));
    }
    eqParts.push(lt(cursorColumns[i], cursorValues[i]));
    conditions.push(and(...eqParts)!);
  }

  return or(...conditions);
}
