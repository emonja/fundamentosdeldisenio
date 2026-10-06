import {test} from 'node:test';
import assert from 'node:assert/strict';
import {roster, lookup, testSubject, properties, classData, classMembers, lockChoice, stages, emotions} from '../public/instrumento/model.mjs';
test('transcribed identities are unique; Test is exact and never part of the class', () => {
  assert.equal(roster.length,25);
  assert.equal(new Set(roster.map(s => s.id)).size,25);
  assert.equal(lookup('Test'),testSubject);
  assert.equal(lookup('test'),undefined);
  assert.equal(testSubject.number,33);
  assert.equal(lookup(' a01648271 ').firstName,'Pedro');
  assert.equal(classMembers(roster[24].id).length,24);
  assert.deepEqual(classData({Test:{emotion:0}}, roster[24].id),[]);
  assert.deepEqual(classData({[roster[24].id]:{emotion:0}}, roster[24].id),[]);
});
test('identity determines unique stable pitch and stroke, independent of emotion', () => {
  assert.equal(new Set(roster.map(s => properties(s,0).frequency)).size,25);
  assert.equal(new Set(roster.map(s => properties(s,0).thickness)).size,25);
  for (const s of roster) for (let i=0;i<4;i++) {
    const p=properties(s,i), initial=properties(s,0);
    assert.equal(p.frequency,initial.frequency);
    assert.equal(p.hue,initial.hue);
    assert.equal(p.thickness,initial.thickness);
    assert.ok(p.hue>=195 && p.hue<=211);
    assert.equal(p.light,emotions[i].light);
  }
});
test('first choice is locked; invalid states and unknown IDs do not count', () => {
  assert.deepEqual(lockChoice(null,2),{emotion:2});
  assert.equal(lockChoice({emotion:2},3),undefined);
  assert.throws(()=>lockChoice(null,4));
  const records={[roster[0].id]:{emotion:2},unknown:{emotion:3},Test:{emotion:1},[roster[1].id]:{emotion:9}};
  assert.equal(classData(records,roster[24].id).length,1);
  assert.deepEqual(stages,['preparation','sound','arrange','color','line','end']);
});
