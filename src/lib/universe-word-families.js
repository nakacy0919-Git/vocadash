// Curated lexical derivation: base-to-member pairs, not automatic suffix guessing.
// No existing synonym/contrast/collocation, inflection label or Japanese gloss is overwritten.
const normalize = value => String(value ?? '').trim().toLowerCase();
const isWord = value => /^[a-z]+(?:-[a-z]+)*$/.test(value);
const pos = new Set(['動詞','名詞','形容詞','副詞']);
export function addCuratedWordFamilies(authored, datasets) {
  const stats = {groups:0,candidatePairs:0,newPairs:0,links:0,heads:0,alreadyFamily:0,protectedExisting:0,duplicateCandidates:0,invalid:0};
  const seen = new Set();
  for (const dataset of datasets) {
    if (dataset?.schemaVersion !== 1 || !Array.isArray(dataset.families)) throw new Error('Invalid word family dataset');
    for (const group of dataset.families) {
      stats.groups++;
      if (!Array.isArray(group) || group.length < 2 || group.some(w=>!isWord(normalize(w?.word))||!w?.meaning?.trim()||!pos.has(w?.partOfSpeech))) { stats.invalid++; continue; }
      const base=group[0];
      for (const member of group.slice(1)) {
        const a=normalize(base.word),b=normalize(member.word);
        if (a===b) {stats.invalid++;continue;}
        const pair=[a,b].sort().join('|');
        if (seen.has(pair)) {stats.duplicateCandidates++;continue;}
        seen.add(pair);stats.candidatePairs++;
        const oldA=authored.get(a),oldB=authored.get(b);
        const ab=oldA?.links.find(l=>normalize(l.word)===b),ba=oldB?.links.find(l=>normalize(l.word)===a);
        // Reverse lookup already exposes a one-way family link. Do not inflate counts.
        if (ab?.type==='family'||ba?.type==='family') {stats.alreadyFamily++;continue;}
        // Keep any established non-family relation; editorial reconciliation is separate.
        if(ab||ba){stats.protectedExisting++;continue;}
        for (const [from,to,x,y] of [[a,b,base,member],[b,a,member,base]]) {
          const previous=authored.get(from);
          if (!previous) stats.heads++;
          const edge={word:to,meaning:y.meaning,partOfSpeech:y.partOfSpeech,type:'family',tier:'related',morphology:['派生・語族'],familySource:'curated-20261115',familyContext:x.meaning};
          authored.set(from,{meaning:previous?.meaning||x.meaning,links:[...(previous?.links||[]),edge]});
          stats.links++;
        }
        stats.newPairs++;
      }
    }
  }
  return stats;
}
