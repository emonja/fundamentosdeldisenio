import {roster, stages, labels, classMembers, classData} from './model.mjs';
import {watch, connected, changeState, demo} from './realtime.mjs';
import {field} from './view.mjs';
const control = document.body.dataset.view === 'control';
const app = document.querySelector('#app'), banner = document.querySelector('#connection');
let state, records = {}, presence = {}, online = false, busy = false, stopAnswers, stopPresence;
function report(error) {banner.textContent = error.message || 'No se pudo conectar.';}
function matrix(container) {
  for (const s of classMembers(state?.excludedId)) {
    const tile = document.createElement('div');
    const data = classData(records, state?.excludedId).find(x => x.id === s.id);
    field(tile, state?.stage === 'preparation' ? 'sound' : data ? state?.stage : 'end', s, data?.emotion);
    if (!data) tile.classList.add('empty');
    tile.setAttribute('aria-label', `${s.number}: ${data ? 'presente' : 'en espera'}`);
    container.append(tile);
  }
}
async function mutate(update) {
  busy = true; render();
  try {await changeState(update);} catch(e) {report(e);} finally {busy = false;render();}
}
function render() {
  const count = classData(records, state?.excludedId).length;
  const total = classMembers(state?.excludedId).length;
  const stageIndex = stages.indexOf(state?.stage);
  if (!control) {
    app.className = 'universe';
    if (!state?.session || total !== 24) {app.innerHTML = '<p class="eyebrow">Fundamentos del Diseño</p><h1>Una multitud.</h1><p>Espera al maestro.</p>';return;}
    app.innerHTML = `<header><h1>${labels[stageIndex] || 'Una multitud.'}</h1><span>${count} / 24</span></header><div class="matrix"></div>`;
    matrix(app.querySelector('.matrix'));return;
  }
  app.className = 'master';
  app.innerHTML = `<p class="eyebrow">Fundamentos del Diseño · Master</p><h1>${labels[stageIndex] || 'Una multitud.'}</h1><p>${count} / ${total} respuestas · ${classData(records,state?.excludedId).filter(s => Object.keys(presence[s.id] || {}).length).length} conectados</p><nav><a href="./${demo ? '?demo=1' : ''}" target="_blank">Estudiante</a><a href="projection.html${demo ? '?demo=1' : ''}" target="_blank">Proyección</a></nav><div id="actions"></div><div class="matrix"></div><details><summary>Lista de clase</summary><ol>${classMembers(state?.excludedId).map(s=>`<li value="${s.number}">${s.name} · ${s.id}${records[s.id] ? ' ✓' : ''}</li>`).join('')}</ol></details><p class="session"></p>`;
  app.querySelector('.session').textContent = state?.session || 'Sin sesión';
  const actions = app.querySelector('#actions');
  if (!state?.session || total !== 24) {
    actions.innerHTML = `<div class="setup"><p>La imagen contiene 25 estudiantes. Selecciona quién no participa para abrir la matriz de 24.</p><label for="exclude">Excluir de esta sesión</label><select id="exclude"><option value="">Selecciona una matrícula</option>${roster.map(s=>`<option value="${s.id}">${s.number} · ${s.name}</option>`).join('')}</select><button id="open">Abrir sesión · preparación</button></div>`;
    actions.querySelector('#open').disabled = !online || busy;
    actions.querySelector('#open').onclick = () => {
      const excludedId = actions.querySelector('select').value;
      if (!excludedId) return;
      const session = crypto.randomUUID();
      mutate(current => current?.session && classMembers(current.excludedId).length === 24 ? undefined : {session, excludedId, stage:'preparation'});
    };
  } else {
    const next = stages[stageIndex + 1];
    actions.innerHTML = `<button class="advance" id="next" ${!next || !online || busy ? 'disabled' : ''}>${next ? '→ ' + labels[stageIndex+1] : 'Sesión terminada'}</button><button id="stop" ${!online || busy || state.stage === 'end' ? 'disabled' : ''}>Detener sonido</button><details><summary>Nueva clase</summary><p>Las respuestas de esta sesión se conservan. Una clase nueva vuelve a pedir el rostro y comienza en silencio.</p><button id="new">Abrir nueva sesión</button></details>`;
    const expected = {...state};
    actions.querySelector('#next').onclick = () => mutate(current => current?.session === expected.session && current.stage === expected.stage ? {...current,stage:next} : undefined);
    actions.querySelector('#stop').onclick = () => mutate(current => current?.session === expected.session ? {...current,stage:'end'} : undefined);
    actions.querySelector('#new').disabled = !online || busy;
    actions.querySelector('#new').onclick = () => {
      const session = crypto.randomUUID();
      mutate(current => current?.session === expected.session ? {...current,session,stage:'preparation'} : undefined);
    };
  }
  if (state?.session && total === 24) matrix(app.querySelector('.matrix'));
}
connected(value => {online = value;banner.textContent = value ? (demo ? 'ENSAYO LOCAL' : '') : 'Sin conexión · controles en pausa';render();}, report);
watch('state', value => {
  const previous = state?.session;state = value;
  if (previous !== state?.session) {
    stopAnswers?.();stopPresence?.();records = {};presence = {};
    if (state?.session) {
      stopAnswers = watch(`sessions/${state.session}/answers`, value => {records = value || {};render();}, report);
      stopPresence = watch(`sessions/${state.session}/presence`, value => {presence = value || {};render();}, report);
    }
  }
  render();
}, report);
