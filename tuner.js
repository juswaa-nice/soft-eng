// Tuner UI (kept from v1). Uses audio.js for mic + YIN pitch detection.
const STRING_NAMES=['E2','A2','D3','G3','B3','E4'],STRING_HZ=[82.41,110.00,146.83,196.00,246.94,329.63];
// ---------- microphone helpers ----------
function micError(e){
  if(e.message==='unsupported') return 'This browser does not support microphone access. Try a current Chrome, Edge, Firefox or Safari.'+(window.isSecureContext?'':' Open the app via https:// or http://localhost.');
  if(e.name==='NotAllowedError') return 'Microphone permission was denied. Allow it in your browser’s site settings, then press Start again.';
  if(e.name==='NotFoundError') return 'No microphone found. Plug one in and try again.';
  return 'Could not start the microphone: '+(e.message||e.name); }

// ---------- tuner ----------
let tuner=null, selString=-1; // -1 = auto
$('#stringBtns').innerHTML=['Auto',...STRING_NAMES.map((n,i)=>`${6-i}: ${n}`)].map((t,i)=>`<button class="alt${i===0?' on':''}" data-s="${i-1}">${t}</button>`).join('');
$$('#stringBtns button').forEach(b=>b.onclick=()=>{ selString=+b.dataset.s; $$('#stringBtns button').forEach(x=>x.classList.toggle('on',x===b));
  $('#tHelp').textContent=selString<0?'Auto mode picks the nearest string. Pluck once and let it ring.':`Tune the ${6-selString}${['th','th','th','th','th','th'][0]} string to ${STRING_NAMES[selString]} (${STRING_HZ[selString]} Hz). Flat: tighten the peg. Sharp: loosen it.`; });
async function startTuner(){
  if(tuner) return; $('#tMic').textContent='Microphone: requesting…';
  try{ const {analyser,sampleRate}=await Mic.acquire('tuner',4096); const buf=new Float32Array(analyser.fftSize); const hist=[];
    tuner={raf:0}; $('#tStart').disabled=true; $('#tStop').disabled=false; $('#tMic').textContent='Microphone: listening'; prog.sessions++; saveProg();
    const loop=()=>{ if(!tuner) return; analyser.getFloatTimeDomainData(buf);
      if(rmsOf(buf)<0.01){ hist.length=0; tunerShow(null,'Too quiet – pluck a string'); }
      else { const {freq,clarity}=detectPitch(buf,sampleRate);
        if(freq<0||clarity<0.8){ tunerShow(null,'Unclear – mute other strings, let it ring'); }
        else { hist.push(freq); if(hist.length>5) hist.shift(); tunerShow([...hist].sort((a,b)=>a-b)[hist.length>>1]); } }
      tuner.raf=requestAnimationFrame(loop); }; loop();
  }catch(e){ $('#tMic').textContent='Microphone: off'; $('#tStatus').textContent=micError(e); }
}
function stopTuner(){ if(!tuner) return; cancelAnimationFrame(tuner.raf); tuner=null; Mic.release('tuner'); $('#tStart').disabled=false; $('#tStop').disabled=true; $('#tMic').textContent='Microphone: off'; tunerShow(null,'Stopped'); }
function tunerShow(f,msg){
  const m=$('#meter'),st=$('#tStatus'); m.className='meter';
  if(f===null){ st.className='status'; st.textContent=msg||''; return; }
  const scale=settings.a4/440, midi=69+12*Math.log2(f/settings.a4), nearest=Math.round(midi);
  let ti=selString; if(ti<0) ti=STRING_HZ.reduce((b,h,i)=>Math.abs(Math.log(f/(h*scale)))<Math.abs(Math.log(f/(STRING_HZ[b]*scale)))?i:b,0);
  const target=STRING_HZ[ti]*scale, cents=1200*Math.log2(f/target);
  $('#tNote').textContent=NOTES[((nearest%12)+12)%12]+(Math.floor(nearest/12)-1); $('#tFreq').textContent=`Frequency: ${f.toFixed(1)} Hz`;
  $('#tTarget').textContent=`Target: string ${6-ti} · ${STRING_NAMES[ti]} · ${target.toFixed(2)} Hz (${cents>0?'+':''}${cents.toFixed(0)} cents)`;
  $('#needle').style.left=(50+Math.max(-50,Math.min(50,cents))).toFixed(1)+'%';
  const inTune=Math.abs(cents)<=settings.tol; if(inTune) m.classList.add('in'); else if(Math.abs(cents)<15) m.classList.add('close');
  st.className='status '+(inTune?'in':cents<0?'flat':'sharp'); st.textContent=inTune?'In tune ✓':cents<0?'Flat – tighten the string':'Sharp – loosen the string';
}

