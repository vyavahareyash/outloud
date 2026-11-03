import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = pkg.version;
const releaseDir = path.resolve("release");
const distDir = path.resolve("dist");
const zipName = `outloud-v${version}.zip`;
const zipPath = path.join(releaseDir, zipName);

if (!fs.existsSync(distDir)) {
	console.error('Error: dist/ does not exist. Run "npm run build" first.');
	process.exit(1);
}

fs.mkdirSync(releaseDir, { recursive: true });
if (fs.existsSync(zipPath)) {
	fs.unlinkSync(zipPath);
}

// Zip contents of dist/ directly so manifest.json is at the root
console.log(`Packaging ${distDir} -> ${zipPath}...`);
execSync(`cd "${distDir}" && zip -r "${zipPath}" . -x "*.DS_Store"`);

const stats = fs.statSync(zipPath);
console.log(
	`Success! Package created: ${zipPath} (${(stats.size / 1024).toFixed(1)} KB)`,
);
