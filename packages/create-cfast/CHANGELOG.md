# Changelog

## [0.3.3](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.3.2...create-cfast-v0.3.3) (2026-04-10)


### Bug Fixes

* update create-cfast test snapshots ([#276](https://github.com/DanielMSchmidt/cfast/issues/276)) ([d4a4c34](https://github.com/DanielMSchmidt/cfast/commit/d4a4c34fff4f4cf518c0247a220deaa149b93972))

## [0.3.2](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.3.1...create-cfast-v0.3.2) (2026-04-09)


### Bug Fixes

* **admin:** lazy-load drizzle-orm to fix vitest cold-import timeout ([#233](https://github.com/DanielMSchmidt/cfast/issues/233)) ([4dc5aa2](https://github.com/DanielMSchmidt/cfast/commit/4dc5aa2ab771de3e30bc43bdcdda4382eebb0cc4))

## [0.3.1](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.3.0...create-cfast-v0.3.1) (2026-04-09)


### Bug Fixes

* externalise node:sqlite in all vitest configs ([#222](https://github.com/DanielMSchmidt/cfast/issues/222)) ([f7e17bd](https://github.com/DanielMSchmidt/cfast/commit/f7e17bdde09a65d16b9416220b4dd5d9d27559a7))

## [0.3.0](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.2.2...create-cfast-v0.3.0) (2026-04-08)


### Features

* **create-cfast:** scaffold template improvements bundle ([#210](https://github.com/DanielMSchmidt/cfast/issues/210)) ([154d8df](https://github.com/DanielMSchmidt/cfast/commit/154d8df5bdcae673482245d5477f56977ae29962))
* **create-cfast:** ship local-first e2e smoke spec template ([#167](https://github.com/DanielMSchmidt/cfast/issues/167)) ([11c358d](https://github.com/DanielMSchmidt/cfast/commit/11c358d7adac1e5632a5e54bdcea065b80df06de))
* **create-cfast:** validate template smoke spec works against fresh scaffolds ([#171](https://github.com/DanielMSchmidt/cfast/issues/171)) ([06807ce](https://github.com/DanielMSchmidt/cfast/commit/06807cef70761fe3f25b4b7239de9008eb08da92))


### Bug Fixes

* **auth,email,admin:** six papercut fixes ([#151](https://github.com/DanielMSchmidt/cfast/issues/151) [#154](https://github.com/DanielMSchmidt/cfast/issues/154) [#155](https://github.com/DanielMSchmidt/cfast/issues/155) [#156](https://github.com/DanielMSchmidt/cfast/issues/156) [#160](https://github.com/DanielMSchmidt/cfast/issues/160) [#161](https://github.com/DanielMSchmidt/cfast/issues/161)) ([#207](https://github.com/DanielMSchmidt/cfast/issues/207)) ([b0b67fa](https://github.com/DanielMSchmidt/cfast/commit/b0b67fa3d144a5a1f57e4fb03c7ca329cf33d9eb))
* convert cross-package @cfast/* deps to peerDependencies (closes [#173](https://github.com/DanielMSchmidt/cfast/issues/173)) ([#200](https://github.com/DanielMSchmidt/cfast/issues/200)) ([bee1d01](https://github.com/DanielMSchmidt/cfast/commit/bee1d01554647281670f270af0b1a92a892b6f08))
* **create-cfast:** prepend wrangler types to typecheck script so fresh checkouts work (closes [#174](https://github.com/DanielMSchmidt/cfast/issues/174)) ([#202](https://github.com/DanielMSchmidt/cfast/issues/202)) ([1ccd158](https://github.com/DanielMSchmidt/cfast/commit/1ccd158fced49567eeb855e90ba3ccf5303af651))
* **create-cfast:** prevent orphaned route files via docs + Vite plugin warning ([#170](https://github.com/DanielMSchmidt/cfast/issues/170)) ([ce4b6d0](https://github.com/DanielMSchmidt/cfast/commit/ce4b6d002d1438468b9e7387c5aa587501a83b3c))
* **create-cfast:** use fileURLToPath for __dirname in e2e smoke spec ([#169](https://github.com/DanielMSchmidt/cfast/issues/169)) ([6c237da](https://github.com/DanielMSchmidt/cfast/commit/6c237da960c78fb69a7680ad8c09bbae78d5bbab))
* framework debt cleanup bundle ([#211](https://github.com/DanielMSchmidt/cfast/issues/211)) ([d1a8e78](https://github.com/DanielMSchmidt/cfast/commit/d1a8e785ed3b1b317cef43c6dd136fe81c2f2339))

## [0.2.2](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.2.1...create-cfast-v0.2.2) (2026-04-07)


### Bug Fixes

* **core:** plugin context inference and runtime dependency validation ([#134](https://github.com/DanielMSchmidt/cfast/issues/134)) ([5a8e9aa](https://github.com/DanielMSchmidt/cfast/commit/5a8e9aa18456d804f80075a12b2de7009f1bdc70)), closes [#110](https://github.com/DanielMSchmidt/cfast/issues/110)
* **create-cfast:** template fixes from demo app dogfooding ([#132](https://github.com/DanielMSchmidt/cfast/issues/132)) ([d17746c](https://github.com/DanielMSchmidt/cfast/commit/d17746c72d2c6ad50871bbafabacd4ae387c8a1b))
* document self-referential FK pattern and @cfast/env API key bindings ([#130](https://github.com/DanielMSchmidt/cfast/issues/130)) ([6338b5d](https://github.com/DanielMSchmidt/cfast/commit/6338b5dabef54d377479f11258fec9143bf58be6))

## [0.2.1](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.2.0...create-cfast-v0.2.1) (2026-04-07)


### Bug Fixes

* **admin, create-cfast:** fix type cast in generated cfast.server.ts and make introspectSchema resilient to non-table exports ([#95](https://github.com/DanielMSchmidt/cfast/issues/95)) ([299c722](https://github.com/DanielMSchmidt/cfast/commit/299c722b932b32245debaffba51f82e7b4a9c8e5))
* **auth:** align passkeys schema with Better Auth expected field names ([#85](https://github.com/DanielMSchmidt/cfast/issues/85)) ([751f6aa](https://github.com/DanielMSchmidt/cfast/commit/751f6aa78e8bd4c25a026221b94382b2d826da7b))

## [0.2.0](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.1.0...create-cfast-v0.2.0) (2026-03-22)


### Features

* split @cfast/ui into @cfast/ui + @cfast/joy, add passkey sign-up ([#81](https://github.com/DanielMSchmidt/cfast/issues/81)) ([57b682e](https://github.com/DanielMSchmidt/cfast/commit/57b682ec7b2bfe3fbf72d4f3244118021cdcc454))


### Bug Fixes

* **create-cfast:** fix broken admin template imports and add scaffold build tests ([#82](https://github.com/DanielMSchmidt/cfast/issues/82)) ([54d4a97](https://github.com/DanielMSchmidt/cfast/commit/54d4a97b9a1695fe65cf75f9ac215cfb139b83ae))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.0.4...create-cfast-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))
* fix OIDC publishing and reset versions for clean 0.1.0 release ([#73](https://github.com/DanielMSchmidt/cfast/issues/73)) ([ea2db2e](https://github.com/DanielMSchmidt/cfast/commit/ea2db2e4dd3b6f53bbc463959e198b46c9171d05))
* upgrade to Node 24 for npm OIDC publishing ([#75](https://github.com/DanielMSchmidt/cfast/issues/75)) ([03fd598](https://github.com/DanielMSchmidt/cfast/commit/03fd59844235d9b1047e8cf996ca4512c2321d19))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.0.4...create-cfast-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))
* fix OIDC publishing and reset versions for clean 0.1.0 release ([#73](https://github.com/DanielMSchmidt/cfast/issues/73)) ([ea2db2e](https://github.com/DanielMSchmidt/cfast/commit/ea2db2e4dd3b6f53bbc463959e198b46c9171d05))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.0.4...create-cfast-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))

## [0.0.4](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.0.3...create-cfast-v0.0.4) (2026-03-21)


### Bug Fixes

* trigger create-cfast release and document commit conventions ([#68](https://github.com/DanielMSchmidt/cfast/issues/68)) ([345aa1b](https://github.com/DanielMSchmidt/cfast/commit/345aa1b4a8113a7bed78290652a2ede01c425f81))

## [0.0.3](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.0.2...create-cfast-v0.0.3) (2026-03-14)


### Bug Fixes

* add publishConfig to create-cfast for npm OIDC publishing ([6c3432c](https://github.com/DanielMSchmidt/cfast/commit/6c3432cfeeb9681a0228c76c70490e65d705e4e1))
* integrate @cfast/email in scaffolded auth setup ([#57](https://github.com/DanielMSchmidt/cfast/issues/57)) ([9f15c77](https://github.com/DanielMSchmidt/cfast/commit/9f15c77e2a60b401291fcf1096c9b51fedff20ff))

## [0.0.2](https://github.com/DanielMSchmidt/cfast/compare/create-cfast-v0.0.1...create-cfast-v0.0.2) (2026-03-14)


### Bug Fixes

* integrate @cfast/email in scaffolded auth setup ([#57](https://github.com/DanielMSchmidt/cfast/issues/57)) ([9f15c77](https://github.com/DanielMSchmidt/cfast/commit/9f15c77e2a60b401291fcf1096c9b51fedff20ff))
