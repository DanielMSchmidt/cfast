# Changelog

## [0.0.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/auth-v0.0.1...@cfast/auth-v0.0.2) (2026-03-13)


### Features

* **auth:** add client components — AuthProvider, useCurrentUser, createAuthClient ([ced4876](https://github.com/DanielMSchmidt/cfast/commit/ced48764d730f90c01854849383dd9c1c2d03cda))
* **auth:** add createAuthRouteHandlers for React Router integration ([babe153](https://github.com/DanielMSchmidt/cfast/commit/babe153f7b18b42f3e47020633c16b16435d33d0))
* **auth:** close README-to-implementation gaps ([#38](https://github.com/DanielMSchmidt/cfast/issues/38)) ([0a5231d](https://github.com/DanielMSchmidt/cfast/commit/0a5231dcec43393929e662527b2953f6873dca39))
* **auth:** complete @cfast/auth — schema, components, roles, impersonation ([#37](https://github.com/DanielMSchmidt/cfast/issues/37)) ([51c0062](https://github.com/DanielMSchmidt/cfast/commit/51c0062f8874246a8232d74bf1d46d2694d39546))
* **auth:** fix any types, add handler, migrate example app to @cfast/auth ([1763f07](https://github.com/DanielMSchmidt/cfast/commit/1763f075fcb1ec5536bdcc1019fe41c555277b59))
* **auth:** scaffold createAuth, createContext, requireUser, and role manager ([97d5719](https://github.com/DanielMSchmidt/cfast/commit/97d57199c5cd78e0c1b038759f3cae7681aa9020))
* **auth:** scaffold types, roles, createAuth, createContext ([eb7c24e](https://github.com/DanielMSchmidt/cfast/commit/eb7c24eae63597f63fd31209938a306acea95dfe))
* **auth:** wire Better Auth into createAuth with session lookup ([c6fece5](https://github.com/DanielMSchmidt/cfast/commit/c6fece5fd0f7466373065170f6fa02c7206b732a))
* **auth:** wire Better Auth with session lookup and role resolution ([30a5946](https://github.com/DanielMSchmidt/cfast/commit/30a59465d4e9157cc93f4abd75e555df594c6e1d))
* **docs:** create documentation website ([#42](https://github.com/DanielMSchmidt/cfast/issues/42)) ([764d4ad](https://github.com/DanielMSchmidt/cfast/commit/764d4ad84afa39943aca21ce23f23edca33f660b))
* **example:** replace manual admin routes with createAdmin() ([92c14da](https://github.com/DanielMSchmidt/cfast/commit/92c14dad7c23bc154ca9c7a91086db6d3f66f2c9))


### Bug Fixes

* add prevention improvements for auth, email, and db issues ([a43181a](https://github.com/DanielMSchmidt/cfast/commit/a43181a5add9539b6db60e1d730ee80d25a5c350))
* auth stack, permissions, and e2e test resilience ([619b665](https://github.com/DanielMSchmidt/cfast/commit/619b66548f10b258ce751987ff47f28a37a2725c))
* **auth:** pass Drizzle schema to Better Auth adapter ([4c8e9d3](https://github.com/DanielMSchmidt/cfast/commit/4c8e9d3f72f75e37e00d66938139df3df40f8752))
* **auth:** replace `as` casts with proper narrowing and documented API boundary ([637e7ea](https://github.com/DanielMSchmidt/cfast/commit/637e7ea3fca8a4da3dc06564836b8b5089329b4e))
* **auth:** use 'roles' table name instead of hardcoded 'cfast_roles' ([599268e](https://github.com/DanielMSchmidt/cfast/commit/599268e4435660f4350bcd35a578736349eca330))
