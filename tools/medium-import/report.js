// Renders the import report as Markdown for reading, and as one summary line for the terminal.

const ACTIONS = { created: 'Created', updated: 'Updated', unchanged: 'Unchanged', overwritten: 'Overwritten' };
const cell = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');

function section(title, rows, render, empty) {
  return [`## ${title} (${rows.length})`, '', rows.length ? rows.map(render).join('\n') : empty, ''];
}

export function summarise(report) {
  const counts = report.converted.reduce((acc, c) => ({ ...acc, [c.action]: (acc[c.action] ?? 0) + 1 }), {});
  const parts = Object.entries(counts).map(([action, n]) => `${n} ${action}`);
  return [
    `${report.discovered} files discovered`,
    parts.length ? parts.join(', ') : '0 converted',
    `${report.skipped.length} skipped`,
    `${report.protected.length} left untouched`,
    `${report.duplicates.length} duplicates`,
    `${report.needsReview.length} need review`,
    `${report.missingImages.length} missing images`,
    `${report.errors.length} errors`,
  ].join('; ');
}

export function renderReport(report) {
  const lines = [
    '# Medium import report',
    '',
    `Generated ${report.generatedAt} from \`${report.exportDir}\`.${report.dryRun ? ' **Dry run: nothing was written.**' : ''}`,
    '',
    summarise(report),
    '',
    'Imported articles are written with `draft: true`. Review each one, add tags, then set `draft: false` to publish it.',
    '',
    `## Articles discovered (${report.discovered})`,
    '',
    `${report.discovered} HTML files in the export: ${report.converted.length} converted, ${report.skipped.length} skipped, ${report.protected.length} left untouched, ${report.duplicates.length} duplicates, ${report.errors.length} failed.`,
    '',
    `## Successfully converted (${report.converted.length})`,
    '',
  ];
  if (report.converted.length) {
    lines.push('| Result | Article | File | Words | Images |', '| --- | --- | --- | --- | --- |');
    for (const c of report.converted) lines.push(`| ${report.dryRun ? `Would be ${c.action}` : ACTIONS[c.action]} | ${cell(c.title)} | \`${c.file}\` | ${c.words} | ${c.images} |`);
  } else lines.push('None.');
  lines.push('');

  lines.push(...section('Requiring manual review', report.needsReview,
    (r) => `- **${r.title}** (\`${r.file}\`)\n${r.reasons.map((reason) => `  - ${reason}`).join('\n')}`, 'None.'));
  lines.push(...section('Missing images', report.missingImages,
    (m) => `- \`${m.file}\`: ${m.url} (${m.reason})`, 'None. Every referenced image was copied into the repository.'));
  lines.push(...section('Unsupported HTML elements', report.unsupported,
    (u) => `- \`${u.file}\`: \`<${u.element}>\` ${u.detail}`, 'None.'));
  lines.push(...section('Duplicate articles', report.duplicates,
    (d) => `- **${d.title}** (\`${d.source}\`): ${d.reason}`, 'None.'));
  lines.push(...section('Existing articles left untouched', report.protected,
    (p) => `- **${p.title}** (\`${p.file}\`): ${p.reason}. Rerun with \`--overwrite\` to replace it with the Medium version.`, 'None.'));
  lines.push(...section('Skipped', report.skipped,
    (s) => `- \`${s.source}\`${s.title ? ` "${s.title}"` : ''}: ${s.reason}`, 'None.'));
  lines.push(...section('Conversion errors', report.errors,
    (e) => `- \`${e.source}\`: ${e.message}`, 'None.'));

  return `${lines.join('\n').trimEnd()}\n`;
}
