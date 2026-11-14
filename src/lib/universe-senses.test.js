import test from 'node:test';
import assert from 'node:assert/strict';
import {allDraftSenses,senseNetworkStats,senseById,sensesFor,searchSenses,candidateTerms,candidateTargets} from './universe-senses.js';
test('original drafts retain unique sense IDs and full translations',()=>{
 const rows=allDraftSenses();
 assert.equal(rows.length,new Set(rows.map(r=>r.id)).size);
 assert.ok(rows.every(r=>r.definition&&r.meaning&&r.examples.every(e=>e[0]&&e[1])));
 assert.deepEqual(senseNetworkStats(),{senses:1133,headwords:995,examples:2266,editorialSenses:45,editorialLinks:135,candidateLinks:1210,mappedSenses:1107,linkedCandidates:94});
});
test('different meanings of the same spelling never share links automatically',()=>{
 const fictional=senseById('VDO-261114-A-00003'), personality=senseById('VDO-261114-A-00004');
 assert.equal(sensesFor('character').length,2);
 assert.ok(candidateTerms(fictional).some(x=>x.word==='protagonist'));
 assert.ok(!candidateTerms(personality).some(x=>x.word==='protagonist'));
 assert.ok(candidateTerms(senseById('VDO-261114-A-00038')).some(x=>x.word==='warm'&&x.type==='contrast'));
 assert.ok(!candidateTerms(senseById('VDO-261114-A-00039')).some(x=>x.word==='warm'));
});
test('imported synonyms stay provisional and target senses are explicitly selectable',()=>{
 assert.ok(allDraftSenses().flatMap(candidateTerms).filter(x=>!x.editorial).every(x=>x.type==='related'&&x.candidate));
 assert.equal(candidateTargets({word:'character'}).length,2);
 assert.ok(searchSenses('性格').some(x=>x.word==='character'));
});
