import {slideById} from "./slides.js";
let cleanup=()=>{};
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const rng=seed=>()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
const makeCanvas=stage=>{const c=document.createElement("canvas");c.className="full";stage.append(c);return c};
const sizeCanvas=c=>{const d=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;c.width=Math.round(w*d);c.height=Math.round(h*d);const x=c.getContext("2d");x.setTransform(d,0,0,d,0,0);return [x,w,h]};
function drawShapes(x,w,h,kind){
 x.strokeStyle="#fff";x.lineWidth=3;const s=Math.min(w/5,h/3,150),y=h/2,at=i=>w*(i+1)/(kind==="shapes2d"?5:6);
 const poly=pts=>{x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.stroke()};
 if(kind==="shapes2d"){
  x.beginPath();x.arc(at(0),y,s*.43,0,7);x.stroke();x.strokeRect(at(1)-s*.48,y-s*.35,s*.96,s*.7);
  poly([[at(2),y-s*.5],[at(2)-s*.5,y+s*.4],[at(2)+s*.5,y+s*.4]]);
  poly([[at(3)-s*.5,y-s*.2],[at(3)+s*.1,y-s*.55],[at(3)+s*.55,y],[at(3)+s*.25,y+s*.5],[at(3)-s*.45,y+s*.4]]);
 }else{
  const z=s*.22,c=at(1);x.beginPath();x.arc(at(0),y,s*.42,0,7);x.stroke();x.beginPath();x.ellipse(at(0),y,s*.42,s*.13,0,0,7);x.stroke();
  x.strokeRect(c-s*.42,y-s*.35,s*.65,s*.65);poly([[c-s*.42,y-s*.35],[c-s*.42+z,y-s*.35-z],[c+s*.23+z,y-s*.35-z],[c+s*.23,y-s*.35]]);x.beginPath();x.moveTo(c+s*.23,y+s*.3);x.lineTo(c+s*.23+z,y+s*.3-z);x.lineTo(c+s*.23+z,y-s*.35-z);x.stroke();
  const d=at(2);x.beginPath();x.ellipse(d,y-s*.35,s*.4,s*.15,0,0,7);x.moveTo(d-s*.4,y-s*.35);x.lineTo(d-s*.4,y+s*.35);x.moveTo(d+s*.4,y-s*.35);x.lineTo(d+s*.4,y+s*.35);x.ellipse(d,y+s*.35,s*.4,s*.15,0,0,Math.PI);x.stroke();
  const e=at(3);x.beginPath();x.ellipse(e,y+s*.38,s*.42,s*.14,0,0,7);x.moveTo(e-s*.42,y+s*.38);x.lineTo(e,y-s*.55);x.lineTo(e+s*.42,y+s*.38);x.stroke();
  const f=at(4),base=[[f-s*.45,y+s*.35],[f+s*.45,y+s*.35],[f+s*.2,y+s*.55],[f-s*.65,y+s*.55]];poly(base);x.beginPath();for(const [a,b] of base){x.moveTo(f,y-s*.55);x.lineTo(a,b)}x.stroke();
 }
}
function drawPlane(x,w,h,points){
 const cx=w/2,cy=h/2,u=Math.min(w,h)/10;x.strokeStyle="#fff";x.fillStyle="#fff";x.lineWidth=1;x.beginPath();x.moveTo(0,cy);x.lineTo(w,cy);x.moveTo(cx,0);x.lineTo(cx,h);x.stroke();
 for(let i=-5;i<=5;i++){x.beginPath();x.moveTo(cx+i*u,cy-5);x.lineTo(cx+i*u,cy+5);x.moveTo(cx-5,cy+i*u);x.lineTo(cx+5,cy+i*u);x.stroke()}
 if(points.length===2){const [a,b]=points;x.lineWidth=2;x.strokeRect(cx+a.x*u,cy-a.y*u,(b.x-a.x)*u,(a.y-b.y)*u)}
 for(const p of points){const px=cx+p.x*u,py=cy-p.y*u;x.setLineDash([5,5]);x.lineWidth=1;x.beginPath();x.moveTo(px,py);x.lineTo(px,cy);x.moveTo(px,py);x.lineTo(cx,py);x.stroke();x.setLineDash([]);x.beginPath();x.arc(px,py,5,0,7);x.fill();x.font="16px Arial";x.fillText(p.label,px+9,py-9)}
}
export function render(stage,state,role,studentId="guest",actions={}){
 cleanup(); cleanup=()=>{}; stage.innerHTML=""; stage.className="stage"; stage.style.background="";
 const slide=slideById(state.slide); if(state.inverted)stage.classList.add("invert");
 if(slide.type==="text"){stage.innerHTML='<div class="title"></div>';stage.firstChild.textContent=slide.text;return}
 if(slide.type==="image"){const img=new Image();img.className="art";img.alt="";img.src=slide.src;img.onerror=()=>{if(img.isConnected){stage.innerHTML='<div class="missing">IMAGEN PENDIENTE · '+slide.src.split("/").pop()+'</div>'}};stage.append(img);if(slide.caption){const c=document.createElement("div");c.className="caption";c.textContent=slide.caption;stage.append(c)}return}
 if(slide.type==="perception"){const odd=role==="student"&&actions.entryOrder%2===1;if(odd){const box=document.createElement("div");box.className="switch";box.innerHTML='<span>LUZ</span><button type="button" aria-label="Cambiar luz">'+(state.inverted?"ON":"OFF")+'</button>';box.querySelector("button").onclick=()=>actions.toggleInvert?.();stage.append(box)}else{const t=document.createElement("div");t.className="title";t.textContent="PERCEPCIÓN";stage.append(t)}return}
 if(slide.type==="noise"){const c=document.createElement("canvas");c.className="full";stage.append(c);const x=c.getContext("2d");let raf;const draw=()=>{c.width=Math.max(160,Math.floor(innerWidth/5));c.height=Math.max(90,Math.floor(innerHeight/5));const im=x.createImageData(c.width,c.height);for(let i=0;i<im.data.length;i+=4){im.data[i]=Math.random()*256;im.data[i+1]=Math.random()*256;im.data[i+2]=Math.random()*256;im.data[i+3]=255}x.putImageData(im,0,0);raf=requestAnimationFrame(draw)};draw();cleanup=()=>cancelAnimationFrame(raf);return}
 if(slide.type==="webcam"){
  const b=document.createElement("button"),note=document.createElement("div"),v=document.createElement("video"),c=document.createElement("canvas");
  b.className="camera-start";b.textContent="ACTIVAR CÁMARA";note.className="camera-note";note.textContent="La imagen permanece en este dispositivo.";c.className="full";c.hidden=true;v.hidden=true;v.autoplay=true;v.playsInline=true;v.muted=true;stage.append(c,v,b,note);
  let stream,raf,disposed=false,request=0,facing="user";
  const draw=()=>{if(disposed||!stream)return;c.width=innerWidth;c.height=innerHeight;const x=c.getContext("2d");x.save();x.translate(c.width,c.height);x.scale(-1,-1);const vr=v.videoWidth/v.videoHeight,cr=c.width/c.height;let sw=v.videoWidth,sh=v.videoHeight,sx=0,sy=0;if(vr>cr){sw=v.videoHeight*cr;sx=(v.videoWidth-sw)/2}else{sh=v.videoWidth/cr;sy=(v.videoHeight-sh)/2}if(sw&&sh)x.drawImage(v,sx,sy,sw,sh,0,0,c.width,c.height);x.restore();raf=requestAnimationFrame(draw)};
  const start=async mode=>{const mine=++request;cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null;try{const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:mode}},audio:false});if(disposed||mine!==request){next.getTracks().forEach(t=>t.stop());return}stream=next;v.srcObject=next;await v.play();if(disposed||mine!==request)return;facing=mode;c.hidden=false;b.textContent=mode==="user"?"CÁMARA TRASERA":"CÁMARA FRONTAL";draw()}catch(e){if(!disposed&&mine===request)b.textContent="CÁMARA NO DISPONIBLE · REINTENTAR"}};
  b.onclick=()=>start(stream?(facing==="user"?"environment":"user"):facing);cleanup=()=>{disposed=true;request++;cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());v.srcObject=null};return
 }
 if(slide.type==="chroma"){const colors={R:"#ff0000",G:"#00ff00",B:"#0000ff"};stage.style.background=colors[state.chroma]||"#000";return}
 if(slide.type==="splitVideo"){if(role==="student"){const img=new Image();img.className="art";img.alt="";img.src=slide.studentSrc;stage.append(img)}else{const frame=document.createElement("iframe");frame.className="video";frame.src="https://www.youtube-nocookie.com/embed/3Q1L1a315cI";frame.title="Ellsworth Kelly";frame.allow="fullscreen; picture-in-picture";frame.allowFullscreen=true;stage.append(frame)}return}
 if(slide.type==="shapes2d"||slide.type==="shapes3d"){const c=makeCanvas(stage),paint=()=>{const [x,w,h]=sizeCanvas(c);drawShapes(x,w,h,slide.type)};window.addEventListener("resize",paint);paint();cleanup=()=>window.removeEventListener("resize",paint);return}
 if(slide.type==="xy"){
  const c=makeCanvas(stage),footer=document.createElement("div"),points=[];footer.className="coordinate-footer";stage.append(footer);
  const paint=()=>{const [x,w,h]=sizeCanvas(c);drawPlane(x,w,h,points);footer.textContent=points.map(p=>`${p.label} (${p.x}, ${p.y})`).join("     ")};
  const tap=e=>{const box=c.getBoundingClientRect(),u=Math.min(box.width,box.height)/10;if(points.length===2)points.length=0;points.push({label:points.length?"B":"A",x:Math.max(-5,Math.min(5,Math.round((e.clientX-box.left-box.width/2)/u))),y:Math.max(-5,Math.min(5,Math.round((box.height/2-e.clientY+box.top)/u)))});paint()};
  c.addEventListener("pointerdown",tap);window.addEventListener("resize",paint);paint();cleanup=()=>{c.removeEventListener("pointerdown",tap);window.removeEventListener("resize",paint)};return
 }
 if(slide.type==="noColor"){
  if(role==="projection"){const t=document.createElement("div");t.className="title";t.textContent="NO COLOR";stage.append(t);return}
  const c=makeCanvas(stage),r=rng(hash(studentId+"no-color")),pattern=Math.floor(r()*8),phase=r()*10,delay=1000+Math.floor(r()*1000);let raf,timer,start=performance.now();
  const draw=now=>{const [x,w,h]=sizeCanvas(c),t=(now-start)/1000+phase;x.fillStyle="#000";x.fillRect(0,0,w,h);x.fillStyle="#fff";const flip=Math.floor(t*2)%2;
   if(pattern===0&&flip)x.fillRect(0,0,w,h);
   if(pattern===1){x.beginPath();x.arc(w*(.5+.55*Math.sin(t*.7)),h*(.5+.5*Math.cos(t*.5)),Math.max(w,h)*.38,0,7);x.fill()}
   if(pattern===2){for(let i=-h;i<w+h;i+=64){x.save();x.translate(i+(t*80)%64,0);x.rotate(-.35);x.fillRect(0,-h,28,h*3);x.restore()}}
   if(pattern===3){const s=40+20*flip;for(let yy=0;yy<h;yy+=s)for(let xx=0;xx<w;xx+=s)if((Math.floor(xx/s)+Math.floor(yy/s)+flip)%2)x.fillRect(xx,yy,s,s)}
   if(pattern===4)for(let yy=(t*50)%20;yy<h;yy+=20)x.fillRect(0,yy,w,5);
   if(pattern===5){x.font=`bold ${Math.max(80,w*.22)}px Arial`;x.textAlign="center";x.fillText("NO COLOR",w/2+Math.sin(t)*w*.2,h/2)}
   if(pattern===6){if(flip)x.fillRect(0,0,w,h);else x.fillRect(0,0,w/2,h)}
   if(pattern===7){const n=Math.min(30,1+Math.floor(t*2));for(let i=0;i<n;i++){const q=rng(hash(studentId+"shape"+i)),xx=q()*w,yy=q()*h,s=10+q()*100;if(q()>.5)x.fillRect(xx,yy,s,s);else{x.beginPath();x.arc(xx,yy,s/2,0,7);x.fill()}}}
   raf=requestAnimationFrame(draw)};
  timer=setTimeout(()=>{start=performance.now();raf=requestAnimationFrame(draw)},delay);cleanup=()=>{clearTimeout(timer);cancelAnimationFrame(raf)};return
 }
 if(slide.type==="point"){if(role==="projection"){const p=document.createElement("i");p.className="point";p.style.left="calc(50% - 6px)";p.style.top="calc(50% - 6px)";stage.append(p)}else{const r=rng(hash(studentId+"point"));const n=1+Math.floor(r()*24);for(let i=0;i<n;i++){const p=document.createElement("i");p.className="point";p.style.left=(5+r()*90)+"%";p.style.top=(5+r()*90)+"%";stage.append(p)}}return}
 if(slide.type==="line"){stage.classList.add("invert");const l=document.createElement("i");l.className="line-shape";if(role==="projection"){l.style.width="100%";l.style.left="0";l.style.top="66.666%"}else{const r=rng(hash(studentId+"line"));l.style.width=(25+r()*60)+"%";l.style.left=(5+r()*35)+"%";l.style.top=(10+r()*80)+"%";l.style.transform="rotate("+Math.floor(r()*180)+"deg)"}stage.append(l)}
}
export function stopRenderer(){cleanup();cleanup=()=>{}}
