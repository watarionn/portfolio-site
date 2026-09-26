(() => {
  const audio = document.getElementById('compositionAudio');
  document.querySelectorAll('[data-seek]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!audio) return;
      audio.currentTime = Number(button.dataset.seek || 0);
      audio.play().catch(() => {});
    });
  });

  const roll = document.getElementById('pianoRoll');
  if (!roll) return;
  const bpm = document.getElementById('composerBpm');
  const keyEl = document.getElementById('composerKey');
  const scaleEl = document.getElementById('composerScale');
  const seedEl = document.getElementById('composerSeed');
  const status = document.getElementById('playgroundStatus');
  const chordStrip = document.getElementById('chordStrip');
  const drumStrip = document.getElementById('drumStrip');
  const trackMelody = document.getElementById('trackMelody'), trackChords = document.getElementById('trackChords'), trackBass = document.getElementById('trackBass'), trackDrums = document.getElementById('trackDrums');
  const noteNames = ['C5','B4','A4','G4','F4','E4','D4','C4'];
  const semitone = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const scales = {major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10]};
  let cells = [], drumCells = [], timers = [], context = null, activeNodes = [], chordDegrees = [0,5,3,4];

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
  function generate(){
    stop(); cells.forEach(c=>{c.classList.remove('active');c.setAttribute('aria-pressed','false');});
    const random=rng(seedEl.value), rows=allowedRows();
    for(let step=0;step<16;step++){
      if(random()<.22) continue;
      const row=rows[Math.floor(random()*rows.length)];
      const c=cells.find(x=>+x.dataset.row===row&&+x.dataset.step===step); if(c){c.classList.add('active');c.setAttribute('aria-pressed','true');}
    }
    updateChords(); status.textContent='Generated';
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
      b.addEventListener('click',()=>{chordDegrees[index]=(chordDegrees[index]+1)%7;updateChords();}); return b;
    }));
  }
  function tone(midi,type='sine',level=.06,duration=.18){
    const osc=context.createOscillator(), gain=context.createGain(), now=context.currentTime;
    osc.type=type; osc.frequency.value=hz(midi); gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime(level,now+.012); gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain).connect(context.destination); osc.start(now); osc.stop(now+duration+.02); activeNodes.push(osc);
  }
  function drum(){
    const osc=context.createOscillator(), gain=context.createGain(), now=context.currentTime;
    osc.type='sine'; osc.frequency.setValueAtTime(115,now); osc.frequency.exponentialRampToValueAtTime(48,now+.09); gain.gain.setValueAtTime(.13,now); gain.gain.exponentialRampToValueAtTime(.0001,now+.11);
    osc.connect(gain).connect(context.destination); osc.start(now); osc.stop(now+.12); activeNodes.push(osc);
  }
  function stop(){
    timers.forEach(clearTimeout); timers=[];
    activeNodes.forEach(n=>{try{n.stop();}catch{}}); activeNodes=[];
    cells.forEach(c=>c.classList.remove('playing')); drumCells.forEach(c=>c.classList.remove('playing')); status.textContent='Ready';
  }
  function play(){
    stop();
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor){status.textContent='Audio unsupported';return;}
    context ||= new AudioCtor(); context.resume();
    const safeBpm=Math.max(60,Math.min(200,+bpm.value||120)); bpm.value=String(safeBpm);
    const stepMs=60000/safeBpm/4;
    for(let step=0;step<16;step++) timers.push(setTimeout(()=>{
      cells.forEach(c=>c.classList.toggle('playing',+c.dataset.step===step)); drumCells.forEach(c=>c.classList.toggle('playing',+c.dataset.step===step));
      if(trackMelody.checked) cells.filter(c=>c.classList.contains('active')&&+c.dataset.step===step).forEach(c=>tone(midiFor(noteNames[+c.dataset.row]),'triangle',.09,Math.max(.08,stepMs/1000*.8)));
      const degree=chordDegrees[Math.floor(step/4)];
      if(trackChords.checked && step%4===0){[0,2,4].forEach(d=>tone(scaleMidi(degree+d,4),'sine',.035,Math.max(.25,stepMs/1000*3.5)));}
      if(trackBass.checked && step%4===0) tone(scaleMidi(degree,2),'square',.045,Math.max(.18,stepMs/1000*1.6));
      if(trackDrums.checked && drumCells[step].classList.contains('active')) drum();
      status.textContent='Playing '+(step+1)+'/16';
    },step*stepMs));
    timers.push(setTimeout(stop,16*stepMs+40));
  }
  buildRoll(); buildDrums(); updateChords();
  document.getElementById('generateMelody').addEventListener('click',generate);
  document.getElementById('clearMelody').addEventListener('click',()=>{stop();cells.forEach(c=>{c.classList.remove('active');c.setAttribute('aria-pressed','false');});});
  document.getElementById('playMelody').addEventListener('click',play);
  document.getElementById('stopMelody').addEventListener('click',stop);
  keyEl.addEventListener('change',updateChords); scaleEl.addEventListener('change',updateChords);
})();