export type Features = {
  auth: boolean;
  db: boolean;
  storage: boolean;
  email: boolean;
  ui: boolean;
  admin: boolean;
};

export type UiLibrary = "joy" | "headless";

export type Config = {
  projectName: string;
  targetDir: string;
  features: Features;
  uiLibrary: UiLibrary | null;
};

export type CliArgs = {
  projectName: string | undefined;
  auth: boolean;
  db: boolean;
  storage: boolean;
  email: boolean;
  ui: boolean;
  admin: boolean;
  all: boolean;
  help: boolean;
};

export const FEATURE_NAMES = ["auth", "db", "storage", "email", "ui", "admin"] as const;
export type FeatureName = (typeof FEATURE_NAMES)[number];
