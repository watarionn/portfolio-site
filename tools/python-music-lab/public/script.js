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
  const noteNames = ['C5','B4','A4','G4','F4','E4','D4','C4'];
  const semitone = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const scales = {major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10]};
  let cells = [], timers = [], context = null, activeNodes = [];

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
  function rng(seed){let x=(Number(seed)||1)>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
  function allowedRows(){
    const root=semitone[keyEl.value], ints=scales[scaleEl.value];
    return noteNames.map((n,i)=>({i,m:midiFor(n)})).filter(x=>ints.includes(((x.m-root)%12+12)%12)).map(x=>x.i);
  }
  function generate(){
    stop(); cells.forEach(c=>c.classList.remove('active'));
    const random=rng(seedEl.value), rows=allowedRows();
    for(let step=0;step<16;step++){
      if(random()<.22) continue;
      const row=rows[Math.floor(random()*rows.length)];
      const c=cells.find(x=>+x.dataset.row===row&&+x.dataset.step===step); if(c)c.classList.add('active');
    }
    updateChords(); status.textContent='Generated';
  }
  function updateChords(){
    const root=keyEl.value, major=scaleEl.value==='major';
    const progression=major?['I','vi','IV','V']:['i','VI','III','VII'];
    chordStrip.replaceChildren(...progression.map(x=>{const s=document.createElement('span');s.textContent=root+' '+x;return s;}));
  }
  function stop(){
    timers.forEach(clearTimeout); timers=[];
    activeNodes.forEach(n=>{try{n.stop();}catch{}}); activeNodes=[];
    cells.forEach(c=>c.classList.remove('playing')); status.textContent='Ready';
  }
  function play(){
    stop(); context ||= new (window.AudioContext||window.webkitAudioContext)(); context.resume();
    const stepMs=60000/Math.max(60,Math.min(200,+bpm.value||120))/4;
    for(let step=0;step<16;step++) timers.push(setTimeout(()=>{
      cells.forEach(c=>c.classList.toggle('playing',+c.dataset.step===step));
      cells.filter(c=>c.classList.contains('active')&&+c.dataset.step===step).forEach(c=>{
        const osc=context.createOscillator(), gain=context.createGain(), now=context.currentTime;
        osc.type='triangle'; osc.frequency.value=hz(midiFor(noteNames[+c.dataset.row]));
        gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime(.12,now+.015); gain.gain.exponentialRampToValueAtTime(.0001,now+Math.max(.08,stepMs/1000*.8));
        osc.connect(gain).connect(context.destination); osc.start(now); osc.stop(now+Math.max(.1,stepMs/1000*.85)); activeNodes.push(osc);
      });
      status.textContent='Playing '+(step+1)+'/16';
    },step*stepMs));
    timers.push(setTimeout(stop,16*stepMs+40));
  }
  buildRoll(); updateChords();
  document.getElementById('generateMelody').addEventListener('click',generate);
  document.getElementById('clearMelody').addEventListener('click',()=>{stop();cells.forEach(c=>c.classList.remove('active'));});
  document.getElementById('playMelody').addEventListener('click',play);
  document.getElementById('stopMelody').addEventListener('click',stop);
  keyEl.addEventListener('change',updateChords); scaleEl.addEventListener('change',updateChords);
})();