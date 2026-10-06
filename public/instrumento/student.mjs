import {lookup, emotions, properties, validEmotion} from './model.mjs';
import {watch, connected, choose, presence, demo} from './realtime.mjs';
import {face, field} from './view.mjs';
import {Voice} from './audio.mjs';
const app = document.querySelector('#app'), banner = document.querySelector('#connection');
const voice = new Voice(), clientId = crypto.randomUUID();
const identityKey = demo ? 'fd-demo-identity' : 'fd-instrument-identity';
let student, emotion, state, online = false, armed = false, busy = false, stopAnswers, wakeLock;
let screen = '';
function report(error) {banner.textContent = error.message || 'No se pudo conectar. Revisa tu conexión.';}
async function wake() {
  try {if ('wakeLock' in navigator && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen');} catch {}
}
function cacheKey() {return `${identityKey}:${state.session}:${student.id}`;}
async function registerPresence() {
  if (online && student && armed) try {await presence(state.session, student, clientId);} catch (e) {report(e);}
}
function panel(html) {app.className = 'panel'; app.innerHTML = html;}
function render() {
  if (!state?.session) {
    if (screen !== 'unopened') panel('<p class="eyebrow">Fundamentos del Diseño</p><h1>Espera.</h1><p>El maestro está preparando el instrumento.</p>');
    screen = 'unopened'; voice.play(false); return;
  }
  if (!student) {
    if (screen === 'login') return;
    screen = 'login'; panel('<p class="eyebrow">Fundamentos del Diseño</p><h1>Una multitud.</h1><form><label for="matricula">Matrícula</label><input id="matricula" autocomplete="off" autocapitalize="characters" spellcheck="false" required><button>Entrar</button><p class="error" role="alert"></p></form>');
    app.querySelector('form').onsubmit = e => {
      e.preventDefault(); const found = lookup(app.querySelector('input').value);
      if (!found || found.id === state.excludedId) {app.querySelector('.error').textContent = 'Matrícula fuera de esta sesión. Revísala con el maestro.';return;}
      student = found; localStorage.setItem(identityKey, student.id); bindAnswers();
    };return;
  }
  if (student.id === state.excludedId) {voice.play(false); panel('<h1>Consulta al maestro.</h1><p>Tu matrícula no está incluida en esta sesión.</p>');return;}
  if (!armed || !validEmotion(emotion)) {
    const locked = validEmotion(emotion);
    const key = 'faces:' + student.id + ':' + (locked ? emotion : 'new');
    if (screen === key) return;
    screen = key;
    panel(`<p class="eyebrow">Fundamentos del Diseño · ${String(student.number).padStart(2,'0')}</p><h1>Hola, ${student.firstName}.</h1><p>${locked ? 'Tu respuesta sigue aquí. Toca tu rostro para preparar el sonido.' : '¿Cómo te sientes hoy?'}</p><div class="faces">${emotions.map((e,i) => `<button type="button" data-emotion="${i}" aria-label="${e.label}" ${locked && i !== emotion ? 'disabled' : ''}>${face(i)}</button>`).join('')}</div><p class="error" role="alert"></p>`);
    app.querySelectorAll('[data-emotion]').forEach(button => button.onclick = async () => {
      if (busy || !online) return;
      busy = true; const attempted = Number(button.dataset.emotion);
      app.querySelectorAll('button').forEach(b => b.disabled = true);
      try {
        await voice.arm(properties(student, attempted).frequency);
        // Fullscreen is optional; the audio unlock above is essential.
        document.documentElement.requestFullscreen?.().catch(() => {});
        await wake();
        const session = state.session;
        const saved = await choose(session, student, attempted);
        if (session !== state.session) {voice.play(false);return;}
        emotion = saved; localStorage.setItem(cacheKey(), String(saved));
        armed = true; await registerPresence(); screen = ''; render();
      } catch (e) {
        voice.play(false); screen = ''; render(); app.querySelector('.error').textContent = e.message;
      } finally {busy = false;}
    });return;
  }
  const active = online && ['sound','arrange','color','line'].includes(state.stage);
  voice.play(active);
  if (state.stage === 'preparation') {
    if (screen === 'prepare') return;
    screen = 'prepare'; panel(`<p class="eyebrow">Fundamentos del Diseño</p><h1>Hola, ${student.firstName}.</h1><ul class="instructions"><li>Quita el modo silencio.</li><li>Sube el volumen al máximo.</li><li>Quita el bloqueo automático de pantalla.</li><li>Sube el brillo al máximo.</li></ul><p class="wait">ESPERA.</p>`);
  } else {
    screen = state.stage; field(app, state.stage, student, emotion);
  }
}
function bindAnswers() {
  stopAnswers?.(); emotion = undefined; armed = false; screen = ''; voice.play(false);
  const cached = localStorage.getItem(cacheKey());
  if (cached !== null && validEmotion(Number(cached))) emotion = Number(cached);
  if (student.test) {render();return;}
  stopAnswers = watch(`sessions/${state.session}/answers/${student.id}`, data => {
    if (validEmotion(data?.emotion)) {emotion = data.emotion;localStorage.setItem(cacheKey(), String(emotion));}
    render();
  }, report);
}
connected(value => {
  online = value; banner.textContent = value ? (demo ? 'ENSAYO LOCAL' : '') : 'Sin conexión · el sonido está en pausa';
  if (!value) voice.play(false); else registerPresence();
  render();
}, report);
watch('state', value => {
  const previous = state?.session; state = value;
  if (previous !== state?.session) {
    voice.play(false); armed = false; screen = '';
    student = lookup(localStorage.getItem(identityKey) || '');
    if (student && state?.session) bindAnswers();
  }
  render();
}, report);
document.addEventListener('visibilitychange', () => {if (document.visibilityState === 'visible' && armed) {wake();render();}});
window.addEventListener('pagehide', e => {voice.play(false);if (!e.persisted) voice.close();wakeLock?.release();});
window.addEventListener('pageshow', () => {if (armed) {wake();render();}});
