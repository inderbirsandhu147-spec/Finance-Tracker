// Shared Google sign-in + cloud sync for water.html, habits.html and reading.html.
// Paste the same firebaseConfig your CapitalFlow app uses (it is safe to be public).
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore,doc,onSnapshot,setDoc} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig={
  apiKey:'AIzaSyDHvJVCiyw7obPD01Yl-IeqDA6pLmrAwNc',
  authDomain:'finance-sync-6502e.firebaseapp.com',
  projectId:'finance-sync-6502e',
  storageBucket:'finance-sync-6502e.firebasestorage.app',
  messagingSenderId:'286427024050',
  appId:'1:286427024050:web:22a6124ef46ee9735f17ab'
};

const A=window.appSync;
if(A){
const configured=!String(firebaseConfig.apiKey).startsWith('PASTE');
const mk=(t,css,html)=>{const e=document.createElement(t);e.style.cssText=css||'';if(html!=null)e.innerHTML=html;return e};
const FONT='font:15px -apple-system,system-ui,sans-serif;';
const pill=mk('button','position:fixed;left:14px;bottom:calc(env(safe-area-inset-bottom) + 18px);z-index:8;border:1px solid #8885;border-radius:22px;padding:9px 15px;background:Canvas;color:CanvasText;box-shadow:0 2px 8px #0003;'+FONT);
document.body.appendChild(pill);document.body.style.marginBottom='70px';
let user=null,status=configured?'Sign in':'Set up sync';
const setStatus=s=>{status=s;pill.textContent='☁ '+s;if(sheetMsg)sheetMsg.textContent=describe()};
const describe=()=>!configured?'Sync is not set up yet. Open sync.js and paste your Firebase config at the top.':user?'Signed in as '+user.email+'. '+status+'. Your data syncs automatically and still works offline.':'Sign in with Google to keep this app in sync across your phone and laptop.';

let sheet=null,sheetMsg=null,auth=null,login=null;
function openSheet(extra){
  if(sheet)sheet.remove();
  sheet=mk('div','position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:20;display:flex;align-items:center;justify-content:center;padding:16px');
  const box=mk('div','background:Canvas;color:CanvasText;border-radius:18px;padding:18px;width:min(380px,100%);'+FONT,'<b>Cloud sync</b>');
  sheetMsg=mk('p','opacity:.7;font-size:14px;margin:8px 0 12px',extra||describe());box.appendChild(sheetMsg);
  const btn=(t,fn,main)=>{const b=mk('button','width:100%;padding:12px;margin-top:8px;border-radius:12px;border:1px solid #8885;'+FONT+(main?'background:#2a8fbd;color:#fff;border-color:#2a8fbd;font-weight:600':'background:none;color:inherit'),t);b.onclick=fn;box.appendChild(b)};
  if(configured&&!user)btn('Sign in with Google',login,true);
  if(user)btn('Sign out',()=>signOut(auth));
  btn('Close',()=>{sheet.remove();sheet=null;sheetMsg=null});
  sheet.appendChild(box);document.body.appendChild(sheet);
}
pill.onclick=()=>openSheet();
if(!configured){setStatus('Set up sync')}
else{
const app=initializeApp(firebaseConfig),db=getFirestore(app);auth=getAuth(app);
const LK='sync.ts.'+A.app;
let ts=+localStorage.getItem(LK)||0,timer=null,ref=null,unsub=null;
const stamp=t=>{ts=t;try{localStorage.setItem(LK,t)}catch(e){}};
window.Sync={changed(){stamp(Date.now());if(user){setStatus('Syncing…');clearTimeout(timer);timer=setTimeout(push,1500)}}};
async function push(){try{await setDoc(ref,{json:JSON.stringify(A.get()),updatedAt:ts,app:A.app});setStatus('Synced ✓')}catch(e){console.error(e);setStatus('Sync error')}}
function take(r){try{A.set(JSON.parse(r.json));stamp(r.updatedAt);setStatus('Synced ✓')}catch(e){console.error(e);setStatus('Sync error')}}
function choose(r){
  const o=mk('div','position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:30;display:flex;align-items:center;justify-content:center;padding:16px');
  const b=mk('div','background:Canvas;color:CanvasText;border-radius:18px;padding:18px;width:min(380px,100%);'+FONT,'<b>Your cloud already has data</b><p style="opacity:.7;font-size:14px">This device also has its own data. Which copy should win? The other one is replaced.</p>');
  const add=(t,fn,main)=>{const x=mk('button','width:100%;padding:12px;margin-top:8px;border-radius:12px;border:1px solid #8885;'+FONT+(main?'background:#2a8fbd;color:#fff;border-color:#2a8fbd;font-weight:600':'background:none;color:inherit'),t);x.onclick=()=>{o.remove();fn()};b.appendChild(x)};
  add('Use the cloud copy',()=>take(r),true);add('Keep this device’s data',()=>{stamp(Date.now());push()});
  o.appendChild(b);document.body.appendChild(o);
}
function listen(){
  if(unsub)unsub();let first=true;
  unsub=onSnapshot(ref,snap=>{
    const r=snap.exists()?snap.data():null,f=first;first=false;
    if(!r){if(f){if(!ts)stamp(Date.now());push()}return}
    if(r.updatedAt>ts){if(f&&!ts&&!A.empty())choose(r);else take(r)}
    else if(f&&ts>r.updatedAt)push();
    else setStatus('Synced ✓');
  },e=>{console.error(e);setStatus('Sync error')});
}
login=async function(){
  const p=new GoogleAuthProvider();
  try{await signInWithPopup(auth,p)}
  catch(e){if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment')signInWithRedirect(auth,p);else openSheet('Sign-in failed ('+(e.code||e.message)+').')}
}
onAuthStateChanged(auth,u=>{user=u;
  if(u){if(sheet){sheet.remove();sheet=null}ref=doc(db,'users',u.uid,'apps',A.app);setStatus('Syncing…');listen()}
  else{if(unsub)unsub();unsub=null;setStatus('Sign in')}});
window.addEventListener('offline',()=>user&&setStatus('Offline'));
window.addEventListener('online',()=>user&&ts&&push());
}
pill.textContent='☁ '+status;
}
