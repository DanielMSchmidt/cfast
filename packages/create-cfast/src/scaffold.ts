import fs from "node:fs";
import path from "node:path";
import type { Config, FeatureName } from "./types";
import { copyDir, replaceInDir, readJsonFragment, writeFile, getTemplatesDir } from "./utils";
import {
  mergePackageJsons,
  stringifyPackageJson,
  generateWranglerToml,
  generateEnv,
  generateCfastServer,
  generateViteConfig,
  generateRootTsx,
  generateRoutesTs,
  generateDevVars,
} from "./generators/index";

export function scaffold(config: Config): void {
  const templatesDir = getTemplatesDir();
  const targetDir = path.resolve(process.cwd(), config.targetDir);

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    throw new Error(`Directory "${config.targetDir}" already exists and is not empty.`);
  }

  // 1. Copy base template
  copyDir(path.join(templatesDir, "base"), targetDir);

  // 2. Determine overlay order (auth after db so auth's schema overwrites db's)
  const overlayOrder: FeatureName[] = ["db", "auth", "storage", "email", "ui", "admin"];
  const enabledOverlays = overlayOrder.filter((f) => config.features[f]);

  // 3. Copy overlays
  for (const overlay of enabledOverlays) {
    const overlayDir = path.join(templatesDir, overlay);
    if (fs.existsSync(overlayDir)) {
      copyDir(overlayDir, targetDir);
    }
  }

  // 4. Merge package.json
  const basePackageJson = readJsonFragment(path.join(templatesDir, "base", "package.json"));
  const overlayFragments = enabledOverlays
    .map((overlay) => readJsonFragment(path.join(templatesDir, overlay, "package.json")))
    .filter((f) => Object.keys(f).length > 0);
  const mergedPackageJson = mergePackageJsons(
    basePackageJson as Record<string, unknown>,
    overlayFragments as Record<string, unknown>[],
  );
  writeFile(path.join(targetDir, "package.json"), stringifyPackageJson(mergedPackageJson));

  // 5. Generate files
  writeFile(path.join(targetDir, "wrangler.toml"), generateWranglerToml(config));
  writeFile(path.join(targetDir, "app", "env.ts"), generateEnv(config));
  writeFile(path.join(targetDir, "app", "cfast.server.ts"), generateCfastServer(config));
  writeFile(path.join(targetDir, "vite.config.ts"), generateViteConfig(config));
  writeFile(path.join(targetDir, "app", "root.tsx"), generateRootTsx(config));
  writeFile(path.join(targetDir, "app", "routes.ts"), generateRoutesTs(config));

  const devVars = generateDevVars(config);
  if (devVars) {
    writeFile(path.join(targetDir, ".dev.vars"), devVars);
  }

  // 6. Replace template variables in all files
  replaceInDir(targetDir, {
    projectName: config.projectName,
  });
}
