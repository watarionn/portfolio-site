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
  const hasJapanese = text => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(str(text));
  const englishKey = text => /^[a-z][a-z0-9_]*$/.test(str(text));
  function starterState() {
    const choice = (id, name, en, tag=en) => ({id,name,en,tag});
    const option = (id, name, en, values) => ({
      id,name,en,choices:values.map((item,i)=>choice(id+i,...item))
    });
    const value = (id, name, en, tag=en, options=[]) => ({id,name,en,tag,options});
    const category = (id, name, en, values) => ({id,name,en,values});
    return {
      schema:SCHEMA,version:VERSION,outputFormat:'prose',
      parts:[
        category('character','登場人物','character',[
          value('woman','女性','a woman','1girl',[
            option('hair','髪の長さ','hair length',[
              ['ショート','short hair'],['ミディアム','medium-length hair'],['ロング','long hair']
            ]),
            option('body','体型','body type',[
              ['細身','a slim build','slim body'],['標準','an average build','average build'],['筋肉質','a muscular build','muscular']
            ]),
            option('haircolor','髪の色','hair color',[
              ['黒髪','black hair'],['茶髪','brown hair'],['金髪','blonde hair']
            ])
          ]),
          value('human','人間','a person','person',[
            option('height','身長','height',[
              ['低い','short stature','short'],['普通','average height'],['高い','tall stature','tall']
            ]),
            option('skin','肌の色','skin tone',[
              ['色白','fair skin'],['褐色','tan skin']
            ]),
            option('face','顔の特徴','facial features',[
              ['丸顔','a round face','round face'],['面長','a long face','long face']
            ])
          ]),
          value('dog','犬','a dog','dog',[
            option('breed','犬種','breed',[
              ['柴犬','a Shiba Inu','shiba inu'],['コーギー','a corgi','corgi'],['ゴールデンレトリバー','a golden retriever','golden retriever']
            ]),
            option('fur','毛の長さ','fur length',[
              ['短毛','short fur'],['長毛','long fur']
            ]),
            option('coat','毛色','coat color',[
              ['白','white fur','white fur'],['黒','black fur'],['茶','brown fur']
            ])
          ]),
          value('fairy','妖精','a fairy','fairy',[
            option('wings','羽','wings',[
              ['透明','transparent wings'],['虹色','iridescent wings','rainbow wings']
            ])
          ]),
          value('angel','天使','an angel','angel',[
            option('wings','羽','wings',[
              ['白','white wings'],['金','golden wings']
            ])
          ]),
          value('cat','猫','a cat','cat',[
            option('coat','毛色','coat color',[
              ['白','white fur'],['黒','black fur'],['三毛','a calico coat','calico']
            ])
          ])
        ]),
        category('location','場所','location',[
          value('city','街中','on a city street','city street',[
            option('timeofday','時間帯','time of day',[
              ['昼','daylight','daytime'],['夜','nighttime','night']
            ])
          ]),
          value('train','電車','inside a train','train interior',[
            option('crowd','車内','carriage',[
              ['空いている','an empty carriage','empty train'],['混雑している','a crowded carriage','crowded train']
            ])
          ]),
          value('forest','森林','in a forest','forest')
        ]),
        category('pose','ポーズ','pose',[
          value('standing','立つ','standing'),value('sitting','座る','sitting'),
          value('kneeling','ひざまずく','kneeling')
        ]),
        category('motion','動き','motion',[
          value('walk','歩く','walking'),value('run','走る','running'),
          value('dance','踊る','dancing')
        ]),
        category('angle','アングル','angle',[
          value('front','正面','from the front','front view'),
          value('low','ローアングル','from a low angle','low angle'),
          value('high','俯瞰','from above','overhead view')
        ]),
        category('light','光','lighting',[
          value('sun','自然光','in natural light','natural lighting'),
          value('back','逆光','with backlighting','backlighting'),
          value('soft','柔らかい光','in soft light','soft lighting')
        ]),
        category('period','年代','era',[
          value('modern','現代','the present day','modern'),
          value('eighties','1980年代','the 1980s','1980s'),
          value('future','未来','the future','futuristic')
        ]),
        category('art','画風','art_style',[
          value('anime','アニメ調','anime style','anime style'),
          value('photo','写真風','photorealistic style','photorealistic'),
          value('water','水彩画','watercolor painting','watercolor')
        ])
      ],
      templates:[
        {id:'sample-a',name:'人物・場所・ポーズ',
          previewJa:'{登場人物}が{場所}で{ポーズ}をしている。',
          content:'{character} {pose} {location}.',outputFormat:'prose'},
        {id:'sample-b',name:'年代・画風・2人・動き',
          previewJa:'{年代}の{画風}、{登場人物}、{登場人物}、{動き}',
          content:'An {art_style} scene set in {era}, featuring {character} and {character}, {motion}.',
          outputFormat:'prose'}
      ],
      prompts:[],recentCopies:[],
      draft:{text:'',marks:[]}
    };
  }
  // Convert only exact, unchanged v2 built-in entries. Never guess English for user-defined words.
  const oldBuiltInTemplates={
    'sample-a':'{登場人物}が{場所}で{ポーズ}をしている。',
    'sample-b':'{年代}の{画風}、{登場人物}、{登場人物}、{動き}'
  };
  function hydrateEnglish(state) {
    const defaults=starterState();
    function match(list,id,name){return list.find(x=>x.id===id&&x.name===name);}
    for(const part of state.parts){
      const baseline=match(defaults.parts,part.id,part.name);
      if(typeof part.en!=='string')part.en=baseline?.en||'';
      for(const val of part.values){
        const original=match(baseline?.values||[],val.id,val.name);
        if(typeof val.en!=='string')val.en=original?.en||'';
        if(typeof val.tag!=='string')val.tag=original?.tag||'';
        for(const opt of val.options){
          const originalOpt=match(original?.options||[],opt.id,opt.name);
          if(typeof opt.en!=='string')opt.en=originalOpt?.en||'';
          for(const chosen of opt.choices){
            const originalChoice=match(originalOpt?.choices||[],chosen.id,chosen.name);
            if(typeof chosen.en!=='string')chosen.en=originalChoice?.en||'';
            if(typeof chosen.tag!=='string')chosen.tag=originalChoice?.tag||'';
          }
        }
      }
    }
    for(const template of state.templates){
      const baseline=defaults.templates.find(x=>x.id===template.id);
      if(baseline&&template.content===oldBuiltInTemplates[template.id]){
        template.content=baseline.content;
      }
      if(typeof template.previewJa!=='string')template.previewJa=baseline?.previewJa||template.name;
    }
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
    hydrateEnglish(state);
    const keys=state.parts.map(x=>x.en).filter(Boolean);
    if(keys.some(k=>!englishKey(k)) || new Set(keys).size!==keys.length)throw Error('英語変数名が重複または不正だよ');
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
  function expression(item, tag=false){
    const en=tag ? (item.tag||item.en) : item.en;
    if(!nonempty(en)||hasJapanese(en))throw Error('「'+item.name+'」の英語表現が未設定だよ。各種辞書で英語表現を登録してね');
    return en.trim();
  }
  function optionsSelected(value,picks,tag){
    const selected=[];
    for(const option of value.options){
      const chosen=option.choices.find(x=>x.id===picks?.[option.id]);
      if(chosen)selected.push(expression(chosen,tag));
    }
    return selected;
  }
  function selectionText(value,picks){
    const choices=optionsSelected(value,picks,false);
    return expression(value)+(choices.length?' with '+choices.join(' and '):'');
  }
  function selectionTags(value,picks){
    return [expression(value,true),...optionsSelected(value,picks,true)].join(', ');
  }
  function reflect(draft,part,value,picks,format='prose'){
    if(hasJapanese(draft.text))throw Error('編集中の文章に日本語があるよ。既存の文章は保護するので、英語に編集してから反映してね');
    const key=part.en;
    if(!englishKey(key))throw Error('「'+part.name+'」の英語変数名を辞書で設定してね');
    const mode=outputFormat(format);
    const inserted=mode==='tags'?selectionTags(value,picks):selectionText(value,picks);
    const placeholder='{'+key+'}';
    const at=draft.text.indexOf(placeholder);
    let start,end,replacement;
    if(at>=0){start=at;end=at+placeholder.length;replacement=inserted;}
    else {
      const separator=draft.text&&!/[\s,.!?]$/.test(draft.text)?(mode==='tags'?', ':' '):'';
      start=end=draft.text.length;replacement=separator+inserted;
    }
    const revised=editText(draft,draft.text.slice(0,start)+replacement+draft.text.slice(end));
    const markStart=start+(replacement.length-inserted.length);
    const marks=[...revised.marks,{
      start:markStart,end:markStart+inserted.length,categoryId:part.id,
      categoryName:part.name,categoryKey:key,valueId:value.id
    }].sort((a,b)=>a.start-b.start);
    return {text:revised.text,marks};
  }
  function toTemplate(draft,parts=[]){
    if(hasJapanese(draft.text))throw Error('日本語を含む文章は英語テンプレートとして保存できないよ');
    const sorted=[...draft.marks].sort((a,b)=>a.start-b.start);
    let result='',last=0;
    for(const mark of sorted){
      if(mark.start<last||mark.end>draft.text.length)throw Error('パーツ位置が不正だよ');
      const category=parts.find(x=>x.id===mark.categoryId);
      const key=category?.en||mark.categoryKey;
      if(!englishKey(key))throw Error('パーツの英語変数名が未登録だよ');
      result+=draft.text.slice(last,mark.start)+'{'+key+'}';
      last=mark.end;
    }
    return result+draft.text.slice(last);
  }
  function addCopy(recentCopies,text,now,format='prose'){
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
    SCHEMA,VERSION,OUTPUT_FORMATS,outputFormat,hasJapanese,englishKey,starterState,validateState,editText,selectionText,selectionTags,reflect,toTemplate,addCopy,newId,backup,restore,clone
  });
});
