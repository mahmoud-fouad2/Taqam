/**
 * Generate mobile app brand assets from the original logo-tight.jpeg.
 * Run with: node scripts/generate-mobile-brand.mjs
 */
import path from "node:path";
import sharp from "sharp";

const baseDir = process.cwd();
const srcLogo = path.join(baseDir, "public/logo-tight.jpeg");
const outDir = path.join(baseDir, "apps/mobile/assets/brand");

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/** Square icon: logo centered with white background + generous padding */
async function makeIcon(targetFile, size) {
  const padding = Math.round(size * 0.18);
  const innerSize = size - padding * 2;

  // Resize logo to innerSize × innerSize (contain, white fill)
  const logoResized = await sharp(srcLogo)
    .resize(innerSize, innerSize, { fit: "contain", background: WHITE })
    .toBuffer();

  // Composite onto white canvas
  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: logoResized, gravity: "center" }])
    .png()
    .toFile(path.join(outDir, targetFile));
}

/** Logo-only banner (light background, wide) */
async function makeLogo(targetFile, width) {
  const height = Math.round(width * 0.35);
  const padding = Math.round(height * 0.15);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const logoResized = await sharp(srcLogo)
    .resize(innerW, innerH, { fit: "contain", background: WHITE })
    .toBuffer();

  await sharp({
    create: { width, height, channels: 4, background: WHITE },
  })
    .composite([{ input: logoResized, gravity: "center" }])
    .png()
    .toFile(path.join(outDir, targetFile));
}

/** Splash screen (portrait) */
async function makeSplash(targetFile) {
  const W = 1290;
  const H = 2796;
  const logoW = 640;
  const logoH = Math.round(logoW * (496 / 877)); // preserve aspect ratio

  const logoResized = await sharp(srcLogo)
    .resize(logoW, logoH, { fit: "contain", background: WHITE })
    .toBuffer();

  await sharp({
    create: { width: W, height: H, channels: 4, background: WHITE },
  })
    .composite([{ input: logoResized, gravity: "center" }])
    .png()
    .toFile(path.join(outDir, targetFile));
}

await Promise.all([
  makeIcon("icon.png", 1024),
  makeIcon("adaptive-foreground.png", 1024),
  makeIcon("favicon.png", 256),
  makeLogo("logo-light.png", 1200),
  makeSplash("splash.png"),
]);

console.log("✓ Mobile brand assets generated from original Taqam logo.");
