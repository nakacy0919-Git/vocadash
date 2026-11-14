import {gradeAnswer,reviewMemory,recall,isMastered} from './memoryEngine.js';

export function applyMemoryAttempt(store,{id,word,meaning,grade,kind='typing',correct,responseMs,hintUsed=false,selfReported=false,at=Date.now(),attemptId}){
 if(typeof id!=='string'||!id||!Number.isFinite(at))throw new Error('Invalid memory identity or time');
 const previous=store.records[id]||{};
 const attempts=Array.isArray(previous.memoryAttemptIds)?previous.memoryAttemptIds:[];
 if(attemptId&&attempts.includes(attemptId))return store;
 const evidence={responseMs,hintUsed,selfReported};
 const rating=grade??gradeAnswer({correct,kind,...evidence});
 const memory=reviewMemory(previous.memory,rating,kind,at,evidence);
 const row={...previous,...(word?{memoryWord:word}:{}),...(meaning?{memoryMeaning:meaning}:{}),memory,...(attemptId?{memoryAttemptIds:[...attempts,attemptId].slice(-100)}:{})};
 return {...store,records:{...store.records,[id]:row}};
}

export function memorySnapshot(records={},words=[],now=Date.now()){
 const index=new Map(words.map(w=>[w.id,w]));
 return Object.fromEntries(Object.entries(records).filter(([,r])=>r?.memory?.attempts).map(([id,r])=>{
  const w=index.get(id),m=r.memory;
  return [id,{wordId:id,word:r.memoryWord||w?.word||'',meaning:r.memoryMeaning||w?.meaning||'',attempts:m.attempts,retrievability:recall(m,now),dueAt:m.dueAt,mastered:isMastered(m,now),weak:m.lastGrade===1}];
 }));
}

export function quizMemoryAttempt(attempt){
 if(!attempt?.senseId)throw new Error('Missing quiz sense ID');
 return {id:'quiz:'+attempt.senseId,word:attempt.word,meaning:attempt.meaning,kind:attempt.format,correct:attempt.correct,responseMs:attempt.responseMs,hintUsed:attempt.hintCount>0,at:attempt.answeredAt,attemptId:attempt.attemptId};
}

export function universeMemoryAttempt(attempt){
 const term=String(attempt?.word||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
 if(!term)throw new Error('Missing Universe word');
 return {id:attempt.wordId||'universe:'+term,word:attempt.word,kind:attempt.kind,correct:attempt.correct,responseMs:attempt.responseMs,hintUsed:!!attempt.hintUsed,at:attempt.answeredAt,attemptId:attempt.attemptId};
}
