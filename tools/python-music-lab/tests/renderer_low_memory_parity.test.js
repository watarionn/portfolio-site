'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const core=require('../public/renderer-core.js');
const fixture=require('./phase02b_selected_614.json');
const truth=require('./phase03b_truth.json');
const t=fixture.tpb;
const melody=fixture.tracks.Melody.map(([s,d,n,v])=>({bar:Math.floor(s/(t*4)),step:(s%(t*4))/(t/2),duration:d/(t/2),midi:n,velocity:v}));
const beat=a=>a.map(([s,d,n,v])=>({bar:Math.floor(s/(t*4)),beat:(s%(t*4))/t,duration:d/t,note:n,velocity:v}));
const drums=fixture.tracks.Drums.map(([s,d,n,v])=>({bar:Math.floor(s/(t*4)),eighth:(s%(t*4))/(t/2),duration:d/(t/2),note:n,velocity:v}));
const result=core.render({bpm:fixture.bpm,melody,chords:beat(fixture.tracks.Chords),bass:beat(fixture.tracks.Bass),drums});
assert.equal(result.tracks,null);
assert.equal(result.frames,truth.frames);
assert.equal(result.sourcePeak,truth.source_peak);
assert.equal(result.normalization,truth.normalization_gain);
const pcm=new Float32Array(result.frames*2);for(let i=0;i<result.frames;i++){pcm[i*2]=result.mix[0][i];pcm[i*2+1]=result.mix[1][i];}
const hash=crypto.createHash('sha256').update(Buffer.from(pcm.buffer)).digest('hex');
assert.equal(hash,truth.sha256.final_mix_float32_le);
console.log('Python Music Lab low-memory final PCM parity passed.');
