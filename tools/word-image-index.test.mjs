import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {wordImageIndex} from './word-image-index.mjs';
test('indexes new alphabet folders, old uploads, exact variants and encoded paths',()=>{
 const root=mkdtempSync(join(tmpdir(),'voca-images-'));
 try{
  for(const file of ['a/apple.webp','s/school principal\'s office.webp','words/nested/blue.webp','c/color_colour.webp','g/go went.webp','g/go.webp','important-concept.webp','important-sleep-learning.webp','important-team-meeting.webp','g/go-ex1.webp','apple.webp']){
   const path=join(root,file);mkdirSync(join(path,'..'),{recursive:true});writeFileSync(path,'fixture');
  }
  const map=wordImageIndex(root);
  assert.equal(map.apple,'/images/word-profiles/apple.webp');
  assert.equal(map.blue,'/images/word-profiles/words/nested/blue.webp');
  assert.equal(map.color,'/images/word-profiles/c/color_colour.webp');
  assert.equal(map.colour,map.color);
  assert.equal(map.go,'/images/word-profiles/g/go.webp');
  assert.equal(map.went,'/images/word-profiles/g/go%20went.webp');
  assert.equal(map["school principal's office"],"/images/word-profiles/s/school%20principal's%20office.webp");
  assert.equal(map.important,'/images/word-profiles/important-concept.webp');
  assert.equal(map['important-sleep-learning'],undefined);
  assert.equal(map['go-ex1'],undefined);
 }finally{rmSync(root,{recursive:true,force:true});}
});
