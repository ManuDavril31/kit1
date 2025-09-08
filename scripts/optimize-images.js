/* Optimiza imágenes en assets/imgs -> genera WebP 480/960 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = process.cwd();
const IMG_DIR = path.join(ROOT, "assets", "imgs");
const SIZES = [480, 960];
const EXT_OK = new Set([".png", ".jpg", ".jpeg"]);

function walk(dir) {
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    return st.isDirectory() ? walk(full) : [full];
  });
}

async function convertOne(file) {
  const ext = path.extname(file).toLowerCase();
  if (!EXT_OK.has(ext)) return;
  const base = file.replace(/\.(png|jpe?g)$/i, "");
  const input = sharp(file, { failOn: "none" });
  const meta = await input.metadata().catch(() => ({}));
  for (const w of SIZES) {
    const out = `${base}-${w}.webp`;
    if (fs.existsSync(out)) continue;
    const width = meta.width || w;
    const target = Math.min(width, w);
    await input
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toFile(out)
      .catch(() => {});
  }
}

(async () => {
  if (!fs.existsSync(IMG_DIR)) {
    console.error("No existe assets/imgs");
    process.exit(1);
  }
  const files = walk(IMG_DIR);
  for (const f of files) {
    await convertOne(f);
  }
  console.log("Imagenes optimizadas (WebP 480/960)");
})();
