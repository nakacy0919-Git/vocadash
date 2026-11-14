// Add explicitly authored contextual near-synonyms as distinct undirected pairs.
// Only one forward edge is stored; the existing reverse index exposes the other direction.
const normalize = value => String(value || '').trim().toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ');
const pairKey=(a,b)=>[normalize(a),normalize(b)].sort().join('\u0000');
const lexical = w => /^[a-z]+(?:[-'][a-z]+)*$/.test(w);
export function synonymCandidateKeys(groups) {
  const pairs=new Set();
  for(const [,terms] of groups) {
    const words=[...new Set(terms.map(normalize).filter(Boolean))];
    for(let i=0;i<words.length;i++)for(let j=i+1;j<words.length;j++)pairs.add(pairKey(words[i],words[j]));
  }
  return pairs;
}
export function addSynonymMega(authored, groups, limit=5000, options={}) {
  const {batch=1,prioritizeSingle=false,excludeCandidates=new Set()}=options;
  const beforeHeads=authored.size;
  const beforeLinks=[...authored.values()].reduce((n,e)=>n+e.links.length,0);
  const beforeSynonyms=[...authored.values()].reduce((n,e)=>n+e.links.filter(l=>l.type==='synonym').length,0);
  const existing=new Set();
  for(const [head,entry] of authored)for(const link of entry.links)existing.add(pairKey(head,link.word));
  const originalHeads=new Set(authored.keys());
  const distinct=new Set();
  let skippedExisting=0,skippedPriorCandidates=0;
  const queues=groups.map(([sense,terms])=>{
    const words=[...new Set(terms.map(normalize).filter(Boolean))];
    const queue=[];
    for(let i=0;i<words.length;i++)for(let j=i+1;j<words.length;j++){
      const a=words[i],b=words[j],key=pairKey(a,b);
      if(distinct.has(key))continue;
      distinct.add(key);
      if(existing.has(key)){skippedExisting++;continue;}
      if(excludeCandidates.has(key)){skippedPriorCandidates++;continue;}
      // Favor single-word alternatives and existing searchable anchors.
      const score=4*(Number(lexical(a))+Number(lexical(b)))+
        Number(originalHeads.has(a))+Number(originalHeads.has(b));
      queue.push({a,b,sense,key,score,i,j,single:lexical(a)&&lexical(b)});
    }
    return queue.sort((a,b)=>b.score-a.score||a.i-b.i||a.j-b.j);
  });
  const selected=[];
  // Round-robin across senses: avoid concentrating the batch in a few large groups.
  function selectRoundRobin(stage) {
    for(let depth=0;selected.length<limit;depth++){
      let found=false;
      for(const queue of stage){
        if(!queue[depth])continue;
        found=true;selected.push(queue[depth]);
        if(selected.length>=limit)break;
      }
      if(!found)break;
    }
  }
  if(prioritizeSingle){
    selectRoundRobin(queues.map(q=>q.filter(p=>p.single)));
    selectRoundRobin(queues.map(q=>q.filter(p=>!p.single)));
  }else selectRoundRobin(queues);
  const ensured=(w,sense)=>{
    if(!authored.has(w))authored.set(w,{meaning:sense,links:[]});
    return authored.get(w);
  };
  const affected=new Set();
  for(const {a,b,sense} of selected){
    const e1=ensured(a,sense),e2=ensured(b,sense);
    // Favor an outbound edge on a new empty head; otherwise balance link counts.
    const [head,target,entry]=e1.links.length<=e2.links.length?[a,b,e1]:[b,a,e2];
    entry.links.push({
      word:target,meaning:sense,type:'synonym',tier:'related',
      synonymContext:sense,
      note:`「${sense}」の意味に限って近い表現です。語感・強さ・文型が異なる場合があり、すべての文脈で置き換えられるわけではありません。`,
      synonymMega:true,synonymBatch:batch
    });
    affected.add(head);affected.add(target);
  }
  const afterLinks=[...authored.values()].reduce((n,e)=>n+e.links.length,0);
  const afterSynonyms=[...authored.values()].reduce((n,e)=>n+e.links.filter(l=>l.type==='synonym').length,0);
  return {
    groups:groups.length,candidatePairs:distinct.size,skippedExisting,skippedPriorCandidates,batch,singleWordPairs:selected.filter(p=>p.single).length,
    addedPairs:selected.length,headsAdded:authored.size-beforeHeads,
    linksAdded:afterLinks-beforeLinks,affectedHeads:affected.size,
    beforeSynonyms,afterSynonyms,beforeHeads,afterHeads:authored.size,beforeLinks,afterLinks
  };
}
