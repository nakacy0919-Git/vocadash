import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATALOG, normalizeWords, sourcePath } from './learning.js';

const expectedKeys = {
  regular3: '12222312231222121214424113122224121431213112411414',
  regular4: '21322412234112213323324443132142244342333444214413',
};

test('third and fourth exam sets are available from the periodic-exam catalog', () => {
  const course = CATALOG.find((entry) => entry.id === 'regular');
  assert.ok(course);
  for (const unitId of Object.keys(expectedKeys)) {
    assert.ok(course.units.some((unit) => unit.id === unitId));
    assert.equal(sourcePath('regular', unitId), './data/' + unitId + '.json');
  }
});

for (const [unitId, key] of Object.entries(expectedKeys)) {
  test(unitId + ': all 50 original four-choice questions preserve answer key and support learning', () => {
    const file = new URL('../data/' + unitId + '.json', import.meta.url);
    const questions = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(questions.length, 50);
    assert.equal(questions.map((q) => q.correct + 1).join(''), key);
    for (const [index, question] of questions.entries()) {
      assert.equal(question.id, index + 1);
      assert.equal(question.lesson, unitId);
      assert.ok(question.english.includes('________'));
      assert.ok(question.japanese.length > 0);
      assert.equal(question.choices.length, 4);
      assert.equal(new Set(question.choices).size, 4);
      assert.ok(question.choices[question.correct]);
      assert.ok(question.explanation.includes(question.choices[question.correct]));
      assert.equal(question.word_details[0].word, question.choices[question.correct]);
      assert.ok(question.word_details[0].meaning);
    }
    const normalized = normalizeWords(questions, 'regular', unitId);
    assert.equal(normalized.length, 50);
    assert.equal(new Set(normalized.map((word) => word.id)).size, 50);
    assert.ok(normalized.every((word) => word.meaning && word.word));
  });
}
