import {lockChoice} from './model.mjs';
export const demo = new URLSearchParams(location.search).get('demo') === '1';
const watchers = new Map();
const localKey = 'fd-instrument-demo-v1';
let sdk;
if (!demo) sdk = await import('../presentacion/js/firebase.js');
const channel = demo ? new BroadcastChannel(localKey) : null;
function localRead() {return JSON.parse(localStorage.getItem(localKey) || '{}');}
function at(data, key) {return key.split('/').reduce((node, part) => node?.[part], data) ?? null;}
function notify() {const data = localRead(); for (const [key, fns] of watchers) for (const fn of fns) fn(at(data, key));}
if (channel) channel.onmessage = notify;
function localWrite(key, value) {
  const data = localRead(), parts = key.split('/'); let node = data;
  for (const part of parts.slice(0,-1)) node = node[part] ||= {};
  node[parts.at(-1)] = value;
  localStorage.setItem(localKey, JSON.stringify(data)); notify(); channel.postMessage('changed');
}
export function watch(key, callback, error) {
  if (!demo) return sdk.onValue(sdk.ref(sdk.db, 'instrument/' + key), s => callback(s.val()), error);
  if (!watchers.has(key)) watchers.set(key, new Set());
  watchers.get(key).add(callback); callback(at(localRead(), key));
  return () => watchers.get(key).delete(callback);
}
export function connected(callback, error) {
  if (demo) {callback(true); return () => {};}
  return sdk.onValue(sdk.ref(sdk.db, '.info/connected'), s => callback(s.val() === true), error);
}
export async function changeState(update) {
  if (demo) return navigator.locks.request(localKey, () => {
    const next = update(localRead().state);
    if (next === undefined) throw new Error('La etapa ya cambió. Revisa el master.');
    localWrite('state', next);
  });
  const tx = await sdk.runTransaction(sdk.ref(sdk.db, 'instrument/state'), update);
  if (!tx.committed) throw new Error('No se pudo cambiar la etapa.');
}
export async function choose(session, student, emotion) {
  // Test answers never enter RTDB or class records.
  if (student.test) return emotion;
  const key = 'sessions/' + session + '/answers';
  if (demo) return navigator.locks.request(localKey, () => {
    const records = at(localRead(), key) || {};
    const choice = lockChoice(records[student.id] ?? null, emotion);
    if (choice) {records[student.id] = choice; localWrite(key, records);}
    return records[student.id].emotion;
  });
  const answer = sdk.ref(sdk.db, 'instrument/' + key + '/' + student.id);
  const tx = await sdk.runTransaction(answer, current => lockChoice(current, emotion));
  return tx.snapshot.val().emotion;
}
export async function presence(session, student, clientId) {
  if (student.test || demo) return;
  const me = sdk.ref(sdk.db, `instrument/sessions/${session}/presence/${student.id}/${clientId}`);
  // Install removal before setting presence; re-register on every reconnect.
  await sdk.onDisconnect(me).remove();
  await sdk.set(me, true);
}
