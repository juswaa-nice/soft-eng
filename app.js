// UI: dashboard, chord library, analyzer/practice, progress, routing.
const ALLCHORDS=KEYS.flatMap(r=>Object.keys(QUAL).map(q=>chordInfo(r,q)));
const BEGINNER=[['C','maj'],['G','maj'],['D','maj'],['A','maj'],['E','maj'],['E','min'],['A','min'],['D','min']];
const keyLabel=k=>KEY_LABEL[k]||k, h=(el,html)=>{el.innerHTML=html;};
let S={key:'G',minor:false,root:'G',q:'maj',vid:null,diff:'all'};
const cur=()=>{const vs=voicings(S.root,S.q);return vs.find(v=>v.id===S.vid)||vs[0];};
const shown=()=>voicings(S.root,S.q).filter(v=>S.diff==='all'||v.diff===S.diff);
function openVoicing(root,q,vid){S.root=root;S.q=q;S.vid=vid||null;const v=cur();S.vid=v.id;touchRecent(v.id);}
const vLabel=vid=>{const v=getVoicing(vid);return v?`${v.chord.name} – ${v.name}`:vid;};
function chipBtn(parent,vid,fn){const b=document.createElement('button');b.className='alt chip';b.textContent=vLabel(vid);b.onclick=fn;parent.appendChild(b);}

// ----- dashboard -----
function renderDash(){
  const[r,q]=BEGINNER[Math.floor(Date.now()/864e5)%BEGINNER.length],v=voicings(r,q)[0];
  h($('#dayDia'),fretSvg(v));h($('#dayName'),`${v.chord.full} (${v.chord.name})`);$('#dayInfo').textContent=`Notes: ${v.chord.tones.join(', ')} · ${v.diff}`;
  $('#dayBtn').onclick=()=>{openVoicing(r,q,v.id);S.key=r;location.hash='chords';};
  const rc=$('#dashRecent');rc.innerHTML='';prog.recent.filter(getVoicing).slice(0,5).forEach(id=>chipBtn(rc,id,()=>{const[a,b]=id.split('|');openVoicing(a,b,id);location.hash='chords';}));
  if(!rc.children.length)rc.textContent='Nothing yet. Open a chord in the library.';
  const sg=$('#dashSuggest');sg.innerHTML='';BEGINNER.slice(0,5).forEach(([a,b])=>{const x=document.createElement('button');x.className='alt chip';x.textContent=chordInfo(a,b).name;x.onclick=()=>{openVoicing(a,b,voicings(a,b)[0].id);location.hash='chords';};sg.appendChild(x);});
  const t=totals();h($('#dashStats'),prog.sessions||t.n?`<p><b>${prog.sessions}</b> practice sessions · <b>${t.n}</b> voicings attempted · <b>${t.ok}</b> recognized · <b>${t.inc}</b> inconclusive</p>`:'<p class="mut">No practice yet. Your numbers will appear here after your first session.</p>');
  h($('#dashLog'),prog.log.length?prog.log.slice(0,6).map(e=>`<div>${e.msg} <span class="mut">${new Date(e.t).toLocaleDateString()}</span></div>`).join(''):'<p class="mut">No activity yet.</p>');}
function totals(){const a=Object.values(prog.attempts);return{n:a.length,ok:a.reduce((s,x)=>s+x.ok,0),bad:a.reduce((s,x)=>s+x.bad,0),inc:a.reduce((s,x)=>s+x.inc,0)};}

// ----- library -----
function renderLib(){
  h($('#keys'),KEYS.map(k=>`<button class="alt chip${k===S.key?' on':''}" data-k="${k}">${keyLabel(k)}</button>`).join(''));
  $$('#keys button').forEach(b=>b.onclick=()=>{S.key=b.dataset.k;renderLib();});
  $('#modeBtn').textContent=S.minor?'Minor key (natural)':'Major key';
  const fam=family(S.key,S.minor);h($('#fam'),fam.map((c,i)=>`<button class="alt${c.root===S.root&&c.q===S.q?' on':''}" data-i="${i}"><small>${c.deg}</small> ${chordInfo(c.root,c.q).name}</button>`).join(''));
  $$('#fam button').forEach(b=>b.onclick=()=>{const c=fam[b.dataset.i];openVoicing(c.root,c.q);renderLib();});
  if(!$('#selRoot').options.length){h($('#selRoot'),KEYS.map(k=>`<option value="${k}">${keyLabel(k)}</option>`).join(''));h($('#selQ'),Object.keys(QUAL).map(q=>`<option value="${q}">${QUAL[q].label}</option>`).join(''));}
  $('#selRoot').value=S.root;$('#selQ').value=S.q;$('#selDiff').value=S.diff;
  const vs=shown(),v=cur(),i=vs.indexOf(v);
  h($('#vList'),vs.map(x=>`<button class="alt${x.id===v.id?' on':''}" data-v="${x.id}">${x.name}<br><span class="badge ${x.diff}">${x.diff}</span></button>`).join('')||'<p class="mut">No voicings at this difficulty. Choose “All”.</p>');
  $$('#vList button').forEach(b=>b.onclick=()=>{S.vid=b.dataset.v;touchRecent(S.vid);renderLib();});
  h($('#libSvg'),fretSvg(v,{big:true}));h($('#libTitle'),`${v.chord.full} <small class="mut">· ${v.name}</small>`);
  const rows=[['Notes',v.noteNames.join(', ')+(v.missing.length?` <span class="mut">(no ${v.missing.join(', ')} – incomplete chord)</span>`:'')],['Root',`${v.chord.root} (${v.frets.map((f,i)=>f>=0&&(OPEN_MIDI[i]+f)%12===v.rootPc?`string ${6-i}`:null).filter(Boolean).join(', ')})`],['Lowest note',v.lowest],['Inversion',v.inversion],['Position',v.position],['Fingers',v.steps.map(s=>stepText(s,v)).join(' ')],['Strings',openMuted(v)],['Difficulty',v.diff],['Character',v.desc]];
  h($('#vInfo'),rows.map(([a,b])=>`<tr><th>${a}</th><td>${b}</td></tr>`).join(''));
  $('#vPrev').onclick=()=>{if(vs.length){S.vid=vs[(i-1+vs.length)%vs.length].id;touchRecent(S.vid);renderLib();}};$('#vNext').onclick=()=>{if(vs.length){S.vid=vs[(i+1)%vs.length].id;touchRecent(S.vid);renderLib();}};
  $('#vPractice').onclick=()=>{queue=[v.id];qi=0;loadTarget();location.hash='analyzer';};
  renderProgs(fam);}
function progChords(pi){const pr=PROGRESSIONS[S.minor?'minor':'major'][pi],fam=family(S.key,S.minor),style=$('#pStyle').value;let prev=null;
  return pr[1].map(d=>{const c=fam[d],v=pickVoicing(c.root,c.q,style,prev);prev=v.minF;return v;});}
function renderProgs(){const list=PROGRESSIONS[S.minor?'minor':'major'];
  h($('#progs'),list.map(([n],i)=>{const vs=progChords(i);return`<div class="row"><b style="min-width:120px">${n}</b>${vs.map(v=>`<button class="alt chip" data-v="${v.id}">${v.chord.name}<small class="mut"> ${v.type==='open'?'open':'fret '+v.minF}</small></button>`).join('')}<button data-p="${i}">Practice</button></div>`;}).join('')+`<p class="mut">In ${keyLabel(S.key)} ${S.minor?'minor':'major'}. Shown chords use the style selected above.</p>`);
  $$('#progs [data-v]').forEach(b=>b.onclick=()=>{const[r,q]=b.dataset.v.split('|');openVoicing(r,q,b.dataset.v);renderLib();window.scrollTo(0,0);});
  $$('#progs [data-p]').forEach(b=>b.onclick=()=>{queue=progChords(+b.dataset.p).map(v=>v.id);qi=0;loadTarget();location.hash='analyzer';});}

// ----- practice target -----
let queue=[],qi=0,stepI=-1,res=null,A=null;
function target(){return getVoicing(queue[qi]||'')||cur();}
function loadTarget(){res=null;stepI=-1;const v=target();touchRecent(v.id);renderTarget();setState('ready','Ready to practice','Press “Start listening”, strum all the marked strings once, and let them ring.');}
function renderTarget(){const v=target();
  h($('#aSvg'),fretSvg(v,{big:true,lit:stepI<0?99:stepI+1,cur:stepI}));$('#aTitle').textContent=`${v.chord.full} – ${v.name}`;$('#aTarget').textContent=`${v.chord.name} (${v.name})`;
  $('#aInfo').textContent=`${queue.length>1?`Chord ${qi+1} of ${queue.length} · `:''}${v.position} · ${v.diff}. ${openMuted(v)}`;$('#aExp').textContent=v.noteNames.join(', ')+(v.missing.length?` (incomplete: no ${v.missing.join(', ')})`:'');
  h($('#aSteps'),v.steps.map((s,i)=>`<li class="${i===stepI?'cur':''}">${stepText(s,v)}</li>`).join(''));}
function setState(cls,label,msg){$('#aState').className='state '+cls;$('#aState').textContent=label;if(msg)$('#aMsg').textContent=msg;}
function fillOpts(){const m=$('#aMode').value,keyOpts=KEYS.map(k=>`<option value="${k}"${k===S.key?' selected':''}>${keyLabel(k)}</option>`).join('');
  h($('#aOpts'),m==='prog'?`<select id="oK">${keyOpts}</select><select id="oP">${PROGRESSIONS.major.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('')}</select>`:m==='family'?`<select id="oK">${keyOpts}</select>`:'');}
$('#aMode').onchange=fillOpts;
$('#aLoad').onclick=()=>{const m=$('#aMode').value;stopAnalyzer();
  if(m==='voicing')queue=[cur().id];
  else if(m==='random'){queue=BEGINNER.map(([r,q])=>voicings(r,q)[0].id).sort(()=>Math.random()-.5).slice(0,5);}
  else{const k=$('#oK').value,fam=family(k,false);let prev=null;const pick=d=>{const c=fam[d],v=pickVoicing(c.root,c.q,'open',prev);prev=v.minF;return v.id;};
    queue=(m==='prog'?PROGRESSIONS.major[+$('#oP').value][1]:[0,1,2,3,4,5]).map(pick);}
  qi=0;loadTarget();};
$('#sPrev').onclick=()=>{stepI=Math.max(0,(stepI<0?target().steps.length:stepI)-1);renderTarget();};
$('#sNext').onclick=()=>{stepI=Math.min(target().steps.length-1,stepI+1);renderTarget();};$('#sAll').onclick=()=>{stepI=-1;renderTarget();};
$('#aRetry').onclick=()=>{stopAnalyzer();loadTarget();startAnalyzer();};$('#aNext').onclick=()=>{stopAnalyzer();qi=(qi+1)%Math.max(1,queue.length);loadTarget();};$('#aBack').onclick=()=>location.hash='chords';

// ----- analysis: compare heard notes with the target voicing's notes, then name the closest chord -----
function record(kind){const id=target().id,a=prog.attempts[id]||(prog.attempts[id]={ok:0,bad:0,inc:0});a[kind]++;logEvent(`${{ok:'Recognized',bad:'Mismatch on',inc:'Unclear audio for'}[kind]} ${vLabel(id)}`);}
function score(pcs,c,total){const inn=pcs.reduce((s,p)=>s+c[p],0),cov=pcs.filter(p=>c[p]>.25).length/pcs.length;return{purity:inn/total,cov,score:inn/total*cov};}
async function startAnalyzer(){
  if(A)return;setState('requesting','Waiting for microphone permission');
  try{const{analyser,sampleRate}=await Mic.acquire('analyzer',16384);const tb=new Float32Array(2048);let sm=new Array(12).fill(0),last=0,streak={k:'',n:0},t0=performance.now(),sound=0;res=null;
    A={raf:0};prog.sessions++;saveProg();$('#aStart').disabled=true;$('#aStop').disabled=false;$('#aMic').textContent='Microphone: listening';setState('listening','Listening for guitar audio');
    const loop=t=>{if(!A)return;A.raf=requestAnimationFrame(loop);if(t-last<120||res)return;last=t;
      analyser.getFloatTimeDomainData(tb);const lvl=rmsOf(tb),v=target();
      if(lvl<.008){sm=sm.map(x=>x*.6);streak={k:'',n:0};if(performance.now()-t0>14000)finish('inc');return;}
      sound++;const raw=computeChroma(analyser,sampleRate,settings.a4),mx=Math.max(...raw);if(mx<=0)return;
      sm=sm.map((x,i)=>.55*x+.45*raw[i]/mx);const m=Math.max(...sm),c=sm.map(x=>x/m),total=c.reduce((a,b)=>a+b,0),heard=c.map((x,i)=>x>.25?i:-1).filter(i=>i>=0);
      const tg=score(v.pcs,c,total),best=ALLCHORDS.map(ch=>({ch,s:score(ch.pcs,c,total).score-.01*ch.pcs.length})).sort((a,b)=>b.s-a.s)[0];
      $('#aNotes').textContent=heard.map(i=>NOTES[i]).join(', ')||'–';$('#aConf').style.width=Math.round(tg.score*100)+'%';$('#aConfTxt').textContent=`Match with target notes: ${Math.round(tg.score*100)}%`;setState('analyzing','Analyzing chord');
      let k='unclear';if(heard.length>=2&&tg.cov>=.75&&tg.purity>=.7)k='match';else if(heard.length>=3&&best.s>=.6&&best.ch.name!==v.chord.name)k='mismatch:'+best.ch.name;
      $('#aDet').textContent=k==='match'?v.chord.name:k.startsWith('mis')?best.ch.name:'unclear';
      streak=streak.k===k?{k,n:streak.n+1}:{k,n:1};
      if(streak.k==='match'&&streak.n>=4)finish('ok',v);
      else if(streak.k.startsWith('mis')&&streak.n>=6){finish('bad',v,best.ch,v.pcs.filter(p=>c[p]<=.25).map(p=>NOTES[p]),heard);}
      else if(performance.now()-t0>14000)finish('inc');};
    A.raf=requestAnimationFrame(loop);
  }catch(e){setState('insufficient','Microphone unavailable',micError(e));$('#aMic').textContent='Microphone: off';}
}
function finish(kind,v,best,missing,heard){res=kind;record(kind);
  if(kind==='ok')setState('recognized','Chord recognized',`Good job! You played the expected chord tones (${v.noteNames.join(', ')}). Press “Next chord” to continue.`);
  if(kind==='bad')setState('mismatch','Chord mismatch',`The notes you played appear closer to ${best.name} than the target ${v.chord.name}.${missing.length?` Expected notes not heard: ${missing.join(', ')}.`:''} This could be finger placement, a muted or missed string, or noise. Check the steps and retry.`);
  if(kind==='inc')setState('retry','Retry recommended','Could not identify a chord confidently. Strum all marked strings clearly and let them ring. This is not counted as a mistake.');
  stopAnalyzer(true);}
function stopAnalyzer(keep){if(!A)return;cancelAnimationFrame(A.raf);A=null;Mic.release('analyzer');$('#aStart').disabled=false;$('#aStop').disabled=true;$('#aMic').textContent='Microphone: off';if(!keep&&!res)setState('ready','Ready to practice');}

// ----- progress / routing -----
function renderProgress(){const t=totals();
  h($('#pStats'),[['Sessions',prog.sessions],['Voicings attempted',t.n],['Recognized',t.ok],['Mismatches',t.bad],['Inconclusive',t.inc]].map(([l,v])=>`<div class="card"><div class="big">${v}</div>${l}</div>`).join(''));
  h($('#pTable'),'<tr><th>Voicing</th><th>Recognized</th><th>Mismatch</th><th>Inconclusive</th></tr>'+Object.entries(prog.attempts).map(([id,a])=>`<tr><td>${vLabel(id)}</td><td>${a.ok}</td><td>${a.bad}</td><td>${a.inc}</td></tr>`).join('')||'<tr><td colspan="4" class="mut">No attempts yet.</td></tr>');}
const PAGES=['dashboard','tuner','chords','analyzer','progress','settings'];
function route(){let p=location.hash.slice(1);if(p==='guide')p='analyzer';if(!PAGES.includes(p))p='dashboard';
  if(p!=='tuner')stopTuner();if(p!=='analyzer')stopAnalyzer();
  $$('.page').forEach(e=>e.classList.toggle('on',e.id===p));$$('nav a').forEach(a=>a.classList.toggle('on',a.hash==='#'+p));$('#nav').classList.remove('open');
  ({dashboard:renderDash,chords:renderLib,progress:renderProgress,analyzer:()=>{if(!queue.length){queue=[cur().id];}else if(!res&&!A&&queue.length===1&&$('#aMode').value==='voicing')queue=[cur().id];fillOpts();loadTarget();},settings:()=>{$('#sA4').value=settings.a4;$('#sTol').value=settings.tol;}})[p]?.();window.scrollTo(0,0);}
$('#modeBtn').onclick=()=>{S.minor=!S.minor;renderLib();};$('#selRoot').onchange=e=>{openVoicing(e.target.value,S.q);renderLib();};$('#selQ').onchange=e=>{openVoicing(S.root,e.target.value);renderLib();};
$('#selDiff').onchange=e=>{S.diff=e.target.value;if(shown().length&&!shown().includes(cur()))S.vid=shown()[0].id;renderLib();};$('#pStyle').onchange=renderProgs;
$('#tStart').onclick=startTuner;$('#tStop').onclick=stopTuner;$('#aStart').onclick=()=>{res=null;startAnalyzer();};$('#aStop').onclick=()=>stopAnalyzer();$('#menuBtn').onclick=()=>$('#nav').classList.toggle('open');
$('#sSave').onclick=()=>{const a=+$('#sA4').value,t=+$('#sTol').value;if(!(a>=415&&a<=466&&t>=1&&t<=15)){$('#sMsg').textContent='A4: 415–466, tolerance: 1–15.';return;}settings.a4=a;settings.tol=t;store.set('settings',settings);$('#sMsg').textContent='Saved.';};
$('#sReset').onclick=()=>{if(confirm('Erase all practice progress?')){Object.assign(prog,{sessions:0,attempts:{},recent:[],log:[]});saveProg();$('#sMsg').textContent='Progress erased.';}};
addEventListener('hashchange',route);addEventListener('pagehide',()=>{stopTuner();stopAnalyzer();});openVoicing('G','maj');route();
