# Changelog

## [0.0.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/permissions-v0.0.1...@cfast/permissions-v0.0.2) (2026-03-13)


### Features

* **auth:** fix any types, add handler, migrate example app to @cfast/auth ([1763f07](https://github.com/DanielMSchmidt/cfast/commit/1763f075fcb1ec5536bdcc1019fe41c555277b59))
* **docs:** create documentation website ([#42](https://github.com/DanielMSchmidt/cfast/issues/42)) ([764d4ad](https://github.com/DanielMSchmidt/cfast/commit/764d4ad84afa39943aca21ce23f23edca33f660b))
* **permissions:** add barrel exports for server and client entrypoints ([6ff974f](https://github.com/DanielMSchmidt/cfast/commit/6ff974fe32db3d2f9f1f65eb2d75275a3e55b102))
* **permissions:** add checkPermissions() with structural checking ([857d3ca](https://github.com/DanielMSchmidt/cfast/commit/857d3ca0ede21e0086b6c2422e52dd532e7d2755))
* **permissions:** add core type definitions ([708008b](https://github.com/DanielMSchmidt/cfast/commit/708008ba248ab2fde3cc550009f6e40dea1aadab))
* **permissions:** add definePermissions() with role hierarchy resolution ([867b3e4](https://github.com/DanielMSchmidt/cfast/commit/867b3e4c1b105946c4f892e2a1f68d68748c4876))
* **permissions:** add ForbiddenError class ([5ed54ea](https://github.com/DanielMSchmidt/cfast/commit/5ed54eabd8d80dd4054d6094ff8b6cef80934bf2))
* **permissions:** add grant() factory function ([e539354](https://github.com/DanielMSchmidt/cfast/commit/e539354daaf05f9935f2837cccec0ba20df8f490))
* **permissions:** add resolveGrants() — merge multiple roles into flat grant list ([44eab74](https://github.com/DanielMSchmidt/cfast/commit/44eab74981462895ed34993dd951f51ce6e68404))
* **permissions:** add resolveGrants() for multi-role grant merging ([a0f616b](https://github.com/DanielMSchmidt/cfast/commit/a0f616b1fddd62ab6ae1572bcf02871f486de8f3))


### Bug Fixes

* auth stack, permissions, and e2e test resilience ([619b665](https://github.com/DanielMSchmidt/cfast/commit/619b66548f10b258ce751987ff47f28a37a2725c))
* **permissions:** eliminate `any` from foundation types ([#51](https://github.com/DanielMSchmidt/cfast/issues/51)) ([82940ca](https://github.com/DanielMSchmidt/cfast/commit/82940cabec487837fd76a818c7ca788ae7c59a67))
* **permissions:** use Symbol-based table names and name-based comparison ([55f64fe](https://github.com/DanielMSchmidt/cfast/commit/55f64fe574eb35e3ce979c356755d2989dfffb40))
