import { describe, it, expect } from "vitest";

// Load component sources via Vite's `?raw` import query so we don't
// need `@types/node` in the admin package just to run a static-text
// check. Vitest resolves `?raw` at transform time and hands us the
// string content, identical to what `fs.readFileSync` would produce
// but with zero runtime node dependency.
import tableListSource from "../components/table-list.tsx?raw";
import tableDetailSource from "../components/table-detail.tsx?raw";
import dashboardSource from "../components/dashboard.tsx?raw";

/**
 * These tests protect the public data-testid contract of the auto-generated
 * admin UI. Downstream apps write Playwright/Cypress suites against these
 * selectors, so a silent regression (e.g. a contributor removing the
 * attribute during a refactor) must not go unnoticed.
 *
 * We intentionally do a static source check rather than a full render
 * test because the admin components compose MUI Joy + react-router, which
 * is unnecessarily heavy for the purpose of confirming that a JSX attribute
 * is still present.
 */

describe("table-list.tsx testids", () => {
  it("applies admin-table-{tableName} to the list table", () => {
    expect(tableListSource).toContain(
      `adminTestId({ kind: "table", table: tableName })`,
    );
  });

  it("applies admin-row-{tableName}-{id} to each row", () => {
    expect(tableListSource).toContain(
      `adminTestId({ kind: "row", table: tableName, id })`,
    );
  });

  it("applies admin-action-create to the Create button", () => {
    expect(tableListSource).toContain(
      `adminTestId({ kind: "action", action: "create" })`,
    );
  });

  it("applies admin-action-view to the View button", () => {
    expect(tableListSource).toContain(
      `adminTestId({ kind: "action", action: "view" })`,
    );
  });

  it("applies admin-action-delete to the Delete button", () => {
    expect(tableListSource).toContain(
      `adminTestId({ kind: "action", action: "delete" })`,
    );
  });
});

describe("table-detail.tsx testids", () => {
  it("applies admin-action-edit to the Edit button", () => {
    expect(tableDetailSource).toContain(
      `adminTestId({ kind: "action", action: "edit" })`,
    );
  });

  it("applies admin-action-delete to the Delete button", () => {
    expect(tableDetailSource).toContain(
      `adminTestId({ kind: "action", action: "delete" })`,
    );
  });
});

describe("dashboard.tsx testids", () => {
  it("applies admin-dashboard-widget-count-{label} to stat cards", () => {
    expect(dashboardSource).toContain(`kind: "dashboard-widget"`);
    expect(dashboardSource).toContain(`widget: "count"`);
    expect(dashboardSource).toContain(`slugifyTestIdSegment(stat.label)`);
  });

  it("applies admin-dashboard-widget-recent-{table} to recent-item sections", () => {
    expect(dashboardSource).toContain(`widget: "recent"`);
    expect(dashboardSource).toContain(`table: section.table`);
  });
});
