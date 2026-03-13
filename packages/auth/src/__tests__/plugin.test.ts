import { describe, it, expect } from "vitest";
import { authRoutes } from "../plugin";

describe("authRoutes", () => {
  it("returns a route config entry for auth catch-all", () => {
    const routes = authRoutes({ handlerFile: "routes/auth.$.tsx" });

    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe("auth/*");
    expect(routes[0].file).toBe("routes/auth.$.tsx");
  });

  it("uses custom basePath", () => {
    const routes = authRoutes({
      handlerFile: "routes/auth.$.tsx",
      basePath: "api/auth",
    });

    expect(routes[0].path).toBe("api/auth/*");
  });

  it("generates a stable route id", () => {
    const routes = authRoutes({ handlerFile: "routes/auth.$.tsx" });

    expect(routes[0].id).toBe("cfast-auth");
  });
});
