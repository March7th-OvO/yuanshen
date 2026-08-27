/**
 * 字体本地化脚本：从 Fontsource（npm 镜像可拉取，无需访问 fonts.googleapis.com）
 * 下载所需 woff2 到 public/fonts/，并同步 OFL 许可证文件。
 *
 * 用法： node scripts/localize-fonts.mjs
 * 换字体：改 FAMILIES 里的包名与文件清单，重跑脚本，再把 src/fonts.css 的 @font-face 对齐。
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, rmSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'fonts');
const tmpDir = path.join(root, '.tmp-fonts');

/** 只保留 latin / latin-ext 子集：页面文案只有中文（系统字体）与西文 */
const FAMILIES = [
  {
    pkg: '@fontsource-variable/inter',
    license: 'Inter-LICENSE.txt',
    files: ['inter-latin-wght-normal.woff2', 'inter-latin-ext-wght-normal.woff2'],
  },
  {
    pkg: '@fontsource-variable/playfair-display',
    license: 'PlayfairDisplay-LICENSE.txt',
    files: [
      'playfair-display-latin-wght-normal.woff2',
      'playfair-display-latin-wght-italic.woff2',
      'playfair-display-latin-ext-wght-normal.woff2',
      'playfair-display-latin-ext-wght-italic.woff2',
    ],
  },
  {
    pkg: '@fontsource/playwrite-de-sas-guides',
    license: 'Playwrite-DESASGuides-LICENSE.txt',
    files: ['playwrite-de-sas-guides-latin-400-normal.woff2'],
  },
];

rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();

for (const { pkg, license, files } of FAMILIES) {
  const tgz = sh(`npm pack ${pkg} --pack-destination "${tmpDir}"`);
  const dir = path.join(tmpDir, pkg.replace(/[@/]/g, '_'));
  mkdirSync(dir);
  sh(`tar -xzf "${path.join(tmpDir, tgz)}" -C "${dir}"`);

  const pkgRoot = path.join(dir, 'package');
  for (const file of files) {
    cpSync(path.join(pkgRoot, 'files', file), path.join(outDir, file));
    console.log(`${pkg} -> public/fonts/${file}`);
  }
  cpSync(path.join(pkgRoot, 'LICENSE'), path.join(outDir, license));

  const ranges = JSON.parse(readFileSync(path.join(pkgRoot, 'unicode.json'), 'utf8'));
  for (const [subset, range] of Object.entries(ranges)) {
    if (fileIncludesSubset(files, subset)) console.log(`  unicode-range[${subset}]: ${range}`);
  }
}

function fileIncludesSubset(files, subset) {
  return files.some((f) => f.includes(`-${subset}-`));
}

rmSync(tmpDir, { recursive: true, force: true });
console.log(`\n完成：public/fonts 现有 ${readdirSync(outDir).length} 个文件。`);
