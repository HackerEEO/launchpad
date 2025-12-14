import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// This script copies the hardhat deployment addresses into the frontend src
// so the frontend can easily import addresses during local development.

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const deploymentsPath = path.resolve(scriptDir, '../contracts/deployments/addresses-hardhat.ts');
  if (!fs.existsSync(deploymentsPath)) {
    console.error('Deployments file not found:', deploymentsPath);
    process.exit(1);
  }

  // Dynamically import the generated deployments file (requires tsx/ts-node when running)
  const deployments = await import(pathToFileURL(deploymentsPath).href);
  const { CONTRACT_ADDRESSES, CHAIN_ID } = deployments as any;

  const outPath = path.resolve(scriptDir, '../src/contracts/addresses.hardhat.ts');
  const content = `// Auto-generated from ${path.relative(process.cwd(), deploymentsPath)}\n` +
    `// Run \"npm run sync:addresses\" after re-deploying contracts to update these values.\n\n` +
    `export const HARDHAT_ADDRESSES = ${JSON.stringify(CONTRACT_ADDRESSES, null, 2)} as const;\n` +
    `export const HARDHAT_CHAIN_ID = ${JSON.stringify(CHAIN_ID)} as const;\n`;

  fs.writeFileSync(outPath, content, 'utf8');
  console.log('Wrote hardhat addresses to', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
