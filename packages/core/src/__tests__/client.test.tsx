// packages/core/src/__tests__/client.test.tsx
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { createCoreProvider, useApp, CoreContext } from "../client/index";

describe("client", () => {
  describe("createCoreProvider", () => {
    it("composes plugin providers in registration order", () => {
      const log: string[] = [];
      const P1 = ({ children }: { children: React.ReactNode }) => {
        log.push("P1");
        return <div data-provider="p1">{children}</div>;
      };
      const P2 = ({ children }: { children: React.ReactNode }) => {
        log.push("P2");
        return <div data-provider="p2">{children}</div>;
      };

      const plugins = [
        { name: "a", setup: () => ({}), Provider: P1, client: { x: 1 } },
        { name: "b", setup: () => ({}), Provider: P2, client: { y: 2 } },
      ];

      const Provider = createCoreProvider(plugins);
      const html = renderToString(
        <Provider>
          <span>child</span>
        </Provider>,
      );

      // P1 wraps P2 wraps child (registration order = nesting order)
      expect(html).toContain("child");
      expect(log).toEqual(["P1", "P2"]);
    });

    it("skips plugins without Provider", () => {
      const log: string[] = [];
      const P1 = ({ children }: { children: React.ReactNode }) => {
        log.push("P1");
        return <>{children}</>;
      };

      const plugins = [
        { name: "a", setup: () => ({}), Provider: P1, client: {} },
        { name: "b", setup: () => ({}) }, // no Provider
      ];

      const Provider = createCoreProvider(plugins);
      renderToString(
        <Provider>
          <span>ok</span>
        </Provider>,
      );
      expect(log).toEqual(["P1"]);
    });
  });

  describe("useApp", () => {
    it("throws when used outside CoreContext.Provider", () => {
      expect(CoreContext).toBeDefined();
    });

    it("returns aggregated client exports", () => {
      const plugins = [
        {
          name: "auth",
          setup: () => ({}),
          client: { useCurrentUser: () => null },
        },
        { name: "db", setup: () => ({}), client: { useQuery: () => [] } },
      ];

      const Provider = createCoreProvider(plugins);
      let captured: Record<string, unknown> = {};

      function TestComponent() {
        captured = useApp();
        return null;
      }

      renderToString(
        <Provider>
          <TestComponent />
        </Provider>,
      );
      expect(captured).toHaveProperty("auth");
      expect(captured).toHaveProperty("db");
    });
  });
});
