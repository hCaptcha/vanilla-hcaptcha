import { rmSync } from "fs";

rmSync("./dist", { recursive: true, force: true });

const shared = {
  entrypoints: ["./src/index.ts"],
  minify: true,
  sourcemap: "linked",
  target: "browser",
} as const;

const [iife, esm] = await Promise.all([
  Bun.build({
    ...shared,
    format: "iife",
    naming: "index.min.js",
    outdir: "./dist",
  }),
  Bun.build({
    ...shared,
    format: "esm",
    naming: "index.min.mjs",
    outdir: "./dist",
  }),
]);

function report(label: string, result: BuildOutput) {
  if (!result.success) {
    console.error(`${label} build failed:`);
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  for (const output of result.outputs) {
    const kb = (output.size / 1024).toFixed(2);
    console.log(`${label}  ${output.path}  ${kb} KB`);
  }
}

type BuildOutput = Awaited<ReturnType<typeof Bun.build>>;

report("iife", iife);
report("esm ", esm);
