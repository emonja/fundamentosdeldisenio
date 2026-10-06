import {test} from 'node:test';
import assert from 'node:assert/strict';
import {roster, classData, stages, properties, testSubject} from '../public/instrumento/model.mjs';
// Exercise the actual local realtime adapter with isolated storage and locks.
const storage = new Map();
globalThis.location = {search:'?demo=1'};
globalThis.localStorage = {getItem:key => storage.get(key) ?? null, setItem:(key,value) => storage.set(key,value)};
globalThis.BroadcastChannel = class {postMessage() {}};
Object.defineProperty(globalThis, 'navigator', {value:{locks:{request:async (name,fn) => fn()}}, configurable:true});
const {watch, changeState, choose} = await import('../public/instrumento/realtime.mjs');
test('full class stays fixed across all stages; Test produces no records', async () => {
  let state, records, individual;
  watch('state',value=>state=value);
  watch('sessions/class-a/answers',value=>records=value);
  watch('sessions/class-a/answers/'+roster[0].id,value=>individual=value);
  await changeState(()=>({session:'class-a',excludedId:roster[24].id,stage:'preparation'}));
  for (let i=0;i<24;i++) await choose(state.session,roster[i],i%4);
  assert.equal(classData(records,state.excludedId).length,24);
  assert.deepEqual(individual,{emotion:0});
  assert.equal(await choose(state.session,roster[0],3),0);
  await choose(state.session,testSubject,2);
  assert.equal(Object.keys(records).length,24);
  assert.equal(records.Test,undefined);
  const original=JSON.stringify(records);
  for (const stage of stages) {
    await changeState(current=>({...current,stage}));
    assert.equal(state.stage,stage);
    assert.equal(JSON.stringify(records),original);
  }
  await assert.rejects(changeState(()=>undefined));
  assert.equal(state.stage,'end');
  await changeState(current=>({...current,session:'class-b',stage:'preparation'}));
  assert.equal(await choose('class-b',roster[0],3),3);
  assert.equal(records[roster[0].id].emotion,0);
});
test('one oscillator stays alive through sound, arrange, color and line', async () => {
  let starts=0,resumes=0,contexts=0; const targets=[];
  globalThis.AudioContext = class {
    state='running';currentTime=0;
    constructor(){contexts++;}
    createOscillator(){return {frequency:{},connect(){return {connect(){}}},start(){starts++;}};}
    createGain(){return {gain:{value:0,cancelScheduledValues(){},setTargetAtTime(value){targets.push(value);}}};}
    async resume(){resumes++;}
  };
  const {Voice}=await import('../public/instrumento/audio.mjs');
  const voice=new Voice();
  await voice.arm(properties(roster[0],0).frequency);
  voice.play(false); for(let i=0;i<4;i++) voice.play(true); voice.play(false);
  assert.equal(starts,1);assert.equal(contexts,1);assert.equal(resumes,1);
  assert.deepEqual(targets,[0,.075,.075,.075,.075,0]);
});
