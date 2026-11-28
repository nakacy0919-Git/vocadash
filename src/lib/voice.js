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

// SpeechRecognition uses one locale at a time; the grammar supports both.
const jaRelation={'類義語':'synonym','同義語':'synonym','対義語':'contrast','反意語':'contrast','派生語':'family','語形':'forms','語形変化':'forms','関連語':'related','コロケーション':'collocation','連語':'collocation'};
const jaAliases={'ビー':'bee','ビイ':'bee','ミツバチ':'bee','蜜蜂':'bee','フライ':'fly','クック':'cook','アップル':'apple','インポータント':'important','ビューティフル':'beautiful'};
export function parseJapaneseVoice(raw){
 const t=String(raw||'').normalize('NFKC').trim().replace(/[。！？!?、]+$/g,'').replace(/\s*([ぁ-んァ-ヶ一-龯])\s*/g,'$1').replace(/^(?:ねえ)?(?:ダッシュ|dash)[、,:]?/i,'').replace(/^(?:すみません|お願い|では|じゃあ)/,'');
 const target=x=>{const w=x.trim().replace(/^[「『"'“]+|[」』"'”]+$/g,'');return jaAliases[w]||w.toLowerCase();};
 const end='(?:を)?(?:表示(?:して(?:ください)?|する)?|見せて(?:ください)?|教えて(?:ください)?|開いて(?:ください)?|出して(?:ください)?|調べて(?:ください)?)';
 const named=t.match(new RegExp('^(.+?)の(類義語|同義語|対義語|反意語|派生語|語形変化|語形|関連語|コロケーション|連語|例文|意味|詳細)'+end+'$'));
 if(named){const [,word,what]=named;if(jaRelation[what])return {kind:'search',value:target(word),relation:jaRelation[what]};return {kind:'examples',value:target(word)};}
 const current=t.match(new RegExp('^(類義語|同義語|対義語|反意語|派生語|語形変化|語形|関連語|コロケーション|連語|例文|意味|詳細)'+end+'$'));
 if(current){const what=current[1];return jaRelation[what]?{kind:'filter',value:jaRelation[what]}:{kind:what==='意味'?'meaning':'examples',value:''};}
 if(/^(?:前の画面に戻って|前に戻って|戻って|戻る)$/.test(t))return {kind:'back',value:''};
 if(/^(?:次へ|次のページ|次のページを表示して)$/.test(t))return {kind:'next',value:''};
 if(/^(?:音声認識を停止して|マイクを止めて|停止して)$/.test(t))return {kind:'stop',value:''};
 if(/^(?:画像を表示して|画像を見せて)$/.test(t))return {kind:'images',value:'show'};
 if(/^(?:画像を隠して|画像を非表示にして)$/.test(t))return {kind:'images',value:'hide'};
 const generic=t.match(new RegExp('^(.+?)'+end+'$'));
 if(generic&&/[ぁ-んァ-ヶ一-龯]/.test(t))return {kind:'search',value:target(generic[1])};
 return null;
}
export function parseVoice(raw) {
 const japanese=parseJapaneseVoice(raw);if(japanese)return japanese;
 const t=String(raw||'').toLowerCase().replace(/[“”"?.!,]/g,'').replace(/\s+/g,' ').trim().replace(/^(?:hey\s+)?dash(?:\s+assistant)?(?:\s+|$)/,'').replace(/^(?:(?:please|thank you|thanks|okay|ok|can you|could you|would you)\s+)+/,'').replace(/\s+(?:please|thank you|thanks)$/,'').trim();
 // Natural requests for a full lexical profile, not just a map.
 const natural=t.match(/^(?:(?:i (?:want|need|would like) to|i'd like to|let's|lets|let me)\s+)?(?:take a look at|have a look at|look at|learn about|learn more about|know more about|see details (?:of|for|about)|see (?:the )?(?:word )?(?:profile|details) (?:of|for)|show (?:me )?(?:the )?(?:word )?(?:profile|details|information) (?:of|for|about))\s+(.+)$/);
 if(natural)return {kind:'examples',value:natural[1].replace(/^(?:the word|the term)\s+/,'')};
 const details=t.match(/^(?:show(?: me)?|give me|tell me) (?:the )?(?:synonyms?|antonyms?|pronunciation|cefr level|definition|meaning|collocations?|word family) (?:of|for) (.+)$/);
 if(details)return {kind:'examples',value:details[1]};
 // Explicit home requests must not be interpreted as one-step history navigation.
 if(/^(?:(?:so|well|hey|just|okay|ok|please|then|now|let's|lets)\s+)*(?:(?:go|come|take me|bring me)\s+)?back(?:\s+to)?\s+(?:(?:the\s+)?(?:dash(?: assistant)?|voice assistant|assistant)|home(?: screen)?)$/.test(t.replace(/’/g,"'")))return {kind:'dashHome',value:''};
 // Accept natural return phrases, but never interpret a vocabulary query such as 'show me back' as navigation.
 const backPhrase=t.replace(/’/g,"'").replace(/^(?:(?:so|well|hey|just|okay|ok|please|then|now|let's|lets|let us|i want to|can we|shall we|we should)\s+)+/,'');
 if(/^(?:(?:go|come|get|take me|bring me|move|head)\s+)?back(?:\s+(?:now|again|a bit|to (?:the )?(?:previous screen|original screen|last screen|assistant|dash assistant)))?$/.test(backPhrase))return {kind:'back',value:''};
 const rules=[
 ['personal',/^(my universe|show my universe|personal universe)$/],
 ['weak',/^(show weak words|weak words|fading planets)$/],
 ['mission',/^(start mission|exploration mission|show missions)$/],
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
 ['examples',/^(give me|show me|show|give|read) (?:some |the |an? |two |three |[23] )?(?:examples?|example sentences?)(?: (?:of|for|with|using) (.+))?$/],
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

// Candidate choices are valid only while that specific list is displayed.
// Exact matching prevents unrelated conversation from starting a new search.
export function voiceCandidateCommand(word){const command='Show me '+word;return parseVoice(command).kind==='search'?command:'Focus on '+word;}
export function voiceCandidateChoice(raw,candidates=[]){
 const t=String(raw||'').normalize('NFKC').toLowerCase().trim().replace(/[“”"?!.,]+$/g,'').replace(/\s+/g,' ');
 const jp=t.match(/^(?:番号)?([1-6一二三四五六])(?:番|番目)?$/);if(jp){const n='一二三四五六'.includes(jp[1])?'一二三四五六'.indexOf(jp[1])+1:Number(jp[1]);return candidates[n-1]||null;}
 const match=t.match(/^(?:number|option|choice|candidate)\s+(one|two|three|four|five|six|[1-6])$/);
 if(match){const n=({one:1,two:2,three:3,four:4,five:5,six:6})[match[1]]||Number(match[1]);return candidates[n-1]||null;}
 const key=t.replace(/^(?:choose|select|open)\s+(?:the word\s+)?/,'');
 if(key===t&&parseVoice(t).kind!=='unknown')return null;
 return candidates.find(w=>String(w).normalize('NFKC').toLowerCase().trim()===key)||null;
}
/** Active sessions and an open Universe support uninterrupted follow-up searches. */
export function routeVoice(alternatives,phase,{universeOpen=false,candidates=[]}={}) {
 const texts=(Array.isArray(alternatives)?alternatives:[]).filter(t=>typeof t==='string'&&t.trim());
 if(phase==='off'||!texts.length)return null;
 for(const t of texts){
  const wake=extractWake(t);if(wake)return {kind:'wake',command:wake.command};
  const parsed=parseVoice(t);
  if(parsed.kind==='stop'||(universeOpen&&(['back','dashHome','close','examples','meaning','previous','pageBack','next','read','map','list'].includes(parsed.kind)||opensVoiceUniverse(parsed.kind,parsed.value))))return {kind:'command',command:t};
  if(phase==='active'&&parsed.kind!=='unknown')return {kind:'command',command:t};
  const choice=voiceCandidateChoice(t,candidates);
  if(choice)return {kind:'command',command:voiceCandidateCommand(choice)};
 }
 return phase==='active'?{kind:'command',command:texts[0]}:null;
}
// Suggestions are derived only from known lexical entries, never generated guesses.
// Prefer speech alternatives, then semantic links; exclude the current word.
export function nextVoiceWords(current,alternatives=[],relations=[],limit=4){
 const key=w=>String(w||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
 const seen=new Set([key(current)]),out=[];
 const add=raw=>{const word=typeof raw==='string'?raw:raw?.word;const k=key(word);if(!k||k.length>65||seen.has(k))return;seen.add(k);out.push(word.trim());};
 for(const word of alternatives)add(word);
 for(const type of ['synonym','family','related','contrast','collocation'])for(const link of relations)if(link?.type===type)add(link);
 return out.slice(0,limit);
}
export function recognizedSearchTerms(alternatives=[]){
 const keys=new Set();
 for(const raw of alternatives){const parsed=parseVoice(extractWake(raw)?.command||raw);if(opensVoiceUniverse(parsed.kind,parsed.value))for(const k of wordCandidates(parsed.value))keys.add(k);}
 return [...keys];
}

export function wordCandidates(raw){
 const word=String(raw||'').normalize('NFKC').toLowerCase().trim().replace(/^[“"'‘]+|[”"'’?.!,]+$/g,'').replace(/\s+/g,' ');
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

export function returnsToAssistant(kind,universeOpen){return kind==='close'||kind==='dashHome';}

/** Resolve authored maps, original course words and draft entries without requiring a network. */
export async function resolveVocabularyEntry(raw,{words=[],lookup=()=>null,getDrafts=async()=>new Map(),getCourse=async()=>null}={}){
 const exact=String(raw||'').normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ');
 const keys=[...new Set([exact,...wordCandidates(raw)].filter(Boolean))];
 for(const k of keys){const map=lookup(k),local=words.find(w=>String(w.word||'').toLowerCase().trim()===k);if(map||local)return {...map,...local,word:local?.word||map?.word||k,meaning:local?.meaning||map?.meaning||''};}
 if(!keys.length)return null;
 const drafts=await Promise.resolve().then(getDrafts).catch(()=>new Map());
 for(const k of keys){
  const records=drafts.get(k)||[];
  if(records.length){
   const first=records[0],examples=records.flatMap(r=>(r.examples||[]).map(e=>({...e,senseId:r.senseId})));
   // Do not present unreviewed paraphrases as verified semantic edges.
   return {word:k,meaning:first.meaningJa,records,examples,english:examples[0]?.en||'',japanese:examples[0]?.ja||'',draft:true};
  }
 }
 for(const k of keys){const course=await Promise.resolve().then(()=>getCourse(k)).catch(()=>null);if(course)return {...course,examples:course.english?[{en:course.english,ja:course.japanese}]:[]};}
 return null;
}

// A deliberately requested navigation must not queue behind a slow vocabulary lookup.
export function isUrgentVoiceNavigation(kind,universeOpen){return kind==='dashHome'||kind==='close'||kind==='stop'||(universeOpen&&['back','previous'].includes(kind));}
export function isAppleTouchDevice(ua='',platform='',touchPoints=0){return /iPhone|iPad|iPod/i.test(ua)||(platform==='MacIntel'&&touchPoints>1);}
export function voiceRestartDelay(failures=0){return Math.min(800,40*Math.pow(2,Math.max(0,failures)));}

// Preload only complete explicit queries. Never execute interim text (Back may become Back home).
export function speculativeVoiceWord(raw){
 const text=String(raw||'').trim();const parsed=parseVoice(extractWake(text)?.command||text);
 if(parsed.kind!=='search'||!parsed.value)return '';
 const word=parsed.value.trim();
 if(word.split(/\s+/).length!==1||! /^[a-z][a-z'-]{1,48}$/i.test(word)||/^(?:the|an|a|word|example|examples|sentence|meaning|definition|please)$/i.test(word))return '';
 return word.toLowerCase();
}
export function supersedesVoiceLookup(kind,value,universeOpen){
 return isUrgentVoiceNavigation(kind,universeOpen)||opensVoiceUniverse(kind,value)||kind==='back';
}

// Example commands can prefetch their target independently of the final command dispatch.
export function speculativeProfileWord(raw){
 const text=String(raw||'').trim(),parsed=parseVoice(extractWake(text)?.command||text);
 if(parsed.kind!=='examples'||!parsed.value)return '';
 const keys=wordCandidates(parsed.value);
 return keys.at(-1)||'';
}
