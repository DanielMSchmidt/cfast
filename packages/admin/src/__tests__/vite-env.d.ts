/**
 * Ambient module declaration for Vite/Vitest's `?raw` import query.
 *
 * The admin test suite uses `import source from "./foo.tsx?raw"` to load
 * component source files as strings for static-text assertions (see
 * `components-testids.test.ts`). This keeps us from pulling in
 * `@types/node` just to read a few files off disk.
 *
 * See: https://vitejs.dev/guide/assets.html#importing-asset-as-string
 */
declare module "*?raw" {
  const content: string;
  export default content;
}
