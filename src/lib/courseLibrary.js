export const PAGE_SIZE=12;
export function libraryPage(words,page=0,pageSize=PAGE_SIZE){
 const size=Math.max(1,Math.floor(Number(pageSize)||PAGE_SIZE)),pages=Math.max(1,Math.ceil(words.length/size)),index=Math.min(pages-1,Math.max(0,Math.floor(Number(page)||0)));
 return {page:index,pages,items:words.slice(index*size,(index+1)*size),start:index*size};
}
const labels={v:'動詞',verb:'動詞',n:'名詞',noun:'名詞',a:'形容詞',adj:'形容詞',adjective:'形容詞',r:'副詞',adv:'副詞',adverb:'副詞',pronoun:'代名詞',preposition:'前置詞',conjunction:'接続詞',determiner:'限定詞',interjection:'間投詞','phrasal verb':'句動詞',phrase:'句・表現',article:'冠詞',numeral:'数詞',modal:'助動詞',auxiliary:'助動詞'};
export function posLabel(raw){const key=String(raw||'').trim().toLowerCase().replace(/\.$/,'');return labels[key]||String(raw||'').trim()||'品詞未登録';}
export function examplesFor(word){const rows=Array.isArray(word?.examples)?word.examples.map(x=>({en:x.en||'',ja:x.ja||''})).filter(x=>x.en):[];return rows.length?rows:word?.english?[{en:word.english,ja:word.japanese||''}]:[];}
export function feedbackDelay(word,base=850){return word?.image||word?.english?Math.max(base,2600):base;}
