import {onValue,stateRef} from "./firebase.js";import {render} from "./renderer.js";
const stage=document.querySelector("#stage");onValue(stateRef,s=>render(stage,s.val()||{slide:"esteban"},"projection"));
