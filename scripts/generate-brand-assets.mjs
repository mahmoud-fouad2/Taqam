import path from "node:path";

import sharp from "sharp";

const baseDir = process.cwd();
const iconSvg = path.join(baseDir, "public/icons/taqam-icon.svg");
const logoSvg = path.join(baseDir, "public/icons/taqam-logo.svg");

async function renderIcon(targetPath, size) {
  await sharp(iconSvg, { density: 600 })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(baseDir, targetPath));
}

async function renderLogo(targetPath, width) {
  await sharp(logoSvg, { density: 600 })
    .resize({
      width,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(baseDir, targetPath));
}

await Promise.all([
  ...[32, 48, 64, 128, 192, 256, 512, 1024].map((size) =>
    renderIcon(`public/icons/favicon-${size}.png`, size)
  ),
  ...[128, 256, 512, 1024].flatMap((size) => [
    renderIcon(`public/icons/mark-light-${size}.png`, size),
    renderIcon(`public/icons/mark-dark-${size}.png`, size)
  ]),
  ...[512, 860, 1200].flatMap((width) => [
    renderLogo(`public/icons/logo-navbar-light-${width}.png`, width),
    renderLogo(`public/icons/logo-navbar-dark-${width}.png`, width)
  ]),
  renderIcon("apps/mobile/assets/brand/icon.png", 1024),
  renderIcon("apps/mobile/assets/brand/adaptive-foreground.png", 1024),
  renderIcon("apps/mobile/assets/brand/favicon.png", 256),
  renderLogo("apps/mobile/assets/brand/logo-light.png", 1200),
  renderLogo("apps/mobile/assets/brand/logo-dark.png", 1200),
  renderLogo("apps/mobile/assets/brand/splash.png", 1400)
]);

console.log("brand-assets-generated");
