// Vector Lab: VTracer 1.0.0-alpha.4 option contract.
// Ref: https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/nodejs/README.md
export const DEFAULTS = Object.freeze({
  clustering:"color-cluster", hierarchical:"cutout", mode:"spline",
  filterSpeckle:4, colorPrecision:6, layerDifference:16,
  cornerThreshold:60, lengthThreshold:4, spliceThreshold:45,
  maxIterations:10, pathPrecision:2, optimize:1,
  simplify:0, maxColors:0, palette:[],
  watershedDetail:128,
  binaryThreshold:128, adaptive:false, adaptiveWindow:0, adaptiveT:15
});
export const LIMITS = Object.freeze({
  filterSpeckle:[1,128], colorPrecision:[1,8], layerDifference:[0,255],
  cornerThreshold:[0,180], lengthThreshold:[3.5,10],
  spliceThreshold:[0,180], pathPrecision:[0,8],
  watershedDetail:[0,1024], maxColors:[0,64],
  simplify:[0,10], optimize:[0,2],
  binaryThreshold:[0,255], adaptiveWindow:[0,511], adaptiveT:[1,50]
});
const VALID = Object.freeze({
  clustering:["color-cluster","watershed","bw"],
  hierarchical:["stacked","cutout"],
  mode:["pixel","polygon","spline"]
});
const integer = new Set(["filterSpeckle","colorPrecision","layerDifference","cornerThreshold",
  "spliceThreshold","maxIterations","pathPrecision","watershedDetail","maxColors",
  "optimize","binaryThreshold","adaptiveWindow"]);
function parsePalette(input) {
  if(Array.isArray(input)) {
    if(input.length>32 || input.some(x => typeof x!=="string"||!/^#[0-9a-fA-F]{6}$/.test(x)))
      throw new Error("パレットは最大32色の #RRGGBB 形式で入力してね");
    return [...new Set(input.map(x=>x.toLowerCase()))];
  }
  const tokens=String(input??"").split(/[\s,;]+/).filter(Boolean);
  return parsePalette(tokens);
}
export function normalize(input={}) {
  if(!input || typeof input!=="object"||Array.isArray(input)) throw new TypeError("設定が不正です");
  const out={...DEFAULTS,palette:[]};
  for(const [name,values] of Object.entries(VALID)) {
    const value=input[name]??out[name];
    if(!values.includes(value)) throw new Error(name+" の設定が不正です");
    out[name]=value;
  }
  for(const [name,[min,max]] of Object.entries(LIMITS)) {
    const n=Number(input[name]??out[name]);
    if(!Number.isFinite(n)||n<min||n>max||(integer.has(name)&&!Number.isInteger(n)))
      throw new RangeError(name+" は "+min+"〜"+max+" の範囲で入力してね");
    out[name]=n;
  }
  out.adaptive=input.adaptive===true;
  out.palette=parsePalette(input.palette??[]);
  if(out.palette.length && out.maxColors>0) out.maxColors=0; // pinned fixed palette wins
  if(out.clustering!=="bw") out.adaptive=false;
  return out;
}
export function toEngine(input) {
  const c=normalize(input);
  const result={
    clustering:c.clustering,hierarchical:c.hierarchical,mode:c.mode,
    filterSpeckle:c.filterSpeckle,colorPrecision:c.colorPrecision,
    layerDifference:c.layerDifference,cornerThreshold:c.cornerThreshold,
    lengthThreshold:c.lengthThreshold,maxIterations:c.maxIterations,
    spliceThreshold:c.spliceThreshold,pathPrecision:c.pathPrecision,
    optimize:c.optimize,watershedDetail:c.watershedDetail,
    binaryThreshold:c.binaryThreshold,adaptive:c.adaptive,
    adaptiveWindow:c.adaptiveWindow,adaptiveT:c.adaptiveT
  };
  if(c.mode==="spline"&&c.simplify>0) result.simplify=c.simplify;
  if(c.clustering==="color-cluster"||c.clustering==="watershed"){
    if(c.palette.length)result.palette=c.palette;
    else if(c.maxColors>0) result.maxColors=c.maxColors;
  }
  return result;
}
export function fromForm(form) {
  const value=(key)=>form.elements.namedItem(key)?.value;
  const checked=(key)=>form.elements.namedItem(key)?.checked===true;
  return normalize({
    clustering:value("clustering"),hierarchical:value("hierarchical"),mode:value("mode"),
    filterSpeckle:value("filterSpeckle"),colorPrecision:value("colorPrecision"),
    layerDifference:value("layerDifference"),cornerThreshold:value("cornerThreshold"),
    lengthThreshold:value("lengthThreshold"),spliceThreshold:value("spliceThreshold"),
    pathPrecision:value("pathPrecision"),optimize:value("optimize"),
    simplify:value("simplify"),maxColors:value("maxColors"),palette:value("palette"),
    watershedDetail:value("watershedDetail"),binaryThreshold:value("binaryThreshold"),
    adaptive:checked("adaptive"),adaptiveWindow:value("adaptiveWindow"),
    adaptiveT:value("adaptiveT")
  });
}
