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
  const sectionGrammar={A:{density:.66,shift:0,energy:.56,style:'sparse',nct:.20,cadence:'half'},B:{density:.78,shift:2,energy:.74,style:'flowing',nct:.28,cadence:'half'},Chorus:{density:.92,shift:9,energy:.96,style:'driving',nct:.32,cadence:'authentic'},Interlude:{density:.58,shift:0,energy:.64,style:'sparse',nct:.18,cadence:'none'},Final:{density:.90,shift:7,energy:.92,style:'driving',nct:.24,cadence:'authentic'},Intro:{density:.48,shift:-2,energy:.42,style:'sparse',nct:.14,cadence:'none'},A2:{density:.72,shift:2,energy:.68,style:'flowing',nct:.22,cadence:'half'},B2:{density:.84,shift:4,energy:.82,style:'flowing',nct:.28,cadence:'half'}};
  const scales = {major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10]};
  let cells = [], drumCells = [], timers = [], context = null, activeNodes = [], chordDegrees = [0,5,3,4], songBars = [], audioGraph=null;
  const voiceConfig={
    Melody:{gain:.20,pan:.12,adsr:[.010,.090,.66,.22],cutoff:5600,layers:[['sawtooth',.74,0,-3.5],['sawtooth',.74,0,3.5],['sine',.32,1,0]]},
    Chords:{gain:.14,pan:-.18,adsr:[.050,.180,.52,.38],cutoff:3300,layers:[['triangle',1,0,0],['sine',.36,1,0]]},
    Bass:{gain:.24,pan:0,adsr:[.006,.110,.70,.15],cutoff:1450,layers:[['square',.42,0,0],['sine',1,0,0],['sine',.18,-1,0]]}
  };

  function midiFor(name){
    const m=name.match(/^([A-G])(\d)$/); return 12*(Number(m[2])+1)+semitone[m[1]];
  }
  function hz(midi){ return 440*Math.pow(2,(midi-69)/12); }
  function buildRoll(){
    roll.replaceChildren(); cells=[];
    noteNames.forEach((name,row)=>{
      const label=document.createElement('div'); label.className='note-label'; label.textContent=name; roll.appendChild(label);
      for(let step=0;step<16;step++){
        const b=document.createElement('button'); b.type='button'; b.className='note-cell'; b.dataset.row=row; b.dataset.step=step;
        b.setAttribute('aria-label',name+' step '+(step+1)); b.setAttribute('aria-pressed','false');
        b.addEventListener('click',()=>{b.classList.toggle('active');b.setAttribute('aria-pressed',String(b.classList.contains('active')));});
        roll.appendChild(b); cells.push(b);
      }
    });
  }
  function buildDrums(){
    drumStrip.replaceChildren(); drumCells=[];
    const label=document.createElement('div'); label.className='drum-label'; label.textContent='Beat'; drumStrip.appendChild(label);
    for(let step=0;step<16;step++){
      const b=document.createElement('button'); b.type='button'; b.className='drum-cell'; b.dataset.step=step; b.setAttribute('aria-label','Drum step '+(step+1));
      if([0,4,8,12].includes(step)) b.classList.add('active');
      b.setAttribute('aria-pressed',String(b.classList.contains('active')));
      b.addEventListener('click',()=>{b.classList.toggle('active');b.setAttribute('aria-pressed',String(b.classList.contains('active')));});
      drumStrip.appendChild(b); drumCells.push(b);
    }
  }
  function rng(seed){let x=(Number(seed)||1)>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
  function allowedRows(){
    const root=semitone[keyEl.value], ints=scales[scaleEl.value];
    return noteNames.map((n,i)=>({i,m:midiFor(n)})).filter(x=>ints.includes(((x.m-root)%12+12)%12)).map(x=>x.i);
  }
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
        const baseDegree=chordDegrees[local%4]; let degree=baseDegree;
        if(section.name.includes('Chorus')&&local%4===2)degree=5;
        else if(section.name==='B'&&local%4===3)degree=4;
        else if(section.name==='Interlude'&&local%4===1)degree=3;
        else if(section.name==='Final'&&local>=section.bars-2)degree=local===section.bars-1?0:4;
        const grammar=sectionGrammar[section.name]||sectionGrammar.A;
        songBars.push({section:section.name,degree,variation:random(),sectionIndex,localBar:local,sectionBars:section.bars,...grammar});
      }
    });
    const actualSeconds=Math.round(totalBars*4*60/safeBpm); let elapsedBars=0;
    songOverview.replaceChildren(...sections.map(section=>{const e=document.createElement('span');const startSec=Math.round(elapsedBars*4*60/safeBpm);elapsedBars+=section.bars;e.innerHTML='<strong>'+section.name+'</strong><small>'+section.bars+' bars · '+startSec+'s</small>';return e;}));
    status.textContent=totalBars+' bars / '+actualSeconds+' sec';
  }
  function candidateMotif(seed){
    const random=rng(seed), rows=allowedRows(), notes=[];
    for(let step=0;step<16;step++){if(random()<.22)continue;const row=rows[Math.floor(random()*rows.length)];notes.push({step,midi:midiFor(noteNames[row]),row});}
    return notes;
  }
  function targetScore(value,target,tolerance){return Math.max(0,Math.min(100,100*(1-Math.abs(value-target)/tolerance)));}
  function expandedMelody(motif,seed){
    const events=[];
    songBars.forEach((info,bar)=>motif.forEach(n=>{
      const phraseRandom=rng(seed+bar*131+n.step*17+97)(); if(n.step!==0&&n.step!==8&&phraseRandom>info.density)return;
      let midi=n.midi+info.shift;if(info.section.includes('Chorus'))midi+=Math.round((midi-67)*.18);
      if((info.cadence==='authentic'||info.cadence==='half')&&info.localBar===info.sectionBars-1&&n.step>=12)midi=scaleMidi(info.cadence==='authentic'?0:4,5);
      events.push({bar,step:n.step,midi,section:info.section});
    }));return events;
  }
  function evaluateCandidate(motif,seed){
    const events=expandedMelody(motif,seed); if(!events.length)return {seed,total:0,notes:motif};
    let strong=0,chordTones=0;events.forEach(e=>{if(e.step===0||e.step===8){strong++;const info=songBars[e.bar],pcs=new Set([0,2,4].map(d=>scaleMidi(info.degree+d,4)%12));if(pcs.has(e.midi%12))chordTones++;}});
    const ordered=[...events].sort((a,b)=>a.bar-b.bar||a.step-b.step),intervals=ordered.slice(1).map((n,i)=>Math.abs(n.midi-ordered[i].midi));
    const harmonyRatio=strong?chordTones/strong:0,stepwise=intervals.length?intervals.filter(x=>x<=4).length/intervals.length:0,pitches=events.map(e=>e.midi),melRange=Math.max(...pitches)-Math.min(...pitches);
    const firstName=songBars[0].section,lastName=songBars.at(-1).section,first=events.filter(e=>e.section===firstName),last=events.filter(e=>e.section===lastName);
    const avg=x=>x.reduce((a,e)=>a+e.midi,0)/Math.max(1,x.length),lift=avg(last)-avg(first),firstBars=songBars.filter(b=>b.section===firstName).length,lastBars=songBars.filter(b=>b.section===lastName).length,densityRatio=(last.length/Math.max(1,lastBars))/Math.max(.01,first.length/Math.max(1,firstBars));
    const contrast=targetScore(lift,8,8)*.65+targetScore(densityRatio,1.30,.80)*.35;
    const cadenceBars=songBars.map((x,i)=>({x,i})).filter(({x,i})=>x.cadence!=='none'&&(i===songBars.length-1||songBars[i+1].section!==x.section));let resolved=0;
    cadenceBars.forEach(({x,i})=>{const ev=events.filter(e=>e.bar===i).at(-1);if(ev&&ev.midi%12===scaleMidi(x.cadence==='authentic'?0:4,4)%12)resolved++;});const cadenceRatio=cadenceBars.length?resolved/cadenceBars.length:1;
    const onsetSlots=new Set(events.map(e=>e.step)).size,harmony=targetScore(harmonyRatio,.82,.45),motion=targetScore(stepwise,.72,.45),rangeScore=targetScore(melRange,20,15),cadence=cadenceRatio*100,rhythm=targetScore(onsetSlots/2,6,4)*.65+50*.35;
    const total=harmony*.25+motion*.20+rangeScore*.15+contrast*.15+cadence*.15+rhythm*.10;
    return {seed,total:+total.toFixed(3),harmony,motion,range:rangeScore,contrast,cadence,rhythm,notes:motif};
  }
  function generateCandidates(){
    buildSong();const base=Number(seedEl.value)||1, ranked=Array.from({length:8},(_,i)=>{const seed=base+i,motif=candidateMotif(seed);return evaluateCandidate(motif,seed);}).sort((a,b)=>b.total-a.total||a.seed-b.seed);
    const best=ranked[0];seedEl.value=String(best.seed);
    cells.forEach(c=>{const on=best.notes.some(n=>n.row===+c.dataset.row&&n.step===+c.dataset.step);c.classList.toggle('active',on);c.setAttribute('aria-pressed',String(on));});
    candidateRanking.replaceChildren(...ranked.map((x,i)=>{const e=document.createElement('div');e.className='candidate-card'+(i===0?' best':'');e.innerHTML='<strong>#'+(i+1)+' · '+x.total.toFixed(1)+'</strong><small>Seed '+x.seed+'</small>';e.title='Harmony '+x.harmony.toFixed(1)+' / Motion '+x.motion.toFixed(1)+' / Range '+x.range.toFixed(1)+' / Contrast '+x.contrast.toFixed(1)+' / Cadence '+x.cadence.toFixed(1)+' / Rhythm '+x.rhythm.toFixed(1);return e;}));
    candidateSummary.textContent='Algorithm selected Seed '+best.seed+' · '+best.total.toFixed(1)+'/100';return best;
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
    chordStrip.replaceChildren(...chordDegrees.map((degree,index)=>{
      const b=document.createElement('button'); b.type='button'; b.textContent=chordName(degree); b.title='クリックで次のダイアトニックコード';
      b.addEventListener('click',()=>{chordDegrees[index]=(chordDegrees[index]+1)%7;updateChords();buildSong();}); return b;
    }));
  }
  function ensureAudioGraph(){
    if(audioGraph)return;
    const master=context.createGain(); master.gain.value=.72; master.connect(context.destination);
    const makeBus=(pan,delaySend,reverbSend)=>{
      const input=context.createGain(), p=context.createStereoPanner?context.createStereoPanner():context.createGain(); if(p.pan)p.pan.value=pan;
      input.connect(p); p.connect(master);
      if(delaySend){
        [[.180,.12],[.360,.065]].forEach(([seconds,g])=>{const d=context.createDelay(.5),x=context.createGain();d.delayTime.value=seconds;x.gain.value=g;p.connect(d);d.connect(x);x.connect(master);});
      }
      if(reverbSend){
        [[.043,.070],[.071,.055],[.113,.045],[.181,.032],[.293,.022]].forEach(([seconds,g])=>{const d=context.createDelay(.4),x=context.createGain();d.delayTime.value=seconds;x.gain.value=g;p.connect(d);d.connect(x);x.connect(master);});
      }
      return input;
    };
    audioGraph={master,buses:{Melody:makeBus(.12,true,true),Chords:makeBus(-.18,false,true),Bass:makeBus(0,false,false),Drums:makeBus(0,false,true)}};
  }
  function voice(midi,name,duration=.18,velocity=1){
    ensureAudioGraph(); const cfg=voiceConfig[name], now=context.currentTime, filter=context.createBiquadFilter(), amp=context.createGain();
    filter.type='lowpass';filter.frequency.value=cfg.cutoff;filter.Q.value=.35;filter.connect(amp);amp.connect(audioGraph.buses[name]);
    const [attack,decay,sustain,release]=cfg.adsr, peak=Math.max(.0001,cfg.gain*velocity);
    amp.gain.setValueAtTime(.0001,now);amp.gain.exponentialRampToValueAtTime(peak,now+attack);amp.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*sustain),now+attack+decay);
    amp.gain.setValueAtTime(Math.max(.0001,peak*sustain),now+duration);amp.gain.exponentialRampToValueAtTime(.0001,now+duration+release);
    cfg.layers.forEach(([type,level,octave,detune])=>{const osc=context.createOscillator(),layer=context.createGain();osc.type=type;osc.frequency.value=hz(midi+12*octave);osc.detune.value=detune;layer.gain.value=level;osc.connect(layer).connect(filter);osc.start(now);osc.stop(now+duration+release+.03);activeNodes.push(osc);osc.onended=()=>{activeNodes=activeNodes.filter(n=>n!==osc);};});
  }
  function tone(midi,type='sine',level=.06,duration=.18){
    ensureAudioGraph(); const osc=context.createOscillator(), gain=context.createGain(), now=context.currentTime;
    osc.type=type; osc.frequency.value=hz(midi); gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime(level,now+.012); gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain).connect(audioGraph.buses.Drums); osc.start(now); osc.stop(now+duration+.02); activeNodes.push(osc);osc.onended=()=>{activeNodes=activeNodes.filter(n=>n!==osc);};
  }
  function drum(){
    const osc=context.createOscillator(), gain=context.createGain(), now=context.currentTime;
    osc.type='sine'; osc.frequency.setValueAtTime(115,now); osc.frequency.exponentialRampToValueAtTime(48,now+.09); gain.gain.setValueAtTime(.13,now); gain.gain.exponentialRampToValueAtTime(.0001,now+.11);
    ensureAudioGraph(); osc.connect(gain).connect(audioGraph.buses.Drums); osc.start(now); osc.stop(now+.12); activeNodes.push(osc); osc.onended=()=>{activeNodes=activeNodes.filter(n=>n!==osc);};
  }
  function stop(){
    timers.forEach(clearTimeout); timers=[];
    activeNodes.forEach(n=>{try{n.onended=null;n.stop();n.disconnect();}catch{}}); activeNodes=[];
    cells.forEach(c=>c.classList.remove('playing')); drumCells.forEach(c=>c.classList.remove('playing')); status.textContent='Ready';
  }
  function play(){
    stop();
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor){status.textContent='Audio unsupported';return;}
    context ||= new AudioCtor(); context.resume(); ensureAudioGraph(); if(audio&&!audio.paused)audio.pause(); if(!songBars.length) buildSong();
    const safeBpm=Math.max(60,Math.min(200,+bpm.value||120)); bpm.value=String(safeBpm);
    const stepMs=60000/safeBpm/4, totalSteps=songBars.length*16;
    let absolute=0;
    function tick(){
      if(absolute>=totalSteps){stop();return;}
      const step=absolute%16, bar=Math.floor(absolute/16), info=songBars[bar];
      cells.forEach(c=>c.classList.toggle('playing',+c.dataset.step===step)); drumCells.forEach(c=>c.classList.toggle('playing',+c.dataset.step===step));
      if(trackMelody.checked) cells.filter(c=>c.classList.contains('active')&&+c.dataset.step===step).forEach(c=>{
        const phraseRandom=rng((Number(seedEl.value)||1)+bar*131+step*17+97)();
        if(step!==0&&step!==8&&phraseRandom>info.density)return;
        let midi=midiFor(noteNames[+c.dataset.row])+info.shift;
        if(info.section.includes('Chorus'))midi+=Math.round((midi-67)*.18);
        if((info.cadence==='authentic'||info.cadence==='half')&&info.localBar===info.sectionBars-1&&step>=12)midi=scaleMidi(info.cadence==='authentic'?0:4,5);
        voice(midi,'Melody',Math.max(.08,stepMs/1000*(info.style==='sparse'?1.7:.8)),.72+.28*info.energy);
      });
      if(trackChords.checked && step===0)[0,2,4].forEach(d=>voice(scaleMidi(info.degree+d,4),'Chords',Math.max(.25,stepMs/1000*12),.65+.35*info.energy));
      if(trackBass.checked && step%4===0){
        const beat=step/4, bassDegree=beat===2?info.degree+4:info.degree;
        let bassMidi=scaleMidi(bassDegree,2)+(beat===1||beat===3?12:0);
        const next=songBars[bar+1]; if(beat===3&&next&&next.energy>info.energy)bassMidi=scaleMidi(next.degree,2)-1;
        voice(bassMidi,'Bass',Math.max(.18,stepMs/1000*1.6),.72+.28*info.energy);
      }
      if(trackDrums.checked){
        if(step%2===0)tone(info.energy>.9&&step===14?82:78,'square',.008+.008*info.energy,.035);
        if(step===0||step===8||(info.energy>=.75&&step===12))drum();
        if(step===4||step===12)tone(50,'triangle',.035,.07);
        const next=songBars[bar+1]; if(step>=10&&info.localBar===info.sectionBars-1&&next&&next.energy>info.energy)tone(45+(step-10), 'triangle',.025,.06);
      }
      status.textContent=info.section+' · '+(bar+1)+'/'+songBars.length+' bars';
      absolute++;
      timers=[setTimeout(tick,stepMs)];
    }
    tick();
  }
  buildRoll(); buildDrums(); updateChords(); buildSong();
  document.getElementById('generateMelody').addEventListener('click',generate);
  document.getElementById('clearMelody').addEventListener('click',()=>{stop();cells.forEach(c=>{c.classList.remove('active');c.setAttribute('aria-pressed','false');});});
  document.getElementById('playMelody').addEventListener('click',play);
  document.getElementById('stopMelody').addEventListener('click',stop);
  keyEl.addEventListener('change',()=>{updateChords();buildSong();}); scaleEl.addEventListener('change',()=>{updateChords();buildSong();}); bpm.addEventListener('change',buildSong); lengthEl.addEventListener('change',buildSong);
})();