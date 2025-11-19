#!/usr/bin/env bun

import { $ } from "bun";
import { minify } from "html-minifier-terser";
import { gzipSync } from "zlib";

// Check if --gzip flag is passed
const shouldGzip = process.argv.includes("--gzip");

console.log("🚀 Building production bundle...\n");

// Clean and create dist directory
console.log("📁 Setting up dist directory...");
await $`rm -rf dist`;
await $`mkdir -p dist`;

// Build optimized CSS with TailwindCSS
console.log("🎨 Building optimized CSS...");
await $`bunx @tailwindcss/cli -i ./src/styles.css -o ./dist/index.css --minify`;

// Minify HTML
console.log("📄 Minifying HTML...");
const html = await Bun.file("src/index.html").text();
const minifiedHtml = await minify(html, {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: true,
  removeAttributeQuotes: true,
  sortAttributes: true,
  sortClassName: true,
});

await Bun.write("dist/index.html", minifiedHtml);

// Copy static assets
console.log("📦 Copying static assets...");
const faviconExists = await Bun.file("favicon.ico").exists();
if (faviconExists) {
  await $`cp favicon.ico dist/favicon.ico`;
} else {
  console.log("⚠️  No favicon.ico found, skipping...");
}

// Optional Gzip compression
if (shouldGzip) {
  console.log("🗜️  Gzipping files...");
  const cssContent = await Bun.file("dist/index.css").arrayBuffer();
  const htmlContent = await Bun.file("dist/index.html").arrayBuffer();

  const gzippedCSS = gzipSync(new Uint8Array(cssContent));
  const gzippedHTML = gzipSync(new Uint8Array(htmlContent));

  await Bun.write("dist/index.css.gz", gzippedCSS);
  await Bun.write("dist/index.html.gz", gzippedHTML);
}

// Calculate file sizes
const cssFile = Bun.file("dist/index.css");
const htmlFile = Bun.file("dist/index.html");

const cssSize = (cssFile.size / 1024).toFixed(2);
const htmlSize = (htmlFile.size / 1024).toFixed(2);

console.log("\n✅ Build completed successfully!\n");
console.log("📊 Bundle sizes:");

if (shouldGzip) {
  const cssGzFile = Bun.file("dist/index.css.gz");
  const htmlGzFile = Bun.file("dist/index.html.gz");

  const cssGzSize = (cssGzFile.size / 1024).toFixed(2);
  const htmlGzSize = (htmlGzFile.size / 1024).toFixed(2);

  const cssCompression = (
    ((cssFile.size - cssGzFile.size) / cssFile.size) *
    100
  ).toFixed(1);
  const htmlCompression = (
    ((htmlFile.size - htmlGzFile.size) / htmlFile.size) *
    100
  ).toFixed(1);

  console.log(
    `   - index.html: ${htmlSize} KB (${htmlGzSize} KB gzipped, ${htmlCompression}% smaller)`,
  );
  console.log(
    `   - index.css: ${cssSize} KB (${cssGzSize} KB gzipped, ${cssCompression}% smaller)`,
  );
} else {
  console.log(`   - index.html: ${htmlSize} KB`);
  console.log(`   - index.css: ${cssSize} KB`);
}

console.log(`\n📁 Output directory: ./dist`);
