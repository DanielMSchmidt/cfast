# Changelog

## [0.0.2](https://github.com/DanielMSchmidt/cfast/compare/@cfast/ui-v0.0.1...@cfast/ui-v0.0.2) (2026-03-13)


### Features

* **auth:** complete @cfast/auth — schema, components, roles, impersonation ([#37](https://github.com/DanielMSchmidt/cfast/issues/37)) ([51c0062](https://github.com/DanielMSchmidt/cfast/commit/51c0062f8874246a8232d74bf1d46d2694d39546))
* **docs:** create documentation website ([#42](https://github.com/DanielMSchmidt/cfast/issues/42)) ([764d4ad](https://github.com/DanielMSchmidt/cfast/commit/764d4ad84afa39943aca21ce23f23edca33f660b))
* **example:** replace manual admin routes with createAdmin() ([92c14da](https://github.com/DanielMSchmidt/cfast/commit/92c14dad7c23bc154ca9c7a91086db6d3f66f2c9))
* **ui:** add permission primitives — useActionStatus, PermissionGate, ActionButton ([df86f08](https://github.com/DanielMSchmidt/cfast/commit/df86f0828444f206afcac5cb9cf177c646dca078))
* **ui:** add plugin system, types, testing infra, and storybook config ([abab363](https://github.com/DanielMSchmidt/cfast/commit/abab36355ba7fa87b4a6aa067f664caaf547ab43))
* **ui:** core barrel export — useActionStatus, PermissionGate, createUIPlugin ([46a0cfa](https://github.com/DanielMSchmidt/cfast/commit/46a0cfab0cee58549aabf018db33bb115bdea135))
* **ui:** createUIPlugin factory — builds permission-aware ActionButton from UI primitives ([8751660](https://github.com/DanielMSchmidt/cfast/commit/8751660abcb3644893424a91aca8a4283ab6dc9b))
* **ui:** Joy UI plugin — ActionButton with tooltip, confirm dialog, loading states ([f60eb40](https://github.com/DanielMSchmidt/cfast/commit/f60eb402571350db28b618435a4887c5b2c6bfbd))
* **ui:** permission-aware React components with plugin system ([0d3b9ac](https://github.com/DanielMSchmidt/cfast/commit/0d3b9acc38363c380f4886560528ab3f11769577))
* **ui:** PermissionGate component — conditionally renders based on action permissions ([95d4052](https://github.com/DanielMSchmidt/cfast/commit/95d4052c4489f4392816a8b7ca82a134ae240d34))
* **ui:** PR 2 — feedback (confirm, toasts, form status) ([#28](https://github.com/DanielMSchmidt/cfast/issues/28)) ([e43f529](https://github.com/DanielMSchmidt/cfast/commit/e43f52935b29767ae25e5ffcfb4b171ea904d567))
* **ui:** PR 3 — utility components ([#29](https://github.com/DanielMSchmidt/cfast/issues/29)) ([12b7f7c](https://github.com/DanielMSchmidt/cfast/commit/12b7f7cd0b9d31456184d58493a2eb7b4f9abdfa))
* **ui:** PR 4 — TypedField components + fieldForColumn() ([#30](https://github.com/DanielMSchmidt/cfast/issues/30)) ([0dab6ed](https://github.com/DanielMSchmidt/cfast/commit/0dab6edf6fa25b316e378dd19c5376c8e3c0336f))
* **ui:** PR 5 — EmptyState + NavigationProgress ([#31](https://github.com/DanielMSchmidt/cfast/issues/31)) ([f5a7300](https://github.com/DanielMSchmidt/cfast/commit/f5a73006104e77949708b5881a42f3d94ebe9720))
* **ui:** PR 6 — page shells (PageContainer, AppShell, UserMenu) ([#32](https://github.com/DanielMSchmidt/cfast/issues/32)) ([7e4e274](https://github.com/DanielMSchmidt/cfast/commit/7e4e274bbd9f56b3a9b8c59aab059d8fdaf26850))
* **ui:** PR 7-9 — data, file, and view components ([#33](https://github.com/DanielMSchmidt/cfast/issues/33)) ([f8d8b05](https://github.com/DanielMSchmidt/cfast/commit/f8d8b05374809aec39a69fd89b326b4ff8dfa2ce))
* **ui:** shared type definitions for plugin system and components ([ec372f3](https://github.com/DanielMSchmidt/cfast/commit/ec372f3d3f36f56457c94a77db1e6877732f4008))
* **ui:** useActionStatus hook — thin wrapper over useActions for single action ([d3d3d92](https://github.com/DanielMSchmidt/cfast/commit/d3d3d923dd215bfad72170dd789880c7556494f2))


### Bug Fixes

* **ui:** add generic constraint to useActionStatus, test error path ([24eabb0](https://github.com/DanielMSchmidt/cfast/commit/24eabb0331d72ea1e08b59d6199e85be68c4bf76))
* **ui:** guard handleClick against unpermitted calls, fix useCallback deps ([30d118b](https://github.com/DanielMSchmidt/cfast/commit/30d118bd1822302bc9c0ebbc09d181bf3e7d02c8))
* **ui:** remove type casts and replace ComponentType&lt;any&gt; with proper types ([#53](https://github.com/DanielMSchmidt/cfast/issues/53)) ([36d9b0c](https://github.com/DanielMSchmidt/cfast/commit/36d9b0c5218de62fbfac0f717ce29f11a032f6f8))
