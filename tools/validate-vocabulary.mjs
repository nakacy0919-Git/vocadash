#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('data/vocabulary-drafts');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const manifest = read('manifest.json');
const errors = [];
const warnings = [];
const ids = new Set();
const exampleIds = new Set();
const headwords = new Set();
const sentences = new Map();
let senses = 0, examples = 0;
for (const filename of manifest.batchFiles) {
  const batch = read(filename);
  if (!Array.isArray(batch.records)) { errors.push(filename + ': missing records'); continue; }
  for (const record of batch.records) {
    senses++;
    const key = String(record.senseId || '');
    if (!key || !record.wordId || !record.headword || !record.meaningJa ||
        !record.definitionEn || !record.partOfSpeech) {
      errors.push('Required field missing: ' + filename + ' ' + key);
    }
    if (ids.has(key)) errors.push('Duplicate sense ID: ' + key);
    ids.add(key);
    headwords.add(String(record.headword || '').toLowerCase());
    if (!Array.isArray(record.examples) || record.examples.length < 2) {
      errors.push('Need at least two examples: ' + key); continue;
    }
    for (const e of record.examples) {
      examples++;
      if (!e.en || !e.ja) errors.push('Missing translation or sentence: ' + key);
      if (!e.id || exampleIds.has(e.id)) errors.push('Missing or duplicate example ID: ' + key + ' ' + e.id);
      exampleIds.add(e.id);
      if (!/[A-Za-z]/.test(e.en || '') || !/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(e.ja || '')) {
        errors.push('Expected English and Japanese text: ' + key);
      }
      const sentence = String(e.en || '').trim().toLowerCase();
      if (!sentences.has(sentence)) sentences.set(sentence, []);
      sentences.get(sentence).push(key);
    }
  }
}
// Derived exports from this authoring pass must match their source records.
for (const filename of manifest.recentWork?.newBatches || []) {
  const source = manifest.batchFiles.find(file => file === filename || path.basename(file, '.json') === filename);
  if (!source) { errors.push('Unknown recent batch: ' + filename); continue; }
  const stem = path.basename(source, '.json');
  const sourceRecords = read(source).records;
  for (const kind of ['examples', 'synonyms']) {
    const exportFile = 'exports/' + kind + '/' + stem + '.json';
    if (!fs.existsSync(path.join(root, exportFile))) continue;
    const exported = read(exportFile).records;
    const expected = kind === 'examples'
      ? sourceRecords.flatMap(record => record.examples.map(example => ({...example, wordId: record.wordId, senseId: record.senseId, headword: record.headword})))
      : sourceRecords;
    if (exported.length !== expected.length) errors.push('Export count mismatch: ' + exportFile);
    const byId = new Map(expected.map(record => [kind === 'examples' ? record.id : record.senseId, record]));
    const exportedIds = new Set();
    for (const record of exported) {
      const exportId = kind === 'examples' ? record.id : record.senseId;
      if (exportedIds.has(exportId)) errors.push('Duplicate export ID: ' + exportId);
      exportedIds.add(exportId);
      const original = byId.get(exportId);
      const fields = kind === 'examples' ? ['wordId', 'senseId', 'headword', 'en', 'ja'] : ['wordId', 'senseId', 'headword', 'definitionEn', 'meaningJa'];
      if (!original || fields.some(field => record[field] !== original[field])) errors.push('Export content mismatch: ' + exportFile + ' ' + exportId);
    }
  }
}
const actual = {distinctHeadwords:headwords.size, senses, examples, distinctExamples:sentences.size};
for (const [k, v] of Object.entries(actual)) {
  if (manifest.totals[k] !== v) errors.push('Manifest mismatch ' + k + ': expected ' + manifest.totals[k] + ' actual ' + v);
}
const collisions = [...sentences.entries()].filter(([sentence, entries]) => entries.length > 1);
for (const [sentence, entries] of collisions) warnings.push('Duplicate sentence (' + entries.join(', ') + '): ' + sentence);
if (collisions.length !== manifest.quality.exactDuplicateExamplePairs) {
  errors.push('Manifest duplicate count mismatch');
}
console.log(JSON.stringify({actual, errors:errors.length, warnings:warnings.length}, null, 2));
warnings.forEach(w => console.warn('WARN:', w));
errors.forEach(e => console.error('ERROR:', e));
if (errors.length) process.exitCode = 1;
