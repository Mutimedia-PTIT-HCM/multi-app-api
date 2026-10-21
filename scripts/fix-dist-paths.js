/**
 * Post-build: rewrite require("@app-...") trong dist/ thành đường dẫn tương đối.
 * TS7 đã xoá baseUrl nên tsc-alias không resolve được paths — script này thay thế.
 * Chạy sau `tsc -p tsconfig.build.json`.
 */
const fs = require("node:fs");
const path = require("node:path");

const DIST = path.resolve(__dirname, "../dist");

// alias segment đầu → thư mục thật trong dist/ (khớp compilerOptions.paths)
const LAYERS = {
  "@app-type": "app-type",
  "@app-common": "common",
  "@app-contracts": "contracts",
  "@app-jobs": "jobs",
  "@app-infra": "infrastructure",
  "@app-application": "application",
  "@app-presentation": "presentation",
};

const RE = /require\("(@app-[^"]+)"\)/g;
let fixed = 0;

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      walk(p);
      continue;
    }
    if (!p.endsWith(".js")) continue;
    const src = fs.readFileSync(p, "utf8");
    if (!RE.test(src)) continue;
    RE.lastIndex = 0;
    const out = src.replace(RE, (_m, spec) => {
      const [seg, ...rest] = spec.split("/");
      const target = path.resolve(DIST, LAYERS[seg], ...rest);
      let rel = path.relative(path.dirname(p), target);
      if (!rel.startsWith(".")) rel = `./${rel}`;
      return `require("${rel}")`;
    });
    fs.writeFileSync(p, out);
    fixed++;
  }
}

walk(DIST);
console.log(`fix-dist-paths: rewrote ${fixed} file(s)`);
