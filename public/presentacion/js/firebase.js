import {initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {getDatabase,ref,onValue,set,runTransaction,onDisconnect} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
const app=initializeApp({projectId:"fundamentos501",databaseURL:"https://fundamentos501-default-rtdb.firebaseio.com"});
export const db=getDatabase(app);
export {ref,onValue,set,runTransaction,onDisconnect};
export const stateRef=ref(db,"presentation/state");
