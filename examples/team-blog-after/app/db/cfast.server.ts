// Re-export the app-level appDb factory. Legacy callers that imported
// `createCfDb` from this path can switch to `appDb(grants, user)` instead.
export { appDb } from "~/cfast.server";
