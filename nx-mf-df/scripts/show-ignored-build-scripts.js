/*
 * Ignored build scripts: @parcel/watcher, @swc/core, esbuild, less, lmdb, msgpackr-extract, nx.
 * Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts. 
 * run: pnpm approve-builds
*/
const fs = require('fs');
const path = require('path');

const pkgs = [
  'esbuild',
  'nx',
  '@swc/core',
  '@parcel/watcher',
  'less',
  'lmdb',
  'msgpackr-extract',
];
const nm = path.join(process.cwd(), 'node_modules');
const pnpmNm = path.join(nm, '.pnpm');

function findPkg(name) {
  if (fs.existsSync(path.join(nm, name, 'package.json')))
    return path.join(nm, name, 'package.json');
  const unscoped = name.replace(/^@[^/]+\//, '');
  const flat = path.join(nm, unscoped, 'package.json');
  if (fs.existsSync(flat)) return flat;
  if (!fs.existsSync(pnpmNm)) return null;
  const dirs = fs.readdirSync(pnpmNm);
  const prefix = name.startsWith('@')
    ? name.replace('/', '+') + '@'
    : unscoped + '@';
  const hit = dirs.find(
    (d) => d.startsWith(prefix) || (d.includes(unscoped + '@') && !d.includes('/'))
  );
  if (!hit) return null;
  const pkgJson = path.join(pnpmNm, hit, 'node_modules', name, 'package.json');
  if (fs.existsSync(pkgJson)) return pkgJson;
  const unscopedPath = path.join(pnpmNm, hit, 'node_modules', unscoped, 'package.json');
  return fs.existsSync(unscopedPath) ? unscopedPath : null;
}

const lifecycles = ['install', 'postinstall', 'preinstall', 'prepare'];

pkgs.forEach((pkg) => {
  const p = findPkg(pkg);
  if (!p) {
    console.log(pkg + ': (not found in node_modules)');
    return;
  }
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const s = j.scripts || {};
  const run = lifecycles.filter((k) => s[k]).map((k) => k + ': ' + s[k]);
  console.log(pkg + ': ' + (run.length ? run.join(' | ') : '(no install scripts)'));
});
