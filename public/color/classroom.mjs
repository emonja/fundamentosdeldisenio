import {db, ref, onValue, set, runTransaction} from '../presentacion/js/firebase.js';

const STAGES = [
  {id:'welcome', label:'Bienvenidos al color', student:'Bienvenidos al color'},
  {id:'piano', label:'Pintura de color con piano', student:'Mira la proyección.'},
  {id:'explore', label:'Explorar el color', student:'Toma una foto y explora tono, saturación y valor.'},
  {id:'paint', label:'Recolorear', student:'Pinta sobre la imagen en blanco y negro.'},
  {id:'harmony', label:'Armonías en papel', student:'Consulta la rueda y lleva tus decisiones al papel.'},
  {id:'tool', label:'Una herramienta útil', student:'Vas a hacer esto en tu cabeza. Por mientras, aquí está una herramienta útil.'}
];
const $ = id => document.getElementById(id);
const view = document.body.dataset.view;
const statePath = 'color/classroom/state';
const stateNode = ref(db, statePath);
let state = null;
let online = false;
let sessionId = null;
let base = null;
let paintLayer = null;
let ctx = null;
let brushColor = '#D72D47';
let painting = false;
let camera = null;
let currentStage = '';
let notes = {};
let noteFades = new Map();
let animation = 0;

function safeText(el, text) { el.textContent = text; }
function stageIndex(id) { return STAGES.findIndex(s => s.id === id); }
function currentStageData() { return STAGES[stageIndex(state?.stage)] || null; }
function status(text) { const el = $('connection'); if (el) safeText(el, text || ''); }

onValue(ref(db, '.info/connected'), snap => {
  online = snap.val() === true;
  status(online ? 'CONECTADO' : 'Sin conexión');
  if (view === 'control') renderControl();
});

onValue(stateNode, snap => {
  const incoming = snap.val();
  if (view === 'student' && incoming?.session !== sessionId) {
    sessionId = incoming?.session || null;
    base = null; paintLayer = null; stopCamera(); currentStage = '';
  }
  state = incoming;
  if (view === 'control') renderControl();
  if (view === 'student') renderStudent();
  if (view === 'projection') renderProjection();
});

if (view === 'projection') {
  onValue(ref(db, 'color/broadcast/notes'), snap => {
    const incoming = snap.val() || {};
    const now = Date.now();
    for (const [pitch, note] of Object.entries(incoming)) {
      const old = notes[pitch];
      if (!old || old.seq !== note.seq || old.active !== note.active) {
        if (note.active) noteFades.set(pitch, {at:now, active:true});
        else {
          const fade = noteFades.get(pitch) || {at:now, active:false};
          noteFades.set(pitch, {at:now, active:false, seq:note.seq, started:fade.started || fade.at || now});
        }
      }
    }
    notes = incoming;
  });
  startBlobAnimation();
}

function renderControl() {
  const app = $('app');
  const idx = stageIndex(state?.stage);
  const active = idx >= 0;
  app.innerHTML = '';
  app.className = 'master';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  safeText(eyebrow, 'Fundamentos del Diseño · Color');
  app.append(eyebrow);

  const title = document.createElement('h1');
  safeText(title, active ? STAGES[idx].label : 'Control de clase');
  app.append(title);

  const links = document.createElement('nav');
  links.className = 'links';
  [
    ['Proyección', 'projection.html'],
    ['Vista estudiante', 'index.html']
  ].forEach(([label, href]) => {
    const a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener';
    safeText(a, label); links.append(a);
  });
  app.append(links);

  const stepper = document.createElement('div');
  stepper.className = 'stepper';
  STAGES.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'step' + (i === idx ? ' current' : i < idx ? ' passed' : '');
    const n = document.createElement('span'); n.className = 'step-number'; safeText(n, String(i+1).padStart(2,'0'));
    const label = document.createElement('span'); label.className = 'step-label'; safeText(label, item.label);
    row.append(n, label); stepper.append(row);
  });
  app.append(stepper);

  const actions = document.createElement('div');
  actions.className = 'actions';
  if (!active) {
    const start = document.createElement('button');
    start.className = 'primary'; start.disabled = !online;
    safeText(start, online ? 'Iniciar · Bienvenidos al color' : 'Esperando conexión');
    start.onclick = () => set(stateNode, {session:crypto.randomUUID(), stage:'welcome', updatedAt:Date.now()});
    actions.append(start);
  } else {
    const previous = document.createElement('button');
    safeText(previous, '← Anterior'); previous.disabled = !online || idx === 0;
    previous.onclick = () => moveStage(idx - 1);
    const next = document.createElement('button'); next.className = 'primary';
    safeText(next, idx === STAGES.length - 1 ? 'Fin de recorrido' : 'Siguiente → ' + STAGES[idx+1].label);
    next.disabled = !online || idx === STAGES.length - 1;
    next.onclick = () => moveStage(idx + 1);
    actions.append(previous, next);
  }
  app.append(actions);

  const reset = document.createElement('button');
  reset.className = 'quiet danger';
  safeText(reset, active ? 'Cerrar sesión' : 'Limpiar estado');
  reset.disabled = !online;
  reset.onclick = () => set(stateNode, null);
  app.append(reset);

  const note = document.createElement('p');
  note.className = 'master-note';
  safeText(note, 'La foto y las decisiones de color permanecen en cada teléfono; el control maestro solo cambia la etapa del grupo.');
  app.append(note);
}
async function moveStage(target) {
  if (!online || !STAGES[target]) return;
  await runTransaction(stateNode, current => {
    if (!current || current.session !== state?.session) return;
    return {...current, stage:STAGES[target].id, updatedAt:Date.now()};
  });
}

function renderProjection() {
  const app = $('app');
  const stage = currentStageData();
  if (!stage) {
    app.className = 'projection waiting';
    app.innerHTML = '<p class="eyebrow">Fundamentos del Diseño · Color</p><h1>Esperando al maestro.</h1>';
    return;
  }
  if (currentStage === state.stage) return;
  currentStage = state.stage;
  app.className = 'projection stage-' + state.stage;
  app.innerHTML = '';
  if (state.stage === 'piano') {
    const canvas = document.createElement('canvas'); canvas.id = 'blobs';
    app.append(canvas);
    const copy = document.createElement('div'); copy.className = 'projection-copy';
    copy.innerHTML = '<p class="eyebrow">Pintura de color con piano</p><h1>Una tecla.<br>Una mancha.</h1><p>El sonido dibuja en color.</p>';
    app.append(copy);
    requestAnimationFrame(resizeBlobCanvas);
    return;
  }
  const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow';
  safeText(eyebrow, 'Fundamentos del Diseño · Color · ' + String(stageIndex(state.stage)+1).padStart(2,'0'));
  const title = document.createElement('h1'); safeText(title, stage.label);
  app.append(eyebrow, title);
  const copy = document.createElement('p'); copy.className = 'projection-prompt';
  const prompts = {
    welcome:'Una sesión para mirar, probar y decidir.',
    explore:'En tu teléfono: toma una foto. Mueve tono, saturación y valor.',
    paint:'La forma y la luz permanecen. ¿Qué cambia cuando regresas el color?',
    harmony:'Una composición por cada tipo de armonía. Color sobre papel.',
    tool:'Vas a hacer esto en tu cabeza. Por mientras, aquí está una herramienta útil.'
  };
  safeText(copy, prompts[state.stage] || '');
  app.append(copy);
  if (state.stage === 'harmony' || state.stage === 'tool') {
    const a = document.createElement('a');
    a.className = 'projection-link';
    a.href = state.stage === 'harmony' ? 'referencia-armonias.html' : 'rueda-color.html';
    a.target = '_blank'; a.rel = 'noopener';
    safeText(a, state.stage === 'harmony' ? 'Abrir rueda y armonías' : 'Abrir herramienta · Rueda de color');
    app.append(a);
  }
}

function startBlobAnimation() {
  if (animation) cancelAnimationFrame(animation);
  const frame = now => {
    animation = requestAnimationFrame(frame);
    const canvas = $('blobs');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width*dpr)), h = Math.max(1, Math.round(rect.height*dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; }
    const c = canvas.getContext('2d');
    c.setTransform(dpr,0,0,dpr,0,0);
    c.clearRect(0,0,rect.width,rect.height);
    const palette = [8,20,194,337,207,222,15,329,198,349,216,28];
    c.globalCompositeOperation = 'screen';
    for (const [pitch,note] of Object.entries(notes)) {
      const fade = note.active ? 1 : Math.max(0,1-(now-(noteFades.get(pitch)?.at||now))/1900);
      if (fade <= 0) continue;
      const p = Number(note.pitch ?? pitch), hue = palette[p%12];
      const x = rect.width*(.15 + ((p-36+48)%48)/48*.7);
      const y = rect.height*(.35 + ((p*17)%29)/100);
      const v = Math.max(.3,Math.min(1,(note.velocity||70)/110));
      const r = Math.min(rect.width,rect.height)*(.12+v*.12);
      const pulse = 1 + Math.sin(now*.001 + p)*.035;
      const g = c.createRadialGradient(x,y,1,x,y,r*1.9*pulse);
      g.addColorStop(0,'hsla('+hue+',100%,72%,'+(.28*fade)+')');
      g.addColorStop(.32,'hsla('+hue+',100%,58%,'+(.2*fade)+')');
      g.addColorStop(.72,'hsla('+hue+',100%,48%,'+(.06*fade)+')');
      g.addColorStop(1,'hsla('+hue+',100%,45%,0)');
      c.fillStyle=g; c.beginPath(); c.arc(x,y,r*1.9*pulse,0,Math.PI*2); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  };
  frame(performance.now());
}
function resizeBlobCanvas() {
  const canvas = $('blobs'); if (!canvas) return;
  canvas.width = Math.max(1, Math.round(canvas.clientWidth*(devicePixelRatio||1)));
  canvas.height = Math.max(1, Math.round(canvas.clientHeight*(devicePixelRatio||1)));
}

function renderStudent() {
  const app = $('app');
  const stage = currentStageData();
  if (!stage) {
    currentStage = '';
    app.className = 'student-screen';
    app.innerHTML = '<p class="eyebrow">Fundamentos del Diseño · Color</p><h1>Espera al maestro.</h1>';
    stopCamera(); return;
  }
  if (currentStage !== state.stage) {
    currentStage = state.stage;
    stopCamera();
    if (state.stage === 'welcome' || state.stage === 'piano' || state.stage === 'harmony' || state.stage === 'tool') {
      app.className = 'student-screen';
      renderStudentStatic(app, state.stage);
      return;
    }
    if (state.stage === 'explore' || state.stage === 'paint') {
      app.className = 'student-screen activity';
      renderPhotoActivity(app, state.stage);
      return;
    }
  }
  if ((state.stage === 'explore' || state.stage === 'paint') && $('canvas')) renderPhotoControls(state.stage);
}
function renderStudentStatic(app, id) {
  app.innerHTML = '';
  const item = STAGES[stageIndex(id)];
  const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; safeText(eyebrow, 'Fundamentos del Diseño · Color');
  const h = document.createElement('h1'); safeText(h, item.label);
  const p = document.createElement('p'); p.className = 'student-prompt'; safeText(p, item.student);
  app.append(eyebrow,h,p);
  if (id === 'harmony') {
    const a=document.createElement('a'); a.className='student-link'; a.href='referencia-armonias.html'; safeText(a,'Abrir rueda y armonías'); app.append(a);
  }
  if (id === 'tool') {
    const a=document.createElement('a'); a.className='student-link'; a.href='rueda-color.html'; safeText(a,'Abrir herramienta útil'); app.append(a);
  }
}
function renderPhotoActivity(app, id) {
  app.innerHTML = '';
  const header = document.createElement('header'); header.className='activity-header';
  const eyebrow=document.createElement('p'); eyebrow.className='eyebrow'; safeText(eyebrow,'Fundamentos del Diseño · '+(id==='explore'?'Explorar el color':'Recolorear'));
  const instruction=document.createElement('p'); instruction.className='activity-instruction';
  safeText(instruction, id==='explore'?'Tono · Saturación · Valor':'Elige un color y pinta sobre la imagen.');
  header.append(eyebrow,instruction);
  const stage=document.createElement('div'); stage.className='photo-stage'; stage.id='photoStage';
  const video=document.createElement('video'); video.id='video'; video.autoplay=true; video.muted=true; video.playsInline=true;
  const canvas=document.createElement('canvas'); canvas.id='canvas'; canvas.setAttribute('aria-label','Imagen de trabajo');
  const prompt=document.createElement('div'); prompt.className='camera-prompt'; prompt.id='cameraPrompt';
  const start=document.createElement('button'); start.className='primary'; start.id='startCamera'; safeText(start,'Abrir cámara');
  prompt.append(start);
  stage.append(video,canvas,prompt);
  const controls=document.createElement('section'); controls.id='photoControls'; controls.className='photo-controls';
  app.append(header,stage,controls);
  start.onclick=()=>startCamera();
  if (base) { video.hidden=true; prompt.hidden=true; canvas.hidden=false; setupCanvas(); renderPhotoControls(id); drawPhoto(id); }
  else { video.hidden=true; canvas.hidden=true; prompt.hidden=false; }
}
function renderPhotoControls(id) {
  const root=$('photoControls'); if (!root) return;
  if (!base) {
    const video=$('video');
    const prompt=$('cameraPrompt');
    if (video && camera) {
      video.hidden=false; prompt.hidden=true; root.hidden=false; root.innerHTML='';
      const actions=document.createElement('div'); actions.className='photo-actions';
      const capture=document.createElement('button'); capture.className='primary'; safeText(capture,'Tomar foto');
      capture.onclick=()=>capturePhoto(); actions.append(capture); root.append(actions);
    }
    return;
  }
  const cameraPrompt=$('cameraPrompt'); if(cameraPrompt) cameraPrompt.hidden=true;
  const canvas=$('canvas'); if(canvas) canvas.hidden=false;
  root.hidden=false; root.innerHTML='';
  if (id === 'explore') {
    const controls=document.createElement('div'); controls.className='sliders';
    [['Tono','hue',-180,180,'°'],['Saturación','sat',0,200,'%'],['Valor','val',0,200,'%']].forEach(([label,key,min,max,unit])=>{
      const row=document.createElement('label'); row.className='slider-row';
      const name=document.createElement('span'); safeText(name,label);
      const input=document.createElement('input'); input.type='range'; input.id=key; input.min=min; input.max=max; input.value=key==='hue'?0:100;
      input.addEventListener('input',()=>drawPhoto('explore'));
      const out=document.createElement('output'); out.id=key+'O'; safeText(out,input.value+unit);
      input.addEventListener('input',()=>safeText(out,input.value+unit));
      row.append(name,input,out); controls.append(row);
    });
    const actions=document.createElement('div'); actions.className='photo-actions';
    const retake=document.createElement('button'); safeText(retake,'Otra foto');
    retake.onclick=()=>{base=null;paintLayer=null;const canvas=$('canvas');if(canvas)canvas.hidden=true;root.hidden=true;startCamera();};
    actions.append(retake); root.append(controls,actions);
  } else {
    const row=document.createElement('div'); row.className='paint-toolbar';
    const label=document.createElement('label'); label.className='picker-label'; safeText(label,'Color');
    const picker=document.createElement('input'); picker.type='color'; picker.id='paintColor'; picker.value=brushColor;
    picker.setAttribute('aria-label','Elegir color para pintar');
    picker.oninput=()=>{brushColor=picker.value;};
    row.append(label,picker); root.append(row);
    canvas?.classList.add('paint-canvas');
    bindPainting(canvas);
  }
}
async function startCamera() {
  const video=$('video'), prompt=$('cameraPrompt');
  if (!video || !navigator.mediaDevices?.getUserMedia) {
    if(prompt) prompt.textContent='La cámara requiere HTTPS o localhost.'; return;
  }
  stopCamera();
  try {
    camera=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920}},audio:false});
    video.srcObject=camera; video.hidden=false; prompt.hidden=true; await video.play();
    renderPhotoControls(state?.stage);
    if (currentStage==='paint' && base) capturePhoto();
  } catch(e) {
    prompt.hidden=false; prompt.textContent=e.name==='NotAllowedError'?'Permite el acceso a la cámara y vuelve a intentarlo.':'No se pudo abrir la cámara ('+e.name+').';
  }
}
function stopCamera() {
  if(camera) camera.getTracks().forEach(t=>t.stop());
  camera=null;
  const video=$('video'); if(video) video.srcObject=null;
}
function capturePhoto() {
  const video=$('video'); if(!video?.videoWidth)return;
  const scale=Math.min(1,1280/video.videoWidth);
  const w=Math.round(video.videoWidth*scale),h=Math.round(video.videoHeight*scale);
  const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(video,0,0,w,h);
  base=c.getContext('2d').getImageData(0,0,w,h);
  stopCamera();setupCanvas();
  if($('video'))$('video').hidden=true;
  if($('cameraPrompt'))$('cameraPrompt').hidden=true;
  if($('canvas'))$('canvas').hidden=false;
  renderPhotoControls(state?.stage);
  drawPhoto(state?.stage);
}
function setupCanvas() {
  const canvas=$('canvas');if(!canvas||!base)return;
  canvas.width=base.width;canvas.height=base.height;
  ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!paintLayer){paintLayer=document.createElement('canvas');paintLayer.width=base.width;paintLayer.height=base.height;}
  else if(paintLayer.width!==base.width||paintLayer.height!==base.height){paintLayer.width=base.width;paintLayer.height=base.height;}
}
function drawPhoto(mode) {
  if(!base)return;
  const canvas=$('canvas');if(!canvas)return;
  setupCanvas();if(!ctx)return;
  if(mode==='paint'){
    const out=ctx.createImageData(base.width,base.height),src=base.data,dst=out.data;
    for(let i=0;i<src.length;i+=4){
      const y=Math.round(src[i]*.2126+src[i+1]*.7152+src[i+2]*.0722);
      dst[i]=dst[i+1]=dst[i+2]=y;dst[i+3]=src[i+3];
    }
    ctx.putImageData(out,0,0);ctx.drawImage(paintLayer,0,0);
    return;
  }
  if(!state || state.stage!=='explore'){ctx.putImageData(base,0,0);return;}
  const dh=Number($('hue')?.value||0),sm=Number($('sat')?.value||100)/100,vm=Number($('val')?.value||100)/100;
  const out=ctx.createImageData(base.width,base.height),src=base.data,dst=out.data;
  for(let i=0;i<src.length;i+=4){
    const r=src[i]/255,g=src[i+1]/255,b=src[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=0;if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;}
    h=(h+dh+360)%360;const s=Math.min(1,(max?d/max:0)*sm),v=Math.min(1,max*vm),c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
    let R=0,G=0,B=0;
    if(h<60){R=c;G=x;}else if(h<120){R=x;G=c;}else if(h<180){G=c;B=x;}else if(h<240){G=x;B=c;}else if(h<300){R=x;B=c;}else{R=c;B=x;}
    dst[i]=(R+m)*255;dst[i+1]=(G+m)*255;dst[i+2]=(B+m)*255;dst[i+3]=src[i+3];
  }
  ctx.putImageData(out,0,0);
}
function bindPainting(canvas) {
  if(!canvas||canvas.dataset.paintBound)return;
  canvas.dataset.paintBound='1';
  const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*canvas.width,y:(e.clientY-r.top)/r.height*canvas.height};};
  canvas.addEventListener('pointerdown',e=>{if(state?.stage!=='paint'||!paintLayer)return;painting=true;canvas.setPointerCapture(e.pointerId);const p=point(e);paintAt(p,p);});
  canvas.addEventListener('pointermove',e=>{if(!painting)return;const p=point(e);paintAt(p,p);});
  const finish=()=>{if(!painting)return;painting=false;drawPhoto('paint');};
  canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
}
function paintAt(a,b) {
  const c=paintLayer?.getContext('2d');if(!c)return;
  const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(distance/9));
  for(let i=0;i<=steps;i++){
    const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,r=Math.max(30,base.width*.05);
    const g=c.createRadialGradient(x,y,r*.05,x,y,r);
    g.addColorStop(0,brushColor+'88');g.addColorStop(.55,brushColor+'55');g.addColorStop(1,brushColor+'00');
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }
  drawPhoto('paint');
}

window.addEventListener('pagehide', stopCamera);

