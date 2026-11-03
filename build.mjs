import * as fs from "node:fs";
import * as path from "node:path";
import * as esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

async function build() {
	fs.mkdirSync("dist/content", { recursive: true });
	fs.mkdirSync("dist/background", { recursive: true });
	fs.mkdirSync("dist/offscreen", { recursive: true });
	fs.mkdirSync("dist/popup", { recursive: true });
	fs.mkdirSync("dist/icons", { recursive: true });

	const buildOptions = {
		entryPoints: {
			"content/content": "src/content/content.ts",
			"background/service-worker": "src/background/service-worker.ts",
			"offscreen/offscreen": "src/offscreen/offscreen.ts",
			"popup/popup": "src/popup/popup.ts",
		},
		bundle: true,
		outdir: "dist",
		format: "esm",
		target: "es2022",
		sourcemap: true,
		minify: false,
	};

	if (isWatch) {
		const ctx = await esbuild.context(buildOptions);
		await ctx.watch();
		console.log("Watching for changes...");
	} else {
		await esbuild.build(buildOptions);
	}

	// Copy static assets
	fs.copyFileSync("manifest.json", "dist/manifest.json");
	fs.copyFileSync("src/popup/popup.html", "dist/popup/popup.html");
	fs.copyFileSync("src/popup/popup.css", "dist/popup/popup.css");
	fs.copyFileSync(
		"src/offscreen/offscreen.html",
		"dist/offscreen/offscreen.html",
	);
	fs.cpSync("src/icons", "dist/icons", { recursive: true });

	console.log("Build complete -> dist/");
}

build().catch((err) => {
	console.error(err);
	process.exit(1);
});
