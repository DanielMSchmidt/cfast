export type PkgFragment = {
  name?: string;
  private?: boolean;
  type?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

export function mergePackageJsons(
  base: PkgFragment,
  fragments: PkgFragment[],
): PkgFragment {
  const merged: PkgFragment = {
    name: base.name,
    private: base.private,
    type: base.type,
    scripts: { ...base.scripts },
    dependencies: { ...base.dependencies },
    devDependencies: { ...base.devDependencies },
  };

  for (const fragment of fragments) {
    if (fragment.dependencies) {
      merged.dependencies = { ...merged.dependencies, ...fragment.dependencies };
    }
    if (fragment.devDependencies) {
      merged.devDependencies = {
        ...merged.devDependencies,
        ...fragment.devDependencies,
      };
    }
    if (fragment.scripts) {
      merged.scripts = { ...merged.scripts, ...fragment.scripts };
    }
  }

  // Sort dependencies alphabetically
  if (merged.dependencies) {
    merged.dependencies = sortKeys(merged.dependencies);
  }
  if (merged.devDependencies) {
    merged.devDependencies = sortKeys(merged.devDependencies);
  }

  return merged;
}

function sortKeys(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export function stringifyPackageJson(pkg: PkgFragment): string {
  return JSON.stringify(pkg, null, 2) + "\n";
}
