// FSRS-6 memory equations (fixed default weights), with VocaDash scheduling and mastery policy.
// https://open-spaced-repetition.github.io/ts-fsrs/guide/model/fsrs-6
const W=[0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542], DAY=86400000, FACTOR=0.9**(-1/W[20])-1;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function recall(m,now=Date.now()){return m?.stability>0&&Number.isFinite(m.lastAt)?(1+FACTOR*Math.max(0,(now-m.lastAt)/DAY)/m.stability)**(-W[20]):0}

export function mastery(m,now=Date.now()){if(!m?.attempts)return 0;const horizon=(1+FACTOR*30/Math.max(.001,m.stability))**(-W[20]);return Math.min(m.lastGrade===1?45:100,m.spacedSuccesses<1?49:m.spacedSuccesses<3?79:100,Math.round(100*horizon*recall(m,now)))}

export function reviewMemory(old,grade,kind,now=Date.now()){
  if(![1,2,3,4].includes(grade))throw new Error('Invalid grade');
  const m=old?.stability>0&&Number.isFinite(old.lastAt)?old:null;
  if(m&&now<m.lastAt)now=m.lastAt;
  const t=m?Math.floor((now-m.lastAt)/DAY):0, initD=g=>W[4]-Math.exp(W[5]*(g-1))+1;
  let s,d;
  if(!m){s=W[grade-1];d=initD(grade);}
  else {
    const D=m.difficulty,S=m.stability,R=recall(m,m.lastAt+t*DAY);
    d=W[7]*initD(4)+(1-W[7])*(D-W[6]*(grade-3)*(10-D)/9);
    if(t===0){const gain=Math.exp(W[17]*(grade-3+W[18]))*S**(-W[19]);s=S*(grade>=3?Math.max(1,gain):gain);}
    else if(grade===1){s=Math.min(W[11]*D**(-W[12])*((S+1)**W[13]-1)*Math.exp(W[14]*(1-R)),S/Math.exp(W[17]*W[18]));}
    else{s=S*(1+Math.exp(W[8])*(11-D)*S**(-W[9])*(Math.exp(W[10]*(1-R))-1)*(grade===2?W[15]:1)*(grade===4?W[16]:1));}
    if(grade===1)s=Math.min(s,S*.85);
  }
  s=clamp(s,.001,36500);d=clamp(d,1,10);
  const spaced=grade>=3&&m&&t>=1?1:0;
  const next={stability:s,difficulty:d,lastAt:now,lastGrade:grade,attempts:(m?.attempts||0)+1,correct:(m?.correct||0)+(grade>=2?1:0),lapses:(m?.lapses||0)+(grade===1?1:0),spacedSuccesses:grade===1?0:(m?.spacedSuccesses||0)+spaced,skills:{...m?.skills,[kind]:(m?.skills?.[kind]||0)+1}};
  next.dueAt=now+(grade===1?10*60000:grade===2?60*60000:Math.max(1,Math.round(s))*DAY);
  return next;
}

export function memoryQueue(words,records,now=Date.now(),limit=10){
  const unique=[...new Map(words.filter(w=>w.id&&w.word&&w.meaning).map(w=>[w.id,w])).values()];
  const due=unique.filter(w=>records[w.id]?.memory?.attempts&&records[w.id].memory.dueAt<=now).sort((a,b)=>records[a.id].memory.dueAt-records[b.id].memory.dueAt);
  const fresh=unique.filter(w=>!records[w.id]?.memory?.attempts);
  return [...due,...fresh].slice(0,limit);
}

export function normalizeAnswer(s){return String(s??'').normalize('NFKC').toLowerCase().trim().replace(/[’‘]/g,"'").replace(/\s+/g,' ')}

export function buildQuestion(word,words,turn=0,random=Math.random){
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const authored=Array.isArray(word.choices)&&word.choices.length===4&&new Set(word.choices.map(normalizeAnswer)).size===4&&normalizeAnswer(word.choices[word.correctIndex])===normalizeAnswer(word.word)&&/_{3,}|＿{3,}/.test(word.prompt||'');
  const typed=!/\.{2,}|…/.test(word.word);
  const pool=[...new Set(words.filter(w=>w.id!==word.id&&normalizeAnswer(w.word)!==normalizeAnswer(word.word)&&w.meaning&&normalizeAnswer(w.meaning)!==normalizeAnswer(word.meaning)).map(w=>w.meaning))];
  const meaning=pool.length>=3;
  const kinds=[...(meaning?['meaning']:[]),...(typed?['typing']:[]),...(authored?['cloze']:[]),...(typed?['listening']:[])];
  if(!kinds.length)return {kind:'recall',prompt:word.word,answer:word.meaning,options:[]};
  const kind=kinds[turn%kinds.length];
  if(kind==='cloze')return {kind,prompt:word.prompt,answer:word.word,options:shuffle(word.choices)};
  if(kind==='meaning')return {kind,prompt:word.word,answer:word.meaning,options:shuffle([word.meaning,...shuffle(pool).slice(0,3)])};
  return {kind,prompt:kind==='typing'?word.meaning:'音声を聞いて入力してください',answer:word.word,options:[]};
}

export function enqueueRetry(queue,index,item){if(item.retry>=2)return queue;const out=[...queue];out.splice(Math.min(out.length,index+4),0,{word:item.word,retry:item.retry+1});return out;}
