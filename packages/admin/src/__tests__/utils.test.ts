import { describe, it, expect } from "vitest";
import { parseAdminParams, buildAdminUrl } from "../utils.js";
import type { AdminParams } from "../utils.js";

function url(path: string): URL {
  return new URL(path, "http://localhost");
}

describe("parseAdminParams", () => {
  describe("dashboard", () => {
    it("returns dashboard when no params", () => {
      expect(parseAdminParams(url("/admin"))).toEqual({
        kind: "dashboard",
      });
    });

    it("returns dashboard for explicit view=dashboard", () => {
      expect(parseAdminParams(url("/admin?view=dashboard"))).toEqual({
        kind: "dashboard",
      });
    });
  });

  describe("table list", () => {
    it("parses basic table list", () => {
      expect(parseAdminParams(url("/admin?view=posts"))).toEqual({
        kind: "list",
        table: "posts",
        page: 1,
        sort: null,
        direction: "desc",
        search: "",
      });
    });

    it("parses table list with all params", () => {
      expect(
        parseAdminParams(
          url("/admin?view=posts&page=3&sort=createdAt&dir=asc&search=hello"),
        ),
      ).toEqual({
        kind: "list",
        table: "posts",
        page: 3,
        sort: "createdAt",
        direction: "asc",
        search: "hello",
      });
    });

    it("defaults page to 1 for invalid page values", () => {
      const result = parseAdminParams(url("/admin?view=posts&page=abc"));
      expect(result).toMatchObject({ kind: "list", page: 1 });
    });

    it("defaults page to 1 for negative page values", () => {
      const result = parseAdminParams(url("/admin?view=posts&page=-1"));
      expect(result).toMatchObject({ kind: "list", page: 1 });
    });

    it("defaults page to 1 for zero", () => {
      const result = parseAdminParams(url("/admin?view=posts&page=0"));
      expect(result).toMatchObject({ kind: "list", page: 1 });
    });

    it("defaults direction to desc when not specified", () => {
      const result = parseAdminParams(url("/admin?view=posts"));
      expect(result).toMatchObject({ kind: "list", direction: "desc" });
    });

    it("parses direction=asc", () => {
      const result = parseAdminParams(url("/admin?view=posts&dir=asc"));
      expect(result).toMatchObject({ kind: "list", direction: "asc" });
    });

    it("defaults direction to desc for unknown values", () => {
      const result = parseAdminParams(url("/admin?view=posts&dir=invalid"));
      expect(result).toMatchObject({ kind: "list", direction: "desc" });
    });
  });

  describe("record detail", () => {
    it("parses detail view", () => {
      expect(
        parseAdminParams(url("/admin?view=posts&id=abc123")),
      ).toEqual({
        kind: "detail",
        table: "posts",
        id: "abc123",
      });
    });
  });

  describe("create", () => {
    it("parses create view", () => {
      expect(
        parseAdminParams(url("/admin?view=posts&mode=create")),
      ).toEqual({
        kind: "create",
        table: "posts",
      });
    });
  });

  describe("edit", () => {
    it("parses edit view", () => {
      expect(
        parseAdminParams(url("/admin?view=posts&id=abc123&mode=edit")),
      ).toEqual({
        kind: "edit",
        table: "posts",
        id: "abc123",
      });
    });
  });

  describe("user list", () => {
    it("parses user list", () => {
      expect(parseAdminParams(url("/admin?view=_users"))).toEqual({
        kind: "user-list",
        page: 1,
        search: "",
      });
    });

    it("parses user list with search and page", () => {
      expect(
        parseAdminParams(url("/admin?view=_users&page=2&search=jane")),
      ).toEqual({
        kind: "user-list",
        page: 2,
        search: "jane",
      });
    });
  });

  describe("user detail", () => {
    it("parses user detail", () => {
      expect(
        parseAdminParams(url("/admin?view=_users&id=user1")),
      ).toEqual({
        kind: "user-detail",
        id: "user1",
      });
    });
  });
});

describe("buildAdminUrl", () => {
  describe("dashboard", () => {
    it("returns empty string for dashboard", () => {
      expect(buildAdminUrl({ kind: "dashboard" })).toBe("");
    });
  });

  describe("table list", () => {
    it("builds minimal list URL", () => {
      const params: AdminParams = {
        kind: "list",
        table: "posts",
        page: 1,
        sort: null,
        direction: "desc",
        search: "",
      };
      expect(buildAdminUrl(params)).toBe("?view=posts");
    });

    it("includes page when > 1", () => {
      const params: AdminParams = {
        kind: "list",
        table: "posts",
        page: 3,
        sort: null,
        direction: "desc",
        search: "",
      };
      expect(buildAdminUrl(params)).toBe("?view=posts&page=3");
    });

    it("omits page when 1", () => {
      const params: AdminParams = {
        kind: "list",
        table: "posts",
        page: 1,
        sort: "title",
        direction: "desc",
        search: "",
      };
      const result = buildAdminUrl(params);
      expect(result).not.toContain("page=");
    });

    it("includes sort", () => {
      const params: AdminParams = {
        kind: "list",
        table: "posts",
        page: 1,
        sort: "createdAt",
        direction: "desc",
        search: "",
      };
      expect(buildAdminUrl(params)).toBe("?view=posts&sort=createdAt");
    });

    it("includes direction only when asc", () => {
      const params: AdminParams = {
        kind: "list",
        table: "posts",
        page: 1,
        sort: null,
        direction: "asc",
        search: "",
      };
      expect(buildAdminUrl(params)).toBe("?view=posts&dir=asc");
    });

    it("omits direction when desc (default)", () => {
      const params: AdminParams = {
        kind: "list",
        table: "posts",
        page: 1,
        sort: null,
        direction: "desc",
        search: "",
      };
      const result = buildAdminUrl(params);
      expect(result).not.toContain("dir=");
    });

    it("includes search", () => {
      const params: AdminParams = {
        kind: "list",
        table: "posts",
        page: 1,
        sort: null,
        direction: "desc",
        search: "hello world",
      };
      const result = buildAdminUrl(params);
      expect(result).toContain("search=hello");
    });

    it("builds full list URL with all params", () => {
      const params: AdminParams = {
        kind: "list",
        table: "posts",
        page: 3,
        sort: "createdAt",
        direction: "asc",
        search: "foo",
      };
      const result = buildAdminUrl(params);
      expect(result).toBe(
        "?view=posts&page=3&sort=createdAt&dir=asc&search=foo",
      );
    });
  });

  describe("detail", () => {
    it("builds detail URL", () => {
      expect(
        buildAdminUrl({ kind: "detail", table: "posts", id: "abc123" }),
      ).toBe("?view=posts&id=abc123");
    });
  });

  describe("create", () => {
    it("builds create URL", () => {
      expect(buildAdminUrl({ kind: "create", table: "posts" })).toBe(
        "?view=posts&mode=create",
      );
    });
  });

  describe("edit", () => {
    it("builds edit URL", () => {
      expect(
        buildAdminUrl({ kind: "edit", table: "posts", id: "abc123" }),
      ).toBe("?view=posts&id=abc123&mode=edit");
    });
  });

  describe("user list", () => {
    it("builds minimal user list URL", () => {
      expect(
        buildAdminUrl({ kind: "user-list", page: 1, search: "" }),
      ).toBe("?view=_users");
    });

    it("builds user list URL with page and search", () => {
      expect(
        buildAdminUrl({ kind: "user-list", page: 2, search: "jane" }),
      ).toBe("?view=_users&page=2&search=jane");
    });
  });

  describe("user detail", () => {
    it("builds user detail URL", () => {
      expect(buildAdminUrl({ kind: "user-detail", id: "user1" })).toBe(
        "?view=_users&id=user1",
      );
    });
  });

  describe("roundtrip", () => {
    it("parseAdminParams(buildAdminUrl(params)) preserves list params", () => {
      const params: AdminParams = {
        kind: "list",
        table: "posts",
        page: 3,
        sort: "createdAt",
        direction: "asc",
        search: "foo",
      };
      const built = buildAdminUrl(params);
      const parsed = parseAdminParams(url(`/admin${built}`));
      expect(parsed).toEqual(params);
    });

    it("roundtrips detail params", () => {
      const params: AdminParams = {
        kind: "detail",
        table: "posts",
        id: "abc123",
      };
      const built = buildAdminUrl(params);
      const parsed = parseAdminParams(url(`/admin${built}`));
      expect(parsed).toEqual(params);
    });

    it("roundtrips create params", () => {
      const params: AdminParams = { kind: "create", table: "posts" };
      const built = buildAdminUrl(params);
      const parsed = parseAdminParams(url(`/admin${built}`));
      expect(parsed).toEqual(params);
    });

    it("roundtrips edit params", () => {
      const params: AdminParams = {
        kind: "edit",
        table: "posts",
        id: "abc123",
      };
      const built = buildAdminUrl(params);
      const parsed = parseAdminParams(url(`/admin${built}`));
      expect(parsed).toEqual(params);
    });

    it("roundtrips user-list params", () => {
      const params: AdminParams = {
        kind: "user-list",
        page: 2,
        search: "jane",
      };
      const built = buildAdminUrl(params);
      const parsed = parseAdminParams(url(`/admin${built}`));
      expect(parsed).toEqual(params);
    });

    it("roundtrips user-detail params", () => {
      const params: AdminParams = { kind: "user-detail", id: "user1" };
      const built = buildAdminUrl(params);
      const parsed = parseAdminParams(url(`/admin${built}`));
      expect(parsed).toEqual(params);
    });
  });
});
