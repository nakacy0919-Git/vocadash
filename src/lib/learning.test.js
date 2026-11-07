import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { READING_LEVELS, READING_PASS_PERCENT, readingWords, scoreReading, maskReadingSentence, saveReadingProgress, calculateEffectiveWPM } from './reading.js';
import { CATALOG, makeSessionQueue, sourcePath, normalizeWords, updateRecord, summaryFor, isDue, assetImage, splitDialogueTurns } from './learning.js';

test('all catalog entries define study units', () => {
  assert.equal(CATALOG.length, 9);
  for (const course of CATALOG) assert.ok(course.units.length > 0);
  assert.equal(sourcePath('eiken_4','1'),'./data/eiken_4_stage1.json');
  assert.equal(sourcePath('eiken_3','2'),'./data/eiken_3_stage2.json');
  assert.equal(sourcePath('eiken_pre1','2'),'./data/eiken_pre1_stage2.json');
  assert.equal(sourcePath('eiken1_master','phrasal_verb'),'./data/eiken_phrasal_verb.json');
  assert.equal(sourcePath('reading','15'),'./data/lesson15_30words.json');
});

test('normalizes existing multiple choice and master vocabulary', () => {
  const common = normalizeWords([{id:7,english:'It was ________.',japanese:'それは________だった。',choices:['fine','unavoidable','tiny','bad'],correct:1,word_details:[{word:'unavoidable',meaning:'避けられない'}]}],'eiken_2','1');
  assert.equal(common[0].id,'eiken_2:1:7');
  assert.equal(common[0].word,'unavoidable');
  assert.equal(common[0].meaning,'避けられない');
  assert.equal(common[0].english,'It was unavoidable.');
  const master = normalizeWords([{id:'x',targetWord:'buckle down',meaning:'本腰を入れる',english:'I will buckle down.',choices:['buckle down','get up','put off','take in'],correct:0}],'eiken1_master','phrasal_verb');
  assert.equal(master[0].word,'buckle down');
});

test('spaced repetition records cards separately and schedules due dates', () => {
  const start = {records:{},totalAnswers:0};
  const now = Date.UTC(2026,10,6);
  const once = updateRecord(start,'eiken_2:1:7',true,now);
  assert.equal(once.records['eiken_2:1:7'].level,1);
  assert.equal(once.records['eiken_2:1:7'].dueAt,now+86400000);
  assert.equal(isDue(once.records['eiken_2:1:7'],now),false);
  const twice = updateRecord(once,'eiken_2:1:7',true,now+86400000);
  assert.equal(twice.records['eiken_2:1:7'].level,2);
  assert.equal(summaryFor([{id:'eiken_2:1:7'}],twice.records).known,1);
  const missed = updateRecord(twice,'eiken_2:1:7',false,now+86400000*2);
  assert.equal(missed.records['eiken_2:1:7'].level,0);
  assert.equal(isDue(missed.records['eiken_2:1:7'],now+86400000*2),true);
  assert.equal(start.totalAnswers,0);
  assert.equal(missed.totalAnswers,3);
});

test('converts media filenames without losing ordinary paths', () => {
  assert.equal(assetImage('/images/verb/1 example word.webp'),'/images/verb/1.webp');
  assert.equal(assetImage('/images/verb/1.webp'),'/images/verb/1.webp');
});


test('dialogue quiz separates speakers while preserving blanks and wording', () => {
  const example = "A: Fran, why don't you ＿＿＿＿ some brownies? B: Good idea, Ken.";
  assert.deepEqual(splitDialogueTurns(example), [
    { speaker: 'A', text: "Fran, why don't you ＿＿＿＿ some brownies?" },
    { speaker: 'B', text: "Good idea, Ken." }
  ]);
  assert.deepEqual(splitDialogueTurns('A: Hello. B: Hi. A: How are you?'), [
    { speaker: 'A', text: 'Hello.' },
    { speaker: 'B', text: 'Hi.' },
    { speaker: 'A', text: 'How are you?' }
  ]);
  assert.deepEqual(splitDialogueTurns('A: Hello.\nB: Hi.'), [
    { speaker: 'A', text: 'Hello.' },
    { speaker: 'B', text: 'Hi.' }
  ]);
  assert.equal(splitDialogueTurns('We will meet at 10:30 tomorrow.'), null);
  assert.equal(splitDialogueTurns('A: A single utterance.'), null);
  assert.equal(splitDialogueTurns('The answer is A: but this is not a dialogue. B: Still text.'), null);
});


test('full Japanese translations survive vocabulary normalization for review', () => {
  const input = [{
    id: 'translation', english: 'She ________ the decision.',
    japanese: '彼女はその決定を惜しんだ。', choices: ['begrudged','drew','sang','lost'],
    correct: 0, meaning: '不満に思う'
  }];
  const [word] = normalizeWords(input, 'eiken_1', '1');
  assert.equal(word.english, 'She begrudged the decision.');
  assert.equal(word.japanese, '彼女はその決定を惜しんだ。');
  assert.equal(word.word, 'begrudged');
});


test('learning sessions are limited and listening needs both image and audio', () => {
  const words = Array.from({length: 12},(_,i)=>({ id:'w'+i, image:i<5?'/image.webp':'', audio:i<5?'/audio.mp3':'' }));
  assert.equal(makeSessionQueue(words,'study',{}, {questionCount:5}).length,5);
  assert.equal(makeSessionQueue(words,'quiz',{}, {questionCount:10}).length,10);
  assert.equal(makeSessionQueue(words,'listening',{}, {questionCount:10}).length,5);
  assert.equal(makeSessionQueue(words,'study',{}, {questionCount:'all'}).length,12);
  const r={'w0':{seen:1,dueAt:0},'w1':{seen:1,dueAt:Date.now()+999999}};
  assert.deepEqual(makeSessionQueue(words,'review',r,{questionCount:10}).map(w=>w.id),['w0']);
});


test('original grade 3 and grade 4 questions have exactly one correct option and complete translations', () => {
  for (const level of [3,4]) {
    for (const stage of [1,2]) {
      const entries = JSON.parse(readFileSync(new URL('../data/eiken_' + level + '_stage' + stage + '.json', import.meta.url)));
      assert.equal(entries.length,20);
      const words = normalizeWords(entries,'eiken_' + level,String(stage));
      assert.equal(words.length,20);
      for (const entry of entries) {
        assert.equal(entry.choices.length,4);
        assert.equal(new Set(entry.choices).size,4);
        assert.equal(entry.choices[entry.correct],entry.targetWord);
        assert.ok(entry.english.includes('________'));
        assert.ok(entry.japanese.length > 8);
        assert.ok(entry.explanation.length > 8);
      }
    }
  }
});

test('every grade 1 master multimedia item has an existing image and model audio', () => {
  for (const name of ['eiken1_verb','eiken1_adjective','eiken1_noun','eiken_phrasal_verb']) {
    const entries = JSON.parse(readFileSync(new URL('../data/' + name + '.json',import.meta.url)));
    assert.equal(entries.length,100);
    for (const item of entries) {
      const image = assetImage(item.image).replace(/^\//,'');
      const audio = String(item.audio||'').replace(/^\//,'');
      assert.ok(existsSync(new URL('../../public/' + image, import.meta.url)), item.id + ': missing image ' + image);
      assert.ok(existsSync(new URL('../../public/' + audio, import.meta.url)), item.id + ': missing audio ' + audio);
    }
  }
});


test('Copeak-style ordered speech agreement supports dialogue labels and contractions', () => {
  assert.equal(READING_LEVELS.length, 5);
  assert.equal(READING_PASS_PERCENT, 80);
  assert.equal(scoreReading('A: Good morning. B: Hi there.', 'Good morning hi there').percent,100);
  assert.equal(scoreReading("I don't like the rain.", 'I do not like the rain').percent,100);
  const partial=scoreReading('I like apples very much.', 'I like apples very');
  assert.equal(partial.percent,80);
  assert.equal(partial.passed,true);
  assert.deepEqual(partial.missedWords,['much']);
  assert.equal(scoreReading('I like apples very much.', 'I like cats').passed,false);
  assert.equal(scoreReading('I like apples very much.','').percent,0);
  assert.deepEqual(readingWords("we've"),{original:["we've"],tokens:['we','have'],indices:[0,0]});
});

test('five reading stages mask words without altering original sentence', () => {
  const sentence='We should read books every single day to improve our English.';
  const first=maskReadingSentence(sentence,1);
  const fifth=maskReadingSentence(sentence,5);
  assert.equal(first.some(piece=>piece.hidden),false);
  assert.equal(fifth.some(piece=>piece.hidden),true);
  assert.equal(first.map(piece=>piece.text).join(''),sentence);
  assert.equal(fifth.map(piece=>piece.text).join(''),sentence);
});

test('reading accuracy milestones persist without changing vocabulary quiz totals',()=>{
  const original={records:{},totalAnswers:7};
  const pass=saveReadingProgress(original,'word1',1,80,Date.UTC(2026,10,7));
  assert.equal(pass.records.word1.readingClearedLevel,1);
  assert.equal(pass.records.word1.readingAttempts,1);
  assert.equal(pass.records.word1.readingBest,80);
  const fail=saveReadingProgress(pass,'word1',2,60,Date.UTC(2026,10,8));
  assert.equal(fail.records.word1.readingClearedLevel,1);
  assert.deepEqual(fail.records.word1.readingBestByLevel,[80,60,0,0,0]);
  const top=saveReadingProgress(fail,'word1',2,100);
  assert.equal(top.records.word1.readingClearedLevel,2);
  assert.equal(top.records.word1.readingBest,100);
  assert.equal(original.records.word1,undefined);
  assert.equal(top.totalAnswers,7);
});


test('reading Accuracy must penalize extra words even when the full target follows', () => {
  const target = 'I borrowed a book from the library.';
  const perfect = scoreReading(target, 'I borrowed a book from the library');
  assert.equal(perfect.percent,100);
  assert.equal(perfect.editDistance,0);
  assert.equal(perfect.extraWords.length,0);

  // Screenshot regression: "I bought I borrowed ..." previously earned 100%.
  const withExtras = scoreReading(target, 'I bought I borrowed a book from the library');
  assert.equal(withExtras.percent,78);
  assert.equal(withExtras.passed,false);
  assert.equal(withExtras.insertions,2);
  assert.equal(withExtras.matchCount,7);
  assert.equal(withExtras.targetCount,7);
  assert.deepEqual(withExtras.extraWords,['i','bought']);
  assert.equal(withExtras.wordMatches.filter(word=>!word.matched).length,2);
  assert.equal(calculateEffectiveWPM(withExtras,12000),35);

  const swapped=scoreReading(target,'I borrowed book a from the library');
  assert.ok(swapped.percent<100,'wrong word order must not earn 100%');
  assert.equal(swapped.substitutions,2);
  const appended=scoreReading(target,'I borrowed a book from the library today');
  assert.equal(appended.insertions,1);
  assert.ok(appended.percent<100);
  const omitted=scoreReading(target,'I borrowed a book from library');
  assert.equal(omitted.deletions,1);
  assert.ok(omitted.percent<100);
  const substituted=scoreReading(target,'I borrowed a car from the library');
  assert.equal(substituted.substitutions,1);
  assert.ok(substituted.percent<100);
  assert.equal(calculateEffectiveWPM(perfect,60000),7);
  assert.equal(calculateEffectiveWPM({matchCount:0},1000),0);
});
