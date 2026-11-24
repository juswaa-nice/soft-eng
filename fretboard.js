// SVG fretboard renderer + finger instructions. Reads voicing objects from chords.js.
const FINGER=['','index','middle','ring','little'],ordS=n=>['','1st','2nd','3rd','4th','5th','6th'][n];
function fretSvg(v,{lit=99,cur=-1,big=false}={}){
  const base=v.maxF<=4?1:v.minF,rows=Math.min(6,Math.max(4,v.maxF-base+1)),x0=46,dx=28,y0=52,dy=38,W=230,H=y0+rows*dy+30;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="fb${big?' big':''}" role="img" aria-label="${v.chord.name}, ${v.name}">`;
  s+=base===1?`<rect x="${x0-2}" y="${y0-5}" width="${dx*5+4}" height="7" rx="2" class="nut"/>`:`<text x="${x0-34}" y="${y0+dy/2+4}" class="fr">${base}fr</text>`;
  for(let i=0;i<6;i++)s+=`<line class="str" x1="${x0+i*dx}" y1="${y0}" x2="${x0+i*dx}" y2="${y0+rows*dy}" stroke-width="${2.2-i*.25}"/>`;
  for(let j=1;j<=rows;j++)s+=`<line class="fret" x1="${x0}" y1="${y0+j*dy}" x2="${x0+5*dx}" y2="${y0+j*dy}"/>`;
  [3,5,7,9,12].forEach(m=>{const r=m-base;if(r>=0&&r<rows)s+=`<circle cx="${x0+2.5*dx}" cy="${y0+(r+.5)*dy}" r="3" class="inlay"/>`;});
  v.frets.forEach((f,i)=>{const x=x0+i*dx,isRoot=f>=0&&(OPEN_MIDI[i]+f)%12===v.rootPc;
    if(f===0)s+=`<circle cx="${x}" cy="${y0-20}" r="6" class="open ${isRoot?'root':''}"/>`;
    if(f<0)s+=`<text x="${x}" y="${y0-14}" class="mute">×</text>`;
    s+=`<text x="${x}" y="${y0+rows*dy+20}" class="lbl">${'EADGBE'[i]}</text>`;});
  v.steps.slice(0,Math.max(0,lit)).forEach((st,k)=>{const cy=y0+(st.fret-base+.5)*dy,cls=(st.idx.some(i=>(OPEN_MIDI[i]+st.fret)%12===v.rootPc)?'root':'tone')+(k===cur?' cur':'');
    if(st.barre){const xa=x0+Math.min(...st.idx)*dx,xb=x0+Math.max(...st.idx)*dx;s+=`<rect class="dot ${cls}" x="${xa-11}" y="${cy-11}" width="${xb-xa+22}" height="22" rx="11"/><text x="${(xa+xb)/2}" y="${cy+5}" class="dn">1</text>`;}
    else{const x=x0+st.idx[0]*dx;s+=`<circle class="dot ${cls}" cx="${x}" cy="${cy}" r="12"/><text x="${x}" y="${cy+5}" class="dn">${st.finger}</text>`;}});
  return s+'</svg>';}
function stepText(st,v){const nn=i=>NOTES[(OPEN_MIDI[i]+st.fret)%12];
  return st.barre?`Lay your index finger flat across fret ${st.fret}, pressing the ${st.idx.map(i=>ordS(6-i)).join(', ')} strings.`
   :`Press the ${ordS(6-st.idx[0])} string at fret ${st.fret} with your ${FINGER[st.finger]} finger (finger ${st.finger}).`;}
function openMuted(v){const o=v.frets.map((f,i)=>f===0?ordS(6-i):null).filter(Boolean),m=v.frets.map((f,i)=>f<0?ordS(6-i):null).filter(Boolean);
  return(o.length?`Open strings: ${o.join(', ')}. `:'')+(m.length?`Muted (don't play): ${m.join(', ')}.`:'All six strings are played.');}
