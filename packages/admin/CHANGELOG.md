# Changelog

## [0.6.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.5.0...@cfast/admin-v0.6.0) (2026-04-10)


### Features

* unified permission UI -- cfastJson, useCfastLoader, ActionButton href/input ([#298](https://github.com/DanielMSchmidt/cfast/issues/298)) ([7bc146b](https://github.com/DanielMSchmidt/cfast/commit/7bc146b9133c2087882d36f849a204283572bf77))

## [0.5.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.4.0...@cfast/admin-v0.5.0) (2026-04-10)


### Features

* **db:** schema-driven db.seed() with relational generation ([#279](https://github.com/DanielMSchmidt/cfast/issues/279)) ([4eca18d](https://github.com/DanielMSchmidt/cfast/commit/4eca18da050962d144a09c49eb9a9e183f3317fc))

## [0.4.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.3.2...@cfast/admin-v0.4.0) (2026-04-10)


### Features

* **admin:** add createAdminAuthAdapter to eliminate per-app boilerplate ([#266](https://github.com/DanielMSchmidt/cfast/issues/266)) ([1186296](https://github.com/DanielMSchmidt/cfast/commit/1186296726b8e296ad0f719961a1160f4f4dd6e7)), closes [#241](https://github.com/DanielMSchmidt/cfast/issues/241)
* **db:** expose meta.changes on transaction result after commit ([#272](https://github.com/DanielMSchmidt/cfast/issues/272)) ([326223d](https://github.com/DanielMSchmidt/cfast/commit/326223d18db96d62d7b8da0d224080b2ddb31337))

## [0.3.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.3.1...@cfast/admin-v0.3.2) (2026-04-09)


### Bug Fixes

* **admin:** lazy-load drizzle-orm to fix vitest cold-import timeout ([#233](https://github.com/DanielMSchmidt/cfast/issues/233)) ([4dc5aa2](https://github.com/DanielMSchmidt/cfast/commit/4dc5aa2ab771de3e30bc43bdcdda4382eebb0cc4))
* **admin:** use top-level @mui/joy import for CssVarsProvider ([#229](https://github.com/DanielMSchmidt/cfast/issues/229)) ([0920da1](https://github.com/DanielMSchmidt/cfast/commit/0920da1421af4814b21ba508fa9a6fc08aa43ffa))

## [0.3.1](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.3.0...@cfast/admin-v0.3.1) (2026-04-09)


### Bug Fixes

* **admin:** resolve React 19 hydration mismatch / useContext null warnings ([#225](https://github.com/DanielMSchmidt/cfast/issues/225)) ([4e57402](https://github.com/DanielMSchmidt/cfast/commit/4e57402d8770ea4f07d4a64a90cfc50cec70f125))
* **db:** add clearLookupCache() for stale grant lookup invalidation ([#223](https://github.com/DanielMSchmidt/cfast/issues/223)) ([1cf0a9a](https://github.com/DanielMSchmidt/cfast/commit/1cf0a9a4dfaf7ad351cd23b048b2c66266dc92b2))
* externalise node:sqlite in all vitest configs ([#222](https://github.com/DanielMSchmidt/cfast/issues/222)) ([f7e17bd](https://github.com/DanielMSchmidt/cfast/commit/f7e17bdde09a65d16b9416220b4dd5d9d27559a7))
* widen @cfast/permissions peerDependency range to include 0.5.x ([#219](https://github.com/DanielMSchmidt/cfast/issues/219)) ([2d314ad](https://github.com/DanielMSchmidt/cfast/commit/2d314ad7496aabd287b13b9cd2caeb3a1c9ac205))

## [0.3.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.2.3...@cfast/admin-v0.3.0) (2026-04-08)


### ⚠ BREAKING CHANGES

* **admin:** `RowAction.action` handlers now require a third `ctx` parameter. Add `ctx` to your handler signature even if you don't use it to avoid TS errors:

### Features

* **admin:** row action callbacks receive auth context ([#197](https://github.com/DanielMSchmidt/cfast/issues/197)) ([3d1561c](https://github.com/DanielMSchmidt/cfast/commit/3d1561c8279665f870571949192a23a2aeac3e1e)), closes [#152](https://github.com/DanielMSchmidt/cfast/issues/152) [#179](https://github.com/DanielMSchmidt/cfast/issues/179)
* **db:** ship db.transaction() with callback API (closes [#144](https://github.com/DanielMSchmidt/cfast/issues/144)) ([#199](https://github.com/DanielMSchmidt/cfast/issues/199)) ([b0e1273](https://github.com/DanielMSchmidt/cfast/commit/b0e1273eecfdbf1f2c9fa64219b7e4e0aedff86f))


### Bug Fixes

* **auth,email,admin:** six papercut fixes ([#151](https://github.com/DanielMSchmidt/cfast/issues/151) [#154](https://github.com/DanielMSchmidt/cfast/issues/154) [#155](https://github.com/DanielMSchmidt/cfast/issues/155) [#156](https://github.com/DanielMSchmidt/cfast/issues/156) [#160](https://github.com/DanielMSchmidt/cfast/issues/160) [#161](https://github.com/DanielMSchmidt/cfast/issues/161)) ([#207](https://github.com/DanielMSchmidt/cfast/issues/207)) ([b0b67fa](https://github.com/DanielMSchmidt/cfast/commit/b0b67fa3d144a5a1f57e4fb03c7ca329cf33d9eb))
* convert cross-package @cfast/* deps to peerDependencies (closes [#173](https://github.com/DanielMSchmidt/cfast/issues/173)) ([#200](https://github.com/DanielMSchmidt/cfast/issues/200)) ([bee1d01](https://github.com/DanielMSchmidt/cfast/commit/bee1d01554647281670f270af0b1a92a892b6f08))
* framework debt cleanup bundle ([#211](https://github.com/DanielMSchmidt/cfast/issues/211)) ([d1a8e78](https://github.com/DanielMSchmidt/cfast/commit/d1a8e785ed3b1b317cef43c6dd136fe81c2f2339))

## [0.2.3](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.2.2...@cfast/admin-v0.2.3) (2026-04-07)


### Bug Fixes

* **admin,forms,joy:** rewrite mui directory imports for vitest 4 compatibility ([#133](https://github.com/DanielMSchmidt/cfast/issues/133)) ([0c21d87](https://github.com/DanielMSchmidt/cfast/commit/0c21d8776c4f46895a41aa7196664edd7a0472b3))

## [0.2.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.2.1...@cfast/admin-v0.2.2) (2026-04-07)


### Bug Fixes

* **admin:** republish to fix workspace:* in dependencies ([#120](https://github.com/DanielMSchmidt/cfast/issues/120)) ([ce3a064](https://github.com/DanielMSchmidt/cfast/commit/ce3a06466278912b31ffe24b5f898d2ac97671cd))

## [0.2.1](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.2.0...@cfast/admin-v0.2.1) (2026-04-07)


### Bug Fixes

* **admin, create-cfast:** fix type cast in generated cfast.server.ts and make introspectSchema resilient to non-table exports ([#95](https://github.com/DanielMSchmidt/cfast/issues/95)) ([299c722](https://github.com/DanielMSchmidt/cfast/commit/299c722b932b32245debaffba51f82e7b4a9c8e5))

## [0.2.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.1.0...@cfast/admin-v0.2.0) (2026-03-22)


### Features

* split @cfast/ui into @cfast/ui + @cfast/joy, add passkey sign-up ([#81](https://github.com/DanielMSchmidt/cfast/issues/81)) ([57b682e](https://github.com/DanielMSchmidt/cfast/commit/57b682ec7b2bfe3fbf72d4f3244118021cdcc454))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.0.1...@cfast/admin-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))
* fix OIDC publishing and reset versions for clean 0.1.0 release ([#73](https://github.com/DanielMSchmidt/cfast/issues/73)) ([ea2db2e](https://github.com/DanielMSchmidt/cfast/commit/ea2db2e4dd3b6f53bbc463959e198b46c9171d05))
* upgrade to Node 24 for npm OIDC publishing ([#75](https://github.com/DanielMSchmidt/cfast/issues/75)) ([03fd598](https://github.com/DanielMSchmidt/cfast/commit/03fd59844235d9b1047e8cf996ca4512c2321d19))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.0.1...@cfast/admin-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))
* fix OIDC publishing and reset versions for clean 0.1.0 release ([#73](https://github.com/DanielMSchmidt/cfast/issues/73)) ([ea2db2e](https://github.com/DanielMSchmidt/cfast/commit/ea2db2e4dd3b6f53bbc463959e198b46c9171d05))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/admin-v0.0.1...@cfast/admin-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))
