/* Read-only legacy PromptDB v1 adapter for the v2 preview. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PromptStudioLegacy=Object.freeze(api);})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FIELDS=['subject','appearance','expression','outfit','action','pose','environment','lighting','camera','composition','style','visibleText','constraints','negative'];
function isDb(value){return value&&['prompt-db','prompt-db-v2'].includes(value.format)&&Array.isArray(value.library);}
function list(db){if(!isDb(db))throw new Error('Unsupported legacy PromptDB');return db.library.map((entry,index)=>({index,title:String(entry.title||'名称未設定'),id:entry.id||''}));}
function importEntry(db,index,T){if(!isDb(db))throw new Error('Unsupported legacy PromptDB');const entry=db.library[index];if(!entry)throw new Error('Missing entry');
const semantic=entry.semantic||{};const segments=[],variables={};
FIELDS.filter(k=>k!=='negative').forEach(k=>{const value=String(semantic[k]||'').trim();if(!value)return;if(segments.length)segments.push({type:'text',value:'. '});variables[k]={label:k,options:[value],selected:0};segments.push({type:'variable',ref:k});});if(segments.length)segments.push({type:'text',value:'.'});
const template=T.normalize({segments,variables});
return {template,legacy:{entry:JSON.parse(JSON.stringify(entry)),negative:String(semantic.negative||''),model_name:String(entry.model_name||''),outputs:JSON.parse(JSON.stringify(entry.outputs||[]))}};
}
function restoreOriginal(imported){if(!imported||!imported.legacy||!imported.legacy.entry)throw new Error('Missing original legacy entry');return JSON.parse(JSON.stringify(imported.legacy.entry));}
function makeEnvelope(imported){if(!imported||!imported.template)throw new Error('Missing template');return {format:'prompt-template-v2',schema_version:2,template:JSON.parse(JSON.stringify(imported.template)),legacy:imported.legacy?JSON.parse(JSON.stringify(imported.legacy)):null};}
function readEnvelope(input,T){if(!input||input.format!=='prompt-template-v2'||input.schema_version!==2)throw new Error('Unsupported v2 envelope');if(!input.template||input.template.schema_version!==2||!Array.isArray(input.template.segments)||!input.template.variables||typeof input.template.variables!=='object'||Array.isArray(input.template.variables))throw new Error('Invalid v2 template');return {template:T.normalize(input.template),legacy:input.legacy?JSON.parse(JSON.stringify(input.legacy)):null};}
function outputForProfile(imported,profileId,T){const template=T.normalize(imported.template);const positive=T.render(template);const original=imported.legacy&&imported.legacy.entry;const outputs=original&&Array.isArray(original.outputs)?original.outputs:[];const profile=outputs.find(x=>x.profile_id===profileId);return {profile_id:profileId,positive,negative:profile&&profile.negative||imported.legacy&&imported.legacy.negative||'',source:'template-text',original_profile_output:profile?JSON.parse(JSON.stringify(profile)):null};}
return {FIELDS,isDb,list,importEntry,restoreOriginal,makeEnvelope,readEnvelope,outputForProfile};
});
