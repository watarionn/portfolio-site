/* Prompt Studio 2.0 dictionary-driven composer. Standalone; no legacy PromptDB reads. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PromptStudioNext = Object.freeze(api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 'prompt-studio-2.0';
  const VERSION = 1;
  const OUTPUT_FORMATS = Object.freeze(['prose', 'tags']);
  const outputFormat = x => OUTPUT_FORMATS.includes(x) ? x : 'prose';
  const clone = x => JSON.parse(JSON.stringify(x));
  const str = x => String(x == null ? '' : x);
  const nonempty = x => str(x).trim();
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
      prompts: [], recentCopies: [], outputFormat:'prose',
      draft: {text:'', marks:[]}
    };
  }
  function validateState(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || input.schema !== SCHEMA || input.version !== VERSION) {
      throw Error('Prompt Studio 2.0形式ではないデータだよ');
    }
    const state = clone(input);
    // Old independent 2.0 backups have no outputFormat; upgrade on read without changing their text.
    state.outputFormat = outputFormat(state.outputFormat);
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
      for (const value of part.values) {
        if (!Array.isArray(value.options)) throw Error('オプション一覧が不正だよ');
        unique(value.options, 'オプション');
        for (const option of value.options) {
          if (!Array.isArray(option.choices)) throw Error('候補一覧が不正だよ');
          unique(option.choices, '候補');
        }
      }
    }
    unique(state.templates, 'テンプレート');
    unique(state.prompts, 'プロンプト');
    for (const record of [...state.templates, ...state.prompts]) {
      if (typeof record.content !== 'string') throw Error('保存文章が不正だよ');
      record.outputFormat = outputFormat(record.outputFormat);
    }
    for (const recent of state.recentCopies) {
      if (!recent || typeof recent.text !== 'string') throw Error('コピー履歴が不正だよ');
      recent.outputFormat = outputFormat(recent.outputFormat);
    }
    if (state.recentCopies.length > 5) state.recentCopies = state.recentCopies.slice(0, 5);
    for (const mark of state.draft.marks) {
      if (!mark || !Number.isInteger(mark.start) || !Number.isInteger(mark.end) ||
          mark.start < 0 || mark.end <= mark.start || mark.end > state.draft.text.length ||
          !nonempty(mark.categoryName)) throw Error('文章内パーツの位置が不正だよ');
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
  function selectionText(value, picks) {
    const optionValues = [];
    for (const option of value.options) {
      const choiceId = picks && picks[option.id];
      const chosen = option.choices.find(x=>x.id===choiceId);
      if (chosen) optionValues.push(option.name + '：' + chosen.name);
    }
    return value.name + (optionValues.length ? '（'+optionValues.join('、')+'）' : '');
  }
  function selectionTags(value, picks) {
    const tags=[value.name];
    for (const option of value.options) {
      const chosen=option.choices.find(x=>x.id===picks?.[option.id]);
      if(chosen)tags.push(chosen.name);
    }
    return tags.join(', ');
  }
  function reflect(draft, part, value, picks, format='prose') {
    const mode=outputFormat(format);
    const inserted = mode==='tags' ? selectionTags(value,picks) : selectionText(value, picks);
    const placeholder = '{' + part.name + '}';
    const at = draft.text.indexOf(placeholder);
    let start, end, replacement;
    if (at >= 0) {
      start=at;end=at+placeholder.length;replacement=inserted;
    } else {
      const separator = draft.text && !/[\s、，,。.!！?？]$/.test(draft.text) ? (mode==='tags' ? ', ' : '、') : '';
      start=end=draft.text.length;
      replacement=separator+inserted;
    }
    // Insertion replaces only the designated placeholder (not arbitrary matching prose).
    const revised = editText(draft, draft.text.slice(0,start)+replacement+draft.text.slice(end));
    const markStart = start + (replacement.length-inserted.length);
    const marks = [...revised.marks, {
      start:markStart,end:markStart+inserted.length,
      categoryId:part.id,categoryName:part.name,valueId:value.id
    }].sort((a,b)=>a.start-b.start);
    return {text:revised.text,marks};
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
  function addCopy(recentCopies, text, now, format='prose') {
    return [{text:str(text),at:now,outputFormat:outputFormat(format)},...recentCopies].slice(0,5);
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
    SCHEMA,VERSION,OUTPUT_FORMATS,outputFormat,starterState,validateState,editText,selectionText,selectionTags,reflect,toTemplate,addCopy,newId,backup,restore,clone
  });
});
