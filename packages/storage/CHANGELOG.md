# Changelog

## [0.0.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/storage-v0.0.1...@cfast/storage-v0.0.2) (2026-03-13)


### Features

* **docs:** create documentation website ([#42](https://github.com/DanielMSchmidt/cfast/issues/42)) ([764d4ad](https://github.com/DanielMSchmidt/cfast/commit/764d4ad84afa39943aca21ce23f23edca33f660b))
* **storage:** add types and StorageError class ([534d2d3](https://github.com/DanielMSchmidt/cfast/commit/534d2d331a453d89a063b8e0b5dc1b7a12db84b4))
* **storage:** file serving and HMAC signed URLs ([9bf90f6](https://github.com/DanielMSchmidt/cfast/commit/9bf90f6f3a843f40f31a8a2a406766bae8b39740))
* **storage:** handle orchestrator and defineStorage composition ([903b3ea](https://github.com/DanielMSchmidt/cfast/commit/903b3ea1b639efbfccc42dd29d07ba4764d2895c))
* **storage:** magic bytes MIME type detection ([0b22f00](https://github.com/DanielMSchmidt/cfast/commit/0b22f0061985f4ad15c768e5c01248fcd40b4bef))
* **storage:** parseSize utility and filetype factory ([9e590ca](https://github.com/DanielMSchmidt/cfast/commit/9e590ca0ffc239277439a44dfcbcfcef91617cc1))
* **storage:** public API exports for server entrypoint ([38d8045](https://github.com/DanielMSchmidt/cfast/commit/38d8045191528f3b67e5a56247095cc1fbefeab8))
* **storage:** request parsing — extract file from multipart form data ([76756cd](https://github.com/DanielMSchmidt/cfast/commit/76756cd5eb4a08e615f122718160cd24de7fbe12))
* **storage:** type-safe file uploads to Cloudflare R2 ([a99c3cd](https://github.com/DanielMSchmidt/cfast/commit/a99c3cd229e73f55586799daed96613c3eb3df8f))
* **storage:** upload pipeline with direct PUT and multipart support ([e307eeb](https://github.com/DanielMSchmidt/cfast/commit/e307eebfa31d1fdfacd02ea51ce8dd593db48ba8))
* **storage:** useUpload client hook with StorageProvider ([f4ce5d1](https://github.com/DanielMSchmidt/cfast/commit/f4ce5d166d2e4c83396c95132c46d60de4884fda))
* **storage:** validation pipeline (content-type, size, magic bytes, byte counting) ([ebf1c26](https://github.com/DanielMSchmidt/cfast/commit/ebf1c26f1816de511dfabbf2021769e217c988b3))


### Bug Fixes

* resolve lint errors in storage package ([df6b36a](https://github.com/DanielMSchmidt/cfast/commit/df6b36a5f8e81bbcfd79cdafb7d12fc5587579a3))
* **storage,email:** validate JSON.parse results instead of using `as` casts ([#44](https://github.com/DanielMSchmidt/cfast/issues/44)) ([2d22a11](https://github.com/DanielMSchmidt/cfast/commit/2d22a1165f691d5957e81d4a8b02d7ea61a210e9))
* **storage:** add delimitedPrefixes to R2Objects mocks ([c825606](https://github.com/DanielMSchmidt/cfast/commit/c8256064b69c8744e6f9efb389b25e984f2ee1b4))
* **storage:** add explicit types to magic-bytes test lambdas ([b884085](https://github.com/DanielMSchmidt/cfast/commit/b884085255c35a2bfb78f8e71253cdf119b4dff1))
* **storage:** add explicit types to test lambdas ([6e27c3d](https://github.com/DanielMSchmidt/cfast/commit/6e27c3df5fe76c32be958a9b57c66aaa3dc39d7b))
* **storage:** add vitest imports and workers-types to tsconfig ([7d8c0f9](https://github.com/DanielMSchmidt/cfast/commit/7d8c0f907935c1484cc58a351888d3330d299c0f))
* **storage:** fix Uint8Array/BlobPart type in test helpers ([f9a45cf](https://github.com/DanielMSchmidt/cfast/commit/f9a45cfbfa5c3c3eea97f67fb6f22a52d7346891))
* **storage:** streaming multipart, R2 list pagination, duration validation ([1da825b](https://github.com/DanielMSchmidt/cfast/commit/1da825beecd531ab0d05acf6680ef90d11db7587))
* **storage:** use per-file jsdom env for client tests, fix children prop ([f97b3e7](https://github.com/DanielMSchmidt/cfast/commit/f97b3e7967f11a76eed609879da0da58b40fadcf))
