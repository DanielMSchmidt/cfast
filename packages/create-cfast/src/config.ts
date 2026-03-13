import type { Config, Features } from "./types";

export function resolveFeatureDeps(features: Features): Features {
  const resolved = { ...features };

  if (resolved.admin) {
    resolved.db = true;
    resolved.ui = true;
    resolved.auth = true;
  }

  if (resolved.auth) {
    resolved.db = true;
  }

  return resolved;
}

export function getAutoAddedFeatures(
  original: Features,
  resolved: Features,
): string[] {
  const added: string[] = [];
  for (const key of Object.keys(resolved) as (keyof Features)[]) {
    if (resolved[key] && !original[key]) {
      added.push(key);
    }
  }
  return added;
}

export function resolveConfig(raw: Config): Config {
  const features = resolveFeatureDeps(raw.features);
  const uiLibrary = features.ui ? (raw.uiLibrary ?? "joy") : null;
  return { ...raw, features, uiLibrary };
}
