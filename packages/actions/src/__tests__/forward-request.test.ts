import { describe, it, expect } from "vitest";
import { forwardRequest } from "../forward-request.js";

describe("forwardRequest (issue #185)", () => {
  describe("default cloning", () => {
    it("preserves cookies and other headers from the original request", () => {
      const original = new Request("http://localhost/api", {
        method: "POST",
        headers: {
          cookie: "session=abc123; csrf=xyz",
          "x-custom-header": "value",
          "content-type": "application/json",
        },
        body: JSON.stringify({ foo: "bar" }),
      });

      const forwarded = forwardRequest(original, {
        body: new FormData(),
      });

      expect(forwarded.headers.get("cookie")).toBe("session=abc123; csrf=xyz");
      expect(forwarded.headers.get("x-custom-header")).toBe("value");
    });

    it("preserves the original method when not overridden", () => {
      const original = new Request("http://localhost/api", {
        method: "PATCH",
        body: '{}',
        headers: { "content-type": "application/json" },
      });
      const forwarded = forwardRequest(original);
      expect(forwarded.method).toBe("PATCH");
    });

    it("preserves the original URL when not overridden", () => {
      const original = new Request("http://localhost/api/items", {
        method: "POST",
        body: '{}',
      });
      const forwarded = forwardRequest(original);
      expect(forwarded.url).toBe("http://localhost/api/items");
    });
  });

  describe("body override", () => {
    it("replaces the body with FormData when supplied", async () => {
      const original = new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({ original: true }),
        headers: { "content-type": "application/json" },
      });

      const newFormData = new FormData();
      newFormData.set("_action", "createRow");
      newFormData.set("title", "Hello");

      const forwarded = forwardRequest(original, { body: newFormData });
      const formData = await forwarded.formData();
      expect(formData.get("_action")).toBe("createRow");
      expect(formData.get("title")).toBe("Hello");
    });

    it("does not consume the original request when a fresh body is supplied", async () => {
      const original = new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({ original: true }),
        headers: { "content-type": "application/json" },
      });

      const forwarded = forwardRequest(original, {
        body: JSON.stringify({ replaced: true }),
        headers: { "content-type": "application/json" },
      });

      // Forwarded carries the new body.
      const fwdBody = await forwarded.json();
      expect(fwdBody).toEqual({ replaced: true });

      // Original is still readable because we never touched its body stream.
      const origBody = await original.json();
      expect(origBody).toEqual({ original: true });
    });

    it("accepts null to forward without a body", async () => {
      const original = new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({ x: 1 }),
        headers: { "content-type": "application/json" },
      });
      const forwarded = forwardRequest(original, { body: null });
      // Reading body of a null-body request gives an empty string.
      expect(await forwarded.text()).toBe("");
    });
  });

  describe("header overrides", () => {
    it("merges supplied headers on top of the originals", () => {
      const original = new Request("http://localhost/api", {
        method: "POST",
        body: '{}',
        headers: {
          cookie: "session=abc",
          "content-type": "application/json",
        },
      });

      const forwarded = forwardRequest(original, {
        body: '{}',
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-trace-id": "trace-1",
        },
      });

      // New header added.
      expect(forwarded.headers.get("x-trace-id")).toBe("trace-1");
      // Existing header overridden.
      expect(forwarded.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      // Untouched header preserved.
      expect(forwarded.headers.get("cookie")).toBe("session=abc");
    });
  });

  describe("method and URL overrides", () => {
    it("uses the override method when supplied", () => {
      const original = new Request("http://localhost/api", {
        method: "POST",
        body: '{}',
      });
      const forwarded = forwardRequest(original, {
        method: "PUT",
        body: '{}',
      });
      expect(forwarded.method).toBe("PUT");
    });

    it("uses the override URL when supplied", () => {
      const original = new Request("http://localhost/api/from", {
        method: "POST",
        body: '{}',
      });
      const forwarded = forwardRequest(original, {
        url: "http://localhost/api/to",
        body: '{}',
      });
      expect(forwarded.url).toBe("http://localhost/api/to");
    });
  });

  describe("body-less methods", () => {
    it("forwards GET requests with no body", async () => {
      const original = new Request("http://localhost/api", {
        method: "GET",
        headers: { cookie: "session=abc" },
      });
      const forwarded = forwardRequest(original);
      expect(forwarded.method).toBe("GET");
      expect(forwarded.headers.get("cookie")).toBe("session=abc");
      expect(await forwarded.text()).toBe("");
    });

    it("throws if a body is supplied for a GET request", () => {
      const original = new Request("http://localhost/api", { method: "GET" });
      expect(() =>
        forwardRequest(original, { body: '{}' }),
      ).toThrow(/cannot attach a body to a GET/i);
    });
  });

  describe("end-to-end sub-action dispatch flow", () => {
    it("sub-action handler sees the same cookies as the original handler", async () => {
      // Simulate a getContext() callback that reads the user from cookies.
      function getUserFromRequest(request: Request): { id: string } | null {
        const cookie = request.headers.get("cookie");
        if (cookie?.includes("session=user-1")) return { id: "user-1" };
        return null;
      }

      const original = new Request("http://localhost/api", {
        method: "POST",
        headers: {
          cookie: "session=user-1",
          "content-type": "application/json",
        },
        body: JSON.stringify({ batch: ["a", "b"] }),
      });

      // The original handler reads its user...
      expect(getUserFromRequest(original)).toEqual({ id: "user-1" });

      // ...then dispatches a sub-action via forwardRequest. The sub-action
      // sees the same user because cookies were preserved.
      const subFormData = new FormData();
      subFormData.set("title", "a");
      const subRequest = forwardRequest(original, { body: subFormData });
      expect(getUserFromRequest(subRequest)).toEqual({ id: "user-1" });
    });
  });
});
