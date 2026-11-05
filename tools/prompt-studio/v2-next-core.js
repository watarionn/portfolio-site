/* Prompt Studio 2.0 dictionary-driven composer. Standalone; no legacy PromptDB reads. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PromptStudioNext = Object.freeze(api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 'prompt-studio-2.0';
  const VERSION = 1;
  const MODES=['prose','tags'];
  const isMode=mode=>MODES.includes(mode);
  const clone = x => JSON.parse(JSON.stringify(x));
  const str = x => String(x == null ? '' : x);
  const nonempty = x => str(x).trim();
  // English tags for common starter values, including previously saved v1 dictionaries.
  // Custom labels are never machine translated.
  const DEFAULT_TAGS = Object.freeze({
    '女性':'1girl','人間':'person','犬':'dog','妖精':'fairy','天使':'angel','猫':'cat',
    '街中':'city street','電車':'train interior','森林':'forest',
    '立つ':'standing','座る':'sitting','ひざまずく':'kneeling',
    '歩く':'walking','走る':'running','踊る':'dancing',
    '正面':'front view','ローアングル':'low angle','俯瞰':'from above',
    '自然光':'natural lighting','逆光':'backlighting','柔らかい光':'soft lighting',
    '現代':'modern','1980年代':'1980s','未来':'futuristic',
    'アニメ調':'anime style','写真風':'photorealistic','水彩画':'watercolor',
    'ショート':'short hair','ミディアム':'medium hair','ロング':'long hair',
    '細身':'slender','標準':'average build','筋肉質':'muscular',
    '黒髪':'black hair','茶髪':'brown hair','金髪':'blonde hair',
    '色白':'pale skin','褐色':'tan skin','低い':'short stature','普通':'average height','高い':'tall',
    '丸顔':'round face','面長':'long face','透明':'transparent wings','虹色':'rainbow wings',
    '柴犬':'shiba inu','コーギー':'corgi','ゴールデンレトリバー':'golden retriever',
    '短毛':'short fur','長毛':'long fur','白':'white','黒':'black','茶':'brown',
    '昼':'daytime','夜':'night','空いている':'empty interior','混雑している':'crowded interior'
  });
  const tagText = entry => nonempty(entry?.tag)||DEFAULT_TAGS[entry?.name]||str(entry?.name);
  function starterState() {
    const choice = (id, name) => ({id, name});
    const option = (id, name, names) => ({
      id, name, choices: names.map((n, i) => choice(id + i, n))
    });
    const value = (id, name, options = []) => ({id, name, options});
    const category = (id, name, values) => ({id, name, values});
    return {
      schema: SCHEMA, version: VERSION,
      parts: [
        category('character', '登場人物', [
          value('woman', '女性', [
            option('hair', '髪の長さ', ['ショート', 'ミディアム', 'ロング']),
            option('body', '体型', ['細身', '標準', '筋肉質']),
            option('haircolor', '髪の色', ['黒髪', '茶髪', '金髪'])
          ]),
          value('human', '人間', [
            option('height', '身長', ['低い', '普通', '高い']),
            option('skin', '肌の色', ['色白', '褐色']),
            option('face', '顔の特徴', ['丸顔', '面長'])
          ]),
          value('dog', '犬', [
            option('breed', '犬種', ['柴犬', 'コーギー', 'ゴールデンレトリバー']),
            option('fur', '毛の長さ', ['短毛', '長毛']),
            option('coat', '毛色', ['白', '黒', '茶'])
          ]),
          value('fairy', '妖精', [option('wings', '羽', ['透明', '虹色'])]),
          value('angel', '天使', [option('wings', '羽', ['白', '金'])]),
          value('cat', '猫', [option('coat', '毛色', ['白', '黒', '三毛'])])
        ]),
        category('location', '場所', [
          value('city', '街中', [option('timeofday', '時間帯', ['昼', '夜'])]),
          value('train', '電車', [option('crowd', '車内', ['空いている', '混雑している'])]),
          value('forest', '森林')
        ]),
        category('pose', 'ポーズ', [value('standing', '立つ'), value('sitting', '座る'), value('kneeling', 'ひざまずく')]),
        category('motion', '動き', [value('walk', '歩く'), value('run', '走る'), value('dance', '踊る')]),
        category('angle', 'アングル', [value('front', '正面'), value('low', 'ローアングル'), value('high', '俯瞰')]),
        category('light', '光', [value('sun', '自然光'), value('back', '逆光'), value('soft', '柔らかい光')]),
        category('period', '年代', [value('modern', '現代'), value('eighties', '1980年代'), value('future', '未来')]),
        category('art', '画風', [value('anime', 'アニメ調'), value('photo', '写真風'), value('water', '水彩画')])
      ],
      templates: [
        {id:'sample-a',name:'人物・場所・ポーズ',content:'{登場人物}が{場所}で{ポーズ}をしている。'},
        {id:'sample-b',name:'年代・画風・2人・動き',content:'{年代}の{画風}、{登場人物}、{登場人物}、{動き}'}
      ],
      prompts: [], recentCopies: [],
      draft: {text:'', marks:[]}, outputMode:'prose'
    };
  }
  function validateState(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || input.schema !== SCHEMA || input.version !== VERSION) {
      throw Error('Prompt Studio 2.0形式ではないデータだよ');
    }
    const state = clone(input);
    // Original 2.0 backups have no outputMode; upgrade without modifying their contents.
    if(state.outputMode===undefined)state.outputMode='prose';
    if(!isMode(state.outputMode))throw Error('出力形式が正しくないよ');
    if (!Array.isArray(state.parts) || !Array.isArray(state.templates) ||
        !Array.isArray(state.prompts) || !Array.isArray(state.recentCopies) ||
        !state.draft || typeof state.draft.text !== 'string' || !Array.isArray(state.draft.marks)) {
      throw Error('保存データの構造が正しくないよ');
    }
    const unique = (items, context) => {
      const ids = new Set();
      for (const item of items) {
        if (!item || !nonempty(item.id) || !nonempty(item.name) || ids.has(item.id)) throw Error(context + 'のIDまたは名前が不正だよ');
        ids.add(item.id);
      }
    };
    unique(state.parts, '属性');
    for (const part of state.parts) {
      if (!Array.isArray(part.values)) throw Error('属性の値一覧が不正だよ');
      unique(part.values, '値');
      for(const value of part.values)if(value.tag!==undefined&&typeof value.tag!=='string')throw Error('タグ表記が不正だよ');
      for (const value of part.values) {
        if (!Array.isArray(value.options)) throw Error('オプション一覧が不正だよ');
        unique(value.options, 'オプション');
        for (const option of value.options) {
          if (!Array.isArray(option.choices)) throw Error('候補一覧が不正だよ');
          unique(option.choices, '候補');
          for(const choice of option.choices)if(choice.tag!==undefined&&typeof choice.tag!=='string')throw Error('タグ表記が不正だよ');
        }
      }
    }
    unique(state.templates, 'テンプレート');
    unique(state.prompts, 'プロンプト');
    for (const record of [...state.templates, ...state.prompts]) {
      if (typeof record.content !== 'string') throw Error('保存文章が不正だよ');
      if(record.mode!==undefined&&!isMode(record.mode))throw Error('保存文章の出力形式が不正だよ');
    }
    for (const recent of state.recentCopies) {
      if (!recent || typeof recent.text !== 'string') throw Error('コピー履歴が不正だよ');
      if(recent.mode!==undefined&&!isMode(recent.mode))throw Error('コピー履歴の出力形式が不正だよ');
    }
    if (state.recentCopies.length > 5) state.recentCopies = state.recentCopies.slice(0, 5);
    for (const mark of state.draft.marks) {
      if (!mark || !Number.isInteger(mark.start) || !Number.isInteger(mark.end) ||
          mark.start < 0 || mark.end <= mark.start || mark.end > state.draft.text.length ||
          !nonempty(mark.categoryName)) throw Error('文章内パーツの位置が不正だよ');
      for(const field of ['proseText','tagsText','autoSeparator']){
        if(mark[field]!==undefined&&typeof mark[field]!=='string')throw Error('文章内パーツの表示情報が不正だよ');
      }
      if(mark.mode!==undefined&&!isMode(mark.mode))throw Error('文章内パーツの形式が不正だよ');
    }
    const marks = [...state.draft.marks].sort((a,b)=>a.start-b.start);
    if (marks.some((m,i)=>i && marks[i-1].end>m.start)) throw Error('文章内パーツの位置が重複しているよ');
    return state;
  }
  // Reconcile an arbitrary textarea edit with recorded part boundaries.
  // Any edited part is de-referenced; unaffected parts retain their semantics.
  function editText(draft, newText) {
    const old = str(draft.text), next = str(newText);
    if (old === next) return clone(draft);
    let left = 0, right = 0;
    while (left < old.length && left < next.length && old[left] === next[left]) left++;
    while (right < old.length-left && right < next.length-left &&
           old[old.length-1-right] === next[next.length-1-right]) right++;
    const oldEnd = old.length - right, delta = next.length-old.length;
    const marks = [];
    for (const m of draft.marks) {
      if (m.end <= left) marks.push(clone(m));
      else if (m.start >= oldEnd) marks.push({...clone(m),start:m.start+delta,end:m.end+delta});
      // Edited or deleted boundaries invalidate only the touched part.
    }
    return {text:next,marks};
  }
  function selectionText(value,picks,mode='prose'){
    if(!isMode(mode))throw Error('出力形式が正しくないよ');
    const chosen=[];
    for(const option of value.options){
      const entry=option.choices.find(x=>x.id===picks?.[option.id]);
      if(entry)chosen.push(mode==='tags'?tagText(entry):option.name+'：'+entry.name);
    }
    return mode==='tags'?[tagText(value),...chosen].filter(Boolean).join(', '):
      value.name+(chosen.length?'（'+chosen.join('、')+'）':'');
  }
  function reflect(draft,part,value,picks,mode='prose'){
    if(!isMode(mode))throw Error('出力形式が正しくないよ');
    const inserted=selectionText(value,picks,mode);
    const placeholder='{'+part.name+'}',at=draft.text.indexOf(placeholder);
    let start,end,replacement,separator='';
    if(at>=0){start=at;end=at+placeholder.length;replacement=inserted;}
    else{
      const previous=draft.text;
      if(previous){
        separator=mode==='tags'?(/[,，、]\\s*$/.test(previous)?' ':', '):
          (/[\\s、，,。.!！?？]$/.test(previous)?'':'、');
      }
      start=end=previous.length;replacement=separator+inserted;
    }
    const revised=editText(draft,draft.text.slice(0,start)+replacement+draft.text.slice(end));
    const markStart=start+separator.length;
    return {text:revised.text,marks:[...revised.marks,{
      start:markStart,end:markStart+inserted.length,
      categoryId:part.id,categoryName:part.name,valueId:value.id,
      proseText:selectionText(value,picks,'prose'),
      tagsText:selectionText(value,picks,'tags'),
      mode,autoSeparator:separator
    }].sort((x,y)=>x.start-y.start)};
  }
  // Format only references created through the picker. Preserve handwritten text verbatim.
  function formatDraft(draft,targetMode){
    if(!isMode(targetMode))throw Error('出力形式が正しくないよ');
    let result='',cursor=0;const marks=[];
    for(const original of [...draft.marks].sort((x,y)=>x.start-y.start)){
      if(original.start<cursor||original.end>draft.text.length)throw Error('パーツ参照範囲が不正だよ');
      result+=draft.text.slice(cursor,original.start);
      const mark=clone(original),oldMode=mark.mode||'prose';
      const current=draft.text.slice(mark.start,mark.end);
      const expected=oldMode==='tags'?mark.tagsText:mark.proseText;
      const replacement=targetMode==='tags'?mark.tagsText:mark.proseText;
      const canConvert=typeof expected==='string'&&typeof replacement==='string'&&current===expected;
      if(canConvert&&oldMode!==targetMode){
        const sep=mark.autoSeparator||'';
        if(sep&&result.endsWith(sep)){
          const nextSep=targetMode==='tags'?', ':'、';
          result=result.slice(0,-sep.length)+nextSep;
          mark.autoSeparator=nextSep;
        }
        mark.mode=targetMode;
      }
      mark.start=result.length;
      result+=canConvert?replacement:current;
      mark.end=result.length;marks.push(mark);cursor=original.end;
    }
    return {text:result+draft.text.slice(cursor),marks};
  }
  function toTemplate(draft) {
    const sorted = [...draft.marks].sort((a,b)=>a.start-b.start);
    let result='', last=0;
    for (const mark of sorted) {
      if (mark.start<last || mark.end>draft.text.length) throw Error('パーツ位置が不正だよ');
      result+=draft.text.slice(last,mark.start)+'{'+mark.categoryName+'}';
      last=mark.end;
    }
    return result+draft.text.slice(last);
  }
  function addCopy(recentCopies,text,now,mode){
    const entry={text:str(text),at:now};
    if(mode!==undefined){if(!isMode(mode))throw Error('出力形式が正しくないよ');entry.mode=mode;}
    return [entry,...recentCopies].slice(0,5);
  }
  function newId(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
  }
  function backup(state) {
    return JSON.stringify({format:'prompt-studio-2.0-backup',version:1,data:validateState(state)},null,2);
  }
  function restore(input) {
    if (!input || input.format!=='prompt-studio-2.0-backup' || input.version!==1) throw Error('2.0バックアップ形式を選択してね');
    return validateState(input.data);
  }
  return Object.freeze({
    SCHEMA,VERSION,MODES,starterState,validateState,editText,selectionText,reflect,formatDraft,toTemplate,addCopy,newId,backup,restore,clone
  });
});
