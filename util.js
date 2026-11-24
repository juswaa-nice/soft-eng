// Shared helpers: DOM shortcuts, saved settings, saved practice progress.
const NOTES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const store={get(k,d){try{return JSON.parse(localStorage.getItem('fw.'+k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem('fw.'+k,JSON.stringify(v))}catch(e){}}};
const settings=Object.assign({a4:440,tol:5},store.get('settings',{}));
const prog=Object.assign({sessions:0,attempts:{},recent:[],log:[]},store.get('progress2',{}));
const saveProg=()=>store.set('progress2',prog);
function logEvent(msg){prog.log=[{t:Date.now(),msg},...prog.log].slice(0,12);saveProg();}
function touchRecent(vid){prog.recent=[vid,...prog.recent.filter(x=>x!==vid)].slice(0,8);saveProg();}
