import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Vite plugin that warns when files under `app/routes/` are not registered
 * in `app/routes.ts`.
 *
 * React Router v7 has no auto-discovery, so an unregistered route file is a
 * silent failure: it compiles but the URL 404s. This plugin scans the routes
 * directory at dev/build time and prints a yellow warning for every file that
 * is not referenced by an `index()` or `route()` call in `app/routes.ts`.
 *
 * It never fails the build — it only logs.
 */
export function cfastRoutesCheckPlugin(): Plugin {
  const ROUTES_DIR = path.resolve(process.cwd(), "app", "routes");
  const ROUTES_TS = path.resolve(process.cwd(), "app", "routes.ts");

  let warned = new Set<string>();

  const runCheck = (): void => {
    if (!fs.existsSync(ROUTES_TS) || !fs.existsSync(ROUTES_DIR)) {
      return;
    }

    const registered = parseRegisteredRoutes(fs.readFileSync(ROUTES_TS, "utf-8"));
    const onDisk = walkRouteFiles(ROUTES_DIR);

    for (const relPath of onDisk) {
      const normalized = relPath.replace(/\\/g, "/");
      const withoutExt = normalized.replace(/\.[^./]+$/, "");

      if (registered.has(normalized) || registered.has(withoutExt)) continue;
      if (warned.has(normalized)) continue;
      warned.add(normalized);

      const yellow = (s: string): string => `\x1b[33m${s}\x1b[0m`;
      const suggestedUrl = withoutExt
        .replace(/^routes\//, "")
        .replace(/\._index$/, "")
        .replace(/\$/g, ":")
        .replace(/\./g, "/");

      // eslint-disable-next-line no-console
      console.warn(
        yellow(`[cfast] WARNING: app/${normalized} is not registered in app/routes.ts`),
      );
      // eslint-disable-next-line no-console
      console.warn(
        yellow(
          `[cfast] Add: route("${suggestedUrl}", "${normalized}") to make this URL reachable.`,
        ),
      );
    }
  };

  return {
    name: "cfast-routes-check",
    apply(_config, env) {
      return env.command === "serve" || env.command === "build";
    },
    buildStart() {
      warned = new Set();
      runCheck();
    },
    configureServer(server) {
      const onChange = (file: string): void => {
        if (file === ROUTES_TS || file.startsWith(ROUTES_DIR + path.sep)) {
          warned = new Set();
          runCheck();
        }
      };
      server.watcher.on("add", onChange);
      server.watcher.on("change", onChange);
      server.watcher.on("unlink", onChange);
    },
  };
}

/**
 * Parse `app/routes.ts` source and return the set of module paths referenced
 * by `route()` and `index()` calls. Comments are stripped first so that
 * commented-out routes do NOT count as registered.
 *
 * Exported for testing.
 */
export function parseRegisteredRoutes(source: string): Set<string> {
  const stripped = stripComments(source);
  const registered = new Set<string>();

  // index("routes/_index.tsx") — module path is the only argument
  const indexRe = /\bindex\s*\(\s*["'`]([^"'`]+)["'`]/g;
  // route("foo", "routes/foo.tsx") — module path is the second argument
  const routeRe = /\broute\s*\(\s*["'`][^"'`]*["'`]\s*,\s*["'`]([^"'`]+)["'`]/g;

  let m: RegExpExecArray | null;
  while ((m = indexRe.exec(stripped)) !== null) {
    registered.add(m[1]);
  }
  while ((m = routeRe.exec(stripped)) !== null) {
    registered.add(m[1]);
  }

  return registered;
}

function stripComments(src: string): string {
  // Remove block comments and line comments. Naive but sufficient for routes.ts.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/**
 * Recursively walk `app/routes/` and return all `.ts/.tsx/.js/.jsx` files
 * as paths relative to `app/` (e.g. `routes/projects._index.tsx`).
 *
 * Exported for testing.
 */
export function walkRouteFiles(routesDir: string): string[] {
  const out: string[] = [];
  const APP_DIR = path.dirname(routesDir);

  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && /\.(t|j)sx?$/.test(entry.name)) {
        out.push(path.relative(APP_DIR, full));
      }
    }
  };

  walk(routesDir);
  return out;
}
