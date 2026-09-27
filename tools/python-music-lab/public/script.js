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
  let cells = [], drumCells = [], timers = [], context = null, activeNodes = [], chordDegrees = [0,5,3,4], songBars = [], audioGraph=null, selectedSongEvents=[], selectedTrackEvents={chords:[],bass:[],drums:[]}, selectedSeed=null;
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
    let strong=0,chordTones=0;events.forEach(e=>{if(e.step===0||e.step===4){strong++;const info=songBars[e.bar],pcs=new Set([0,2,4].map(d=>scaleMidi(info.degree+d,4)%12));if(pcs.has(e.midi%12))chordTones++;}});
    const intervals=events.slice(1).map((n,i)=>Math.abs(n.midi-events[i].midi)),harmonyRatio=strong?chordTones/strong:0,stepwise=intervals.length?intervals.filter(x=>x<=4).length/intervals.length:0,pitches=events.map(e=>e.midi),melRange=Math.max(...pitches)-Math.min(...pitches);
    const firstName=songBars[0].section,lastName=songBars.at(-1).section,first=events.filter(e=>e.section===firstName),last=events.filter(e=>e.section===lastName),avg=x=>x.reduce((a,e)=>a+e.midi,0)/Math.max(1,x.length),lift=avg(last)-avg(first),firstBars=songBars.filter(b=>b.section===firstName).length,lastBars=songBars.filter(b=>b.section===lastName).length,densityRatio=(last.length/Math.max(1,lastBars))/Math.max(.01,first.length/Math.max(1,firstBars));
    const contrast=targetScore(lift,8,8)*.65+targetScore(densityRatio,1.30,.80)*.35,cadenceBars=songBars.map((x,i)=>({x,i})).filter(({x,i})=>x.cadence!=='none'&&(i===songBars.length-1||songBars[i+1].section!==x.section));let resolved=0;
    cadenceBars.forEach(({x,i})=>{const ev=events.filter(e=>e.bar===i).at(-1);if(ev&&ev.midi%12===scaleMidi(x.cadence==='authentic'?0:4,4)%12)resolved++;});const cadenceRatio=cadenceBars.length?resolved/cadenceBars.length:1,onsets=new Set(events.map(e=>e.step)).size,harmony=targetScore(harmonyRatio,.82,.45),motion=targetScore(stepwise,.72,.45),rangeScore=targetScore(melRange,20,15),cadence=cadenceRatio*100,rhythm=targetScore(onsets,6,4)*.65+50*.35,total=harmony*.25+motion*.20+rangeScore*.15+contrast*.15+cadence*.15+rhythm*.10;
    return {seed,total:+total.toFixed(3),harmony,motion,range:rangeScore,contrast,cadence,rhythm,notes:motif,events};
  }
  function generateCandidates(){
    buildSong();const base=Number(seedEl.value)||1,ranked=Array.from({length:8},(_,i)=>{const seed=base+i,motif=candidateMotif(seed);return evaluateCandidate(motif,seed);}).sort((a,b)=>b.total-a.total||a.seed-b.seed),best=ranked[0];seedEl.value=String(best.seed);
    cells.forEach(c=>{const step=Math.floor(+c.dataset.step/2),event=best.events.find(e=>e.bar===0&&e.step===step),on=event&&midiFor(noteNames[+c.dataset.row])===event.midi;c.classList.toggle('active',!!on);c.setAttribute('aria-pressed',String(!!on));});
    candidateRanking.replaceChildren(...ranked.map((x,i)=>{const e=document.createElement('div');e.className='candidate-card'+(i===0?' best':'');e.innerHTML='<strong>#'+(i+1)+' · '+x.total.toFixed(1)+'</strong><small>Seed '+x.seed+'</small>';e.title='Harmony '+x.harmony.toFixed(1)+' / Motion '+x.motion.toFixed(1)+' / Range '+x.range.toFixed(1)+' / Contrast '+x.contrast.toFixed(1)+' / Cadence '+x.cadence.toFixed(1)+' / Rhythm '+x.rhythm.toFixed(1);return e;}));candidateSummary.textContent='Algorithm selected Seed '+best.seed+' · '+best.total.toFixed(1)+'/100';selectedSongEvents=best.events;selectedTrackEvents=parityTrackEvents();selectedSeed=best.seed;return best;
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
    chordStrip.replaceChildren(...chordDegrees.map((degree,index)=>{
      const b=document.createElement('button'); b.type='button'; b.textContent=chordName(degree); b.title='クリックで次のダイアトニックコード';
      b.addEventListener('click',()=>{chordDegrees[index]=(chordDegrees[index]+1)%7;updateChords();buildSong();}); return b;
    }));
  }
  function ensureAudioGraph(){
    if(audioGraph)return;
    const mix=context.createGain(), saturator=context.createWaveShaper(), master=context.createGain(),drive=1.15,curve=new Float32Array(65537),den=Math.tanh(drive);
    for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1;curve[i]=Math.tanh(x*drive)/den;}
    saturator.curve=curve;saturator.oversample='2x';master.gain.value=.72;mix.connect(saturator);saturator.connect(master);master.connect(context.destination);
    const trackGain={Melody:1,Chords:.88,Bass:.96,Drums:.82};
    const makeBus=(name,pan,delaySend,reverbSend)=>{
      const input=context.createGain(), gain=context.createGain(), p=context.createStereoPanner?context.createStereoPanner():context.createGain();gain.gain.value=trackGain[name]??1;if(p.pan)p.pan.value=pan;
      input.connect(gain);gain.connect(p); p.connect(mix);
      if(delaySend){
        [[.180,.12],[.360,.065]].forEach(([seconds,g])=>{const d=context.createDelay(.5),x=context.createGain();d.delayTime.value=seconds;x.gain.value=g;p.connect(d);d.connect(x);x.connect(mix);});
      }
      if(reverbSend){
        [[.043,.070],[.071,.055],[.113,.045],[.181,.032],[.293,.022]].forEach(([seconds,g])=>{const d=context.createDelay(.4),x=context.createGain();d.delayTime.value=seconds;x.gain.value=g;p.connect(d);d.connect(x);x.connect(mix);});
      }
      return input;
    };
    audioGraph={mix,saturator,master,buses:{Melody:makeBus('Melody',.12,true,true),Chords:makeBus('Chords',-.18,false,true),Bass:makeBus('Bass',0,false,false),Drums:makeBus('Drums',0,false,true)}};
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
    context ||= new AudioCtor(); context.resume(); ensureAudioGraph(); if(audio&&!audio.paused)audio.pause(); if(!songBars.length) buildSong(); if(!selectedSongEvents.length){const fallbackSeed=selectedSeed??(Number(seedEl.value)||1),motif=candidateMotif(fallbackSeed);selectedSongEvents=expandedMelody(motif,fallbackSeed);selectedTrackEvents=parityTrackEvents();}
    const safeBpm=Math.max(60,Math.min(200,+bpm.value||120)); bpm.value=String(safeBpm);
    const stepMs=60000/safeBpm/4, totalSteps=songBars.length*16;
    let absolute=0;
    function tick(){
      if(absolute>=totalSteps){stop();return;}
      const step=absolute%16, bar=Math.floor(absolute/16), info=songBars[bar];
      cells.forEach(c=>c.classList.toggle('playing',+c.dataset.step===step)); drumCells.forEach(c=>c.classList.toggle('playing',+c.dataset.step===step));
      if(trackMelody.checked && step%2===0){
        const eighthStep=step/2, ev=selectedSongEvents.find(e=>e.bar===bar&&e.step===eighthStep);
        if(ev)voice(ev.midi,'Melody',Math.max(.08,stepMs/1000*2*ev.duration),ev.velocity/100);
      }
      if(trackChords.checked&&step===0)selectedTrackEvents.chords.filter(e=>e.bar===bar).forEach(e=>voice(e.note,'Chords',Math.max(.25,stepMs/1000*16),e.velocity/100));
      if(trackBass.checked&&step%4===0){const beat=step/4,e=selectedTrackEvents.bass.find(x=>x.bar===bar&&x.beat===beat);if(e)voice(e.note,'Bass',Math.max(.18,stepMs/1000*4),e.velocity/100);}
      if(trackDrums.checked&&step%2===0){const eighth=step/2;selectedTrackEvents.drums.filter(e=>e.bar===bar&&e.eighth===eighth).forEach(e=>{if(e.note===36)drum();else tone(e.note<40?50:e.note,'triangle',Math.max(.012,e.velocity/3500),Math.max(.035,stepMs/1000*e.duration*2));});}
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