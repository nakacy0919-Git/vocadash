// Versioned conservative pilot model; not FSRS and never labelled as a validated test score.
export const MODEL = 'classroom-spaced-v1';
const DAY = 86400000;
const intervals = [0, 1, 3, 7, 14, 30, 60, 120];
export function summarize(attempts, now = Date.now()) {
  const words = new Map();
  let correct = 0, duration = 0;
  for (const a of [...attempts].sort((a,b) => a.created-b.created || a.id.localeCompare(b.id))) {
    const w = words.get(a.word) || {word:a.word,label:a.label,level:0,correct:0,wrong:0,days:new Set(),last:0,due:0};
    const spaced = !w.last || (a.created >= w.due && a.created - w.last >= DAY);
    if (a.correct) { correct++; w.correct++; if (spaced) {w.level = Math.min(7,w.level+1);w.due=a.created+intervals[w.level]*DAY;} }
    else { w.wrong++; w.level=0; w.due=a.created; }
    w.days.add(new Date(a.created).toISOString().slice(0,10));
    w.last=a.created; w.lastCorrect=Boolean(a.correct);
    words.set(a.word,w); duration+=a.duration;
  }
  const list=[...words.values()].map(w=>({...w, retention:Math.round((w.lastCorrect?100:0)*Math.pow(.9,Math.max(0,now-w.last)/(Math.max(1,intervals[w.level])*DAY))), mastered:w.level>=5 && w.days.size>=5 && w.due>now}));
  return {answers:attempts.length,correct,accuracy:attempts.length?Math.round(100*correct/attempts.length):null,minutes:Math.round(duration/6000)/10,learned:list.length,mastered:list.filter(w=>w.mastered).length,due:list.filter(w=>w.due<=now).length,retention:list.length?Math.round(list.reduce((s,w)=>s+w.retention,0)/list.length):null,weak:list.filter(w=>w.wrong || w.due<=now).sort((a,b)=>b.wrong-a.wrong || a.retention-b.retention).slice(0,10)};
}
export function growth(attempts, timezone='UTC') {
 const days=new Map();
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'});
 for(const a of attempts){const day=formatter.format(a.created);if(!days.has(day))days.set(day,[]);days.get(day).push(a);}
 const seen=new Set();return [...days].sort(([a],[b])=>a.localeCompare(b)).map(([day,items])=>{items.forEach(a=>seen.add(a.word));return {day,words:seen.size,answers:items.length};});
}
export function csv(rows) {
 const cell=value=>'"'+String(value??'').replace(/^[\s]*[=+@-]/,"'$&").replaceAll('"','""')+'"';
 return '\uFEFF'+[['ID','表示名','学習分','学習語数','回答数','正答率%','推定定着度%','長期定着語数','要復習語数'],...rows.map(r=>[r.id,r.name,r.minutes,r.learned,r.answers,r.accuracy,r.retention,r.mastered,r.due])].map(r=>r.map(cell).join(',')).join('\r\n');
}

// Never combine the memory state of two learners who studied the same word.
export function classSummary(attempts,now=Date.now()){
 const learners=new Map();for(const a of attempts){if(!learners.has(a.user_id))learners.set(a.user_id,[]);learners.get(a.user_id).push(a);}
 const values=[...learners.values()].map(a=>summarize(a,now));
 const total={answers:0,correct:0,minutes:0,learned:0,mastered:0,due:0,retention:null,accuracy:null,weak:[]};
 let weighted=0;const weak=new Map();
 for(const s of values){for(const k of ['answers','correct','minutes','learned','mastered','due'])total[k]+=s[k];weighted+=(s.retention||0)*s.learned;for(const w of s.weak){const old=weak.get(w.word)||{...w,wrong:0,retention:0,students:0};old.wrong+=w.wrong;old.retention+=w.retention;old.students++;weak.set(w.word,old);}}
 total.minutes=Math.round(total.minutes*10)/10;total.retention=total.learned?Math.round(weighted/total.learned):null;total.accuracy=total.answers?Math.round(total.correct*100/total.answers):null;total.weak=[...weak.values()].map(w=>({...w,retention:Math.round(w.retention/w.students)})).sort((a,b)=>b.students-a.students||b.wrong-a.wrong).slice(0,10);return total;
}
