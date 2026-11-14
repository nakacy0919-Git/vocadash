// A wake word is recognized only at the start of a final utterance.
export function extractWake(raw,mode='both') {
 const t=String(raw||'').trim();
 const m=t.match(/^(hey[\s,]+)?dash(?:\s+assistant)?\b[\s,.:!?-]*(.*)$/i);
 if(!m)return null;
 if(mode==='hey'&&!m[1]||mode==='short'&&m[1])return null;
 const command=m[2].trim();
 // Do not activate on the app name in a normal sentence.
 if(command&&parseVoice(command).kind==='unknown')return null;
 return {command};
}

export function parseVoice(raw) {
 const t=String(raw||'').toLowerCase().replace(/[“”"?.!,]/g,'').replace(/\s+/g,' ').trim().replace(/^(?:hey\s+)?dash(?:\s+assistant)?(?:\s+|$)/,'').replace(/^(?:(?:please|thank you|thanks|okay|ok|can you|could you|would you)\s+)+/,'').replace(/\s+(?:please|thank you|thanks)$/,'').trim();
 const rules=[
 ['stop',/^(stop listening|stop|stop the microphone|turn off (?:the )?(?:mic|microphone|voice)|voice off|stop voice)$/],
 ['sleep',/^(go to sleep|stand by|standby|sleep mode|goodbye dash)$/],
 ['help',/^(help|show commands|what can i say)$/],
 ['home',/^(go home|home|back to dashboard)$/],
 ['close',/^(close (the )?universe|go back to (voca dash|vocadash)|close map|exit universe)$/],
 ['back',/^(go back|back|return|return to (?:the )?(?:assistant|voice assistant|dash assistant)|back to (?:the )?(?:dash )?assistant|go back to (?:the )?(?:dash )?assistant)$/],
 ['previous',/^(previous word|go to the previous word|previous node)$/],
 ['pageBack',/^(previous page|back one page|go to the previous page)$/],
 ['next',/^(next( word| page| question)?|skip)$/],
 ['universe',/^(open|show|launch)( me)? (the |voca )?universe(?: (of|for) (.+))?$/],
 ['filter',/^(?:(show|expand|display|hide) (me )?(the )?)?(synonyms?|similar words|antonyms?|opposites?|word famil(?:y|ies)|derivatives?|derivations?|collocations?|related words|related terms|all relations|all words|all|everything|word forms|inflections)$/],
 ['focus',/^(focus on|center on|centre on|explore|expand on|expand) (.+)$/],
 ['examples',/^(give me|show me|show|give|read) (?:some |the |an? |two |three |[23] )?(?:examples?|example sentences?)(?: (?:of|for) (.+))?$/],
 ['read',/^(read (it|the word|aloud)|pronounce( it)?|say it|read the (first|second|third) (sentence|example))$/],
 ['meaning',/^(show (me )?(the )?meaning|show definition|what does it mean|reveal)$/],
 ['quiz',/^(quiz me|start (a |the )?quiz|give me a quiz)$/],
 ['study',/^(start (study|learning)|study mode|flashcards)$/],
 ['sentence',/^(sentence mode|start example mode)$/],
 ['review',/^(review mode|start review)$/],
 ['list',/^(show (the )?list|list view)$/],
 ['map',/^(show (the )?map|map view)$/],
 ['images',/^(show|hide) images?$/],
 ['translation',/^(show|hide) (japanese|translation)$/],
 ['search',/^(?:show me|look up|find|search for|what does|what is|define|tell me about) (.+?)(?: mean)?$/],
 ];
 for(const [kind,re] of rules){const m=t.match(re);if(!m)continue;let value='';
 if(kind==='universe')value=m[5]||'';
 if(kind==='focus')value=m[2];
 if(kind==='search')value=m[1];
 if(kind==='examples')value=m[2]||'';
 if(kind==='read')value=m[4]||'';
 if(kind==='filter'){const x=m[4];value=/synonym|similar/.test(x)?'synonym':/antonym|opposite/.test(x)?'contrast':/famil|deriv/.test(x)?'family':/collocation/.test(x)?'collocation':/forms|inflections/.test(x)?'forms':/related/.test(x)?'related':'all';}
 if(kind==='images'||kind==='translation')value=m[1];
 return {kind,value};
 }
 return {kind:'unknown',value:t};
}

/** Route recognition alternatives without requiring a wake word during an active session. */
export function routeVoice(alternatives,phase) {
 const texts=(Array.isArray(alternatives)?alternatives:[]).filter(t=>typeof t==='string'&&t.trim());
 if(phase==='off'||!texts.length)return null;
 // Prefer the browser's top result when it already matches a supported command.
 const first=texts[0],wake=extractWake(first);
 if(wake)return {kind:'wake',command:wake.command};
 const parsed=parseVoice(first);
 if(parsed.kind==='stop')return {kind:'command',command:first};
 if(phase==='active'&&parsed.kind!=='unknown')return {kind:'command',command:first};
 // Alternatives can recover a recognition variation, but standby accepts only wake phrases.
 for(const t of texts.slice(1)){
  const w=extractWake(t);
  if(w)return {kind:'wake',command:w.command};
  if(phase==='active'&&parseVoice(t).kind!=='unknown')return {kind:'command',command:t};
 }
 return phase==='active'?{kind:'command',command:first}:null;
}

export function wordCandidates(raw){
 const word=String(raw||'').toLowerCase().trim().replace(/^[“"'‘]+|[”"'’?.!,]+$/g,'').replace(/\s+/g,' ');
 if(!word)return [];
 const stripped=word.replace(/^(?:the word|the term|a word|the|an|a)\s+/,'').replace(/\s+please$/,'').trim();
 return [...new Set([word,stripped].filter(Boolean))];
}
function editDistance(a,b){
 let prev=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){const row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+Number(a[i-1]!==b[j-1]));prev=row;}
 return prev[b.length];
}
// Suggestions are never executed automatically. Preserve real words and distinct meanings.
export function suggestVoiceWords(raw,words,limit=4){
 const q=wordCandidates(raw).at(-1)||'';
 if(q.length<4||q.length>50)return [];
 const max=q.length>=8?2:1;
 return [...new Set(words)].filter(w=>typeof w==='string'&&w!==q&&Math.abs(w.length-q.length)<=max)
  .map(w=>({word:w,d:editDistance(q,w)})).filter(x=>x.d<=max)
  .sort((a,b)=>a.d-b.d||Math.abs(a.word.length-q.length)-Math.abs(b.word.length-q.length)||a.word.localeCompare(b.word)).slice(0,limit).map(x=>x.word);
}
export function speechSegments(event){
 const results=event?.results||[],final=[],interim=[];
 for(let i=event?.resultIndex||0;i<results.length;i++){const r=results[i];const alt=Array.from(r||[]).map(x=>x.transcript).filter(Boolean);if(r.isFinal){if(alt.length)final.push(alt);}else if(alt[0])interim.push(alt[0]);}
 return {final,interim:interim.join(' ')};
}

// A vocabulary query opens the semantic explorer by default; explicit example requests remain separate.
export function opensVoiceUniverse(kind,value){return Boolean(value)&&['search','focus','universe'].includes(kind);}
export function quickVoiceEntry(value,words,lookup){for(const key of wordCandidates(value)){const local=words.find(w=>String(w.word||'').toLowerCase().trim()===key),map=lookup(key);if(map||local)return {...map,...local,word:local?.word||map.word,meaning:local?.meaning||map?.meaning||''};}return null;}

export function returnsToAssistant(kind,universeOpen){return kind==='close'||kind==='back'&&universeOpen;}
