// Single source of truth: music theory + guitar voicings. No DOM code here.
const OPEN_MIDI=[40,45,50,55,59,64]; // E2 A2 D3 G3 B3 E4 (strings 6→1)
const LET=['C','D','E','F','G','A','B'],LET_PC=[0,2,4,5,7,9,11];
const KEYS=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const KEY_LABEL={Db:'C#/Db',Eb:'D#/Eb','F#':'F#/Gb',Ab:'G#/Ab',Bb:'A#/Bb'};
const pcOf=n=>((LET_PC[LET.indexOf(n[0])]+[...n.slice(1)].reduce((a,c)=>a+(c==='#'?1:-1),0))%12+12)%12;
// Spell a note by letter so enharmonics are correct (e.g. F# major has E#, not F).
function spell(root,semi,deg){const li=LET.indexOf(root[0]),k=(li+deg)%7;let d=((pcOf(root)+semi-LET_PC[k])%12+12)%12;if(d>6)d-=12;return LET[k]+(d>0?'#'.repeat(d):'b'.repeat(-d));}
// iv = [semitones, scale-degree steps]
const QUAL={maj:{label:'Major',sym:'',iv:[[0,0],[4,2],[7,4]]},min:{label:'Minor',sym:'m',iv:[[0,0],[3,2],[7,4]]},
 7:{label:'Dominant 7th',sym:'7',iv:[[0,0],[4,2],[7,4],[10,6]]},maj7:{label:'Major 7th',sym:'maj7',iv:[[0,0],[4,2],[7,4],[11,6]]},
 m7:{label:'Minor 7th',sym:'m7',iv:[[0,0],[3,2],[7,4],[10,6]]},sus2:{label:'Suspended 2nd',sym:'sus2',iv:[[0,0],[2,1],[7,4]]},
 sus4:{label:'Suspended 4th',sym:'sus4',iv:[[0,0],[5,3],[7,4]]},add9:{label:'Add9',sym:'add9',iv:[[0,0],[4,2],[7,4],[14,1]]},
 6:{label:'Sixth',sym:'6',iv:[[0,0],[4,2],[7,4],[9,5]]},dim:{label:'Diminished',sym:'dim',iv:[[0,0],[3,2],[6,4]]},aug:{label:'Augmented',sym:'aug',iv:[[0,0],[4,2],[8,4]]}};
function chordInfo(root,q){const iv=QUAL[q].iv;return{root,q,name:root+QUAL[q].sym,full:`${root} ${QUAL[q].label}`,tones:iv.map(([s,d])=>spell(root,s,d)),pcs:iv.map(([s])=>(pcOf(root)+s)%12),rootPc:pcOf(root)};}
// Diatonic chord family for a key (major or natural minor).
function family(key,minor){
  const sc=minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11],qs=minor?['min','dim','maj','min','min','maj','maj']:['maj','min','min','maj','maj','min','dim'];
  const rn=minor?['i','ii°','III','iv','v','VI','VII']:['I','ii','iii','IV','V','vi','vii°'];
  return qs.map((q,i)=>({deg:rn[i],root:spell(key,sc[i],i),q}));}
const PROGRESSIONS={major:[['I–V–vi–IV',[0,4,5,3]],['I–IV–V',[0,3,4]],['vi–IV–I–V',[5,3,0,4]],['ii–V–I',[1,4,0]]],minor:[['i–VI–III–VII',[0,5,2,6]],['i–iv–v',[0,3,4]],['i–VII–VI–VII',[0,6,5,6]]]};
// Open shapes keyed "rootPc|quality" (6th→1st string, -1 muted)
const OPEN={'0|maj':[-1,3,2,0,1,0],'2|maj':[-1,-1,0,2,3,2],'4|maj':[0,2,2,1,0,0],'7|maj':[3,2,0,0,0,3],'9|maj':[-1,0,2,2,2,0],'9|min':[-1,0,2,2,1,0],'2|min':[-1,-1,0,2,3,1],'4|min':[0,2,2,0,0,0],
 '0|7':[-1,3,2,3,1,0],'2|7':[-1,-1,0,2,1,2],'4|7':[0,2,0,1,0,0],'7|7':[3,2,0,0,0,1],'9|7':[-1,0,2,0,2,0],'5|maj7':[-1,-1,3,2,1,0],'0|maj7':[-1,3,2,0,0,0],'7|maj7':[3,2,0,0,0,2],'2|maj7':[-1,-1,0,2,2,2],'9|maj7':[-1,0,2,1,2,0],'4|maj7':[0,2,1,1,0,0],
 '9|m7':[-1,0,2,0,1,0],'4|m7':[0,2,0,0,0,0],'2|m7':[-1,-1,0,2,1,1],'9|sus2':[-1,0,2,2,0,0],'9|sus4':[-1,0,2,2,3,0],'2|sus2':[-1,-1,0,2,3,0],'2|sus4':[-1,-1,0,2,3,3],'4|sus4':[0,2,2,2,0,0],'0|add9':[-1,3,2,0,3,0],'7|6':[3,2,0,0,0,0]};
const N=null;
const E_SHAPE={maj:[0,2,2,1,0,0],min:[0,2,2,0,0,0],7:[0,2,0,1,0,0],maj7:[0,2,1,1,0,0],m7:[0,2,0,0,0,0],sus4:[0,2,2,2,0,0],6:[0,2,2,1,2,0]};
const A_SHAPE={maj:[N,0,2,2,2,0],min:[N,0,2,2,1,0],7:[N,0,2,0,2,0],maj7:[N,0,2,1,2,0],m7:[N,0,2,0,1,0],sus2:[N,0,2,2,0,0],sus4:[N,0,2,2,3,0],add9:[N,0,2,4,2,0],6:[N,0,2,2,2,2],dim:[N,0,1,2,1,N],aug:[N,0,3,2,2,1]};
const SETS=[[3,4,5],[2,3,4],[1,2,3],[0,1,2]], INV=['Root position','1st inversion','2nd inversion','3rd inversion'];
// Finger numbers: barre → lowest-fret strings share finger 1; everything else is numbered by fret, low to high.
function assignFingers(f,barre){const idx=f.map((x,i)=>x>0?i:-1).filter(i=>i>=0).sort((a,b)=>f[a]-f[b]||a-b),fg=Array(6).fill(0);let n=0;
  if(barre&&idx.length){const lo=f[idx[0]];idx.filter(i=>f[i]===lo).forEach(i=>fg[i]=1);n=1;idx.filter(i=>f[i]!==lo).forEach(i=>fg[i]=Math.min(4,++n));}
  else idx.forEach(i=>fg[i]=Math.min(4,++n));return fg;}
function makeVoicing(info,name,type,frets,barre,desc){
  const fingers=assignFingers(frets,barre),fr=frets.filter(x=>x>0),minF=fr.length?Math.min(...fr):0,maxF=fr.length?Math.max(...fr):0;
  const midi=frets.map((x,i)=>x<0?null:OPEN_MIDI[i]+x),played=midi.filter(m=>m!==null),pcs=[...new Set(played.map(m=>m%12))],nm={};info.pcs.forEach((p,i)=>nm[p]=info.tones[i]);
  const bass=Math.min(...played)%12,inv=Math.max(0,info.pcs.indexOf(bass)),missing=info.tones.filter((_,i)=>!pcs.includes(info.pcs[i]));
  const steps=[];frets.forEach((x,i)=>{if(x>0&&!(barre&&fingers[i]===1&&x===minF&&frets.filter((y,j)=>fingers[j]===1&&y===minF).length>1&&steps.some(s=>s.barre)))steps.push({finger:fingers[i],fret:x,idx:[i],barre:false});});
  if(barre){const b=frets.map((x,i)=>fingers[i]===1&&x>0?i:-1).filter(i=>i>=0);steps.length=0;steps.push({finger:1,fret:minF,idx:b,barre:true});frets.forEach((x,i)=>{if(x>0&&fingers[i]>1)steps.push({finger:fingers[i],fret:x,idx:[i],barre:false});});}
  steps.sort((a,b)=>a.finger-b.finger);
  const diff=type==='open'?'Beginner':(maxF>7||type==='barre'&&['dim','aug','add9','maj7'].includes(info.q))?'Advanced':'Intermediate';
  return{id:`${info.root}|${info.q}|${name}`,chord:info,name,type,frets,fingers,barre,steps,pcs,rootPc:info.rootPc,minF,maxF,diff,desc,
   noteNames:pcs.map(p=>nm[p]),lowest:nm[bass]+(Math.floor(Math.min(...played)/12)-1),inversion:INV[inv],missing,
   position:!fr.length?'Open strings':(frets.includes(0)&&maxF<=4?'Open position (frets 1–4)':`Frets ${minF}–${maxF}${maxF>=8?' (upper neck)':''}`)};}
const _cache={};
function voicings(root,q){const key=root+'|'+q;if(_cache[key])return _cache[key];const info=chordInfo(root,q),out=[],seen=new Set(),rp=info.rootPc;
  const add=(...a)=>{const v=makeVoicing(info,...a),k=v.frets.join();if(!seen.has(k)){seen.add(k);out.push(v);}};
  if(OPEN[rp+'|'+q])add('Open position','open',OPEN[rp+'|'+q],false,'Uses open strings, so it rings fully. The best first shape to learn.');
  const ef=(rp-4+12)%12,af=(rp-9+12)%12;
  if(E_SHAPE[q]&&ef>0)add(`E-shape barre (fret ${ef})`,'barre',E_SHAPE[q].map(v=>v+ef),true,'Movable shape with the root on the 6th string. Slide it up the neck to change the chord.');
  if(A_SHAPE[q]&&af>0)add(`A-shape barre (fret ${af})`,'barre',A_SHAPE[q].map(v=>v===null?-1:v+af),true,'Movable shape with the root on the 5th string. Pairs well with E-shape barres.');
  if(info.pcs.length===3)SETS.forEach(set=>{[0,1,2].forEach(b=>{let best=null;
    for(let a=0;a<=12;a++)for(let c=0;c<=12;c++)for(let d=0;d<=12;d++){const f=[a,c,d],n=f.map((x,i)=>(OPEN_MIDI[set[i]]+x)%12);
      if(new Set(n).size<3||!n.every(p=>info.pcs.includes(p))||n[0]!==info.pcs[b])continue;
      const mi=f.map((x,i)=>OPEN_MIDI[set[i]]+x);if(!(mi[0]<mi[1]&&mi[1]<mi[2])||(f.includes(0)&&Math.max(...f)>4))continue; // ascending pitch; opens only in low positions
      const fr=f.filter(x=>x>0);if(fr.length&&Math.max(...fr)-Math.min(...fr)>3)continue;const s=[Math.max(...f),f.reduce((x,y)=>x+y)];
      if(!best||s[0]<best.s[0]||s[0]===best.s[0]&&s[1]<best.s[1])best={f,s};}
    if(best){const fr=[-1,-1,-1,-1,-1,-1];set.forEach((st,i)=>fr[st]=best.f[i]);
      add(`Triad, strings ${6-set[0]}-${6-set[1]}-${6-set[2]} (${INV[b].toLowerCase()})`,'triad',fr,false,'Compact three-string voicing for lead-style fills, funk rhythm and chord embellishments. Strum or pluck only the three marked strings.');}});});
  return _cache[key]=out.slice(0,10);}
const getVoicing=vid=>{const[r,q,n]=vid.split('|');return QUAL[q]?voicings(r,q).find(v=>v.name===n):null;};
// Choose a voicing style for a progression, keeping hand movement small.
function pickVoicing(root,q,style,prev){const vs=voicings(root,q);let c=vs.filter(v=>v.type===style);if(!c.length)c=vs;
  const pos=v=>v.minF;return c.reduce((b,v)=>prev==null?(b||v):(!b||Math.abs(pos(v)-prev)<Math.abs(pos(b)-prev)?v:b),null);}
if(typeof module!=='undefined')module.exports={voicings,family,chordInfo,QUAL,KEYS,OPEN_MIDI};
