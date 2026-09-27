(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PMLEvaluatorCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
  const targetScore=(v,target,tolerance)=>tolerance<=0?(v===target?100:0):clamp(100*(1-Math.abs(v-target)/tolerance));
  const pyRound=value=>{const floor=Math.floor(value),fraction=value-floor;if(fraction<.5)return floor;if(fraction>.5)return floor+1;return floor%2===0?floor:floor+1;};
  const roundTo=(v,digits)=>{const scale=10**digits;return pyRound(v*scale)/scale;};
  function sectionRanges(config){let cursor=0;return config.sections.map(section=>{const start=cursor*config.barTicks;cursor+=section.bars;return{name:section.name,start,end:cursor*config.barTicks};});}
  const inRange=(events,start,end)=>events.filter(e=>start<=e.start&&e.start<end);
  function evaluate(config,melody,chordForBar){
    let strong=0,chordTones=0;
    for(const e of melody){const pos=e.start%config.barTicks,beat=Math.floor(pos/config.ticksPerBeat);if(pos%config.ticksPerBeat===0&&(beat===0||beat===2)){strong++;const pcs=new Set(chordForBar(Math.floor(e.start/config.barTicks)).map(n=>((n%12)+12)%12));if(pcs.has(((e.note%12)+12)%12))chordTones++;}}
    const harmonyRatio=strong?chordTones/strong:0,ordered=[...melody].sort((a,b)=>a.start-b.start),intervals=ordered.slice(1).map((e,i)=>Math.abs(e.note-ordered[i].note)),stepwise=intervals.length?intervals.filter(x=>x<=4).length/intervals.length:0,notes=melody.map(e=>e.note),pitchRange=notes.length?Math.max(...notes)-Math.min(...notes):0,ranges=sectionRanges(config);
    let contrast=50;
    if(ranges.length>=2){const first=inRange(melody,ranges[0].start,ranges[0].end),last=inRange(melody,ranges.at(-1).start,ranges.at(-1).end);if(!first.length||!last.length)contrast=0;else{const avg=a=>a.reduce((s,e)=>s+e.note,0)/a.length,lift=avg(last)-avg(first),fd=first.length/config.sections[0].bars,ld=last.length/config.sections.at(-1).bars,ratio=ld/Math.max(.01,fd);contrast=targetScore(lift,8,8)*.65+targetScore(ratio,1.30,.80)*.35;}}
    let resolved=0,cadenceTotal=0;for(let i=0;i<config.sections.length;i++){const section=config.sections[i];if(section.cadence==='none')continue;const r=ranges[i],events=inRange(melody,r.start,r.end);if(!events.length)continue;const final=events.reduce((a,b)=>b.start>a.start?b:a);cadenceTotal++;const expected=section.cadence==='authentic'?config.tonicPc:config.dominantPc;if(((final.note%12)+12)%12===expected)resolved++;}
    const cadenceRatio=cadenceTotal?resolved/cadenceTotal:1,eighth=Math.floor(config.ticksPerBeat/2),onsets=new Set(melody.map(e=>Math.floor((e.start%config.barTicks)/eighth))),durations=new Set(melody.map(e=>Math.max(1,pyRound(e.duration/eighth)))),rhythm=melody.length?targetScore(onsets.size,6,4)*.65+targetScore(durations.size,2,2)*.35:0,harmony=targetScore(harmonyRatio,.82,.45),motion=targetScore(stepwise,.72,.45),range=targetScore(pitchRange,20,15),cadence=cadenceRatio*100,total=harmony*.25+motion*.20+range*.15+contrast*.15+cadence*.15+rhythm*.10;
    return{total_score:roundTo(total,3),harmony_score:roundTo(harmony,3),motion_score:roundTo(motion,3),range_score:roundTo(range,3),section_contrast_score:roundTo(contrast,3),cadence_score:roundTo(cadence,3),rhythm_score:roundTo(rhythm,3),strong_beat_chord_tone_ratio:roundTo(harmonyRatio,4),stepwise_motion_ratio:roundTo(stepwise,4),melodic_range_semitones:pitchRange,cadence_resolution_ratio:roundTo(cadenceRatio,4)};
  }
  return{targetScore,pyRound,evaluate};
});
