import {db,ref,onValue,set,runTransaction,onDisconnect,stateRef} from "./firebase.js";import {render} from "./renderer.js";
const stage=document.querySelector("#stage");let id=localStorage.getItem("fd-student-id");if(!id){id=crypto.randomUUID();localStorage.setItem("fd-student-id",id)}
let order=Number(localStorage.getItem("fd-entry-order")||0);
async function register(){if(!order){const counter=ref(db,"presentation/entryCounter");const tx=await runTransaction(counter,n=>(n||0)+1);order=tx.snapshot.val();localStorage.setItem("fd-entry-order",order)}const me=ref(db,"presentation/students/"+id);await set(me,{order,connected:true});onDisconnect(me).remove()}
register();
onValue(stateRef,s=>render(stage,s.val()||{slide:"esteban"},"student",id,{entryOrder:order,toggleInvert:()=>runTransaction(ref(db,"presentation/state/inverted"),v=>!v)}));
