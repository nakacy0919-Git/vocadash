#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('data/vocabulary-drafts');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const manifest = read('manifest.json');
const errors = [];
const warnings = [];
const ids = new Set();
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
      const sentence = String(e.en || '').trim().toLowerCase();
      if (!sentences.has(sentence)) sentences.set(sentence, []);
      sentences.get(sentence).push(key);
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
