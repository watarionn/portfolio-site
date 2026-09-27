(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PMLRendererCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const RATE=44100;
  const VOICES={
    Melody:{gain:.20,pan:.12,adsr:[.010,.090,.66,.22],layers:[['saw',.74,0,-3.5],['saw',.74,0,3.5],['sine',.32,1,0]],cutoff:5600},
    Chords:{gain:.14,pan:-.18,adsr:[.050,.180,.52,.38],layers:[['triangle',1,0,0],['sine',.36,1,0]],cutoff:3300},
    Bass:{gain:.24,pan:0,adsr:[.006,.110,.70,.15],layers:[['square',.42,0,0],['sine',1,0,0],['sine',.18,-1,0]],cutoff:1450}
  };
  const hz=midi=>440*Math.pow(2,(midi-69)/12);
  const pyRound=value=>{const floor=Math.floor(value),fraction=value-floor;if(fraction<.5)return floor;if(fraction>.5)return floor+1;return floor%2===0?floor:floor+1;};
  function drumNoise(length,seed){
    const MASK128=(1n<<128n)-1n,MASK64=(1n<<64n)-1n,M=(2549297995355413924n<<64n)|4865540595714422341n,IA=0x43b0d7e5,MA=0x931e8875,IB=0x8b51f9dd,MB=0x58f38ded,ML=0xca01f9dd,MR=0x4973f715;
    let hc=IA>>>0;const hash=v=>{let x=(v^hc)>>>0;hc=Math.imul(hc,MA)>>>0;x=Math.imul(x,hc)>>>0;return(x^(x>>>16))>>>0},mix=(x,y)=>{let z=(Math.imul(ML,x)-Math.imul(MR,y))>>>0;return(z^(z>>>16))>>>0};
    let entropy=[],n=BigInt(seed>>>0);if(n===0n)entropy=[0];while(n){entropy.push(Number(n&0xffffffffn));n>>=32n;}const pool=new Uint32Array(4);for(let i=0;i<4;i++)pool[i]=hash(i<entropy.length?entropy[i]:0);for(let src=0;src<4;src++)for(let dst=0;dst<4;dst++)if(src!==dst)pool[dst]=mix(pool[dst],hash(pool[src]));
    hc=IB>>>0;const words=[];for(let i=0;i<8;i++){let v=pool[i%4]^hc;hc=Math.imul(hc,MB)>>>0;v=Math.imul(v,hc)>>>0;words.push((v^(v>>>16))>>>0);}const u64=[];for(let i=0;i<8;i+=2)u64.push((BigInt(words[i+1])<<32n)|BigInt(words[i]));
    const init=(u64[0]<<64n)|u64[1],seq=(u64[2]<<64n)|u64[3],inc=((seq<<1n)|1n)&MASK128;let state=0n;state=(state*M+inc)&MASK128;state=(state+init)&MASK128;state=(state*M+inc)&MASK128;
    const raw=()=>{state=(state*M+inc)&MASK128;const x=((state>>64n)^(state&MASK64))&MASK64,r=state>>122n;return((x>>r)|(x<<((64n-r)&63n)))&MASK64;},out=new Float64Array(length);for(let i=0;i<length;i++)out[i]=2*(Number(raw()>>11n)/9007199254740992)-1;return out;
  }
  function movingAverage(stereo,window){
    const out=[new Float64Array(stereo[0].length),new Float64Array(stereo[1].length)];
    for(let ch=0;ch<2;ch++){let sum=0;const csum=new Float64Array(stereo[ch].length);for(let i=0;i<stereo[ch].length;i++){sum+=stereo[ch][i];csum[i]=sum;out[ch][i]=i<window-1?sum/(i+1):(sum-(i>=window?csum[i-window]:0))/window;}}return out;
  }
  function tonal(midi,name,duration,velocity){
    const cfg=VOICES[name],[attack,decay,sustain,release]=cfg.adsr,noteSamples=Math.max(1,pyRound(duration*RATE)),releaseSamples=Math.max(0,pyRound(release*RATE)),count=noteSamples+releaseSamples,attackSamples=Math.min(noteSamples,Math.max(0,pyRound(attack*RATE))),decaySamples=Math.min(noteSamples-attackSamples,Math.max(0,pyRound(decay*RATE))),sustainSamples=noteSamples-attackSamples-decaySamples,envelope=new Float64Array(count);
    for(let i=0;i<attackSamples;i++)envelope[i]=i/attackSamples;for(let i=0;i<decaySamples;i++)envelope[attackSamples+i]=1+(sustain-1)*(i/decaySamples);for(let i=0;i<sustainSamples;i++)envelope[attackSamples+decaySamples+i]=sustain;if(releaseSamples){const level=envelope[noteSamples-1]||sustain;for(let i=0;i<releaseSamples;i++)envelope[noteSamples+i]=releaseSamples===1?0:level*(1-i/(releaseSamples-1));}
    const left=new Float64Array(count),right=new Float64Array(count),base=hz(midi),amp=cfg.layers.reduce((s,l)=>s+Math.abs(l[1]),0)||1,angle=(cfg.pan+1)*Math.PI/4,pl=Math.cos(angle),pr=Math.sin(angle);
    for(let i=0;i<count;i++){const t=i/RATE;let mono=0;for(const [type,level,octave,detune] of cfg.layers){const cycles=base*Math.pow(2,octave)*Math.pow(2,detune/1200)*t,wrapped=cycles-Math.floor(cycles),phase=2*Math.PI*wrapped,wave=type==='sine'?Math.sin(phase):type==='square'?(wrapped<.5?1:-1):type==='triangle'?1-4*Math.abs(wrapped-.5):2*wrapped-1;mono+=level*wave;}mono=mono/amp*envelope[i]*velocity*cfg.gain;left[i]=mono*pl;right[i]=mono*pr;}return[left,right];
  }
  function drum(note,velocity,startSeconds){
    const v=velocity/127,duration=note===36?.34:note===38?.24:note===42?.09:note===46?.20:note===49?.72:.12,count=Math.max(1,pyRound(duration*RATE)),seed=((note*1000003)^pyRound(startSeconds*1e6))>>>0,noise=drumNoise(count,seed),mono=new Float64Array(count);
    for(let i=0;i<count;i++){const t=i/RATE;if(note===36)mono[i]=Math.sin(2*Math.PI*(105*t-42*t*t))*Math.exp(-t*13)*.72*v;else if(note===38)mono[i]=(.72*noise[i]+.28*Math.sin(2*Math.PI*185*t))*Math.exp(-t*17)*.46*v;else if(note===42||note===46)mono[i]=noise[i]*Math.exp(-t*(note===42?46:22))*.22*v;else if(note===49)mono[i]=(noise[i]+Math.sin(2*Math.PI*4600*t)*.15)*Math.exp(-t*5.2)*.26*v;else mono[i]=noise[i]*Math.exp(-t*30)*.15*v;}
    const pan=note===38?.05:note===42?-.25:note===46?.25:note===49?.30:0,angle=(pan+1)*Math.PI/4,left=new Float64Array(count),right=new Float64Array(count),pl=Math.cos(angle),pr=Math.sin(angle);for(let i=0;i<count;i++){left[i]=mono[i]*pl;right[i]=mono[i]*pr;}return[left,right];
  }
  function addTapsInPlace(dry,specs){
    const tapSpecs=specs.map(([ms,gain,cross])=>[pyRound(ms*RATE/1000),gain,cross]),maxDelay=Math.max(0,...tapSpecs.map(t=>t[0])),size=maxDelay+1,history=[new Float64Array(size),new Float64Array(size)];
    for(let i=0;i<dry[0].length;i++){
      const slot=i%size,originalL=dry[0][i],originalR=dry[1][i];history[0][slot]=originalL;history[1][slot]=originalR;let wetL=0,wetR=0;
      for(const [delay,gain,cross] of tapSpecs)if(i>=delay){const src=(i-delay)%size;wetL+=history[cross?1:0][src]*gain;wetR+=history[cross?0:1][src]*gain;}
      dry[0][i]=originalL+wetL;dry[1][i]=originalR+wetR;
    }
  }
  function render(input){
    const bpm=Math.max(60,Math.min(200,+input.bpm||120)),beat=60/bpm,eighth=beat/2,enabled=Object.assign({Melody:true,Chords:true,Bass:true,Drums:true},input.enabled||{}),retainTracks=!!input.retainTracks,m=input.melody||[],c=input.chords||[],b=input.bass||[],d=input.drums||[];
    const melodyEnd=Math.max(0,...m.map(e=>(e.bar*4+(e.step+e.duration)*.5)*beat)),chordEnd=Math.max(0,...c.map(e=>(e.bar*4+e.beat+e.duration)*beat)),bassEnd=Math.max(0,...b.map(e=>(e.bar*4+e.beat+e.duration)*beat)),drumEnd=Math.max(0,...d.map(e=>(e.bar*4+(e.eighth+e.duration)*.5)*beat)),frames=Math.max(1,Math.ceil((Math.max(melodyEnd,chordEnd,bassEnd,drumEnd)+2.4)*RATE)),preMix=[new Float64Array(frames),new Float64Array(frames)],tracks=retainTracks?{}:null;
    const rv=[[43,.070,true],[71,.055,false],[113,.045,true],[181,.032,false],[293,.022,true]],gains={Melody:1,Chords:.88,Bass:.96,Drums:.82};
    const finish=(name,events,addEvent)=>{
      let track=[new Float64Array(frames),new Float64Array(frames)];
      if(enabled[name])for(const e of events){const [start,pcm]=addEvent(e);const offset=pyRound(start*RATE);for(let ch=0;ch<2;ch++)for(let i=0;i<pcm[ch].length&&offset+i<frames;i++)track[ch][offset+i]+=pcm[ch][i];}
      if(name!=='Drums'){const w=Math.max(1,Math.min(512,pyRound(RATE/(2*VOICES[name].cutoff))));track=movingAverage(movingAverage(track,w),w);}
      const gain=gains[name];for(let ch=0;ch<2;ch++)for(let i=0;i<frames;i++)track[ch][i]*=gain;
      if(enabled[name]&&name==='Melody'){addTapsInPlace(track,[[180,.12,true],[360,.065,false]]);addTapsInPlace(track,rv);}
      else if(enabled[name]&&(name==='Chords'||name==='Drums'))addTapsInPlace(track,rv);
      for(let ch=0;ch<2;ch++)for(let i=0;i<frames;i++)preMix[ch][i]+=track[ch][i];
      if(retainTracks)tracks[name]=track;
    };
    finish('Melody',m,e=>[(e.bar*4+e.step*.5)*beat,tonal(e.midi,'Melody',e.duration*eighth,e.velocity/127)]);
    finish('Chords',c,e=>[(e.bar*4+e.beat)*beat,tonal(e.note,'Chords',e.duration*beat,e.velocity/127)]);
    finish('Bass',b,e=>[(e.bar*4+e.beat)*beat,tonal(e.note,'Bass',e.duration*beat,e.velocity/127)]);
    finish('Drums',d,e=>{const start=(e.bar*4+e.eighth*.5)*beat;return[start,drum(e.note,e.velocity,start)];});
    const mix=[new Float64Array(frames),new Float64Array(frames)],den=Math.tanh(1.15);let peak=0;for(let ch=0;ch<2;ch++)for(let i=0;i<frames;i++){const v=Math.tanh(preMix[ch][i]*1.15)/den;mix[ch][i]=v;peak=Math.max(peak,Math.abs(v));}const normalization=peak>0?.92/peak:1;for(let ch=0;ch<2;ch++)for(let i=0;i<frames;i++)mix[ch][i]*=normalization;
    return{rate:RATE,frames,tracks,mix,sourcePeak:peak,normalization};
  }
  return{RATE,VOICES,pyRound,drumNoise,movingAverage,tonal,drum,render};
});
