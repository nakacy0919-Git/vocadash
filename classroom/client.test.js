import {test} from 'node:test';
import assert from 'node:assert/strict';
import {beginClassroom,endClassroom,recordClassroom,flushClassroom} from '../src/classroom/client.js';
test('offline outbox survives retry and does not send another learner data',async()=>{
 const previous={fetch:globalThis.fetch,localStorage:globalThis.localStorage,document:globalThis.document};
 const storage=new Map(),sent=[];let online=false;
 globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 globalThis.document={hidden:false};
 globalThis.fetch=async(_url,options)=>{if(!online)throw new Error('offline');sent.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true})};};
 try{
 const a={id:'assignment',course:'course',unit:'1'};beginClassroom('alice',a,()=>{});
 recordClassroom({id:'word',word:'word'},true,'quiz',{courseId:'different',unitId:'1'});assert.equal(storage.size,0);
 recordClassroom({id:'word',word:'word'},true,'quiz',{courseId:'course',unitId:'1'});await new Promise(setImmediate);
 const pending=JSON.parse(storage.get('vd-classroom-outbox:alice:assignment'));assert.equal(pending.length,1);
 online=true;endClassroom();beginClassroom('bob',a,()=>{});await flushClassroom();assert.equal(sent.length,0);
 beginClassroom('alice',a,()=>{});await flushClassroom();assert.equal(sent.length,1);assert.equal(sent[0].items[0].id,pending[0].id);assert.deepEqual(JSON.parse(storage.get('vd-classroom-outbox:alice:assignment')),[]);
 }finally{endClassroom();Object.assign(globalThis,previous);}
});
