export async function api(path,body) {
 const response=await fetch('/api/classroom/'+path,{credentials:'same-origin',...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'接続できません');return result;
}
let context=null, busy=false, started=Date.now();
const queueKey=()=>`vd-classroom-outbox:${context.userId}:${context.assignment.id}`;
export function beginClassroom(userId,assignment,onStatus){context={userId,assignment,onStatus};started=Date.now();}
export function endClassroom(){context=null;}
export function startQuestion(){started=Date.now();}
export function recordClassroom(word,correct,mode,selection){
 if(!context)return;if(selection.courseId!==context.assignment.course||selection.unitId!==context.assignment.unit){context.onStatus('課題の教材に戻ると記録を再開します');return;}
 const key=queueKey();try{const queue=JSON.parse(localStorage.getItem(key)||'[]');if(queue.length>=500)throw new Error('未送信の記録が500件あります。接続後に再試行してください');queue.push({id:crypto.randomUUID(),word:word.id,label:word.word,correct,duration:document.hidden?0:Math.min(120000,Date.now()-started),mode,created:Date.now()});localStorage.setItem(key,JSON.stringify(queue));context.onStatus('未送信 '+queue.length+'件');flushClassroom();}catch(e){context.onStatus('保存エラー: '+e.message);}started=Date.now();
}
export async function flushClassroom(){
 if(!context||busy)return;const active=context,key=queueKey();busy=true;
 try{if(document.hidden)return;const queue=JSON.parse(localStorage.getItem(key)||'[]');if(!queue.length){active.onStatus('送信済み');return;}await api('attempts',{assignmentId:active.assignment.id,items:queue.slice(0,50)});const ids=new Set(queue.slice(0,50).map(i=>i.id));const remaining=JSON.parse(localStorage.getItem(key)||'[]').filter(i=>!ids.has(i.id));localStorage.setItem(key,JSON.stringify(remaining));active.onStatus(remaining.length?'未送信 '+remaining.length+'件':'送信済み');}catch(e){active.onStatus('未送信・再試行待ち: '+e.message);}finally{busy=false;}
}
