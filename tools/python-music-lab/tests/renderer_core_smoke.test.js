'use strict';
const assert=require('node:assert/strict');
const core=require('../public/renderer-core.js');

assert.equal(core.RATE,44100);

const melody=core.tonal(72,'Melody',0.234375,87/127);
assert.equal(melody[0].length,20038);
assert.equal(Math.fround(melody[0][0]),-0);
assert.equal(Math.fround(melody[0][1]),Math.fround(-0.00015373260309550793));

const snare=core.drum(38,92,0.5);
assert.equal(snare[0].length,10584);
assert.equal(Math.fround(snare[0][0]),Math.fround(0.06835167978533369));
assert.equal(Math.fround(snare[0][1]),Math.fround(-0.045764868470179146));

const noise=core.drumNoise(4,36000108);
const expected=[0.943445291449644,-0.9723205953830358,-0.1615232148359076,0.601758296921556];
for(let i=0;i<expected.length;i++)assert.equal(noise[i],expected[i]);

const source=[Float64Array.from([1,2,3,4,5]),Float64Array.from([5,4,3,2,1])];
const filtered=core.movingAverage(source,3);
assert.deepEqual(Array.from(filtered[0]),[1,1.5,2,3,4]);
assert.deepEqual(Array.from(filtered[1]),[5,4.5,4,3,2]);

console.log('Python Music Lab renderer-core smoke parity passed.');
