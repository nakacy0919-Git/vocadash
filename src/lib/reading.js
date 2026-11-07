// Mirrors Copeak's ordered word-agreement scoring principle.
// Accuracy measures recognized words in order, not pronunciation or prosody.
const WORD = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;
const EXPAND = {
  "i'm":"i am","you're":"you are","we're":"we are","they're":"they are",
  "he's":"he is","she's":"she is","it's":"it is","that's":"that is",
  "there's":"there is","i've":"i have","we've":"we have","you've":"you have",
  "they've":"they have","i'll":"i will","you'll":"you will","we'll":"we will",
  "they'll":"they will","he'll":"he will","she'll":"she will","it'll":"it will",
  "i'd":"i would","you'd":"you would","we'd":"we would","they'd":"they would",
  "don't":"do not","doesn't":"does not","didn't":"did not","can't":"can not",
  "cannot":"can not","won't":"will not","isn't":"is not","aren't":"are not",
  "wasn't":"was not","weren't":"were not","shouldn't":"should not",
  "wouldn't":"would not","couldn't":"could not","hasn't":"has not",
  "haven't":"have not","hadn't":"had not","let's":"let us"
};
export const READING_PASS_PERCENT = 80;
export const READING_SCORE_VERSION = 2; // Strict alignment: insertion/deletion/reordering penalized
export const READING_LEVELS = [
  {level:1,label:'全文表示',hidden:0},
  {level:2,label:'20%を隠す',hidden:.2},
  {level:3,label:'40%を隠す',hidden:.4},
  {level:4,label:'60%を隠す',hidden:.6},
  {level:5,label:'チャレンジ',hidden:.8}
];
export function readingWords(input) {
  // A:/B: are speaker labels, not words that need to be pronounced.
  const clean = String(input || '').normalize('NFKC')
    .replace(/(^|\s)[A-DQ]\s*:\s*/gi, '$1')
    .replace(/[‘’]/g,"'").toLowerCase();
  const original = Array.from(clean.matchAll(WORD),m=>m[0]).slice(0,160);
  const tokens=[],indices=[];
  original.forEach((word,index)=>{
    for(const part of (EXPAND[word] || word).split(' ')) {
      tokens.push(part);indices.push(index);
    }
  });
  return {original,tokens,indices};
}
/**
 * Order-sensitive word accuracy. Insertions, deletions, substitutions and
 * swapped words all lower the score. An extra spoken word cannot yield 100%.
 * Alignment is token-level Levenshtein (cost 1 per word edit), with preferred
 * exact diagonal matches for transparent red/green transcript highlighting.
 */
export function scoreReading(targetText, transcript) {
  const target = readingWords(targetText);
  const spoken = readingWords(transcript);
  const A = target.tokens, B = spoken.tokens;
  const m = A.length, n = B.length;
  const dp = Array.from({length:m+1},()=>new Uint16Array(n+1));
  for (let i=0; i<=m; i++) dp[i][0] = i;
  for (let j=0; j<=n; j++) dp[0][j] = j;
  for (let i=1; i<=m; i++) {
    for (let j=1; j<=n; j++) {
      const cost = A[i-1] === B[j-1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,         // skipped source word
        dp[i][j-1] + 1,         // extra spoken word
        dp[i-1][j-1] + cost     // exact word or substitution
      );
    }
  }
  const matchedTarget = new Set(), matchedSpoken = new Set();
  let i=m, j=n, insertions=0, deletions=0, substitutions=0;
  while (i>0 || j>0) {
    if (i>0 && j>0 && A[i-1] === B[j-1] && dp[i][j] === dp[i-1][j-1]) {
      matchedTarget.add(target.indices[i-1]);
      matchedSpoken.add(spoken.indices[j-1]);
      i--; j--;
    } else if (i>0 && j>0 && dp[i][j] === dp[i-1][j-1]+1) {
      substitutions++; i--; j--;
    } else if (j>0 && dp[i][j] === dp[i][j-1]+1) {
      insertions++; j--;
    } else {
      deletions++; i--;
    }
  }
  const distance=dp[m][n];
  const denominator=Math.max(m,n);
  const percent=denominator ? Math.max(0,Math.round(100*(1-distance/denominator))) : 0;
  const matchedTokenCount = Math.max(0, m - deletions - substitutions);
  return {
    percent,passed:m>0&&n>0&&percent>=READING_PASS_PERCENT,
    matchCount:matchedTokenCount,targetCount:m,
    transcript:String(transcript||''),
    wordMatches:spoken.original.map((value,k)=>({value,matched:matchedSpoken.has(k)})),
    missedWords:target.original.filter((value,k)=>!matchedTarget.has(k)),
    extraWords:spoken.original.filter((value,k)=>!matchedSpoken.has(k)),
    recognizedCount:n,editDistance:distance,insertions,deletions,substitutions
  };
}
/** Effective WPM counts exact words matched in the correct order, not extras. */
export function calculateEffectiveWPM(result, elapsedMs) {
  const minutes = Math.max(1000, Number(elapsedMs) || 1000) / 60000;
  return Math.round(Math.max(0, Number(result?.matchCount) || 0) / minutes);
}

export function maskReadingSentence(sentence,level) {
  const hidden=READING_LEVELS[Math.max(0,Math.min(4,Number(level)-1||0))].hidden;
  const pieces=String(sentence||'').split(/(\s+)/);
  let index=0;
  return pieces.map((text)=>{
    if(!/[\p{L}\p{N}]/u.test(text)) return {text,hidden:false};
    const isSpeaker=/^[A-DQ]:$/i.test(text);
    if(isSpeaker) return {text,hidden:false};
    const slot=(index*7+3)%10;index++;
    return {text,hidden:hidden>0&&slot<hidden*10};
  });
}
export function saveReadingProgress(store,wordId,level,percent,now=Date.now()) {
  const record=store.records[wordId]||{};
  // Older scores used LCS and could award 100% with extra spoken words.
  // Preserve legacy fields in storage, but restart best scores and unlocks
  // under version 2 instead of allowing old, inflated scores to dominate.
  const valid = record.readingScoreVersion === READING_SCORE_VERSION;
  const passed=Number(percent)>=READING_PASS_PERCENT;
  const bestByLevel=Array.from({length:5},(_,i)=>valid ? (Number(record.readingBestByLevel?.[i])||0) : 0);
  const index=Math.min(4,Math.max(0,Number(level)-1||0));
  bestByLevel[index]=Math.max(bestByLevel[index],Number(percent)||0);
  const updated={
    ...record,
    readingScoreVersion:READING_SCORE_VERSION,
    readingAttempts:(record.readingAttempts||0)+1,
    readingBest:Math.max(valid?(Number(record.readingBest)||0):0,Number(percent)||0),
    readingLast:Number(percent)||0,readingLastAt:now,readingBestByLevel:bestByLevel,
    readingClearedLevel:passed?Math.max(valid?(Number(record.readingClearedLevel)||0):0,Number(level)||1):(valid?(Number(record.readingClearedLevel)||0):0)
  };
  return {...store,records:{...store.records,[wordId]:updated}};
}
