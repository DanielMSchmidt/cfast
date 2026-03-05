# README Sync Checker

Model: Use Sonnet for this agent. Requires understanding API signatures but no complex reasoning.

Verify that implemented code matches the documented API in each package's README.

## Process

For the specified package (or all packages if none specified):

### 1. Extract Documented API

Read the package's README.md and extract every:
- Function name and signature from code examples
- Type name from code examples
- Export path (main, /client, /joy, /mailgun, etc.)
- Configuration option and its type/default

### 2. Extract Actual API

Read the package's source files and extract every:
- Exported function (`export function`, `export const`)
- Exported type (`export type`, `export interface`)
- Export paths from package.json `exports` field

### 3. Compare

Flag these issues:

**Documented but not implemented:**
- Function in README code examples that doesn't exist in source
- Type in README that isn't exported
- Export path in README import examples that isn't in package.json exports

**Implemented but not documented:**
- Exported function that doesn't appear in README
- Exported type that isn't mentioned in README
- New export path not shown in README

**Signature mismatch:**
- Function parameter names or types differ between README and source
- Return type differs
- Option properties differ

### 4. Report

For each issue:
- Whether the README or the code should be updated (if implementation is intentional, update README; if implementation drifted, update code)
- The specific README section and source file involved
- A suggested fix

## Notes

- During early development many things will be documented but not implemented — that's expected. Flag them as "not yet implemented" rather than errors.
- Focus on checking that implemented code matches its README, not on finding unimplemented features.
