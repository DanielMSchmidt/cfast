import { describe, it, expect, vi } from "vitest";
import { createCacheManager } from "../cache";

describe("CacheManager", () => {
  describe("key generation", () => {
    it("generates different keys for different roles", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      const key1 = cache.generateKey("SELECT * FROM posts", "anonymous", 1);
      const key2 = cache.generateKey("SELECT * FROM posts", "editor", 1);
      expect(key1).not.toBe(key2);
    });

    it("generates different keys for different table versions", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      const key1 = cache.generateKey("SELECT * FROM posts", "user", 1);
      const key2 = cache.generateKey("SELECT * FROM posts", "user", 2);
      expect(key1).not.toBe(key2);
    });

    it("generates same key for same inputs", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      const key1 = cache.generateKey("SELECT * FROM posts", "user", 1);
      const key2 = cache.generateKey("SELECT * FROM posts", "user", 1);
      expect(key1).toBe(key2);
    });

    it("generates different keys for different SQL", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      const key1 = cache.generateKey("SELECT * FROM posts", "user", 1);
      const key2 = cache.generateKey("SELECT * FROM comments", "user", 1);
      expect(key1).not.toBe(key2);
    });
  });

  describe("table versions", () => {
    it("starts at version 0", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      expect(cache.getTableVersion("posts")).toBe(0);
    });

    it("increments on invalidation", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      cache.invalidateTable("posts");
      expect(cache.getTableVersion("posts")).toBe(1);
    });

    it("increments independently per table", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      cache.invalidateTable("posts");
      cache.invalidateTable("posts");
      cache.invalidateTable("comments");
      expect(cache.getTableVersion("posts")).toBe(2);
      expect(cache.getTableVersion("comments")).toBe(1);
    });
  });

  describe("excluded tables", () => {
    it("isExcluded returns true for excluded tables", () => {
      const cache = createCacheManager({
        backend: "cache-api",
        exclude: ["sessions", "auditLogs"],
      });
      expect(cache.isExcluded("sessions")).toBe(true);
      expect(cache.isExcluded("auditLogs")).toBe(true);
      expect(cache.isExcluded("posts")).toBe(false);
    });

    it("handles empty exclude list", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      expect(cache.isExcluded("posts")).toBe(false);
    });
  });

  describe("TTL parsing", () => {
    it("parses seconds", () => {
      const cache = createCacheManager({ backend: "cache-api", ttl: "30s" });
      expect(cache.getTtlSeconds()).toBe(30);
    });

    it("parses minutes", () => {
      const cache = createCacheManager({ backend: "cache-api", ttl: "5m" });
      expect(cache.getTtlSeconds()).toBe(300);
    });

    it("parses hours", () => {
      const cache = createCacheManager({ backend: "cache-api", ttl: "2h" });
      expect(cache.getTtlSeconds()).toBe(7200);
    });

    it("defaults to 60s when no TTL specified", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      expect(cache.getTtlSeconds()).toBe(60);
    });

    it("allows override in getTtlSeconds", () => {
      const cache = createCacheManager({ backend: "cache-api", ttl: "30s" });
      expect(cache.getTtlSeconds("5m")).toBe(300);
    });
  });

  describe("observability hooks", () => {
    it("calls onInvalidate when tables are invalidated", () => {
      const onInvalidate = vi.fn();
      const cache = createCacheManager({
        backend: "cache-api",
        onInvalidate,
      });
      cache.invalidateTable("posts");
      expect(onInvalidate).toHaveBeenCalledWith(["posts"]);
    });

    it("calls onInvalidate for each table independently", () => {
      const onInvalidate = vi.fn();
      const cache = createCacheManager({
        backend: "cache-api",
        onInvalidate,
      });
      cache.invalidateTable("posts");
      cache.invalidateTable("comments");
      expect(onInvalidate).toHaveBeenCalledTimes(2);
    });
  });
});
