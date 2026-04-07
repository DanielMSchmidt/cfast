import path from "node:path";
import prompts from "prompts";
import { green } from "kolorist";
import type { CliArgs, Config, FeatureName, UiLibrary } from "./types";
import { FEATURE_NAMES } from "./types";
import { resolveConfig, resolveFeatureDeps, getAutoAddedFeatures } from "./config";

const FEATURE_LABELS: Record<FeatureName, string> = {
  auth: "@cfast/auth — Authentication (magic email + passkeys)",
  db: "@cfast/db — D1 database with Drizzle ORM",
  storage: "@cfast/storage — R2 file uploads",
  email: "@cfast/email — Email via Mailgun",
  ui: "@cfast/ui — Permission-aware components + actions",
  admin: "@cfast/admin — Admin panel",
};

export async function promptForConfig(args: CliArgs): Promise<Config | null> {
  // User input: may be a bare name ("my-app"), a relative path ("./my-app"),
  // or an absolute path ("/tmp/my-app"). We treat the raw value as the target
  // directory and derive the project name from its basename so that
  // package.json, wrangler.toml bindings, etc. don't contain the full path.
  let rawInput = args.projectName;
  if (!rawInput) {
    const result = await prompts({
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-cfast-app",
    });
    if (!result.projectName) return null;
    rawInput = result.projectName as string;
  }

  const projectName = path.basename(path.resolve(rawInput));

  // Features
  const hasAnyFeatureFlag = FEATURE_NAMES.some((f) => args[f]) || args.all;
  let selectedFeatures: FeatureName[];

  if (args.all) {
    selectedFeatures = [...FEATURE_NAMES];
  } else if (hasAnyFeatureFlag) {
    selectedFeatures = FEATURE_NAMES.filter((f) => args[f]);
  } else {
    const result = await prompts({
      type: "multiselect",
      name: "features",
      message: "Which packages do you need?",
      choices: FEATURE_NAMES.map((name) => ({
        title: FEATURE_LABELS[name],
        value: name,
      })),
    });
    if (!result.features) return null;
    selectedFeatures = result.features as FeatureName[];
  }

  const features = {
    auth: selectedFeatures.includes("auth"),
    db: selectedFeatures.includes("db"),
    storage: selectedFeatures.includes("storage"),
    email: selectedFeatures.includes("email"),
    ui: selectedFeatures.includes("ui"),
    admin: selectedFeatures.includes("admin"),
  };

  // Show auto-resolved deps
  const resolved = resolveFeatureDeps(features);
  const autoAdded = getAutoAddedFeatures(features, resolved);
  if (autoAdded.length > 0) {
    console.log(green(`  Added automatically: ${autoAdded.join(", ")}`));
  }

  // UI library — default to joy when running fully non-interactive (--all or --ui flag)
  let uiLibrary: UiLibrary | null = null;
  if (resolved.ui) {
    if (hasAnyFeatureFlag) {
      uiLibrary = "joy";
    } else {
      const result = await prompts({
        type: "select",
        name: "uiLibrary",
        message: "UI library:",
        choices: [
          { title: "MUI Joy UI", value: "joy" },
          { title: "Headless (bring your own)", value: "headless" },
        ],
      });
      if (result.uiLibrary === undefined) return null;
      uiLibrary = result.uiLibrary as UiLibrary;
    }
  }

  const targetDir = rawInput;

  return resolveConfig({
    projectName,
    targetDir,
    features: resolved,
    uiLibrary,
  });
}
