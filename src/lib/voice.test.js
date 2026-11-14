import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVoice} from './voice.js';
test('voice commands',()=>{for(const [input,kind,value] of [['Show me connect','search','connect'],['Open the universe of connect','universe','connect'],['Expand synonyms','filter','synonym'],['Focus on connection','focus','connection'],['Read the second sentence','read','second'],['Show me collocations','filter','collocation'],['Stop listening','stop','']])assert.deepEqual(parseVoice(input),{kind,value});});
