import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVoice,extractWake,routeVoice,wordCandidates,suggestVoiceWords,speechSegments} from './voice.js';
test('voice commands',()=>{for(const [input,kind,value] of [['Show me connect','search','connect'],['Open the universe of connect','universe','connect'],['Expand synonyms','filter','synonym'],['Focus on connection','focus','connection'],['Read the second sentence','read','second'],['Show me collocations','filter','collocation'],['Stop listening','stop','']])assert.deepEqual(parseVoice(input),{kind,value});});

test('wake word supports both phrases, one-shot commands and individual preferences',()=>{
 for(const input of ['Hey, Voca!','Voca','hey voca dash','Voka'])assert.deepEqual(extractWake(input),{command:''});
 assert.deepEqual(extractWake('Hey Voca, show me connect'),{command:'show me connect'});
 assert.deepEqual(extractWake('Voca expand synonyms'),{command:'expand synonyms'});
 assert.deepEqual(extractWake('Hey, Voca', 'hey'),{command:''});
 assert.deepEqual(extractWake('Voca','short'),{command:''});
 for(const input of ['vocabulary','I said Voca','Voca is a great app','Vocal','invocation'])assert.equal(extractWake(input),null);
 assert.equal(extractWake('Voca','hey'),null);
 assert.equal(extractWake('Hey Voca','short'),null);
 assert.equal(parseVoice('Go to sleep').kind,'sleep');
 assert.equal(parseVoice('Stop listening').kind,'stop');
});

test('one tap active session accepts direct and addressed commands; standby is optional',()=>{
 assert.deepEqual(routeVoice(['Show me connect'],'active'),{kind:'command',command:'Show me connect'});
 assert.deepEqual(routeVoice(['Voca, expand synonyms'],'active'),{kind:'wake',command:'expand synonyms'});
 assert.deepEqual(routeVoice(['Hey Voca'],'active'),{kind:'wake',command:''});
 assert.deepEqual(routeVoice(['Go to sleep'],'active'),{kind:'command',command:'Go to sleep'});
 assert.equal(routeVoice(['Show me connect'],'standby'),null);
 assert.deepEqual(routeVoice(['Voca show me connect'],'standby'),{kind:'wake',command:'show me connect'});
 assert.deepEqual(routeVoice(['Hey, Voca!'],'standby'),{kind:'wake',command:''});
 assert.deepEqual(routeVoice(['Stop listening'],'standby'),{kind:'command',command:'Stop listening'});
 assert.equal(routeVoice(['Hey Voca'],'off'),null);
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
