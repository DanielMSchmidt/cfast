import { describe, it, expect } from "vitest";
import {
  definePermissions,
  grant,
  checkPermissions,
} from "@cfast/permissions";
import { posts, users, comments } from "../helpers/schema";

describe("hierarchy", () => {
  it("circular hierarchy detected throws Error", () => {
    expect(() =>
      definePermissions({
        roles: ["admin", "editor"] as const,
        grants: {
          admin: [grant("read", posts)],
          editor: [grant("read", posts)],
        },
        hierarchy: {
          admin: ["editor"],
          editor: ["admin"],
        },
      }),
    ).toThrow(/[Cc]ircular/);
  });

  it('grant("manage", "all") grants everything', () => {
    const perms = definePermissions({
      roles: ["superadmin", "viewer"] as const,
      grants: {
        superadmin: [grant("manage", "all")],
        viewer: [grant("read", posts)],
      },
    });

    const result = checkPermissions("superadmin", perms, [
      { action: "create", table: posts },
      { action: "delete", table: users },
      { action: "update", table: comments },
      { action: "read", table: posts },
    ]);

    expect(result.permitted).toBe(true);
    expect(result.denied).toHaveLength(0);
    expect(result.reasons).toHaveLength(0);
  });

  it("checkPermissions returns { permitted, denied, reasons }", () => {
    const perms = definePermissions({
      roles: ["viewer"] as const,
      grants: {
        viewer: [grant("read", posts)],
      },
    });

    const result = checkPermissions("viewer", perms, [
      { action: "read", table: posts },
      { action: "delete", table: posts },
    ]);

    expect(result.permitted).toBe(false);
    expect(result.denied).toHaveLength(1);
    expect(result.denied[0].action).toBe("delete");
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0]).toContain("viewer");
    expect(result.reasons[0]).toContain("delete");
  });

  it("hierarchy resolves inherited grants", () => {
    const perms = definePermissions({
      roles: ["admin", "editor", "viewer"] as const,
      grants: {
        admin: [grant("delete", posts)],
        editor: [grant("create", posts), grant("update", posts)],
        viewer: [grant("read", posts)],
      },
      hierarchy: {
        admin: ["editor"],
        editor: ["viewer"],
      },
    });

    // admin inherits editor + viewer grants
    const adminResult = checkPermissions("admin", perms, [
      { action: "read", table: posts },
      { action: "create", table: posts },
      { action: "update", table: posts },
      { action: "delete", table: posts },
    ]);
    expect(adminResult.permitted).toBe(true);

    // editor inherits viewer grants
    const editorResult = checkPermissions("editor", perms, [
      { action: "read", table: posts },
      { action: "create", table: posts },
      { action: "update", table: posts },
    ]);
    expect(editorResult.permitted).toBe(true);

    // editor should NOT have delete
    const editorDeleteResult = checkPermissions("editor", perms, [
      { action: "delete", table: posts },
    ]);
    expect(editorDeleteResult.permitted).toBe(false);

    // viewer only has read
    const viewerResult = checkPermissions("viewer", perms, [
      { action: "create", table: posts },
    ]);
    expect(viewerResult.permitted).toBe(false);
  });
});
