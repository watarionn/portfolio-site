import assert from "node:assert/strict";
import {normalize,toEngine} from "../../tools/vector-lab/options.mjs";
const def=normalize({});
assert.equal(def.clustering,"color-cluster");
assert.equal(def.hierarchical,"cutout");
assert.equal(def.mode,"spline");
assert.equal(toEngine({}).maxColors,undefined);
const watershed=toEngine({clustering:"watershed",watershedDetail:190,maxColors:8,mode:"spline",simplify:1.25,optimize:2});
assert.equal(watershed.watershedDetail,190);
assert.equal(watershed.maxColors,8);
assert.equal(watershed.simplify,1.25);
assert.equal(watershed.optimize,2);
const fixed=toEngine({palette:"#112233, #AABBCC #112233",maxColors:12});
assert.deepEqual(fixed.palette,["#112233","#aabbcc"]);
assert.equal(fixed.maxColors,undefined);
const bw=toEngine({clustering:"bw",adaptive:true,binaryThreshold:150,adaptiveWindow:19,adaptiveT:12});
assert.equal(bw.adaptive,true);
assert.equal(bw.adaptiveWindow,19);
assert.equal(bw.binaryThreshold,150);
assert(!("palette" in bw));
const polygon=toEngine({mode:"polygon",simplify:3});
assert(!("simplify" in polygon));
for(const bad of [
 {palette:"#000"},{palette:"red"},{filterSpeckle:129},{maxColors:65},{adaptiveT:0},
 {watershedDetail:-1},{optimize:3},{clustering:"unknown"},
 {binaryThreshold:255.5},{palette:new Array(40).fill("#ffffff")}
]) assert.throws(()=>normalize(bad));
console.log("VECTOR_LAB_OPTIONS_PASS");
