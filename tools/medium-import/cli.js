#!/usr/bin/env node
// npm run migrate:medium -- <extracted-export-folder> [options]
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { runImport } from './importer.js';
import { renderReport, summarise } from './report.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const HELP = `Import articles from an extracted Medium export.

Usage
  npm run migrate:medium -- <export-folder> [options]

  <export-folder>       The folder you get after unzipping Medium's export (it contains "posts").
                        Defaults to ./medium-export

Options
  --dry-run             Show what would happen. Writes and downloads nothing.
  --overwrite           Offer to replace articles that were edited by hand. Asks for each file.
  --yes                 With --overwrite: replace without asking.
  --include-drafts      Also import unpublished Medium drafts.
  --include-responses   Also import short posts that look like replies to other stories.
  --no-images           Do not download images; articles keep pointing at Medium.
  --help                Show this text.

Articles are written to src/blog/posts with "draft: true". Images go to src/assets/blog/<slug>/.
The report is written to reports/medium-import-report.md.`;

const FLAGS = new Set(['--dry-run', '--overwrite', '--yes', '--include-drafts', '--include-responses', '--no-images', '--help']);
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));
const unknown = [...flags].filter((f) => !FLAGS.has(f));

if (flags.has('--help')) { console.log(HELP); process.exit(0); }
if (unknown.length || positional.length > 1) {
  console.error(`${unknown.length ? `Unknown option: ${unknown.join(', ')}` : 'Pass one export folder.'}\n\n${HELP}`);
  process.exit(2);
}

async function confirm(file) {
  if (flags.has('--yes')) return true;
  if (!process.stdin.isTTY) {
    console.error(`Not replacing ${file}: no terminal to ask in. Add --yes to replace without asking.`);
    return false;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${file} was edited by hand. Replace it with the Medium version? [y/N] `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

try {
  const report = await runImport({
    exportDir: path.resolve(positional[0] ?? 'medium-export'),
    postsDir: path.join(root, 'src/blog/posts'),
    assetsDir: path.join(root, 'src/assets/blog'),
    manifestPath: path.join(root, 'tools/medium-import/manifest.json'),
    dryRun: flags.has('--dry-run'),
    overwrite: flags.has('--overwrite'),
    confirm,
    includeDrafts: flags.has('--include-drafts'),
    includeResponses: flags.has('--include-responses'),
    downloadImages: !flags.has('--no-images'),
  });

  const reportDir = path.join(root, 'reports');
  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(path.join(reportDir, 'medium-import-report.md'), renderReport(report));
  await fs.writeFile(path.join(reportDir, 'medium-import-report.json'), `${JSON.stringify(report, null, 2)}\n`);

  console.log(`${report.dryRun ? 'Dry run. ' : ''}${summarise(report)}`);
  console.log('Report: reports/medium-import-report.md');
  if (report.errors.length) process.exitCode = 1;
} catch (error) {
  console.error(`Import failed: ${error.message}`);
  process.exit(1);
}
