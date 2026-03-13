import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getTemplatesDir(): string {
  // In dist/index.js, templates is at ../templates
  return path.resolve(__dirname, "..", "templates");
}

export function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    // Rename _gitignore to .gitignore (npm strips dotfiles during publish)
    const destName = entry.name === "_gitignore" ? ".gitignore" : entry.name;
    const destPath = path.join(dest, destName);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      // Skip package.json and wrangler.toml fragments — handled by mergers
      if (entry.name === "package.json" || entry.name === "wrangler.toml") {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function replaceInDir(dir: string, replacements: Record<string, string>): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceInDir(fullPath, replacements);
    } else {
      replaceInFile(fullPath, replacements);
    }
  }
}

function replaceInFile(filePath: string, replacements: Record<string, string>): void {
  // Skip binary files
  const ext = path.extname(filePath);
  const textExts = [".ts", ".tsx", ".js", ".json", ".toml", ".md", ".html", ".css", ""];
  if (!textExts.includes(ext) && !filePath.endsWith(".gitignore")) return;

  let content = fs.readFileSync(filePath, "utf-8");
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }
  fs.writeFileSync(filePath, content);
}

export function readJsonFragment(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
}

export function readTextFragment(filePath: string): string {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

export function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}
