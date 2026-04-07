# Changelog

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
