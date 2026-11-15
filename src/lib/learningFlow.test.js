import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldAutoAdvance,CEFR_COURSES,CORRECT_ADVANCE_MS} from './learningFlow.js';
test('quick correct answers advance but instructional feedback and errors remain',()=>{
 assert.equal(shouldAutoAdvance(true,''),true);
 assert.equal(shouldAutoAdvance(true,'   '),true);
 assert.equal(shouldAutoAdvance(false,''),false);
 assert.equal(shouldAutoAdvance(true,'用法に注意'),false);
 assert.equal(shouldAutoAdvance(true,'0'),false);
 assert.ok(CORRECT_ADVANCE_MS>=500);
});
test('six distinct CEFR learning routes',()=>{
 assert.equal(CEFR_COURSES.length,6);
 assert.equal(new Set(CEFR_COURSES.map(c=>c.id)).size,6);
 assert.ok(CEFR_COURSES.every(c=>c.units[0].id==='all'));
});

import {readFileSync} from 'node:fs';
test('all active drafts are loadable, unique and assigned to a CEFR level',()=>{
 const root=new URL('../../data/vocabulary-drafts/',import.meta.url);
 const manifest=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));
 const rows=manifest.batchFiles.flatMap(path=>JSON.parse(readFileSync(new URL(path,root),'utf8')).records);
 assert.equal(rows.length,manifest.totals.senses);
 assert.equal(new Set(rows.map(r=>r.senseId)).size,rows.length);
 assert.equal(new Set(rows.map(r=>r.wordId)).size,manifest.totals.distinctHeadwords);
 for(const c of CEFR_COURSES)assert.ok(rows.some(r=>r.cefrHeadword===c.short),'Missing '+c.short);
});
