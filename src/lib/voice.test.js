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

test('universe hands-free commands distinguish assistant return, map history, filters and polite microphone stop',()=>{for(const [raw,kind,value] of [['Back','back',''],['Go back','back',''],['Previous word','previous',''],['Previous page','pageBack',''],['Expand synonyms','filter','synonym'],['Expand the collocations','filter','collocation'],['Expand derivatives','filter','family'],['Expand all','filter','all'],['Expand beautiful','focus','beautiful'],['Expand on beauty','focus','beauty'],['Thank you stop listening','stop',''],['Stop listening please','stop',''],['Can you expand synonyms please','filter','synonym']])assert.deepEqual(parseVoice(raw),{kind,value});assert.equal(returnsToAssistant('back',true),true);assert.equal(returnsToAssistant('close',true),true);assert.equal(returnsToAssistant('previous',true),false);assert.equal(returnsToAssistant('pageBack',true),false);assert.deepEqual(routeVoice(['Thank you stop listening'],'standby'),{kind:'command',command:'Thank you stop listening'});});

import {centerFromRelation} from './universeNavigation.js';
test('Dash is the wake name; old Voca wake phrase is retired',()=>{assert.deepEqual(extractWake('Dash Assistant, show me beautiful'),{command:'show me beautiful'});assert.deepEqual(parseVoice('Dash, expand synonyms'),{kind:'filter',value:'synonym'});assert.equal(extractWake('Hey Voca'),null);assert.equal(extractWake('Dashboard'),null);assert.equal(parseVoice('Back to Dash Assistant').kind,'back');});
test('direct related-node navigation supports existing and leaf words',()=>{const map=word=>word==='beauty'?{word,meaning:'美しさ',relatedWords:[{word:'beautiful'}]}:null;const a=centerFromRelation({word:'beauty',meaning:'美'},map,new Map());assert.equal(a.meaning,'美しさ');assert.equal(a.relatedWords[0].word,'beautiful');const b=centerFromRelation({word:'new phrase',meaning:'新しい表現'},map,new Map());assert.equal(b.word,'new phrase');assert.equal(b.meaning,'新しい表現');});
