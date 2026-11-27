import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CATALOG,sourcePath,normalizeWords,assetImage} from './learning.js';
import {prepareFastWords,sessionItems} from './periodicPractice.js';
test('Eiken grade 1 master is in exams and all 400 original media sets remain playable',()=>{
 const course=CATALOG.find(c=>c.id==='eiken1_master');assert.equal(course.group,'英検対策');assert.equal(course.units.length,4);assert.ok(CATALOG.indexOf(course)<6);
 let total=0;
 for(const u of course.units){
  const raw=JSON.parse(readFileSync(new URL('../'+sourcePath(course.id,u.id).replace('./',''),import.meta.url),'utf8'));
  const words=normalizeWords(raw,course.id,u.id);assert.equal(words.length,100);
  for(const w of words){assert.ok(w.image&&w.audio);assert.ok(existsSync(new URL('../../public'+assetImage(w.image),import.meta.url)),w.image);assert.ok(existsSync(new URL('../../public'+w.audio,import.meta.url)),w.audio);}
  const fast=prepareFastWords(words);assert.equal(fast.length,100);assert.equal(sessionItems(fast,{count:100,random:false}).length,100);assert.ok(fast.every(w=>w.image&&w.audio));total+=words.length;
 }
 assert.equal(total,400);
});
