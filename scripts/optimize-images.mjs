import sharp from 'sharp';
import { readdir, stat, readFile, writeFile, unlink } from 'node:fs/promises';
import { join, extname, dirname, basename } from 'node:path';

const PUBLIC_DIR = 'public';

// Per-folder max dimension (longest side, in CSS pixels × 2 for retina)
const FOLDER_MAX = {
  'public/logos':   400,   // displayed 140-245px
  'public/steam':   256,   // displayed 96-126px badges
  'public/b4k':     800,   // carousel images displayed ~280-560px
  'public/lms':     800,
  'public/outdoor': 800,
  'public/bk':     1200,   // BKplakatas displayed up to 530x747
  'public/bk-imported': 1200, // imported third-party photos
};


// horizontal logos and small overlays — special-case override (max longest side)
const FILE_OVERRIDES = {
  'public/logos/businesskids-horizontal.png': 320,
  'public/logos/meskuciai.jpeg': 200,
  // Hero images need 1920px to display crisp at full viewport width on desktop
  'public/b4k/b4_hero.jpg':              1920,
  'public/b4k/b4_hero.jpeg':             1920,
  'public/lms/lms-promo.jpg':            1920,
  'public/lms/lms-promo.jpeg':           1920,
  'public/bk/Hero_Carousel_BK.jpg':      1920,
  'public/bk/Hero_Carousel_BK.jpeg':     1920,
};

const WEBP_QUALITY = 75;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

const files = (await walk(PUBLIC_DIR)).filter(f => /\.(jpe?g|png)$/i.test(f));

let totalBefore = 0, totalAfter = 0;

for (const file of files) {
  const beforeBytes = (await stat(file)).size;
  totalBefore += beforeBytes;

  const folder = dirname(file);
  const maxDim = FILE_OVERRIDES[file] ?? FOLDER_MAX[folder] ?? 1200;

  const buf = await readFile(file);
  const img = sharp(buf, { failOnError: false }).rotate();
  const meta = await sharp(buf).rotate().metadata();

  const needsResize = (meta.width || 0) > maxDim || (meta.height || 0) > maxDim;
  const pipeline = needsResize
    ? img.resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
    : img;

  const webpBuf = await pipeline.clone().webp({ quality: WEBP_QUALITY, effort: 6 }).toBuffer();
  const webpPath = file.replace(/\.(jpe?g|png)$/i, '.webp');

  await writeFile(webpPath, webpBuf);
  totalAfter += webpBuf.length;

  if (webpPath !== file) {
    await unlink(file);
  }

  const pct = ((1 - webpBuf.length / beforeBytes) * 100).toFixed(0);
  console.log(`${file} -> ${webpPath}: ${(beforeBytes/1024).toFixed(0)}KB -> ${(webpBuf.length/1024).toFixed(0)}KB (-${pct}%) [max ${maxDim}px]`);
}

console.log(`\nTotal: ${(totalBefore/1024/1024).toFixed(2)}MB -> ${(totalAfter/1024/1024).toFixed(2)}MB`);
console.log(`\nNext step: update <img src="..."> in index.html — run:`);
console.log(`  node scripts/rewrite-img-srcs.mjs`);
