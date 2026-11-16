import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVoice,extractWake,routeVoice,wordCandidates,suggestVoiceWords,speechSegments,opensVoiceUniverse,quickVoiceEntry,returnsToAssistant} from './voice.js';
test('voice commands',()=>{for(const [input,kind,value] of [['Show me connect','search','connect'],['Open the universe of connect','universe','connect'],['Expand synonyms','filter','synonym'],['Focus on connection','focus','connection'],['Read the second sentence','read','second'],['Show me collocations','filter','collocation'],['Stop listening','stop','']])assert.deepEqual(parseVoice(input),{kind,value});});

test('wake word supports both phrases, one-shot commands and individual preferences',()=>{
 for(const input of ['Hey, Dash!','Dash','hey dash assistant','Dash Assistant'])assert.deepEqual(extractWake(input),{command:''});
 assert.deepEqual(extractWake('Hey Dash, show me connect'),{command:'show me connect'});
 assert.deepEqual(extractWake('Dash expand synonyms'),{command:'expand synonyms'});
 assert.deepEqual(extractWake('Hey, Dash', 'hey'),{command:''});
 assert.deepEqual(extractWake('Dash','short'),{command:''});
 for(const input of ['vocabulary','I said Dash','Dash is a great app','Dashboard','invocation'])assert.equal(extractWake(input),null);
 assert.equal(extractWake('Dash','hey'),null);
 assert.equal(extractWake('Hey Dash','short'),null);
 assert.equal(parseVoice('Go to sleep').kind,'sleep');
 assert.equal(parseVoice('Stop listening').kind,'stop');
});

test('one tap active session accepts direct and addressed commands; standby is optional',()=>{
 assert.deepEqual(routeVoice(['Show me connect'],'active'),{kind:'command',command:'Show me connect'});
 assert.deepEqual(routeVoice(['Dash, expand synonyms'],'active'),{kind:'wake',command:'expand synonyms'});
 assert.deepEqual(routeVoice(['Hey Dash'],'active'),{kind:'wake',command:''});
 assert.deepEqual(routeVoice(['Go to sleep'],'active'),{kind:'command',command:'Go to sleep'});
 assert.equal(routeVoice(['Show me connect'],'standby'),null);
 assert.deepEqual(routeVoice(['Dash show me connect'],'standby'),{kind:'wake',command:'show me connect'});
 assert.deepEqual(routeVoice(['Hey, Dash!'],'standby'),{kind:'wake',command:''});
 assert.deepEqual(routeVoice(['Stop listening'],'standby'),{kind:'command',command:'Stop listening'});
 assert.equal(routeVoice(['Hey Dash'],'off'),null);
 assert.deepEqual(routeVoice(['noise','Expand synonyms'],'active'),{kind:'command',command:'Expand synonyms'});
});

test('search tolerates filler articles without losing legitimate phrases',()=>{
 assert.deepEqual(wordCandidates('the beautiful'),['the beautiful','beautiful']);
 assert.deepEqual(wordCandidates('the word environment'),['the word environment','environment']);
 assert.deepEqual(wordCandidates('a little'),['a little','little']);
 assert.deepEqual(suggestVoiceWords('enviroment',['environment','apple','environmental']),['environment']);
 assert.deepEqual(suggestVoiceWords('cat',['car']),[]);
});
test('interim recognition is displayed but never sent as a command',()=>{
 const a=Object.assign([{transcript:'Show me the'}],{isFinal:false});
 const b=Object.assign([{transcript:'Show me the beautiful'},{transcript:'Show me beautiful'}],{isFinal:true});
 assert.deepEqual(speechSegments({results:[a],resultIndex:0}),{final:[],interim:'Show me the'});
 assert.deepEqual(speechSegments({results:[b],resultIndex:0}),{final:[['Show me the beautiful','Show me beautiful']],interim:''});
});

import {audioLevel} from './voiceMeter.js';
test('voice visualizer measures signal RMS and ignores silence',()=>{assert.equal(audioLevel(new Float32Array(128)),0);assert.ok(audioLevel(new Float32Array(128).fill(.2))>audioLevel(new Float32Array(128).fill(.05)));assert.ok(audioLevel(new Float32Array(128).fill(1))<=1);});

import {lookupUniverse} from './universe.js';
test('Show me beautiful launches a registered Universe entry directly, with or without an article',()=>{for(const raw of ['Show me beautiful','Show me the beautiful','Dash, show me beautiful','Hey Dash, show me beautiful']){const cmd=parseVoice(extractWake(raw)?.command||raw);assert.equal(opensVoiceUniverse(cmd.kind,cmd.value),true);const item=quickVoiceEntry(cmd.value,[],lookupUniverse);assert.equal(item?.word,'beautiful');assert.ok(item.relatedWords.length>0);}assert.equal(opensVoiceUniverse('examples','beautiful'),false);assert.equal(opensVoiceUniverse('filter','synonym'),false);});

test('universe hands-free commands distinguish assistant return, map history, filters and polite microphone stop',()=>{for(const [raw,kind,value] of [['Back','back',''],['Go back','back',''],['Previous word','previous',''],['Previous page','pageBack',''],['Expand synonyms','filter','synonym'],['Expand the collocations','filter','collocation'],['Expand derivatives','filter','family'],['Expand all','filter','all'],['Expand beautiful','focus','beautiful'],['Expand on beauty','focus','beauty'],['Thank you stop listening','stop',''],['Stop listening please','stop',''],['Can you expand synonyms please','filter','synonym']])assert.deepEqual(parseVoice(raw),{kind,value});assert.equal(returnsToAssistant('back',true),false);assert.equal(returnsToAssistant('dashHome',true),true);assert.equal(returnsToAssistant('close',true),true);assert.equal(returnsToAssistant('previous',true),false);assert.equal(returnsToAssistant('pageBack',true),false);assert.deepEqual(routeVoice(['Thank you stop listening'],'standby'),{kind:'command',command:'Thank you stop listening'});});

import {centerFromRelation} from './universeNavigation.js';
test('Dash is the wake name; old Voca wake phrase is retired',()=>{assert.deepEqual(extractWake('Dash Assistant, show me beautiful'),{command:'show me beautiful'});assert.deepEqual(parseVoice('Dash, expand synonyms'),{kind:'filter',value:'synonym'});assert.equal(extractWake('Hey Voca'),null);assert.equal(extractWake('Dashboard'),null);assert.equal(parseVoice('Back to Dash Assistant').kind,'dashHome');});
test('direct related-node navigation supports existing and leaf words',()=>{const map=word=>word==='beauty'?{word,meaning:'美しさ',relatedWords:[{word:'beautiful'}]}:null;const a=centerFromRelation({word:'beauty',meaning:'美'},map,new Map());assert.equal(a.meaning,'美しさ');assert.equal(a.relatedWords[0].word,'beautiful');const b=centerFromRelation({word:'new phrase',meaning:'新しい表現'},map,new Map());assert.equal(b.word,'new phrase');assert.equal(b.meaning,'新しい表現');});

import {resolveVocabularyEntry} from './voice.js';
test('voice search finds draft-only and course-only nouns verbs adjectives and spelling variants',async()=>{
 const record={headword:'organize/organise',senseId:'s1',meaningJa:'整理する',examples:[{en:'We organize events.',ja:'行事を企画する。'}]};
 const drafts=new Map([['organize',[record]],['organise',[record]],['constraint',[{headword:'constraint',senseId:'s2',meaningJa:'制約',examples:[]}]]]);
 const getCourse=async k=>k==='pragmatic'?{word:k,meaning:'実際的な',english:'They chose a pragmatic solution.'}:null;
 for(const [raw,word] of [['Show me organise','organise'],['Show me constraint','constraint'],['Show me pragmatic','pragmatic']]){
  const cmd=parseVoice(raw),out=await resolveVocabularyEntry(cmd.value,{getDrafts:async()=>drafts,getCourse});
  assert.equal(out?.word,word);
 }
 assert.equal((await resolveVocabularyEntry('pragmatic',{getDrafts:async()=>{throw Error('chunk failed')},getCourse}))?.word,'pragmatic');
 assert.equal(await resolveVocabularyEntry('unregistered',{getDrafts:async()=>drafts,getCourse}),null);
});
test('standby rejects an unaddressed command and accepts addressed words of any class',()=>{
 for(const word of ['develop','evidence','sustainable','gradually']){
  assert.equal(routeVoice(['Show me '+word],'standby'),null);
  const routed=routeVoice(['Dash show me '+word],'standby');assert.equal(parseVoice(routed.command).value,word);
 }
});
import {CATEGORY_WORDS,CATEGORY_CATALOG,categoryUnit} from './category.js';
import {normalizeWords,makeSessionQueue} from './learning.js';
test('category courses cover 100 unique words across 15 courses and retain shared IDs',()=>{
 assert.equal(CATEGORY_WORDS.length,100);assert.equal(new Set(CATEGORY_WORDS.map(w=>w.word)).size,100);assert.equal(CATEGORY_CATALOG.length,15);
 const memberships=new Map();
 for(const course of CATEGORY_CATALOG)for(const unit of course.units){
  const raw=categoryUnit(course.id,unit.id),words=normalizeWords(raw,course.id,unit.id);assert.ok(words.length>0&&words.length<=10);
  for(const w of words){assert.equal(w.choices.length,4);assert.equal(new Set(w.choices).size,4);assert.ok(w.english.toLowerCase().includes(w.word));assert.equal(w.id,'category:'+w.word);memberships.set(w.id,(memberships.get(w.id)||0)+1);}
  assert.deepEqual(makeSessionQueue(words,'study',{}, {questionCount:'all',randomOrder:false}).map(w=>w.id),words.map(w=>w.id));
 }
 assert.equal(memberships.size,100);assert.ok([...memberships.values()].every(n=>n===3));
});

test('personal Universe commands use explicit Dash wake gating',()=>{
 assert.equal(parseVoice('show my universe').kind,'personal');
 assert.equal(parseVoice('show weak words').kind,'weak');
 assert.equal(parseVoice('start mission').kind,'mission');
 assert.equal(extractWake('Dash show my universe').command,'show my universe');
});

test('natural back commands work even after the universe wake window expires',()=>{
 for(const raw of ["so back","so let's go back","hey just back","Hey Dash, let's go back","well go back now","take me back to the previous screen","okay go back again"]){
  assert.equal(parseVoice(raw).kind,'back',raw);
  assert.ok(routeVoice([raw],'standby',{universeOpen:true}),raw);
 }
 assert.equal(routeVoice(['so back'],'standby'),null);
 assert.equal(routeVoice(['so back'],'off',{universeOpen:true}),null);
 for(const raw of ['show me back','show me background','look up back','find backpack'])assert.equal(parseVoice(raw).kind,'search');
 for(const raw of ['my back hurts','I went back yesterday','background music'])assert.equal(parseVoice(raw).kind,'unknown');
 for(const word of ['beauty','sad','accelerator','environment','quickly','back'])assert.deepEqual(parseVoice('Hey Dash, show me '+word),{kind:'search',value:word});
});

import {readFileSync} from 'node:fs';
test('voice resolver can read every canonical original vocabulary sense and requested search examples',async()=>{
 const root=new URL('../../data/vocabulary-drafts/',import.meta.url);const manifest=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));const rows=manifest.batchFiles.flatMap(path=>JSON.parse(readFileSync(new URL(path,root),'utf8')).records);const index=new Map();for(const r of rows)for(const k of [r.headword,...r.headword.split('/')].map(w=>w.toLowerCase().trim())){const list=index.get(k)||[];list.push(r);index.set(k,list);}
 assert.equal(new Set(rows.map(r=>r.wordId)).size,8653);
 for(const [k] of index){const item=await resolveVocabularyEntry(k,{getDrafts:async()=>index});assert.ok(item?.meaning,k);}
 for(const k of ['beauty','sad','accelerator']){const item=await resolveVocabularyEntry(k,{lookup:lookupUniverse,getDrafts:async()=>index});assert.ok(item?.word,k+' must resolve');}
});

import {voiceCandidateChoice,voiceCandidateCommand,nextVoiceWords,recognizedSearchTerms} from './voice.js';
test('successive Universe searches accept Show me without a wake word even in standby',()=>{
 for(const word of ['beauty','sad','accelerator','resilience'])for(const phase of ['active','standby'])assert.deepEqual(routeVoice(['Show me '+word],phase,{universeOpen:true}),{kind:'command',command:'Show me '+word});
 assert.equal(routeVoice(['Show me beauty'],'standby'),null);assert.equal(routeVoice(['Show me beauty'],'off',{universeOpen:true}),null);assert.equal(routeVoice(['I like beauty'],'standby',{universeOpen:true}),null);
});
test('only displayed candidates may be selected by voice or option number',()=>{
 const candidates=['beautiful','beautify','gorgeous','pretty'];
 for(const [utterance,word] of [['Beautiful','beautiful'],['Choose beautify','beautify'],['Number three','gorgeous'],['Option 4','pretty']])assert.deepEqual(routeVoice([utterance],'standby',{universeOpen:true,candidates}),{kind:'command',command:'Show me '+word});
 assert.equal(routeVoice(['beautify'],'standby',{universeOpen:true,candidates:[]}),null);assert.equal(routeVoice(['number five'],'standby',{universeOpen:true,candidates}),null);assert.equal(routeVoice(['beautiful'],'off',{universeOpen:true,candidates}),null);
 assert.equal(voiceCandidateChoice('back',['back']),null);assert.equal(voiceCandidateChoice('choose back',['back']),'back');assert.equal(routeVoice(['back'],'standby',{universeOpen:true,candidates:['back']}).command,'back');
});
test('predictions use recognition alternatives and authored relations without duplicates',()=>{
 assert.deepEqual(nextVoiceWords('beauty',['Beauty','beautiful','BEAUTIFUL'],[{word:'beautify',type:'family'},{word:'gorgeous',type:'synonym'},{word:'Beautiful',type:'related'},{word:'pretty',type:'synonym'},{word:'ugly',type:'contrast'}]),['beautiful','gorgeous','pretty','beautify']);
 assert.deepEqual(recognizedSearchTerms(['Show me beauty','Dash show me beautiful','back','noise']),['beauty','beautiful']);
});

test('a reserved filter name selected explicitly remains a vocabulary query',()=>{assert.equal(voiceCandidateCommand('synonyms'),'Focus on synonyms');assert.deepEqual(routeVoice(['number one'],'standby',{universeOpen:true,candidates:['synonyms']}),{kind:'command',command:'Focus on synonyms'});assert.equal(parseVoice('Show me synonyms').kind,'filter');});

import {profilePages,pushProfileHistory,popProfileHistory} from './wordProfile.js';
test('example commands with a or an and the target word work during Universe standby',()=>{
 for(const phrase of ['Show me a example sentence of accelerator','Show me an example sentence of accelerator','Show me example sentences for accelerator','Show me an example sentence using accelerator']){assert.deepEqual(parseVoice(phrase),{kind:'examples',value:'accelerator'});assert.equal(routeVoice([phrase],'standby',{universeOpen:true}).command,phrase);}
 for(const phrase of ['back home','go back home','so back home','Back to Dash Assistant']){assert.equal(parseVoice(phrase).kind,'dashHome');assert.ok(routeVoice([phrase],'standby',{universeOpen:true}));}
 assert.equal(parseVoice('Back').kind,'back');assert.equal(returnsToAssistant('back',true),false);
 assert.equal(parseVoice('Show me back home').kind,'search');assert.equal(routeVoice(['back home'],'off',{universeOpen:true}),null);
});
test('word profile pagination preserves bilingual examples and distinct sense identities',()=>{
 const data={word:'bank',records:[{senseId:'s1',partOfSpeech:'noun',meaningJa:'銀行',definitionEn:'a financial institution',examples:[{en:'I went to the bank.',ja:'銀行へ行った。'},{en:'The bank is open.',ja:'銀行は開いている。'},{en:'A new bank opened.',ja:'新しい銀行が開店した。'}]},{senseId:'s2',partOfSpeech:'noun',meaningJa:'土手',examples:[{en:'We sat on the river bank.',ja:'川岸に座った。'}]}]};
 const wide=profilePages(data,2),compact=profilePages(data,1);assert.deepEqual(wide.map(p=>p.id),['s1','s1','s2']);assert.equal(compact.length,4);assert.deepEqual(wide.flatMap(p=>p.examples),compact.flatMap(p=>p.examples));assert.equal(wide[2].meaning,'土手');assert.equal(profilePages({word:'missing'})[0].examples.length,0);
});
test('Back restores the last map or profile and its page rather than jumping home',()=>{
 const map={center:{word:'beauty'},filter:'family',page:2,profile:null};const profile={center:{word:'beauty'},profile:{word:'accelerator'},profilePage:1};const history=pushProfileHistory(pushProfileHistory([],map),profile);let a=popProfileHistory(history);assert.deepEqual(a.screen,profile);a=popProfileHistory(a.remaining);assert.deepEqual(a.screen,map);assert.equal(popProfileHistory(a.remaining).screen,null);
});

import {isUrgentVoiceNavigation,isAppleTouchDevice,voiceRestartDelay} from './voice.js';
test('Back and Back home can preempt pending searches without changing explicit word search',()=>{
 assert.equal(isUrgentVoiceNavigation(parseVoice('Back').kind,true),true);
 assert.equal(isUrgentVoiceNavigation(parseVoice('Back home').kind,false),true);
 assert.equal(isUrgentVoiceNavigation(parseVoice('Show me back').kind,true),false);
 assert.equal(isUrgentVoiceNavigation(parseVoice('Show me beautiful').kind,true),false);
 assert.equal(isUrgentVoiceNavigation('back',false),false);
});
test('iPadOS desktop user-agent and iPhone use a single microphone path',()=>{
 assert.equal(isAppleTouchDevice('Mozilla iPad','iPad',5),true);
 assert.equal(isAppleTouchDevice('Mozilla Macintosh','MacIntel',5),true);
 assert.equal(isAppleTouchDevice('Mozilla iPhone','iPhone',5),true);
 assert.equal(isAppleTouchDevice('Mozilla Macintosh','MacIntel',0),false);
 assert.equal(isAppleTouchDevice('Windows Chrome','Win32',0),false);
});
test('recognition reconnects promptly with backoff after failures',()=>{
 assert.equal(voiceRestartDelay(0),40);
 assert.equal(voiceRestartDelay(1),80);
 assert.equal(voiceRestartDelay(2),160);
 assert.equal(voiceRestartDelay(10),800);
});

import {profileWarpSamples,PROFILE_WARP_MS} from './profileWarp.js';
test('profile warp uses a bounded original short sound with smooth endpoints',()=>{const {rate,samples}=profileWarpSamples();assert.equal(samples.length,Math.round(rate*PROFILE_WARP_MS/1000));assert.equal(samples[0],0);assert.ok(Math.abs(samples.at(-1))<.001);assert.ok(samples.some(x=>Math.abs(x)>.1));assert.ok(samples.every(x=>Number.isFinite(x)&&Math.abs(x)<.8));});

import {speculativeVoiceWord,supersedesVoiceLookup} from './voice.js';
test('interim single-word queries may preload but incomplete or navigation commands cannot',()=>{for(const raw of ['Show me beauty','Hey Dash, show me accelerator','Show me sad'])assert.ok(speculativeVoiceWord(raw),raw);for(const raw of ['Show me','Show me an','Show me example','Show me example sentence of beauty','Back','Back home','Show me take off'])assert.equal(speculativeVoiceWord(raw),'',raw);});
test('new searches and back supersede slow requests while unrelated commands do not',()=>{for(const raw of ['Show me beauty','Show me accelerator','Back','Back home']){const cmd=parseVoice(raw);assert.equal(supersedesVoiceLookup(cmd.kind,cmd.value,true),true,raw);}for(const raw of ['Read aloud','Show me synonyms','Show me an example sentence of beauty']){const cmd=parseVoice(raw);assert.equal(supersedesVoiceLookup(cmd.kind,cmd.value,true),false,raw);}});

import {speculativeProfileWord} from './voice.js';
test('example requests can warm the canonical index before final recognition without navigating',()=>{for(const raw of ['Show me example sentence of beauty','Hey Dash, show me an example sentence of beauty','Show me examples for beauty'])assert.equal(speculativeProfileWord(raw),'beauty',raw);for(const raw of ['Show me example sentence','Show me beauty','Back','Back home'])assert.equal(speculativeProfileWord(raw),'',raw);});
