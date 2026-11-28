import fs from 'node:fs';
import {formProfile,formCounts} from '../src/lib/wordForms.js';
const base=new URL('../data/vocabulary-drafts/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,base),'utf8'));
const m=read('manifest.json'),rows=m.batchFiles.flatMap(p=>read(p).records),counts={},byPos={},backlog=[];let forms=0;
for(const r of rows){const p=formProfile(r.headword,r.partOfSpeech,r),pos=r.partOfSpeech||'unknown';if(!p.status||!p.forms.length||!p.source)throw Error(r.senseId);counts[p.status]=(counts[p.status]||0)+1;const b=byPos[pos]??={};b[p.status]=(b[p.status]||0)+1;forms+=p.forms.length;if(p.status==='review'||p.status==='conditional')backlog.push({senseId:r.senseId,wordId:r.wordId,headword:r.headword,pos,status:p.status,note:p.note});}
const summary={headwords:new Set(rows.map(r=>r.wordId)).size,senses:rows.length,counts,byPos,displayRows:forms,curatedTables:formCounts(),needsReview:backlog.length};if(summary.senses!==m.totals.senses||summary.headwords!==m.totals.distinctHeadwords)throw Error('Corpus mismatch');
if(process.argv.includes('--output'))fs.writeFileSync(process.argv[process.argv.indexOf('--output')+1],JSON.stringify({summary,backlog},null,2));console.log('MORPHOLOGY_AUDIT '+JSON.stringify(summary));
