const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../../../package.json');
const constantFilePath = path.join(__dirname, '../src/lib/nx-version/nx-version.constant.ts');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const nxVersion = packageJson.devDependencies?.nx || packageJson.dependencies?.nx || 'unknown';
  
  const constantContent = `export const NX_VERSION = '${nxVersion}';\n`;
  
  fs.writeFileSync(constantFilePath, constantContent, 'utf8');
  console.log(`Updated NX_VERSION to ${nxVersion}`);
} catch (error) {
  console.error('rror updating NX_VERSION:', error.message);
  process.exit(1);
}
