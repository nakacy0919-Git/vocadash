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
