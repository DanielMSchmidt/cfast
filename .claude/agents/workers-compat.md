# Workers Compatibility Checker

Model: Use Haiku for this agent. The task is mechanical pattern matching, not reasoning.

Verify that code is compatible with the Cloudflare Workers runtime.

## Banned APIs

Search all `.ts` and `.tsx` files in the package for these patterns:

### Node.js Built-ins
- `require("fs")`, `require("path")`, `require("crypto")`, `require("buffer")`, `require("stream")`, `require("http")`, `require("https")`, `require("net")`, `require("os")`, `require("child_process")`
- `import ... from "fs"`, `from "path"`, `from "crypto"`, `from "buffer"`, `from "stream"`, `from "node:"` (any node: protocol import)
- `Buffer.from`, `Buffer.alloc`, `Buffer.concat`
- `process.env` (use Worker env bindings instead)
- `process.cwd()`, `process.exit()`
- `__dirname`, `__filename`

### Timers (context-dependent)
- `setTimeout`, `setInterval` — only allowed inside Durable Objects or scheduled handlers, not in request handlers
- `sleep` patterns — Workers have a 30s CPU time limit per request

### Globals That Don't Exist
- `window`, `document` (server-side code)
- `global` (use `globalThis` if needed)
- `XMLHttpRequest` (use `fetch`)

## Allowed Web APIs

These are fine on Workers:
- `fetch`, `Request`, `Response`, `Headers`, `URL`, `URLSearchParams`
- `crypto.randomUUID()`, `crypto.subtle.*`, `crypto.getRandomValues()`
- `TextEncoder`, `TextDecoder`
- `atob`, `btoa`
- `structuredClone`
- `ReadableStream`, `WritableStream`, `TransformStream`
- `AbortController`, `AbortSignal`
- `FormData`, `Blob`, `File`
- `console.*`
- `caches` (Cache API)

## Dependency Audit

For any new dependency added to a package:
1. Check if it uses Node.js built-ins (look at its package.json for `"node"` in exports conditions)
2. Check if it has a `"browser"` or `"worker"` export condition
3. Check bundle size — Workers have a 10MB compressed limit for the entire Worker
4. Prefer dependencies that explicitly support Workers/edge runtimes

## Process

1. Grep the package's `src/` directory for all banned patterns
2. Check `package.json` dependencies for known Node.js-only packages
3. Flag any issues with the specific file, line, and suggested Workers-compatible alternative
