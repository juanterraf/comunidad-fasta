import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TARGET = path.join(ROOT, "src", "app", "fonts");

const FILES: Array<{ from: string; to: string }> = [
  {
    from: "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
    to: "inter-latin-wght-normal.woff2",
  },
  {
    from: "node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2",
    to: "poppins-latin-400-normal.woff2",
  },
  {
    from: "node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2",
    to: "poppins-latin-500-normal.woff2",
  },
  {
    from: "node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2",
    to: "poppins-latin-600-normal.woff2",
  },
  {
    from: "node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff2",
    to: "poppins-latin-700-normal.woff2",
  },
];

async function main(): Promise<void> {
  await mkdir(TARGET, { recursive: true });
  for (const f of FILES) {
    const src = path.join(ROOT, f.from);
    const dst = path.join(TARGET, f.to);
    await copyFile(src, dst);
    console.log(`✓ ${f.to}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
