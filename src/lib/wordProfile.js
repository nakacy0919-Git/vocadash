// Keep examples paired with the authored sense instead of combining incompatible meanings.
const clean=s=>typeof s==='string'?s.trim():'';
function examples(rows){const seen=new Set();return (Array.isArray(rows)?rows:[]).filter(e=>clean(e?.en)).map(e=>({en:clean(e.en),ja:clean(e.ja)})).filter(e=>{const key=e.en+'|'+e.ja;if(seen.has(key))return false;seen.add(key);return true;});}
// Draft fields may contain a delimited string or structured vocabulary rows.
export function profileTerms(raw){
 const rows=Array.isArray(raw)?raw:typeof raw==='string'?raw.split(/[,;|、]/):[];
 const seen=new Set();return rows.map(row=>typeof row==='string'?{word:row.trim(),meaning:''}:{word:clean(row?.word||row?.en||row?.term||row?.headword),meaning:clean(row?.meaning||row?.ja||row?.meaningJa)}).filter(row=>{const key=row.word.toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;});
}
export function profilePages(entry,perPage=2){
 const count=Math.max(1,Math.min(2,Number(perPage)||2));
 const records=Array.isArray(entry?.records)?entry.records:[];
 const senses=records.length?records.map(r=>({id:r.senseId,pos:clean(r.partOfSpeech),meaning:clean(r.meaningJa),definition:clean(r.definitionEn),pronunciation:clean(r.pronunciation||r.ipa||entry?.pronunciation||entry?.ipa),cefr:clean(r.cefrSense||r.cefrHeadword||entry?.cefr),synonyms:profileTerms(r.synonyms),antonyms:profileTerms(r.antonyms),family:profileTerms(r.derivatives||r.wordFamily),collocations:profileTerms(r.collocations),draft:r.status==='draft-unreviewed'||!!entry.draft,examples:examples(r.examples)})):[{id:entry?.word,pos:clean(entry?.partOfSpeech||entry?.pos),meaning:clean(entry?.meaning),definition:clean(entry?.definition||entry?.definitionEn),pronunciation:clean(entry?.pronunciation||entry?.ipa),cefr:clean(entry?.cefr||entry?.cefrHeadword),synonyms:profileTerms(entry?.synonyms),antonyms:profileTerms(entry?.antonyms),family:profileTerms(entry?.derivatives||entry?.wordFamily),collocations:profileTerms(entry?.collocations),draft:!!entry?.draft,examples:examples(entry?.examples?.length?entry.examples:entry?.english?[{en:entry.english,ja:entry.japanese}]:[])}];
 return senses.flatMap((sense,senseIndex)=>Array.from({length:Math.max(1,Math.ceil(sense.examples.length/count))},(_,i)=>({...sense,senseIndex,senseCount:senses.length,examples:sense.examples.slice(i*count,(i+1)*count),exampleOffset:i*count,exampleCount:sense.examples.length})));
}
export function pushProfileHistory(history,screen){return [...history.slice(-49),screen];}
export function popProfileHistory(history){return {screen:history.at(-1)||null,remaining:history.slice(0,-1)};}

// Screen budgets depend on the profile's actual available area (not just device width).
export function profileLayout(width=1024,height=650){
 const portrait=width<760, tight=height<470, tiny=height<320||width<480;
 return {portrait,tight,tiny,examples:tiny||tight?1:2,previewTerms:tiny?1:tight?2:3,detailTerms:tiny?3:tight?4:portrait?6:8};
}
// Prefer sense-specific terms. If missing, label word-level links separately.
export function profileRelationRows(senseRows,headRows){
 const own=profileTerms(senseRows),head=profileTerms(headRows),seen=new Set(own.map(row=>row.word.toLowerCase()));
 return [...own.map(row=>({...row,headOnly:false})),...head.filter(row=>!seen.has(row.word.toLowerCase())).map(row=>({...row,headOnly:true}))];
}
export function profileTextPages(text,limit=300){
 const chars=Array.from(String(text||'')),pages=[];let i=0;
 limit=Math.max(40,Number(limit)||300);
 while(i<chars.length){let end=Math.min(i+limit,chars.length);if(end<chars.length){let j=end;while(j>i+limit*.7&&!/\s/.test(chars[j-1]))j--;if(j>i+limit*.7)end=j;}pages.push(chars.slice(i,end).join('').trim());i=end;}
 return pages.length?pages:[''];
}
