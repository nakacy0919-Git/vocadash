import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data/voca-roots/';
const manifest=JSON.parse(fs.readFileSync(dir+'manifest.json','utf8'));
const load=prefix=>manifest.files.filter(f=>f.startsWith(prefix+'-')).flatMap(f=>JSON.parse(fs.readFileSync(dir+f,'utf8')).records);
const roots=load('roots'),prefixes=load('prefixes'),suffixes=load('suffixes'),links=load('word-links'),quizzes=load('quizzes');
const all=[...roots,...prefixes,...suffixes],ids=new Set(all.map(x=>x.id)), byId=new Map(all.map(x=>[x.id,x]));
const unique=xs=>assert.equal(new Set(xs).size,xs.length,'duplicate ID');
unique(all.map(x=>x.id));unique(links.map(x=>x.id));unique(quizzes.map(x=>x.id));
const candidates=JSON.parse(fs.readFileSync('data/vocabulary-drafts/candidate-index.json','utf8')).entries;
for(const m of all){assert.ok(m.forms.length&&m.meaningJa&&m.meaningEn&&m.exampleHeadwords.length>=3);assert.equal(m.status,'draft-unreviewed');}
for(const l of links){assert.ok(ids.has(l.morphemeId));assert.equal(l.wordId,candidates[l.headword]?.wordId??null);assert.ok(byId.get(l.morphemeId).exampleHeadwords.includes(l.headword));}
for(const q of quizzes){assert.ok(ids.has(q.morphemeId));assert.equal(q.answerId,q.morphemeId);assert.equal(q.choices.length,4);unique(q.choices.map(c=>c.id));unique(q.choices.map(c=>c.labelJa));assert.ok(q.choices.every(c=>ids.has(c.id)));assert.ok(q.choices.some(c=>c.id===q.answerId));assert.equal(q.quizEligible,false);}
const actual={roots:roots.length,prefixes:prefixes.length,suffixes:suffixes.length,relations:links.length,distinctHeadwords:new Set(links.map(x=>x.headword)).size,matchedRelations:links.filter(x=>x.wordId).length,matchedDistinctHeadwords:new Set(links.filter(x=>x.wordId).map(x=>x.headword)).size,unresolvedRelations:links.filter(x=>!x.wordId).length,quizzes:quizzes.length,imagePrompts:roots.filter(r=>r.imageHintJa).length,generatedImages:0};
assert.deepEqual(actual,manifest.counts);assert.equal(manifest.productionEnabled,false);console.log(JSON.stringify(actual,null,2));
