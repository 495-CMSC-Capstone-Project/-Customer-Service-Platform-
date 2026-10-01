import { gzipSync } from "node:zlib";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const assetDirectory = path.resolve("dist/assets");
const reportDirectory = path.resolve("reports");
const limits = {
  javascriptGzipBytes: 100 * 1024,
  cssGzipBytes: 25 * 1024,
};

const assetNames = await readdir(assetDirectory);
const totals = {
  javascriptBytes: 0,
  javascriptGzipBytes: 0,
  cssBytes: 0,
  cssGzipBytes: 0,
};

for (const assetName of assetNames) {
  const extension = path.extname(assetName);
  if (extension !== ".js" && extension !== ".css") {
    continue;
  }

  const content = await readFile(path.join(assetDirectory, assetName));
  const gzipBytes = gzipSync(content).byteLength;
  if (extension === ".js") {
    totals.javascriptBytes += content.byteLength;
    totals.javascriptGzipBytes += gzipBytes;
  } else {
    totals.cssBytes += content.byteLength;
    totals.cssGzipBytes += gzipBytes;
  }
}

const checks = {
  javascriptWithinBudget:
    totals.javascriptGzipBytes <= limits.javascriptGzipBytes,
  cssWithinBudget: totals.cssGzipBytes <= limits.cssGzipBytes,
};
const report = {
  generatedAt: new Date().toISOString(),
  limits,
  totals,
  checks,
};

await mkdir(reportDirectory, { recursive: true });
await writeFile(
  path.join(reportDirectory, "frontend-quality.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

const toKilobytes = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;
console.log(
  `JavaScript gzip: ${toKilobytes(totals.javascriptGzipBytes)} / ${toKilobytes(limits.javascriptGzipBytes)}`,
);
console.log(
  `CSS gzip: ${toKilobytes(totals.cssGzipBytes)} / ${toKilobytes(limits.cssGzipBytes)}`,
);

if (!checks.javascriptWithinBudget || !checks.cssWithinBudget) {
  console.error("Frontend bundle size budget exceeded.");
  process.exitCode = 1;
}
