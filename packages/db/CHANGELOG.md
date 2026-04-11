# Changelog

## [0.8.1](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.8.0...@cfast/db-v0.8.1) (2026-04-11)


### Bug Fixes

* widen @cfast/* peer dependency ranges to &lt;1.0.0 ([#303](https://github.com/DanielMSchmidt/cfast/issues/303)) ([defcda3](https://github.com/DanielMSchmidt/cfast/commit/defcda3881c07f27e373e7cfd96da359d695ef7a)), closes [#302](https://github.com/DanielMSchmidt/cfast/issues/302)

## [0.8.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.7.0...@cfast/db-v0.8.0) (2026-04-10)


### Features

* unified permission UI -- cfastJson, useCfastLoader, ActionButton href/input ([#298](https://github.com/DanielMSchmidt/cfast/issues/298)) ([7bc146b](https://github.com/DanielMSchmidt/cfast/commit/7bc146b9133c2087882d36f849a204283572bf77))

## [0.7.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.6.0...@cfast/db-v0.7.0) (2026-04-10)


### Features

* **db:** add .seed() method API on column builders and table wrapper ([#285](https://github.com/DanielMSchmidt/cfast/issues/285)) ([88c7788](https://github.com/DanielMSchmidt/cfast/commit/88c778891a00d647089eeec8188ea1cdc3c5687f))

## [0.6.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.5.0...@cfast/db-v0.6.0) (2026-04-10)


### Features

* **db:** add row-level _can annotations ([#270](https://github.com/DanielMSchmidt/cfast/issues/270)) ([#280](https://github.com/DanielMSchmidt/cfast/issues/280)) ([2c570df](https://github.com/DanielMSchmidt/cfast/commit/2c570dfdda5323dff8ccf57ca0c579d7b7bc2dfd))
* **db:** schema-driven db.seed() with relational generation ([#279](https://github.com/DanielMSchmidt/cfast/issues/279)) ([4eca18d](https://github.com/DanielMSchmidt/cfast/commit/4eca18da050962d144a09c49eb9a9e183f3317fc))

## [0.5.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.4.1...@cfast/db-v0.5.0) (2026-04-10)


### Features

* **@cfast/db:** auto-infer .with() result types ([#271](https://github.com/DanielMSchmidt/cfast/issues/271)) ([8d90d3c](https://github.com/DanielMSchmidt/cfast/commit/8d90d3caa492871743efcbfd11cb802c4eaa5bd7))
* **db:** add toJSON() for automatic Date-to-ISO-string conversion ([#273](https://github.com/DanielMSchmidt/cfast/issues/273)) ([ffe1399](https://github.com/DanielMSchmidt/cfast/commit/ffe1399c8fd7de6a6254447143d671aa910cf173)), closes [#242](https://github.com/DanielMSchmidt/cfast/issues/242)
* **db:** expose meta.changes on transaction result after commit ([#272](https://github.com/DanielMSchmidt/cfast/issues/272)) ([326223d](https://github.com/DanielMSchmidt/cfast/commit/326223d18db96d62d7b8da0d224080b2ddb31337))

## [0.4.1](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.4.0...@cfast/db-v0.4.1) (2026-04-09)


### Bug Fixes

* **actions:** add dispatch() to forward parent context to sub-actions ([#224](https://github.com/DanielMSchmidt/cfast/issues/224)) ([512ecb7](https://github.com/DanielMSchmidt/cfast/commit/512ecb72f5ade401d461ba00c0544ff26e5a96a6))
* **admin:** resolve React 19 hydration mismatch / useContext null warnings ([#225](https://github.com/DanielMSchmidt/cfast/issues/225)) ([4e57402](https://github.com/DanielMSchmidt/cfast/commit/4e57402d8770ea4f07d4a64a90cfc50cec70f125))
* **db:** add clearLookupCache() for stale grant lookup invalidation ([#223](https://github.com/DanielMSchmidt/cfast/issues/223)) ([1cf0a9a](https://github.com/DanielMSchmidt/cfast/commit/1cf0a9a4dfaf7ad351cd23b048b2c66266dc92b2))
* externalise node:sqlite in all vitest configs ([#222](https://github.com/DanielMSchmidt/cfast/issues/222)) ([f7e17bd](https://github.com/DanielMSchmidt/cfast/commit/f7e17bdde09a65d16b9416220b4dd5d9d27559a7))
* widen @cfast/permissions peerDependency range to include 0.5.x ([#219](https://github.com/DanielMSchmidt/cfast/issues/219)) ([2d314ad](https://github.com/DanielMSchmidt/cfast/commit/2d314ad7496aabd287b13b9cd2caeb3a1c9ac205))

## [0.4.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.3.0...@cfast/db-v0.4.0) (2026-04-08)


### Features

* **create-cfast:** scaffold template improvements bundle ([#210](https://github.com/DanielMSchmidt/cfast/issues/210)) ([154d8df](https://github.com/DanielMSchmidt/cfast/commit/154d8df5bdcae673482245d5477f56977ae29962))
* **db:** ship db.transaction() with callback API (closes [#144](https://github.com/DanielMSchmidt/cfast/issues/144)) ([#199](https://github.com/DanielMSchmidt/cfast/issues/199)) ([b0e1273](https://github.com/DanielMSchmidt/cfast/commit/b0e1273eecfdbf1f2c9fa64219b7e4e0aedff86f))


### Bug Fixes

* convert cross-package @cfast/* deps to peerDependencies (closes [#173](https://github.com/DanielMSchmidt/cfast/issues/173)) ([#200](https://github.com/DanielMSchmidt/cfast/issues/200)) ([bee1d01](https://github.com/DanielMSchmidt/cfast/commit/bee1d01554647281670f270af0b1a92a892b6f08))
* framework debt cleanup bundle ([#211](https://github.com/DanielMSchmidt/cfast/issues/211)) ([d1a8e78](https://github.com/DanielMSchmidt/cfast/commit/d1a8e785ed3b1b317cef43c6dd136fe81c2f2339))

## [0.3.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.2.0...@cfast/db-v0.3.0) (2026-04-07)


### Features

* **permissions,db:** support cross-table grant lookups via with (closes [#105](https://github.com/DanielMSchmidt/cfast/issues/105)) ([#141](https://github.com/DanielMSchmidt/cfast/issues/141)) ([2908f3a](https://github.com/DanielMSchmidt/cfast/commit/2908f3a87a93e2bf21a2306656baabf3303a199a))

## [0.2.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.1.1...@cfast/db-v0.2.0) (2026-04-07)


### Features

* **db:** fill 6 gaps — schema cast, single-op, callback compose, row types, offset/limit, atomic batch ([#138](https://github.com/DanielMSchmidt/cfast/issues/138)) ([092ca9a](https://github.com/DanielMSchmidt/cfast/commit/092ca9aabfdbcbbc4a70b7bfd4d807ac1402a401))
* **permissions:** user-object resolveGrants and string table subjects ([#137](https://github.com/DanielMSchmidt/cfast/issues/137)) ([79018b4](https://github.com/DanielMSchmidt/cfast/commit/79018b44c2bc2d0fc54eeed38c1297f9c8bf1fb8))


### Bug Fixes

* document self-referential FK pattern and @cfast/env API key bindings ([#130](https://github.com/DanielMSchmidt/cfast/issues/130)) ([6338b5d](https://github.com/DanielMSchmidt/cfast/commit/6338b5dabef54d377479f11258fec9143bf58be6))

## [0.1.1](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.1.0...@cfast/db-v0.1.1) (2026-04-07)


### Bug Fixes

* **db:** republish to fix workspace:* in dependencies ([#123](https://github.com/DanielMSchmidt/cfast/issues/123)) ([069877e](https://github.com/DanielMSchmidt/cfast/commit/069877ed5f5657cd848534cf7b212891cf3573a9))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.0.3...@cfast/db-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))
* fix OIDC publishing and reset versions for clean 0.1.0 release ([#73](https://github.com/DanielMSchmidt/cfast/issues/73)) ([ea2db2e](https://github.com/DanielMSchmidt/cfast/commit/ea2db2e4dd3b6f53bbc463959e198b46c9171d05))
* upgrade to Node 24 for npm OIDC publishing ([#75](https://github.com/DanielMSchmidt/cfast/issues/75)) ([03fd598](https://github.com/DanielMSchmidt/cfast/commit/03fd59844235d9b1047e8cf996ca4512c2321d19))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.0.3...@cfast/db-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))
* fix OIDC publishing and reset versions for clean 0.1.0 release ([#73](https://github.com/DanielMSchmidt/cfast/issues/73)) ([ea2db2e](https://github.com/DanielMSchmidt/cfast/commit/ea2db2e4dd3b6f53bbc463959e198b46c9171d05))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.0.3...@cfast/db-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))

## [0.0.3](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.0.2...@cfast/db-v0.0.3) (2026-03-21)


### Features

* add can(), composeSequential, ActionForm, createAdminAuth ([#64](https://github.com/DanielMSchmidt/cfast/issues/64)) ([5abe7b5](https://github.com/DanielMSchmidt/cfast/commit/5abe7b5dda8aa167b6228151781a997012276087))

## [0.0.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.0.1...@cfast/db-v0.0.2) (2026-03-21)


### Features

* add can(), composeSequential, ActionForm, createAdminAuth ([#64](https://github.com/DanielMSchmidt/cfast/issues/64)) ([5abe7b5](https://github.com/DanielMSchmidt/cfast/commit/5abe7b5dda8aa167b6228151781a997012276087))
