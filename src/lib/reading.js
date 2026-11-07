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
export function scoreReading(targetText,transcript) {
  const t=readingWords(targetText),s=readingWords(transcript);
  const A=t.tokens,B=s.tokens,m=A.length,n=B.length;
  const dp=Array.from({length:m+1},()=>new Uint16Array(n+1));
  for(let i=m-1;i>=0;i--) {
    for(let j=n-1;j>=0;j--) {
      dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
    }
  }
  const matchedTarget=new Set(),matchedSpoken=new Set();
  let i=0,j=0;
  while(i<m&&j<n) {
    if(A[i]===B[j]) {
      matchedTarget.add(t.indices[i]);matchedSpoken.add(s.indices[j]);i++;j++;
    } else if(dp[i+1][j]>=dp[i][j+1]) i++;
    else j++;
  }
  const percent=m?Math.min(100,Math.round(dp[0][0]/m*100)):0;
  return {
    percent, passed: m>0 && n>0 && percent>=READING_PASS_PERCENT,
    matchCount:dp[0][0],targetCount:m,
    transcript:String(transcript||''),
    wordMatches:s.original.map((value,k)=>({value,matched:matchedSpoken.has(k)})),
    missedWords:t.original.filter((value,k)=>!matchedTarget.has(k)),
    recognizedCount:n
  };
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
  const passed=Number(percent)>=READING_PASS_PERCENT;
  const bestByLevel=Array.from({length:5},(_,i)=>Number(record.readingBestByLevel?.[i])||0);
  const index=Math.min(4,Math.max(0,Number(level)-1||0));
  bestByLevel[index]=Math.max(bestByLevel[index],Number(percent)||0);
  const updated={
    ...record,readingAttempts:(record.readingAttempts||0)+1,
    readingBest:Math.max(record.readingBest||0,Number(percent)||0),
    readingLast:Number(percent)||0,readingLastAt:now,readingBestByLevel:bestByLevel,
    readingClearedLevel:passed?Math.max(record.readingClearedLevel||0,Number(level)||1):record.readingClearedLevel||0
  };
  return {...store,records:{...store.records,[wordId]:updated}};
}
