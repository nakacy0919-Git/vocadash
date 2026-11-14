import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVoice,extractWake} from './voice.js';
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
