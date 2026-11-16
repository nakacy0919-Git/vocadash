// Authored visual assets. A headword image is conceptual; example images belong
// to an exact sentence, not to its position in a list or a different sense.
const key=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
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
export function conceptVisual(word){return visuals[key(word)]?.concept||null;}
export function exampleVisual(word,sentence){return visuals[key(word)]?.examples[sentenceKey(sentence)]||null;}
