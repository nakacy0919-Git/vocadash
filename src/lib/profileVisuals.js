// Authored visual assets. A headword image is conceptual; example images belong
// to an exact sentence, not to its position in a list or a different sense.
const key=value=>String(value||'').normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
const sentenceKey=value=>key(value).replace(/[.!?]+$/,'');
const base='/images/word-profiles/';
const visuals={
 important:{
  concept:{src:base+'important-concept.webp',alt:'周囲の青いパズルの中で輝く金色のピース'},
  examples:{
   [sentenceKey('Sleep is important for learning.')]:{src:base+'important-sleep-learning.webp',alt:'十分に眠り、元気に学習する生徒'},
   [sentenceKey('This meeting is important to our team.')]:{src:base+'important-team-meeting.webp',alt:'目標について真剣に話し合うチーム'}
  }
 }
};
const uploaded=new Map(Object.entries(typeof __VOCADASH_WORD_IMAGES__==='undefined'?{}:__VOCADASH_WORD_IMAGES__));
export function conceptVisual(word){
 const normalized=key(word);if(!normalized)return null;
 for(const candidate of [normalized,...normalized.split(/\s*\/\s*/)]){
  const src=uploaded.get(candidate)||uploaded.get(candidate.replace(/\s+/g,'_'));
  if(src&&!/-concept\.webp$/i.test(src))return {src,alt:String(word)+' の単語イメージ'};
  const authored=visuals[candidate]?.concept;if(authored)return authored;
  if(src)return {src,alt:String(word)+' の単語イメージ'};
 }
 return null;
}
export function exampleVisual(word,sentence){return visuals[key(word)]?.examples?.[sentenceKey(sentence)]||null;}
