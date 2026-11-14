// FSRS-6 memory equations (fixed default weights), with VocaDash scheduling and mastery policy.
// https://open-spaced-repetition.github.io/ts-fsrs/guide/model/fsrs-6
import {choiceIndex,wordOptions} from './fourChoices.js';
const W=[0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542], DAY=86400000, FACTOR=0.9**(-1/W[20])-1;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function recall(m,now=Date.now()){return m?.stability>0&&Number.isFinite(m.lastAt)?(1+FACTOR*Math.max(0,(now-m.lastAt)/DAY)/m.stability)**(-W[20]):0}

export function mastery(m,now=Date.now()){if(!m?.attempts||!m.correct)return 0;const horizon=(1+FACTOR*30/Math.max(.001,m.stability))**(-W[20]);return Math.min(m.lastGrade===1?Math.min(45,m.lapseCeiling??45):100,m.spacedSuccesses<1?49:m.spacedSuccesses<3?79:100,Math.round(100*horizon*recall(m,now)))}

export function reviewMemory(old,grade,kind,now=Date.now(),evidence={}){
  if(!Number.isFinite(now))throw new Error("Invalid review time");
  if(![1,2,3,4].includes(grade))throw new Error('Invalid grade');
  const m=old?.stability>0&&Number.isFinite(old.lastAt)?old:null;
  if(m&&now<m.lastAt)now=m.lastAt;
  const t=m?Math.floor((now-m.lastAt)/DAY):0, initD=g=>W[4]-Math.exp(W[5]*(g-1))+1;
  let s,d;
  if(!m){s=W[grade-1];d=initD(grade);}
  else {
    const D=m.difficulty,S=m.stability,R=recall(m,m.lastAt+t*DAY);
    d=W[7]*initD(4)+(1-W[7])*(D-W[6]*(grade-3)*(10-D)/9);
    if(t===0){const gain=Math.exp(W[17]*(grade-3+W[18]))*S**(-W[19]);s=S*(grade>=2?Math.max(1,gain):gain);}
    else if(grade===1){s=Math.min(W[11]*D**(-W[12])*((S+1)**W[13]-1)*Math.exp(W[14]*(1-R)),S/Math.exp(W[17]*W[18]));}
    else{s=S*(1+Math.exp(W[8])*(11-D)*S**(-W[9])*(Math.exp(W[10]*(1-R))-1)*(grade===2?W[15]:1)*(grade===4?W[16]:1));}

  }
  s=clamp(s,.001,36500);d=clamp(d,1,10);
  const spaced=grade>=3&&m&&t>=1?1:0;
  const next={stability:s,difficulty:d,lastAt:now,lastGrade:grade,attempts:(m?.attempts||0)+1,correct:(m?.correct||0)+(grade>=2?1:0),lapses:(m?.lapses||0)+(grade===1?1:0),spacedSuccesses:grade===1?0:(m?.spacedSuccesses||0)+spaced,skills:{...m?.skills,[kind]:(m?.skills?.[kind]||0)+1}};
  if(grade===1)next.lapseCeiling=Math.max(0,mastery(m,now)-5);
  next.schemaVersion=2;
  next.introducedAt=m?.introducedAt??(m?.attempts?null:now);
  next.retention=clamp(Number.isFinite(evidence.retention)?evidence.retention:.9,.8,.97);
  next.dueAt=now+(grade===1?10*60000:grade===2&&t===0?60*60000:Math.max(1,Math.round(intervalDays(s,next.retention)))*DAY);
  const prior=m?.skillStats?.[kind]||{};
  const responseMs=Number.isFinite(evidence.responseMs)&&evidence.responseMs>=0?evidence.responseMs:null;
  next.skillStats={...m?.skillStats,[kind]:{attempts:(prior.attempts||0)+1,correct:(prior.correct||0)+(grade>=2?1:0),unaided:(prior.unaided||0)+(grade>=3?1:0),lapses:(prior.lapses||0)+(grade===1?1:0),lastGrade:grade,lastAt:now,responseMs}};
  const previousHistory=Array.isArray(m?.history)?m.history:[];
  next.history=[...previousHistory,{at:now,kind,grade,responseMs,hintUsed:!!evidence.hintUsed,recallBefore:recall(m,now),stability:s,difficulty:d,dueAt:next.dueAt,mastery:mastery(next,now)}].slice(-200);
  return next;
}

// FSRS inverse curve; learning steps, rating and mastery remain product policies.
export function intervalDays(stability,retention=.9){
  if(!Number.isFinite(stability)||stability<=0||!Number.isFinite(retention)||retention<=0||retention>=1)throw new Error('Invalid interval input');
  return stability/FACTOR*(retention**(-1/W[20])-1);
}

export function gradeAnswer({correct,responseMs,hintUsed=false,selfReported=false,kind='typing'}){
  if(!correct)return 1;
  // Slow answers are successful recall, never a lapse. Speed alone cannot earn Easy.
  const slow={meaning:12000,typing:30000,cloze:20000,listening:40000,recall:20000}[kind]||30000;
  return hintUsed||selfReported||(Number.isFinite(responseMs)&&responseMs>slow)?2:3;
}

const uniqueWords=words=>[...new Map(words.filter(w=>w.id&&w.word&&w.meaning).map(w=>[w.id,w])).values()];
const priority=(m,now)=>(m.lastGrade===1?4:0)+(1-recall(m,now))*3+Math.min(2,Math.max(0,(now-m.dueAt)/DAY)/Math.max(1,m.stability));
export function memoryQueue(words,records,now=Date.now(),limit=10){
  const unique=uniqueWords(words);
  const due=unique.filter(w=>records[w.id]?.memory?.attempts&&records[w.id].memory.dueAt<=now).sort((a,b)=>priority(records[b.id].memory,now)-priority(records[a.id].memory,now)||records[a.id].memory.dueAt-records[b.id].memory.dueAt);
  const fresh=unique.filter(w=>!records[w.id]?.memory?.attempts);
  return [...due,...fresh].slice(0,Math.max(0,Math.floor(limit)));
}

export function dailyPlan(words,records,now=Date.now(),{minutes=10,newLimit=10}={}){
  const unique=uniqueWords(words);
  const memories=Object.values(records).map(r=>r?.memory).filter(Boolean);
  const today=new Date(now).toDateString();
  const introducedToday=memories.filter(m=>Number.isFinite(m.introducedAt)&&new Date(m.introducedAt).toDateString()===today).length;
  const times=memories.flatMap(m=>Object.values(m.skillStats||{})).map(s=>s.responseMs).filter(t=>Number.isFinite(t)&&t>0);
  const seconds=times.length?clamp(times.reduce((a,b)=>a+b,0)/times.length/1000+10,20,90):30;
  const capacity=Math.max(1,Math.floor(Math.max(0,Number.isFinite(minutes)?minutes:10)*60/seconds));
  const due=memoryQueue(unique,records,now,unique.length).filter(w=>records[w.id]?.memory?.attempts);
  const fresh=unique.filter(w=>!records[w.id]?.memory?.attempts);
  const reviews=due.slice(0,capacity),newWords=fresh.slice(0,Math.max(0,Math.min(newLimit-introducedToday,capacity-reviews.length)));
  return {words:[...reviews,...newWords],reviews:reviews.length,newWords:newWords.length,backlog:due.length-reviews.length,introducedToday,estimatedMinutes:Math.ceil((reviews.length+newWords.length)*seconds/60),nextDueAt:Math.min(...unique.map(w=>records[w.id]?.memory?.dueAt).filter(t=>Number.isFinite(t)&&t>now),Infinity)};
}

export function weakWords(words,records,now=Date.now(),limit=5){
  return uniqueWords(words).filter(w=>records[w.id]?.memory?.attempts).map(word=>{
    const m=records[word.id].memory,stats=Object.entries(m.skillStats||{});
    const weakest=stats.sort((a,b)=>(a[1].unaided/a[1].attempts)-(b[1].unaided/b[1].attempts))[0];
    return {word,recall:recall(m,now),mastery:mastery(m,now),lapses:m.lapses,weakestKind:weakest?.[0]||null,score:priority(m,now)+(weakest?1-weakest[1].unaided/weakest[1].attempts:0)};
  }).sort((a,b)=>b.score-a.score).slice(0,limit);
}

export function isMastered(m,now=Date.now()){
  const production=['typing','listening'].some(k=>(m?.skillStats?.[k]?.unaided||0)>=2);
  const recognition=['meaning','cloze','typing-choice','listening-choice','spelling','definition','en-ja','ja-en'].filter(k=>(m?.skillStats?.[k]?.unaided||0)>=2).length>=2;
  return !!(m?.spacedSuccesses>=3&&m.stability>=30&&m.lastGrade>=3&&(production||recognition)&&mastery(m,now)>=80);
}

export function normalizeAnswer(s){return String(s??'').normalize('NFKC').toLowerCase().trim().replace(/[’‘]/g,"'").replace(/\s+/g,' ')}

export function buildQuestion(word,words,turn=0,random=Math.random,memory=null){
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const authored=Array.isArray(word.choices)&&word.choices.length===4&&new Set(word.choices.map(normalizeAnswer)).size===4&&normalizeAnswer(word.choices[word.correctIndex])===normalizeAnswer(word.word)&&/_{3,}|＿{3,}/.test(word.prompt||'');
  const typed=!/\.{2,}|…/.test(word.word);
  const index=choiceIndex(words), englishOptions=typed?wordOptions(word,index,{random}):[];
  const pool=[...new Map(words.filter(w=>w.id!==word.id&&normalizeAnswer(w.word)!==normalizeAnswer(word.word)&&w.meaning&&normalizeAnswer(w.meaning)!==normalizeAnswer(word.meaning)).map(w=>[normalizeAnswer(w.meaning),w.meaning])).values()];
  const meaning=pool.length>=3;
  const kinds=[...(meaning?['meaning']:[]),...(englishOptions.length===4?['typing']:[]),...(authored?['cloze']:[]),...(englishOptions.length===4?['listening']:[])];
  if(!kinds.length)return {kind:'recall',prompt:word.word,answer:word.meaning,options:[]};
  const stats=memory?.skillStats||{};
  const ranked=[...kinds].sort((a,b)=>{
    const skill=k=>stats[k==='typing'||k==='listening'?k+'-choice':k]||stats[k];
    const score=k=>skill(k)?.attempts?skill(k).unaided/skill(k).attempts:0;
    return score(a)-score(b)||(stats[a]?.lastAt||0)-(stats[b]?.lastAt||0);
  });
  const kind=memory&&turn%3!==0?ranked[0]:kinds[turn%kinds.length];
  if(kind==='cloze')return {kind,prompt:word.prompt,answer:word.word,options:shuffle(word.choices)};
  if(kind==='meaning')return {kind,prompt:word.word,answer:word.meaning,options:shuffle([word.meaning,...shuffle(pool).slice(0,3)])};
  return {kind,prompt:kind==='typing'?word.meaning:'音声を聞いて正しい英単語を選んでください',answer:word.word,options:englishOptions};
}

export function enqueueRetry(queue,index,item){if(item.retry>=2)return queue;const out=[...queue];out.splice(Math.min(out.length,index+4),0,{word:item.word,retry:item.retry+1});return out;}
