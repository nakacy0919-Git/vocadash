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
