#!/usr/bin/env node
/**
 * Rewrite legacy `@mui/joy/<Component>` directory imports to named imports
 * from `@mui/joy` in built ESM files and type declarations.
 *
 * Why: Vite resolves directory imports without an explicit extension, but
 * Vitest 4 (and any Node strict ESM resolver) rejects them with
 * `ERR_UNSUPPORTED_DIR_IMPORT`. The published bundles for `@cfast/admin`,
 * `@cfast/forms`, and `@cfast/joy` contain lines like:
 *
 *     import Box from "@mui/joy/Box";
 *
 * which break consumers running Vitest 4. `@mui/joy` re-exports every public
 * component as a named export from its top-level entry, and is marked
 * `sideEffects: false`, so we can safely rewrite the directory imports to:
 *
 *     import { Box } from "@mui/joy";
 *
 * The rewrite is purely textual on the emitted dist files. Source files keep
 * the existing per-component imports for clarity and Joy UI parity.
 *
 * Usage: node scripts/fix-mui-joy-imports.mjs <distDir> [<distDir> ...]
 */

import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

// We rewrite both runtime ESM (`.js`, `.mjs`, `.cjs`) and type declaration
// files (`.d.ts`, `.d.mts`, `.d.cts`). The .d.ts case matters because tsup
// preserves directory paths in emitted types and TypeScript with
// `moduleResolution: "node16" | "nodenext"` follows the ESM resolver, which
// is just as strict as the runtime one.
const RUNTIME_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);

function classifyFile(name) {
  if (name.endsWith(".d.ts") || name.endsWith(".d.mts") || name.endsWith(".d.cts")) {
    return "types";
  }
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot) : "";
  if (RUNTIME_EXTENSIONS.has(ext)) return "runtime";
  return null;
}

// Default import:  import Foo from "@mui/joy/Bar";
const DEFAULT_IMPORT_RE =
  /import\s+([A-Za-z_$][\w$]*)\s+from\s+(["'])@mui\/joy\/([A-Za-z][\w-]*)\2;?/g;

// Type-only default import:  import type Foo from "@mui/joy/Bar";
const TYPE_DEFAULT_IMPORT_RE =
  /import\s+type\s+([A-Za-z_$][\w$]*)\s+from\s+(["'])@mui\/joy\/([A-Za-z][\w-]*)\2;?/g;

// Named import (with or without `type`):
//   import { Foo, Bar as Baz } from "@mui/joy/Quux";
//   import type { Foo } from "@mui/joy/Quux";
const NAMED_IMPORT_RE =
  /import\s+(type\s+)?\{([^}]+)\}\s+from\s+(["'])@mui\/joy\/([A-Za-z][\w-]*)\3;?/g;

// Subpaths we never rewrite — they aren't simple component re-exports.
const SKIP_SUBPATHS = new Set(["styles", "colors"]);

/**
 * @param {string} source
 * @returns {{ output: string; rewrites: number }}
 */
function rewriteSource(source) {
  let rewrites = 0;

  // Default imports — `import Foo from "@mui/joy/Bar"`
  let output = source.replace(DEFAULT_IMPORT_RE, (match, localName, _quote, subpath) => {
    if (SKIP_SUBPATHS.has(subpath)) return match;
    rewrites += 1;
    // Use an aliased named import so the local binding (which tsup may have
    // suffixed for collision avoidance, e.g. `Box8`) keeps working.
    return localName === subpath
      ? `import { ${subpath} } from "@mui/joy";`
      : `import { ${subpath} as ${localName} } from "@mui/joy";`;
  });

  // Type-only default imports — `import type Foo from "@mui/joy/Bar"`
  output = output.replace(TYPE_DEFAULT_IMPORT_RE, (match, localName, _q, subpath) => {
    if (SKIP_SUBPATHS.has(subpath)) return match;
    rewrites += 1;
    return localName === subpath
      ? `import type { ${subpath} } from "@mui/joy";`
      : `import type { ${subpath} as ${localName} } from "@mui/joy";`;
  });

  // Named imports — `import { ButtonProps } from "@mui/joy/Button"`. The
  // named bindings already exist on the top-level entry (`@mui/joy` re-exports
  // `* from './Button'`), so we just point them at the barrel.
  output = output.replace(NAMED_IMPORT_RE, (match, typeKw, names, _q, subpath) => {
    if (SKIP_SUBPATHS.has(subpath)) return match;
    rewrites += 1;
    const prefix = typeKw ? "import type" : "import";
    return `${prefix} {${names}} from "@mui/joy";`;
  });

  return { output, rewrites };
}

/**
 * @param {string} dir
 * @returns {AsyncGenerator<string>}
 */
async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && classifyFile(entry.name) !== null) {
      yield full;
    }
  }
}

/**
 * @param {string} distDir
 */
async function processDist(distDir) {
  const absolute = resolve(distDir);
  let distStat;
  try {
    distStat = await stat(absolute);
  } catch (err) {
    if (err && err.code === "ENOENT") {
      console.error(`fix-mui-joy-imports: dist not found: ${absolute}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
  if (!distStat.isDirectory()) {
    console.error(`fix-mui-joy-imports: not a directory: ${absolute}`);
    process.exitCode = 1;
    return;
  }

  let filesTouched = 0;
  let totalRewrites = 0;
  for await (const file of walk(absolute)) {
    const original = await readFile(file, "utf8");
    const { output, rewrites } = rewriteSource(original);
    if (rewrites > 0 && output !== original) {
      await writeFile(file, output);
      filesTouched += 1;
      totalRewrites += rewrites;
    }
  }

  console.log(
    `fix-mui-joy-imports: ${absolute} — rewrote ${totalRewrites} import(s) across ${filesTouched} file(s)`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: fix-mui-joy-imports.mjs <distDir> [<distDir> ...]");
    process.exit(1);
  }
  for (const dir of args) {
    await processDist(dir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
