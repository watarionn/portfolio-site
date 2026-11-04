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
return {FIELDS,isDb,list,importEntry};
});
