(() => {
  const audio = document.getElementById('compositionAudio');
  document.querySelectorAll('[data-seek]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!audio) return;
      stop(); audio.currentTime = Number(button.dataset.seek || 0);
      audio.play().catch(() => {});
    });
  });

  const roll = document.getElementById('pianoRoll');
  if (!roll) return;
  const bpm = document.getElementById('composerBpm');
  const keyEl = document.getElementById('composerKey');
  const scaleEl = document.getElementById('composerScale');
  const seedEl = document.getElementById('composerSeed');
  const lengthEl = document.getElementById('composerLength');
  const status = document.getElementById('playgroundStatus');
  const chordStrip = document.getElementById('chordStrip');
  const drumStrip = document.getElementById('drumStrip');
  const songOverview = document.getElementById('songOverview');
  const candidateRanking=document.getElementById('candidateRanking'), candidateSummary=document.getElementById('candidateSummary');
  const trackMelody = document.getElementById('trackMelody'), trackChords = document.getElementById('trackChords'), trackBass = document.getElementById('trackBass'), trackDrums = document.getElementById('trackDrums');
  const noteNames = ['C5','B4','A4','G4','F4','E4','D4','C4'];
  const semitone = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const sectionGrammar={A:{density:.66,shift:0,energy:.56,style:'sparse',nct:.20,cadence:'half',progression:['i','VI','III','VII']},B:{density:.78,shift:2,energy:.74,style:'flowing',nct:.28,cadence:'half',progression:['iv','VI','III','V']},Chorus:{density:.92,shift:9,energy:.96,style:'driving',nct:.32,cadence:'authentic',progression:['VI','VII','i','V']},Interlude:{density:.58,shift:0,energy:.64,style:'sparse',nct:.18,cadence:'none'},Final:{density:.90,shift:7,energy:.92,style:'driving',nct:.24,cadence:'authentic'},Intro:{density:.48,shift:-2,energy:.42,style:'sparse',nct:.14,cadence:'none'},A2:{density:.72,shift:2,energy:.68,style:'flowing',nct:.22,cadence:'half'},B2:{density:.84,shift:4,energy:.82,style:'flowing',nct:.28,cadence:'half'}};
  const scales = {major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10]};
  let cells = [], drumCells = [], timers = [], context = null, activeNodes = [], chordDegrees = [0,5,3,4], songBars = [], selectedSongEvents=[], selectedTrackEvents={chords:[],bass:[],drums:[]}, selectedSeed=null, selectedMotif=null, rankedCandidates=[], humanSelectedSeed=null, humanEdited=false;
  function midiFor(name){
    const m=name.match(/^([A-G])(\d)$/); return 12*(Number(m[2])+1)+semitone[m[1]];
  }
  function buildRoll(){
    roll.replaceChildren(); cells=[];
    noteNames.forEach((name,row)=>{
      const label=document.createElement('div'); label.className='note-label'; label.textContent=name; roll.appendChild(label);
      for(let step=0;step<16;step++){
        const b=document.createElement('button'); b.type='button'; b.className='note-cell'; b.dataset.row=row; b.dataset.step=step;
        b.setAttribute('aria-label',name+' step '+(step+1)); b.setAttribute('aria-pressed','false');
        b.addEventListener('click',()=>applyHumanMotifEdit(+b.dataset.row,Math.floor(+b.dataset.step/2)));
        roll.appendChild(b); cells.push(b);
      }
    });
  }
  function buildDrums(){
    drumStrip.replaceChildren(); drumCells=[];
    const label=document.createElement('div'); label.className='drum-label'; label.textContent='Kick'; drumStrip.appendChild(label);
    for(let step=0;step<16;step++){
      const b=document.createElement('button'); b.type='button'; b.className='drum-cell'; b.dataset.step=step; b.setAttribute('aria-label','Drum step '+(step+1));
      if([0,4,8,12].includes(step)) b.classList.add('active');
      b.setAttribute('aria-pressed',String(b.classList.contains('active')));
      b.addEventListener('click',()=>applyHumanDrumEdit(+b.dataset.step));
      drumStrip.appendChild(b); drumCells.push(b);
    }
  }
  function applyHumanDrumEdit(step){
    if(selectedSeed===null)return;stop();const on=!drumCells[step].classList.contains('active');drumCells[step].classList.toggle('active',on);drumCells[step].setAttribute('aria-pressed',String(on));
    if(!selectedTrackEvents.drums.length)selectedTrackEvents=parityTrackEvents();
    const eighth=step/2;
    for(let bar=0;bar<songBars.length;bar++){
      selectedTrackEvents.drums=selectedTrackEvents.drums.filter(e=>!(e.bar===bar&&e.note===36&&Math.abs(e.eighth-eighth)<1e-9));
      if(on)selectedTrackEvents.drums.push({bar,eighth,duration:.5,note:36,velocity:96});
    }
    selectedTrackEvents.drums.sort((a,b)=>a.bar-b.bar||a.eighth-b.eighth||a.note-b.note);humanEdited=true;const current=selectedMotif?evaluateCandidate(selectedMotif,selectedSeed):rankedCandidates.find(x=>x.seed===selectedSeed);candidateSummary.textContent='Human edited · Seed '+selectedSeed+(current?' · '+current.total.toFixed(1)+'/100':'');status.textContent='Human-edited kick pattern';
  }
  function rng(seed){let x=(Number(seed)||1)>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
  function allowedRows(){
    const root=semitone[keyEl.value], ints=scales[scaleEl.value];
    return noteNames.map((n,i)=>({i,m:midiFor(n)})).filter(x=>ints.includes(((x.m-root)%12+12)%12)).map(x=>x.i);
  }
  function degreeIndex(symbol){const major={I:0,ii:1,iii:2,IV:3,V:4,vi:5,'vii°':6},minor={i:0,'ii°':1,III:2,iv:3,v:4,V:4,VI:5,VII:6};return (scaleEl.value==='Minor'?minor:major)[symbol];}
  function triadFor(symbol,octave=4){const degree=degreeIndex(symbol);if(degree===undefined)return [0,2,4].map(d=>scaleMidi(d,octave));const tri=[0,2,4].map(d=>scaleMidi(degree+d,octave));if(scaleEl.value==='Minor'&&symbol==='V')tri[1]+=1;return tri;}
  function buildSong(){
    const random=rng((Number(seedEl.value)||1)+97), safeBpm=Math.max(60,Math.min(200,+bpm.value||120));
    const targetSeconds=Number(lengthEl.value)||60;
    const totalBars=Math.max(8,Math.round(targetSeconds*safeBpm/240));
    const templates=targetSeconds<=35?['A','B','Chorus','Final']:targetSeconds<=70?['A','B','Chorus','Interlude','Chorus','Final']:['Intro','A','B','Chorus','Interlude','A2','B2','Chorus','Final'];
    const base=Math.floor(totalBars/templates.length), extra=totalBars%templates.length;
    const sections=templates.map((name,i)=>({name,bars:base+(i<extra?1:0)}));
    songBars=[]; let absoluteBar=0;
    sections.forEach((section,sectionIndex)=>{
      for(let local=0;local<section.bars;local++,absoluteBar++){
        const grammar=sectionGrammar[section.name]||sectionGrammar.A;let degreeSymbol;
        if(grammar.progression)degreeSymbol=grammar.progression[local%grammar.progression.length];
        else degreeSymbol=(scaleEl.value==='Minor'?['i','VI','III','VII']:['I','vi','IV','V'])[local%4];
        if(grammar.cadence==='authentic'&&section.bars>=2&&local===section.bars-2)degreeSymbol='V';
        if(grammar.cadence==='authentic'&&local===section.bars-1)degreeSymbol=scaleEl.value==='Minor'?'i':'I';
        if(grammar.cadence==='half'&&local===section.bars-1)degreeSymbol='V';
        const degree=degreeIndex(degreeSymbol);
        songBars.push({section:section.name,degree,degreeSymbol,variation:random(),sectionIndex,localBar:local,sectionBars:section.bars,...grammar});
      }
    });
    const actualSeconds=Math.round(totalBars*4*60/safeBpm); let elapsedBars=0;
    songOverview.replaceChildren(...sections.map(section=>{const e=document.createElement('span');const startSec=Math.round(elapsedBars*4*60/safeBpm);elapsedBars+=section.bars;e.innerHTML='<strong>'+section.name+'</strong><small>'+section.bars+' bars · '+startSec+'s</small>';return e;}));
    status.textContent=totalBars+' bars / '+actualSeconds+' sec';
  }
  function pyRandom(seed){
    const N=624,M=397,MATRIX_A=0x9908b0df,UPPER_MASK=0x80000000,LOWER_MASK=0x7fffffff,mt=new Uint32Array(N);let index=N;
    function initGenrand(x){mt[0]=x>>>0;for(let i=1;i<N;i++){const v=mt[i-1]^(mt[i-1]>>>30);mt[i]=(Math.imul(1812433253,v)+i)>>>0;}}
    initGenrand(19650218);const key=[seed>>>0];let i=1,j=0,k=Math.max(N,key.length);
    for(;k;k--){const x=mt[i-1]^(mt[i-1]>>>30);mt[i]=(mt[i]^(Math.imul(x,1664525)))+key[j]+j>>>0;i++;j++;if(i>=N){mt[0]=mt[N-1];i=1;}if(j>=key.length)j=0;}
    for(k=N-1;k;k--){const x=mt[i-1]^(mt[i-1]>>>30);mt[i]=(mt[i]^(Math.imul(x,1566083941)))-i>>>0;i++;if(i>=N){mt[0]=mt[N-1];i=1;}}mt[0]=0x80000000;
    function twist(){for(let i=0;i<N;i++){const y=(mt[i]&UPPER_MASK)|(mt[(i+1)%N]&LOWER_MASK);mt[i]=mt[(i+M)%N]^(y>>>1)^((y&1)?MATRIX_A:0);}index=0;}
    function uint32(){if(index>=N)twist();let y=mt[index++];y^=y>>>11;y^=(y<<7)&0x9d2c5680;y^=(y<<15)&0xefc60000;y^=y>>>18;return y>>>0;}
    function random(){const a=uint32()>>>5,b=uint32()>>>6;return (a*67108864+b)/9007199254740992;}
    function getrandbits(k){if(k<=32)return uint32()>>>(32-k);throw new Error('getrandbits >32 unsupported');}
    function randbelow(n){const k=32-Math.clz32(n);let r;do{r=getrandbits(k);}while(r>=n);return r;}
    return {random,randint:(a,b)=>a+randbelow(b-a+1),choice:a=>a[randbelow(a.length)],choices:(values,weights)=>{const total=weights.reduce((a,b)=>a+b,0),x=random()*total;let acc=0;for(let i=0;i<values.length;i++){acc+=weights[i];if(x<acc)return values[i];}return values.at(-1);}};
  }
  function weightedMove(random){return random.choices([-2,-1,0,1,2],[1,4,2,4,1]);}
  function syncMotifRoll(){
    cells.forEach(cell=>{const step=Math.floor(+cell.dataset.step/2),item=selectedMotif?.find(m=>m.step===step),row=+cell.dataset.row,target=item?.scaleOffset===null?null:motifMidi(item.scaleOffset),on=target!==null&&midiFor(noteNames[row])===target;cell.classList.toggle('active',!!on);cell.setAttribute('aria-pressed',String(!!on));});
  }
  function motifMidi(scaleOffset){
    const scale=scales[scaleEl.value],root=semitone[keyEl.value],baseScale=scale.map(x=>60+root+x),ext=[...baseScale.map(x=>x-12),...baseScale,...baseScale.map(x=>x+12),...baseScale.map(x=>x+24)];
    return nearest(ext,baseScale[3]+scaleOffset*2);
  }
  function scaleOffsetForMidi(midi){
    let best=0,distance=Infinity;for(let offset=-4;offset<=5;offset++){const d=Math.abs(motifMidi(offset)-midi);if(d<distance){distance=d;best=offset;}}return best;
  }
  function applyHumanMotifEdit(row,step){
    if(!selectedMotif||selectedSeed===null)return;stop();const midi=midiFor(noteNames[row]),item=selectedMotif.find(m=>m.step===step);if(!item)return;
    const current=item.scaleOffset===null?null:motifMidi(item.scaleOffset);item.scaleOffset=current===midi?null:scaleOffsetForMidi(midi);
    const evaluated=evaluateCandidate(selectedMotif,selectedSeed);selectedSongEvents=evaluated.events;selectedTrackEvents=parityTrackEvents();syncMotifRoll();humanEdited=true;candidateSummary.textContent='Human edited · Seed '+selectedSeed+' · '+evaluated.total.toFixed(1)+'/100';status.textContent='Human-edited motif';
  }
  function candidateMotif(seed){
    const random=pyRandom(seed), contour=[0];for(let i=1;i<8;i++)contour.push(Math.max(-4,Math.min(5,contour[i-1]+weightedMove(random))));
    return contour.map((offset,step)=>({step,scaleOffset:(step!==0&&step!==4&&random.random()<.18)?null:offset,duration:(step===2||step===6)&&random.random()<.40?2:1}));
  }
  function nearest(values,target){return values.reduce((a,b)=>Math.abs(b-target)<Math.abs(a-target)?b:a);}
  function targetScore(value,target,tolerance){return Math.max(0,Math.min(100,100*(1-Math.abs(value-target)/tolerance)));}
  function expandedMelody(motif,seed){
    const events=[], random=pyRandom(seed+101), scale=scales[scaleEl.value], root=semitone[keyEl.value], baseScale=scale.map(x=>60+root+x), ext=[...baseScale.map(x=>x-12),...baseScale,...baseScale.map(x=>x+12),...baseScale.map(x=>x+24)];
    songBars.forEach((info,bar)=>motif.forEach(m=>{
      if(m.scaleOffset===null)return;let density=info.density;if(info.style==='sparse')density*=m.step%2?.74:.88;else if(info.style==='driving')density=Math.min(1,density+(m.step%2?.12:.06));if(m.step!==0&&m.step!==4&&random.random()>density)return;
      let offset=m.scaleOffset;if(info.section.toLowerCase().includes('b'))offset+=Math.floor((info.localBar%4)/2);else if(info.section.toLowerCase().includes('chorus'))offset=Math.round(offset*1.35)+2;
      let note=nearest(ext,baseScale[3]+offset*2+info.shift), chord=triadFor(info.degreeSymbol,4), chordExt=[...chord,...chord.map(n=>n+12)];
      if(m.step===0||m.step===4)note=nearest(chordExt,note);
      else if(random.random()<info.nct){const pcs=new Set(chord.map(n=>n%12)),cand=ext.filter(n=>!pcs.has(n%12)&&Math.abs(n-note)>0&&Math.abs(n-note)<=4);if(cand.length){const dist=Math.min(...cand.map(n=>Math.abs(n-note))),near=cand.filter(n=>Math.abs(n-note)===dist);note=random.choice(near);}}
      if(info.localBar%4===3&&m.step>=6)note=nearest([baseScale[0],baseScale[0]+12,baseScale[0]+24].filter(n=>n>=52&&n<=91),note);
      if(info.localBar===info.sectionBars-1&&m.step>=6&&info.cadence!=='none')note=nearest([scaleMidi(info.cadence==='authentic'?0:4,4),scaleMidi(info.cadence==='authentic'?0:4,5)],note);
      note=Math.max(52,Math.min(91,note));let duration=info.style==='driving'?1:m.duration;if(info.style==='sparse'&&m.step!==0&&m.step!==4&&random.random()<.35)duration=Math.min(2,duration+1);duration=Math.min(duration,8-m.step);const velocity=Math.max(45,Math.min(118,Math.trunc(70+28*info.energy+random.randint(-5,5))));
      if(events.length&&bar*8+m.step<events.at(-1).bar*8+events.at(-1).step+events.at(-1).duration)return;events.push({bar,step:m.step,midi:note,duration,velocity,section:info.section});
    }));
    songBars.forEach((info,bar)=>{if(info.localBar!==info.sectionBars-1||info.cadence==='none')return;const barEvents=events.filter(e=>e.bar===bar);if(!barEvents.length)return;const last=barEvents.reduce((a,b)=>b.step>a.step?b:a),scale=scales[scaleEl.value],root=semitone[keyEl.value],base=60+root+scale[info.cadence==='authentic'?0:4],targets=[base,base+12,base+24].filter(n=>n>=52&&n<=91);last.midi=nearest(targets,last.midi);});
    return events;
  }
  function evaluateCandidate(motif,seed){
    const events=expandedMelody(motif,seed);if(!events.length)return {seed,total:0,notes:motif,events};
    const tpb=480,barTicks=tpb*4,scale=scales[scaleEl.value],root=semitone[keyEl.value],tonicPc=(root+scale[0])%12,dominantPc=(root+scale[4])%12,sections=[];
    songBars.forEach(info=>{const last=sections.at(-1);if(last&&last.name===info.section)last.bars++;else sections.push({name:info.section,bars:1,cadence:info.cadence});});
    const melody=events.map(e=>({start:e.bar*barTicks+e.step*(tpb/2),duration:e.duration*(tpb/2),note:e.midi,velocity:e.velocity}));
    const chordForBar=bar=>triadFor(songBars[bar].degreeSymbol,4);
    const score=PMLEvaluatorCore.evaluate({ticksPerBeat:tpb,barTicks,tonicPc,dominantPc,sections},melody,chordForBar);
    return {seed,total:score.total_score,harmony:score.harmony_score,motion:score.motion_score,range:score.range_score,contrast:score.section_contrast_score,cadence:score.cadence_score,rhythm:score.rhythm_score,metrics:score,notes:motif,events};
  }
  function selectBrowserCandidate(candidate,human=false){
    stop();selectedSeed=candidate.seed;selectedMotif=candidate.notes.map(m=>({...m}));selectedSongEvents=candidate.events.map(e=>({...e}));selectedTrackEvents=parityTrackEvents();humanSelectedSeed=human?candidate.seed:null;humanEdited=false;syncMotifRoll();
    candidateRanking.querySelectorAll('.candidate-card').forEach(card=>{const selected=+card.dataset.seed===candidate.seed;card.classList.toggle('selected',selected);card.setAttribute('aria-pressed',String(selected));});
    candidateSummary.textContent=(human?'Human selected ':'Algorithm selected ')+'Seed '+candidate.seed+' · '+candidate.total.toFixed(1)+'/100';
  }
  function generateCandidates(){
    buildSong();const base=Number(seedEl.value)||1;rankedCandidates=Array.from({length:8},(_,i)=>{const seed=base+i,motif=candidateMotif(seed);return evaluateCandidate(motif,seed);}).sort((a,b)=>b.total-a.total||a.seed-b.seed);const best=rankedCandidates[0];
    candidateRanking.replaceChildren(...rankedCandidates.map((x,i)=>{const e=document.createElement('button');e.type='button';e.dataset.seed=x.seed;e.setAttribute('aria-pressed','false');e.className='candidate-card'+(i===0?' best':'');e.innerHTML='<strong>#'+(i+1)+' · '+x.total.toFixed(1)+'</strong><small>Seed '+x.seed+'</small>';e.title='Harmony '+x.harmony.toFixed(1)+' / Motion '+x.motion.toFixed(1)+' / Range '+x.range.toFixed(1)+' / Contrast '+x.contrast.toFixed(1)+' / Cadence '+x.cadence.toFixed(1)+' / Rhythm '+x.rhythm.toFixed(1);e.addEventListener('click',()=>selectBrowserCandidate(x,true));return e;}));
    selectBrowserCandidate(best,false);return best;
  }
  function parityTrackEvents(){
    const chords=[],bass=[],drums=[];
    songBars.forEach((info,bar)=>{
      const chord=triadFor(info.degreeSymbol,4),energy=info.energy;
      chord.forEach(note=>chords.push({bar,beat:0,duration:4,note,velocity:Math.trunc(52+25*energy)}));
      const bassChord=triadFor(info.degreeSymbol,3),root=bassChord[0]-12,fifth=bassChord[2]-12,notes=[root,root+12,fifth,root+12],next=songBars[bar+1];
      if(energy>=.85)notes[1]=fifth;
      if(info.localBar===info.sectionBars-1&&next&&next.energy>energy)notes[3]=triadFor(next.degreeSymbol,3)[0]-13;
      notes.forEach((note,beat)=>bass.push({bar,beat,duration:1,note,velocity:Math.trunc(68+24*energy+((beat===0||beat===2)?6:0))}));
      if(info.localBar===0&&energy>=.78)drums.push({bar,eighth:0,duration:2,note:49,velocity:108});
      for(let step=0;step<8;step++)drums.push({bar,eighth:step,duration:.5,note:(energy>=.90&&step===7)?46:42,velocity:Math.trunc(42+30*energy+(step%2===0?5:0))});
      const kicks=[0,2];if(energy>=.75)kicks.push(3);if(energy>=.90)drums.push({bar,eighth:3,duration:.5,note:36,velocity:86});
      kicks.forEach(beat=>drums.push({bar,eighth:beat*2,duration:1,note:36,velocity:96}));[1,3].forEach(beat=>drums.push({bar,eighth:beat*2,duration:1,note:38,velocity:92}));
      if(info.localBar===info.sectionBars-1&&next&&next.energy>energy)[[5,45],[6,47],[7,50]].forEach(([step,note])=>drums.push({bar,eighth:step,duration:.5,note,velocity:88+step}));
    });return {chords,bass,drums};
  }
  function generate(){
    stop(); cells.forEach(c=>{c.classList.remove('active');c.setAttribute('aria-pressed','false');});
    generateCandidates();
    updateChords(); buildSong();
  }
  function scaleMidi(degree, octave=4){
    const root=60+semitone[keyEl.value], ints=scales[scaleEl.value];
    const normalized=((degree%7)+7)%7, octaveShift=Math.floor(degree/7);
    return root+ints[normalized]+12*(octave-4+octaveShift);
  }
  function chordName(degree){
    const names=scaleEl.value==='major'?['I','ii','iii','IV','V','vi','vii°']:['i','ii°','III','iv','v','VI','VII'];
    return keyEl.value+' '+names[degree];
  }
  function updateChords(){
    chordStrip.replaceChildren(...chordDegrees.map(degree=>{const e=document.createElement('span');e.className='chord-preview';e.textContent=chordName(degree);return e;}));
  }
  function stop(){
    timers.forEach(clearTimeout); timers=[];
    activeNodes.forEach(n=>{try{n.onended=null;n.stop();n.disconnect();}catch{}}); activeNodes=[];
    cells.forEach(c=>c.classList.remove('playing')); drumCells.forEach(c=>c.classList.remove('playing')); status.textContent='Ready';
  }
  function play(){
    stop();const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor){status.textContent='Audio unsupported';return;}context ||= new AudioCtor();context.resume();if(audio&&!audio.paused)audio.pause();if(!songBars.length)buildSong();if(!selectedSongEvents.length){const fallbackSeed=selectedSeed??(Number(seedEl.value)||1),motif=candidateMotif(fallbackSeed);selectedSongEvents=expandedMelody(motif,fallbackSeed);selectedTrackEvents=parityTrackEvents();}
    const safeBpm=Math.max(60,Math.min(200,+bpm.value||120));bpm.value=String(safeBpm);status.textContent='Rendering…';
    const rendered=PMLRendererCore.render({bpm:safeBpm,melody:selectedSongEvents,chords:selectedTrackEvents.chords,bass:selectedTrackEvents.bass,drums:selectedTrackEvents.drums,enabled:{Melody:trackMelody.checked,Chords:trackChords.checked,Bass:trackBass.checked,Drums:trackDrums.checked}}),buffer=context.createBuffer(2,rendered.frames,rendered.rate);for(let ch=0;ch<2;ch++)buffer.getChannelData(ch).set(rendered.mix[ch]);const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);source.start();activeNodes.push(source);
    const stepMs=60000/safeBpm/4,totalSteps=songBars.length*16,started=performance.now();function visualTick(){const absolute=Math.floor((performance.now()-started)/stepMs);if(absolute>=totalSteps){cells.forEach(c=>c.classList.remove('playing'));drumCells.forEach(c=>c.classList.remove('playing'));status.textContent='Ready';return;}const step=absolute%16,bar=Math.floor(absolute/16),info=songBars[bar];cells.forEach(c=>c.classList.toggle('playing',+c.dataset.step===step));drumCells.forEach(c=>c.classList.toggle('playing',+c.dataset.step===step));status.textContent=info.section+' · '+(bar+1)+'/'+songBars.length+' bars';timers=[setTimeout(visualTick,Math.max(16,stepMs/2))];}visualTick();
    source.onended=()=>{activeNodes=activeNodes.filter(n=>n!==source);timers.forEach(clearTimeout);timers=[];cells.forEach(c=>c.classList.remove('playing'));drumCells.forEach(c=>c.classList.remove('playing'));status.textContent='Ready';};
  }
  buildRoll(); buildDrums(); updateChords(); buildSong();
  document.getElementById('generateMelody').addEventListener('click',generate);
  document.getElementById('clearMelody').addEventListener('click',()=>{stop();if(selectedMotif&&selectedSeed!==null){selectedMotif.forEach(m=>m.scaleOffset=null);const evaluated=evaluateCandidate(selectedMotif,selectedSeed);selectedSongEvents=evaluated.events;selectedTrackEvents=parityTrackEvents();syncMotifRoll();humanEdited=true;candidateSummary.textContent='Human edited · Seed '+selectedSeed+' · '+evaluated.total.toFixed(1)+'/100';status.textContent='Melody cleared';}else cells.forEach(c=>{c.classList.remove('active');c.setAttribute('aria-pressed','false');});});
  document.getElementById('playMelody').addEventListener('click',play);
  document.getElementById('stopMelody').addEventListener('click',stop);
  if(audio)audio.addEventListener('play',stop);
  [trackMelody,trackChords,trackBass,trackDrums].forEach(track=>track.addEventListener('change',stop));
  const invalidateComposition=()=>{selectedSongEvents=[];selectedTrackEvents={chords:[],bass:[],drums:[]};selectedSeed=null;selectedMotif=null;rankedCandidates=[];humanSelectedSeed=null;humanEdited=false;candidateRanking.replaceChildren();candidateSummary.textContent='曲を生成すると8候補を評価します';}; keyEl.addEventListener('change',()=>{stop();invalidateComposition();updateChords();buildSong();}); scaleEl.addEventListener('change',()=>{stop();invalidateComposition();updateChords();buildSong();}); bpm.addEventListener('change',()=>{stop();invalidateComposition();buildSong();}); lengthEl.addEventListener('change',()=>{stop();invalidateComposition();buildSong();});
})();