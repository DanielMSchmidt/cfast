# Changelog

## [0.0.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/db-v0.0.1...@cfast/db-v0.0.2) (2026-03-13)


### Features

* cursor and offset pagination for @cfast/db + @cfast/pagination ([4ba2c44](https://github.com/DanielMSchmidt/cfast/commit/4ba2c44fdcab712b321070e99be43610a9c85014))
* **db:** add core types — Operation, Db, builders, cache config ([ea47934](https://github.com/DanielMSchmidt/cfast/commit/ea47934d8f8229b1d0eb16f400e26c65e4795f10))
* **db:** add pagination types ([77f85c4](https://github.com/DanielMSchmidt/cfast/commit/77f85c483247109319dd33be97f8a319c262811e))
* **db:** cache layer — Cache API + KV backends, table versioning, tag invalidation ([54dbad1](https://github.com/DanielMSchmidt/cfast/commit/54dbad124de9cdc6bca45f7cedce96215ef2b8c9))
* **db:** compose() — merge operations with deduplicated permissions ([54cf7fb](https://github.com/DanielMSchmidt/cfast/commit/54cf7fbbc35c144d0db1de6560b0dffee882e82a))
* **db:** createDb() factory wiring all components together ([6ed6302](https://github.com/DanielMSchmidt/cfast/commit/6ed6302ec5a13f1643f4e1dacd796cdf57c3b581))
* **db:** export parseCursorParams and parseOffsetParams ([83d6863](https://github.com/DanielMSchmidt/cfast/commit/83d6863336d96b21d419e800b0320caa0be5bd0b))
* **db:** mutation builders — insert, update, delete with permission WHERE injection ([8a65682](https://github.com/DanielMSchmidt/cfast/commit/8a65682d3753db29bb5273df27e78c320ea04c8d))
* **db:** paginate method on QueryBuilder ([1be484c](https://github.com/DanielMSchmidt/cfast/commit/1be484ce3365c7aae5fb0053853919e89eef73e1))
* **db:** paginate method on QueryBuilder ([03fa9ba](https://github.com/DanielMSchmidt/cfast/commit/03fa9ba40198d97034f28daedd7d70ea0ac889bd))
* **db:** param parsers and cursor encoding ([e2f8587](https://github.com/DanielMSchmidt/cfast/commit/e2f8587325651f74603bf4e4e53f8947fb19a035))
* **db:** permission compilation — resolve grants to WHERE clauses ([cf902e1](https://github.com/DanielMSchmidt/cfast/commit/cf902e10b3248d0e76ecdbdddc205158561426cb))
* **db:** query builder — db.query(table).findMany/findFirst ([5081e9c](https://github.com/DanielMSchmidt/cfast/commit/5081e9c6030c1141efaebe448bcc3a96592ffa73))
* **db:** scaffold package with test helpers and dev deps ([be19167](https://github.com/DanielMSchmidt/cfast/commit/be19167edc1488871c1ab15d5d5f2d4d0e3e3159))
* **docs:** create documentation website ([#42](https://github.com/DanielMSchmidt/cfast/issues/42)) ([764d4ad](https://github.com/DanielMSchmidt/cfast/commit/764d4ad84afa39943aca21ce23f23edca33f660b))
* **example:** replace manual admin routes with createAdmin() ([92c14da](https://github.com/DanielMSchmidt/cfast/commit/92c14dad7c23bc154ca9c7a91086db6d3f66f2c9))


### Bug Fixes

* add prevention improvements for auth, email, and db issues ([a43181a](https://github.com/DanielMSchmidt/cfast/commit/a43181a5add9539b6db60e1d730ee80d25a5c350))
* auth stack, permissions, and e2e test resilience ([619b665](https://github.com/DanielMSchmidt/cfast/commit/619b66548f10b258ce751987ff47f28a37a2725c))
* **db:** add @cloudflare/workers-types for D1Database type ([f7b62a4](https://github.com/DanielMSchmidt/cfast/commit/f7b62a4d7e3b57a864fabf728d5e283da5f4de1a))
* **db:** remove `any` casts from utils, query-builder, and mutate-builder ([#49](https://github.com/DanielMSchmidt/cfast/issues/49)) ([d82ae28](https://github.com/DanielMSchmidt/cfast/commit/d82ae288563abec3ac67c6efe61090485d6231be))
* **pagination:** address code review findings ([560b8ff](https://github.com/DanielMSchmidt/cfast/commit/560b8ff50e96990af3b91c3a2ba3e5d52a33437b))
* **permissions:** use Symbol-based table names and name-based comparison ([55f64fe](https://github.com/DanielMSchmidt/cfast/commit/55f64fe574eb35e3ce979c356755d2989dfffb40))
