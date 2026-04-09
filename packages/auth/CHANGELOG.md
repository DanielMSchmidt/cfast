# Changelog

## [0.4.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.4.1...@cfast/auth-v0.4.2) (2026-04-09)


### Bug Fixes

* externalise node:sqlite in all vitest configs ([#222](https://github.com/DanielMSchmidt/cfast/issues/222)) ([f7e17bd](https://github.com/DanielMSchmidt/cfast/commit/f7e17bdde09a65d16b9416220b4dd5d9d27559a7))
* widen @cfast/permissions peerDependency range to include 0.5.x ([#219](https://github.com/DanielMSchmidt/cfast/issues/219)) ([2d314ad](https://github.com/DanielMSchmidt/cfast/commit/2d314ad7496aabd287b13b9cd2caeb3a1c9ac205))

## [0.4.1](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.4.0...@cfast/auth-v0.4.1) (2026-04-08)


### Bug Fixes

* **auth:** normalize passkey credentialId to standard base64 for CDP ([#212](https://github.com/DanielMSchmidt/cfast/issues/212)) ([1d8dab9](https://github.com/DanielMSchmidt/cfast/commit/1d8dab9e83c68b6382246881df8e7b1023555aae)), closes [#210](https://github.com/DanielMSchmidt/cfast/issues/210)

## [0.4.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.3.0...@cfast/auth-v0.4.0) (2026-04-08)


### Features

* **auth:** passkey test helper via Playwright virtual authenticator (closes [#178](https://github.com/DanielMSchmidt/cfast/issues/178)) ([#206](https://github.com/DanielMSchmidt/cfast/issues/206)) ([e77c542](https://github.com/DanielMSchmidt/cfast/commit/e77c542749db9202a95e4f22ce8357c0323d53a2))


### Bug Fixes

* **auth,email,admin:** six papercut fixes ([#151](https://github.com/DanielMSchmidt/cfast/issues/151) [#154](https://github.com/DanielMSchmidt/cfast/issues/154) [#155](https://github.com/DanielMSchmidt/cfast/issues/155) [#156](https://github.com/DanielMSchmidt/cfast/issues/156) [#160](https://github.com/DanielMSchmidt/cfast/issues/160) [#161](https://github.com/DanielMSchmidt/cfast/issues/161)) ([#207](https://github.com/DanielMSchmidt/cfast/issues/207)) ([b0b67fa](https://github.com/DanielMSchmidt/cfast/commit/b0b67fa3d144a5a1f57e4fb03c7ca329cf33d9eb))
* **auth:** ship impersonation_logs schema + graceful fallback when table missing (closes [#172](https://github.com/DanielMSchmidt/cfast/issues/172)) ([#203](https://github.com/DanielMSchmidt/cfast/issues/203)) ([5d968a3](https://github.com/DanielMSchmidt/cfast/commit/5d968a3f5adf2afbd1817402c5716e09bdbbd4a0))
* convert cross-package @cfast/* deps to peerDependencies (closes [#173](https://github.com/DanielMSchmidt/cfast/issues/173)) ([#200](https://github.com/DanielMSchmidt/cfast/issues/200)) ([bee1d01](https://github.com/DanielMSchmidt/cfast/commit/bee1d01554647281670f270af0b1a92a892b6f08))

## [0.3.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.2.2...@cfast/auth-v0.3.0) (2026-04-07)


### Features

* **auth:** ship test-helpers subpath with real-workflow session helpers ([#139](https://github.com/DanielMSchmidt/cfast/issues/139)) ([6eb311e](https://github.com/DanielMSchmidt/cfast/commit/6eb311e7dff68605a3f4b1f347286a957e6fe6ac)), closes [#101](https://github.com/DanielMSchmidt/cfast/issues/101)

## [0.2.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.2.1...@cfast/auth-v0.2.2) (2026-04-07)


### Bug Fixes

* **auth:** republish to fix workspace:* in dependencies ([#121](https://github.com/DanielMSchmidt/cfast/issues/121)) ([915f031](https://github.com/DanielMSchmidt/cfast/commit/915f03198c0b36282ddbb02dc2c66da55067cfca))

## [0.2.1](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.2.0...@cfast/auth-v0.2.1) (2026-04-07)


### Bug Fixes

* **auth:** align passkeys schema with Better Auth expected field names ([#85](https://github.com/DanielMSchmidt/cfast/issues/85)) ([751f6aa](https://github.com/DanielMSchmidt/cfast/commit/751f6aa78e8bd4c25a026221b94382b2d826da7b))

## [0.2.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.1.0...@cfast/auth-v0.2.0) (2026-03-22)


### Features

* split @cfast/ui into @cfast/ui + @cfast/joy, add passkey sign-up ([#81](https://github.com/DanielMSchmidt/cfast/issues/81)) ([57b682e](https://github.com/DanielMSchmidt/cfast/commit/57b682ec7b2bfe3fbf72d4f3244118021cdcc454))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.0.3...@cfast/auth-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))
* fix OIDC publishing and reset versions for clean 0.1.0 release ([#73](https://github.com/DanielMSchmidt/cfast/issues/73)) ([ea2db2e](https://github.com/DanielMSchmidt/cfast/commit/ea2db2e4dd3b6f53bbc463959e198b46c9171d05))
* upgrade to Node 24 for npm OIDC publishing ([#75](https://github.com/DanielMSchmidt/cfast/issues/75)) ([03fd598](https://github.com/DanielMSchmidt/cfast/commit/03fd59844235d9b1047e8cf996ca4512c2321d19))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.0.3...@cfast/auth-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))
* fix OIDC publishing and reset versions for clean 0.1.0 release ([#73](https://github.com/DanielMSchmidt/cfast/issues/73)) ([ea2db2e](https://github.com/DanielMSchmidt/cfast/commit/ea2db2e4dd3b6f53bbc463959e198b46c9171d05))

## [0.1.0](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.0.3...@cfast/auth-v0.1.0) (2026-03-21)


### Features

* add npm keywords and fix release config ([#71](https://github.com/DanielMSchmidt/cfast/issues/71)) ([7add687](https://github.com/DanielMSchmidt/cfast/commit/7add687e8713fd8f409455aa71631f59a11fc3fa))

## [0.0.3](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.0.2...@cfast/auth-v0.0.3) (2026-03-21)


### Features

* add can(), composeSequential, ActionForm, createAdminAuth ([#64](https://github.com/DanielMSchmidt/cfast/issues/64)) ([5abe7b5](https://github.com/DanielMSchmidt/cfast/commit/5abe7b5dda8aa167b6228151781a997012276087))

## [0.0.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.0.1...@cfast/auth-v0.0.2) (2026-03-21)


### Features

* add can(), composeSequential, ActionForm, createAdminAuth ([#64](https://github.com/DanielMSchmidt/cfast/issues/64)) ([5abe7b5](https://github.com/DanielMSchmidt/cfast/commit/5abe7b5dda8aa167b6228151781a997012276087))
