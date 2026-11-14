#!/usr/bin/env node
// Read the private reference locally; only IDs and aggregate counts are exported.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const value = flag => args[args.indexOf(flag) + 1];
if (!args.includes('--master') || !value('--master')) {
  console.error('Usage: node tools/audit-vocabulary-coverage.mjs --master PRIVATE_REFERENCE_JSON [--require-complete]');
  process.exit(2);
}
const root = path.resolve('data/vocabulary-drafts');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = read(path.join(root, 'manifest.json'));
const referenceBytes = fs.readFileSync(value('--master'));
const reference = JSON.parse(referenceBytes);
const rows = reference.values ?? reference;
if (!Array.isArray(rows) || rows.some(row => !/^VD-\d+$/.test(row[0]) || !row[1] || !row[2])) {
  throw new Error('Reference must be data rows [wordId, headword, level, ...], without a header.');
}
const master = new Map(rows.map(row => [row[0], row]));
if (master.size !== rows.length) throw new Error('Duplicate word IDs in the reference');
const records = manifest.batchFiles.flatMap(file => read(path.join(root, file)).records);
const byWordId = new Map();
for (const record of records) {
  if (!byWordId.has(record.wordId)) byWordId.set(record.wordId, []);
  byWordId.get(record.wordId).push(record);
}
const valid = record => Boolean(record.meaningJa?.trim() && record.definitionEn?.trim() &&
  record.partOfSpeech?.trim() && Array.isArray(record.examples) && record.examples.length >= 2 &&
  record.examples.every(example => example.en?.trim() && example.ja?.trim()) &&
  (record.synonyms?.length || record.synonymNoteJa?.trim()));
const byLevel = {};
const backlog = [];
const identityErrors = [];
for (const record of records) {
  const row = master.get(record.wordId);
  if (!row || row[1].toLowerCase() !== record.headword.toLowerCase()) identityErrors.push(record.senseId);
}
for (const [wordId, , level] of rows) {
  const totals = byLevel[level] ??= {target: 0, drafted: 0, withRequiredContent: 0, reviewed: 0};
  totals.target++;
  const senses = byWordId.get(wordId) ?? [];
  if (senses.length) totals.drafted++;
  if (senses.some(valid)) totals.withRequiredContent++;
  if (senses.some(record => record.status === 'approved' && valid(record))) totals.reviewed++;
  if (!senses.length || !senses.some(valid)) backlog.push({wordId, level, reason: senses.length ? 'required-content-missing' : 'no-draft'});
}
const drafted = Object.values(byLevel).reduce((sum, level) => sum + level.drafted, 0);
const reviewed = Object.values(byLevel).reduce((sum, level) => sum + level.reviewed, 0);
const report = {
  schemaVersion: '1.0', asOf: manifest.lastUpdated,
  reference: {kind: 'private-reference-read-locally', rows: rows.length, sha256: crypto.createHash('sha256').update(referenceBytes).digest('hex')},
  targetHeadwords: rows.length, draftedHeadwords: drafted, reviewedHeadwords: reviewed,
  remainingWithoutDraft: rows.length - drafted,
  remainingWithoutRequiredContent: backlog.length,
  byLevel, identityErrors,
  status: reviewed === rows.length && !identityErrors.length ? 'complete-reviewed' : 'incomplete',
  note: 'Draft coverage is not editorial approval or exhaustive coverage of every sense. No runtime or deployment changes.',
  backlog,
};
fs.writeFileSync(path.join(root, 'quality/master-coverage.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({...report, backlog: `${backlog.length} word IDs written to quality/master-coverage.json`}, null, 2));
if (identityErrors.length || (args.includes('--require-complete') && report.status !== 'complete-reviewed')) process.exitCode = 1;
