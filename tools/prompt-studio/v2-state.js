/* Pure persistence adapter for Prompt Studio v2. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PromptStudioV2State=Object.freeze(api);})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PROFILES=['flux-natural','gpt-image-instruction','sdxl-natural','sdxl-tags','generic-tags'];
function pack(template,legacy,profile,negative,T,L){
 const base=L.makeEnvelope({template:T.normalize(template),legacy});
 return {...base,settings:{profile:PROFILES.includes(profile)?profile:PROFILES[0],negative:String(negative??'')}};
}
function unpack(input,T,L){
 if(input===null||input===undefined)return {template:T.fromText(''),legacy:null,profile:PROFILES[0],negative:''};
 if(input.format!=='prompt-template-v2'){
  if(input.schema_version===2&&Array.isArray(input.segments))return {template:T.normalize(input),legacy:null,profile:PROFILES[0],negative:''};
  throw new Error('Unsupported v2 state format');
 }
 const base=L.readEnvelope(input,T),settings=input.settings||{};
 return {...base,profile:PROFILES.includes(settings.profile)?settings.profile:PROFILES[0],negative:String(settings.negative??base.legacy?.negative??'')};
}
return {PROFILES,pack,unpack};
});
