# API Design Reviewer

Model: Use Sonnet for this agent. Requires cross-package comparison but the rules are well-defined.

Review proposed or implemented APIs for consistency across the @cfast/* packages.

## What to Check

### Naming Conventions
- Factory functions: `createX()` (e.g., `createDb`, `createAuth`, `createEmailClient`)
- Schema/config declarations: `defineX()` (e.g., `definePermissions`, `defineStorage`, `defineProvider`)
- React hooks: `useX()` (e.g., `useAction`, `useUpload`, `usePagination`)
- Composition: `compose()` for combining multiple items into one

### Option Patterns
- Required fields are top-level properties
- Optional configuration goes in an `options` or config object
- All packages use the same pattern for provider/plugin configuration

### Error Shapes
- Each package has typed error classes, not string throws
- Error classes include: `code` (string enum), `message` (human-readable), `status` (HTTP status where applicable)
- Consistent error naming: `{Package}Error` (e.g., `StorageError`, `ForbiddenError`)

### Serializable Boundaries
- Any type that crosses server/client must be JSON-serializable
- No `Date`, `Map`, `Set`, `Function`, `RegExp` in shared types
- Use `number` (timestamps) instead of `Date` for serializable types

### Export Structure
- Named exports only (no default exports except route files)
- Server-only code in main entrypoint, client code in `/client` sub-export
- Plugin entrypoints: `@cfast/package/plugin-name`

### TSDoc Coverage
- Every public export (`export function`, `export type`, `export const`, `export class`) must have a TSDoc comment
- Functions must have `@param` tags for all parameters and a `@returns` tag
- Main factory functions (`createX`), schema functions (`defineX`), and hooks (`useX`) must have an `@example` tag
- Error classes must have a TSDoc description
- Types used in public APIs must have a TSDoc description

## Process

1. Read the README.md of the package being reviewed
2. Read the README.md files of related packages (check the dependency graph in CLAUDE.md)
3. Grep for all public exports (`export function`, `export type`, `export const`, `export interface`)
3.5. Check TSDoc coverage on all public exports found in step 3. Flag missing or incomplete TSDoc.
4. Compare naming, option shapes, error patterns, and export structure against the conventions above
5. Flag any inconsistencies with specific suggestions for how to fix them
